/**
 * The NN Command Centre.
 *
 * Claude is given the dashboard — the same numbers on the owner's screen, and
 * the same list of gaps — and nothing else. It cannot query the database, so it
 * cannot go and find a number it was not shown, which means it cannot quietly
 * substitute a plausible one. Where a figure is missing it is told so
 * explicitly, and it is instructed to say so rather than estimate.
 *
 * Every request is authorised: a verified Supabase token whose email is on the
 * OWNER_EMAILS list. Not "is there a session" — is this person the owner.
 */

import Anthropic from "@anthropic-ai/sdk";
import { anthropicReady, env } from "@/lib/env";
import { ownerFromToken } from "@/lib/supabase";
import { loadCatalogue } from "@/lib/catalog";
import { summariseBusiness } from "@/lib/business";
import { formatMinor } from "@/lib/money";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = "claude-sonnet-5";
const MAX_TOKENS = 1100;

function bearer(req: Request): string | null {
  const header = req.headers.get("authorization") ?? "";
  return header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : null;
}

export async function POST(req: Request) {
  /* ── who is asking ── */
  const email = await ownerFromToken(bearer(req));
  if (!email) {
    return Response.json(
      { error: "forbidden", message: "This console is for the owner." },
      { status: 403 },
    );
  }

  if (!anthropicReady()) {
    return Response.json(
      { error: "not_configured", message: "The command centre needs ANTHROPIC_API_KEY." },
      { status: 503 },
    );
  }

  let body: { question?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }
  const question =
    typeof body.question === "string" && body.question.trim()
      ? body.question.trim().slice(0, 500)
      : "Give me today's summary.";

  const { products, source } = await loadCatalogue();
  const business = await summariseBusiness(products);

  /* ── the dashboard, written out the way a person would read it ── */
  const currency = products[0]?.currency ?? "INR";

  const metricLines = business.metrics.map((m) => {
    if (m.value === null) {
      return `- ${m.label}: NOT AVAILABLE. ${m.unavailable ?? ""}`.trim();
    }
    const rendered =
      m.kind === "currency"
        ? formatMinor(m.value, currency)
        : m.kind === "percent"
          ? `${(m.value * 100).toFixed(2)}%`
          : String(m.value);
    return `- ${m.label}: ${rendered}${m.basis ? ` (${m.basis})` : ""}`;
  });

  const productLines = business.products.map((p) => {
    const parts = [
      p.unitsSold === null ? "units sold NOT AVAILABLE" : `${p.unitsSold} sold`,
      p.revenueMinor === null
        ? "revenue NOT AVAILABLE"
        : `${formatMinor(p.revenueMinor, currency)} revenue`,
      `${p.views} views`,
      `${p.addsToBag} added to bag`,
      p.addRate === null
        ? "add rate NOT AVAILABLE (too few views)"
        : `${(p.addRate * 100).toFixed(1)}% add rate`,
      "stock on hand NOT AVAILABLE",
    ];
    return `- ${p.title}: ${parts.join(", ")}`;
  });

  const behaviourLines = business.analytics.events.map((e) => {
    const top = e.top.length
      ? ` — most common: ${e.top.map((t) => `${t.value} (${t.count})`).join(", ")}`
      : "";
    return `- ${e.name}: ${e.count}${top}`;
  });

  const dashboard = `
DASHBOARD — last ${business.windowDays} days, generated ${new Date().toISOString()}

HEADLINE FIGURES
${metricLines.join("\n") || "- none available"}

PER PRODUCT
${productLines.join("\n") || "- no products"}

VISITOR BEHAVIOUR (consented analytics only, ${business.analytics.source})
${behaviourLines.join("\n") || "- no events recorded"}

KNOWN GAPS IN THIS DATA
${business.gaps.length ? business.gaps.map((g) => `- ${g}`).join("\n") : "- none"}

CATALOGUE SOURCE: ${source === "shopify" ? "live Shopify data" : "the Collection 001 reference seed, not live Shopify data"}
`.trim();

  const system = `You are the NN Command Centre, the analyst for NERO NOREN's owner, ${email}.

You answer using ONLY the dashboard below. It is everything you have.

Rules you must not break:
- Never state a number that is not in the dashboard. Never estimate, extrapolate or infer one.
- Where the dashboard says NOT AVAILABLE, say plainly that the figure is not available and what would make it available. Do not work around it.
- Cite the figures you use, with their values, so the owner can check you.
- Flag anything that looks unusual, and say what would confirm it. Distinguish clearly between what the data shows and what you suspect.
- If the catalogue source is the reference seed rather than live Shopify data, say so before drawing conclusions about products.
- Do not recommend a discount or a sale: NN holds one price.

Voice: calm, precise, warm. Sentence case. No hype, no emojis. Short paragraphs, and a short list where a list genuinely helps. Be brief — the owner is reading this on a phone.

${dashboard}`;

  const client = new Anthropic({ apiKey: env.anthropicKey });
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) =>
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));

      try {
        const response = await client.messages.stream({
          model: MODEL,
          max_tokens: MAX_TOKENS,
          system,
          messages: [{ role: "user", content: question }],
        });

        let full = "";
        for await (const event of response) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            full += event.delta.text;
            send("delta", { visible: full });
          }
        }
        send("done", { reply: full.trim(), gaps: business.gaps });
      } catch (err) {
        console.error("[owner/insight] Claude request failed:", err);
        send("error", { message: "The command centre could not answer just then." });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
