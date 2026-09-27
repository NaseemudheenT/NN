import { z } from "zod";

/**
 * The stylist is asked for JSON. Models mostly comply, and occasionally wrap it
 * in prose or a code fence. This parses what actually arrives and, when it
 * cannot, falls back to treating the whole reply as the message — a customer
 * seeing a sensible answer with no product cards is a far better failure than a
 * customer seeing an error.
 */

export const stylistReplySchema = z.object({
  reply: z.string().min(1),
  products: z.array(z.string()).max(3).default([]),
  action: z
    .enum(["none", "open_trial_room", "open_size_finder", "add_to_bag", "handoff"])
    .default("none"),
});

export type StylistReply = z.infer<typeof stylistReplySchema>;

export function parseStylistReply(raw: string): StylistReply {
  const text = raw.trim();

  // A fenced block, or a bare object somewhere in the text.
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidates = [
    fenced?.[1],
    text.startsWith("{") ? text : undefined,
    text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1) || undefined,
  ].filter((c): c is string => !!c && c.trim().startsWith("{"));

  for (const candidate of candidates) {
    try {
      const parsed = stylistReplySchema.safeParse(JSON.parse(candidate));
      if (parsed.success) return parsed.data;
    } catch {
      /* try the next candidate */
    }
  }

  // Not JSON. Use the text as written, with no product cards.
  return { reply: text.replace(/```[a-z]*|```/g, "").trim(), products: [], action: "none" };
}
