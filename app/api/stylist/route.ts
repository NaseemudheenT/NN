/**
 * The NN stylist.
 *
 * Runs on the server so ANTHROPIC_API_KEY never reaches a browser. The model is
 * given the catalogue for this request and told, in the system prompt, that it
 * may recommend nothing else — so it cannot invent a product, a price, a
 * discount or a delivery promise, because it has never been shown one.
 *
 * The reply streams as it is written, and product handles are validated against
 * the catalogue on the way out. A handle the model made up is dropped rather
 * than rendered as a broken card.
 */

import Anthropic from "@anthropic-ai/sdk";
import { anthropicReady, env } from "@/lib/env";
import { loadCatalogue } from "@/lib/catalog";
import { formatMinor } from "@/lib/money";
import type { Product } from "@/lib/catalog/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = "claude-sonnet-5";
/** Caps the cost of a single answer and keeps the stylist concise. */
const MAX_TOKENS = 700;
const MAX_QUESTION_CHARS = 600;
const MAX_HISTORY = 8;

/* ── rate limiting ──────────────────────────────────────────────
   In-memory and per-instance, which is the right trade for this: it costs
   nothing, it stops a single visitor running up a bill, and a distributed
   limit would need Redis for a problem we do not have yet. */

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 8;
const hits = new Map<string, number[]>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);

  // Keep the map from growing without bound on a long-lived instance.
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      if (!v.some((t) => now - t < WINDOW_MS)) hits.delete(k);
    }
  }
  return recent.length > MAX_PER_WINDOW;
}

function visitorKey(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "anonymous").trim();
}

/* ── the system prompt ─────────────────────────────────────────── */

function systemPrompt(products: Product[]): string {
  const catalogue = products.map((p) => ({
    handle: p.handle,
    name: `${p.name}, ${p.colour}`,
    type: p.type,
    price: formatMinor(p.priceMinor, p.currency),
    sizes: p.variants.filter((v) => v.available).map((v) => v.size),
    fabric: p.fabric,
    fit: p.fitNotes,
    best_for: p.bestFor,
    description: p.description,
  }));

  const sizeGuide = products
    .find((p) => p.type === "shirt")
    ?.sizeChart.rows.map(
      (r) =>
        `${r.label}: to fit chest ${Math.round((r.body.chest?.[0] ?? 0) / 2.54)}–${Math.round(
          (r.body.chest?.[1] ?? 0) / 2.54,
        )} in`,
    )
    .join("; ");

  return `You are the NN stylist for NERO NOREN, an online-first, European-inspired menswear brand from India.

Voice: calm, precise, warm. Sentence case. Never pushy. No hype words, no emojis, no exclamation marks, no invented scarcity, no claims about luxury or origin that are not in the product data below.

You may recommend ONLY from this catalogue. It is the entire range. Never mention a product, colour, price, fabric, discount, offer or delivery date that is not here.

${JSON.stringify(catalogue, null, 1)}

Shirt sizing: ${sizeGuide ?? "S to XXL"}. Trousers are sized by the customer's usual jeans waist in inches.

For any question about size or fit, give your best reading and then point the customer at the trial room on this site, which computes the answer from their measurements against the finished garment. Do not guess a precise size with confidence you do not have.

You can help with: what to wear for an occasion, how to pair pieces, fabric and care, and how a piece is cut. If a question is outside clothing, say so briefly and warmly, and offer what you can help with instead.

Keep replies to two to four short sentences.

End every reply with a line of exactly this form, and nothing after it:
RECOMMEND: handle, handle, handle

List up to three handles from the catalogue, most relevant first, or write "RECOMMEND: none" if no specific piece applies.`;
}

/* ── the route ─────────────────────────────────────────────────── */

interface StylistRequest {
  question?: unknown;
  history?: unknown;
}

export async function POST(req: Request) {
  if (!anthropicReady()) {
    return Response.json(
      {
        error: "not_configured",
        message: "The stylist needs ANTHROPIC_API_KEY set in .env.local.",
      },
      { status: 503 },
    );
  }

  if (rateLimited(visitorKey(req))) {
    return Response.json(
      {
        error: "rate_limited",
        message: "The stylist is catching up. Try again in a moment.",
      },
      { status: 429 },
    );
  }

  let body: StylistRequest;
  try {
    body = (await req.json()) as StylistRequest;
  } catch {
    return Response.json({ error: "bad_request", message: "Expected JSON." }, { status: 400 });
  }

  const question = typeof body.question === "string" ? body.question.trim() : "";
  if (!question) {
    return Response.json({ error: "bad_request", message: "Ask a question." }, { status: 400 });
  }

  const history = Array.isArray(body.history)
    ? body.history
        .filter(
          (m): m is { role: "user" | "assistant"; text: string } =>
            typeof m === "object" &&
            m !== null &&
            (("role" in m && (m as { role: string }).role === "user") ||
              (m as { role: string }).role === "assistant") &&
            typeof (m as { text: unknown }).text === "string",
        )
        .slice(-MAX_HISTORY)
    : [];

  const { products } = await loadCatalogue();
  const validHandles = new Set(products.map((p) => p.handle));

  const client = new Anthropic({ apiKey: env.anthropicKey });

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      let full = "";
      try {
        const response = await client.messages.stream({
          model: MODEL,
          max_tokens: MAX_TOKENS,
          system: systemPrompt(products),
          messages: [
            ...history.map((m) => ({ role: m.role, content: m.text })),
            { role: "user" as const, content: question.slice(0, MAX_QUESTION_CHARS) },
          ],
        });

        for await (const event of response) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            full += event.delta.text;
            // Hold back the RECOMMEND line: it is protocol, not prose.
            const visible = full.split(/RECOMMEND:/i)[0];
            send("delta", { text: event.delta.text, visible });
          }
        }

        // Pull the handles out and keep only ones that really exist.
        const match = /RECOMMEND:\s*(.+)\s*$/i.exec(full);
        const handles = (match?.[1] ?? "")
          .split(",")
          .map((h) => h.trim().toLowerCase())
          .filter((h) => h && h !== "none" && validHandles.has(h))
          .slice(0, 3);

        send("done", {
          reply: full.split(/RECOMMEND:/i)[0].trim(),
          products: handles,
        });
      } catch (err) {
        console.error("[stylist] Claude request failed:", err);
        send("error", {
          message:
            "The stylist could not answer just then. The collection page has everything, and you can ask again in a moment.",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
