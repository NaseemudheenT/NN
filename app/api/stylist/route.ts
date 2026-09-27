/**
 * The NN Stylist.
 *
 * Runs on the server so ANTHROPIC_API_KEY never reaches a browser. The stylist
 * is given the NN knowledge file and a set of tools that read live Shopify
 * data — it cannot invent a product, a price or a stock level, because it has
 * to ask for each one and the answer comes from the catalogue.
 *
 * The reply streams as it is written. Product handles are validated against the
 * catalogue on the way out, so a handle the model imagined is dropped rather
 * than rendered as a broken card.
 */

import type Anthropic from "@anthropic-ai/sdk";
import { anthropicReady } from "@/lib/env";
import { loadCatalogue } from "@/lib/catalog";
import { rateLimit, visitorKey } from "@/lib/ratelimit";
import { LIMITS, MODELS } from "@/ai/models";
import { buildStylistPrompt } from "@/ai/prompts/stylist";
import { CUSTOMER_TOOLS } from "@/ai/tools/customer";
import { runConversation } from "@/ai/runner";
import { parseStylistReply } from "@/ai/schema";
import { logConversation } from "@/lib/ai-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface StylistRequest {
  question?: unknown;
  history?: unknown;
  context?: unknown;
  consent?: unknown;
}

const str = (v: unknown, fallback: string, max = 120) =>
  typeof v === "string" && v.trim() ? v.trim().slice(0, max) : fallback;

export async function POST(req: Request) {
  if (!anthropicReady()) {
    return Response.json(
      { error: "not_configured", message: "The stylist needs ANTHROPIC_API_KEY set in .env.local." },
      { status: 503 },
    );
  }

  const limit = rateLimit(`stylist:${visitorKey(req)}`, LIMITS.rateLimitPerHour, 3_600_000);
  if (!limit.allowed) {
    return Response.json(
      { error: "rate_limited", message: "The stylist is catching up. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
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

  const history: Anthropic.MessageParam[] = Array.isArray(body.history)
    ? body.history
        .filter(
          (m): m is { role: "user" | "assistant"; text: string } =>
            typeof m === "object" &&
            m !== null &&
            ((m as { role: string }).role === "user" || (m as { role: string }).role === "assistant") &&
            typeof (m as { text: unknown }).text === "string",
        )
        .slice(-LIMITS.stylist.historyTurns)
        .map((m) => ({ role: m.role, content: m.text }))
    : [];

  const raw = (body.context ?? {}) as Record<string, unknown>;
  const system = await buildStylistPrompt({
    localTime: str(raw.localTime, new Date().toLocaleTimeString("en-IN")),
    dayPhase: str(raw.dayPhase, "unknown"),
    currentPage: str(raw.currentPage, "/"),
    currentProduct: str(raw.currentProduct, "none"),
    bagSummary: str(raw.bagSummary, "empty", 400),
  });

  const { products } = await loadCatalogue();
  const validHandles = new Set(products.map((p) => p.handle));
  const consented = body.consent === true;

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {
          /* the client went away */
        }
      };

      try {
        const result = await runConversation({
          model: MODELS.stylist,
          system,
          messages: [
            ...history,
            { role: "user", content: question.slice(0, LIMITS.stylist.maxQuestionChars) },
          ],
          tools: CUSTOMER_TOOLS as unknown as readonly never[],
          maxToolCalls: LIMITS.stylist.maxToolCalls,
          maxTokens: LIMITS.stylist.maxTokens,
          ctx: { ownerEmail: null },
          onText: (visible) => {
            // Hold back the JSON envelope while it is still being written.
            const plain = visible.trim().startsWith("{") ? "" : visible;
            if (plain) send("delta", { visible: plain });
          },
          onTool: (name, input) => {
            console.log(`[stylist] tool: ${name}`, JSON.stringify(input).slice(0, 200));
            send("tool", { name });
          },
        });

        const parsed = parseStylistReply(result.text);
        const handles = parsed.products.filter((h) => validHandles.has(h)).slice(0, 3);

        // A proposal from add_to_bag becomes a confirm step in the interface.
        const pending = result.confirmations.find((c) => c.tool === "add_to_bag");

        send("done", {
          reply: parsed.reply,
          products: handles,
          action: parsed.action,
          confirm: pending?.payload ?? null,
          toolsUsed: result.toolsUsed.map((t) => t.name),
        });

        if (consented) {
          void logConversation({
            surface: "stylist",
            question,
            reply: parsed.reply,
            tools: result.toolsUsed.map((t) => t.name),
          });
        }
      } catch (err) {
        console.error("[stylist] request failed:", err);
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
