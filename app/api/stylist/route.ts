import { getCatalog } from "@/lib/shopify";
import { env, integrations } from "@/lib/env";

export const runtime = "nodejs";

/* A small in-memory limit, so one visitor cannot run up the bill. */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 8;
const seen = new Map<string, { count: number; resetAt: number }>();

function limited(key: string) {
  const now = Date.now();
  const entry = seen.get(key);
  if (!entry || now > entry.resetAt) {
    seen.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_PER_WINDOW;
}

interface Body {
  question: string;
  history?: { role: "you" | "stylist"; text: string }[];
}

const SYSTEM = `You are the stylist at Nero Noren, an online-first menswear house for men and boys.

Voice: calm, precise, warm. Sentence case. Short paragraphs. No hype words, no exclamation marks, no emoji, no invented scarcity, no claims about luxury, heritage or origin that are not in the catalogue below.

Hard rules:
- You may recommend ONLY pieces from the catalogue given below. Never invent a product, a colour, a price, a discount, a delivery date or a stock level.
- If a piece has no price in the catalogue, say the price is held in the store rather than guessing one.
- If you are asked about something the catalogue does not cover, say so plainly and offer what you do know.
- For anything about fit or size, point the customer at the trial room rather than guessing their size.
- Keep answers under 140 words.

When you recommend pieces, end your reply with a single final line in exactly this form and nothing after it:
<<<products handle-one,handle-two
Use at most three handles, taken verbatim from the catalogue. Omit the line entirely if you are recommending nothing.`;

export async function POST(request: Request) {
  if (!integrations.anthropic()) {
    return Response.json(
      {
        message:
          "The stylist is not connected yet. Set ANTHROPIC_API_KEY to bring it online — you can keep browsing the collection in the meantime.",
      },
      { status: 503 },
    );
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "anonymous";

  if (limited(ip)) {
    return Response.json(
      { message: "That is a lot of questions at once. Give it a minute and ask again." },
      { status: 429 },
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return Response.json({ message: "Malformed request" }, { status: 400 });
  }

  const question = (body.question ?? "").trim().slice(0, 600);
  if (!question) return Response.json({ message: "Ask a question" }, { status: 400 });

  const catalog = await getCatalog();
  const lines = catalog.products.map((p) =>
    [
      `handle: ${p.handle}`,
      `name: ${p.title}`,
      p.colour && `colour: ${p.colour}`,
      p.fabric && `cloth: ${p.fabric}`,
      p.fit && `fit: ${p.fit}`,
      `sizes: ${p.sizes.join(", ") || "not published"}`,
      `price: ${p.price ? `${p.price.currency} ${p.price.amount}` : "held in the store, not published"}`,
    ]
      .filter(Boolean)
      .join(" | "),
  );

  const catalogueBlock =
    lines.length > 0
      ? `Catalogue (the only pieces that exist):\n${lines.join("\n")}`
      : "Catalogue: empty. Recommend nothing and say the collection is not yet published.";

  const messages = [
    ...(body.history ?? []).slice(-6).map((t) => ({
      role: t.role === "you" ? ("user" as const) : ("assistant" as const),
      content: t.text.slice(0, 1200),
    })),
    { role: "user" as const, content: question },
  ];

  let upstream: Response;
  try {
    upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": env.anthropicKey()!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 500,
        stream: true,
        system: `${SYSTEM}\n\n${catalogueBlock}`,
        messages,
      }),
    });
  } catch {
    return Response.json(
      { message: "The stylist could not be reached. You can keep browsing the collection." },
      { status: 503 },
    );
  }

  if (!upstream.ok || !upstream.body) {
    console.error("[stylist] upstream error", upstream.status);
    return Response.json(
      { message: "The stylist is unavailable right now. You can keep browsing the collection." },
      { status: 503 },
    );
  }

  /* Re-emit the upstream SSE as plain text, so nothing about the provider —
     headers, ids or the key — is exposed to the browser. */
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = upstream.body!.getReader();
      let buffer = "";
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const events = buffer.split("\n\n");
          buffer = events.pop() ?? "";

          for (const event of events) {
            for (const line of event.split("\n")) {
              if (!line.startsWith("data:")) continue;
              const payload = line.slice(5).trim();
              if (!payload || payload === "[DONE]") continue;
              try {
                const json = JSON.parse(payload) as {
                  type?: string;
                  delta?: { type?: string; text?: string };
                };
                if (json.type === "content_block_delta" && json.delta?.text) {
                  controller.enqueue(encoder.encode(json.delta.text));
                }
              } catch {
                /* partial frame — wait for the rest */
              }
            }
          }
        }
      } catch {
        controller.enqueue(encoder.encode("\n\nThe answer was cut short."));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
