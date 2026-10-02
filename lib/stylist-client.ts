/**
 * Talking to the stylist, lifted out of the chat UI that used to hold it.
 *
 * The streaming protocol is the part worth preserving independently of any
 * interface: the server sends Server-Sent Events carrying four kinds of frame,
 * and reading them correctly is fiddly enough that it should not have to be
 * rewritten every time the chat window is redesigned.
 *
 *   tool   — the model reached for the catalogue. Shown as "checking sizes…",
 *            because a silent pause while it works reads as a hang.
 *   delta  — more visible text. Note VISIBLE: the model's reasoning is not
 *            in this field and must never be rendered.
 *   done   — the final answer, the products it actually found, and any
 *            action the UI should offer.
 *   error  — the server gave up; fall back to the house answer.
 *
 * ── the two rules that matter ────────────────────────────────────────
 * Frames arrive split across network chunks, so the buffer keeps whatever is
 * left after the last complete "\n\n" and prepends it to the next read.
 * Parsing each chunk independently drops any frame unlucky enough to straddle
 * a packet boundary, which looks like the stylist occasionally skipping a word.
 *
 * And the products in `done` are the ONLY products that may be shown. The
 * server has already checked each one against the real catalogue. Rendering
 * anything the model merely mentioned in prose would put invented garments in
 * front of a customer, which for a real shop is the worst thing this file
 * could do.
 */

export interface StylistContext {
  localTime: string;
  dayPhase: string;
  currentPage: string;
  currentProduct: string;
  bagSummary: string;
}

export interface StylistTurn {
  role: "user" | "assistant";
  text: string;
}

export interface StylistEvents {
  /** The model reached for a tool. Label is already human-readable. */
  onTool?: (label: string) => void;
  /** More visible text. Replaces, not appends — the server sends the whole
      visible string each time, so appending would duplicate it. */
  onDelta?: (visible: string) => void;
  /** Finished. `products` are catalogue-verified handles. */
  onDone?: (result: { reply: string; products: string[]; action?: string }) => void;
  /** Could not answer live. The caller should use the house answer. */
  onFallback?: (reason: string) => void;
}

const TOOL_LABEL: Record<string, string> = {
  search_catalogue: "searching the collection",
  get_product: "reading the product",
  size_advice: "checking sizes",
  outfit_for: "building an outfit",
};

/** Why the live stylist is unavailable, in words a customer can read. */
function fallbackReason(error?: string): string {
  if (error === "not_configured") {
    return "Answering from the NN style guide. Set ANTHROPIC_API_KEY to bring the full stylist online.";
  }
  if (error === "rate_limited") return "The stylist is busy, so this is from the style guide.";
  return "Answering from the NN style guide.";
}

/**
 * Ask the stylist and stream the answer.
 *
 * Returns when the stream ends. Pass an AbortSignal to cancel — a customer
 * who navigates away mid-answer should not leave a reader running.
 */
export async function askStylist({
  question,
  history,
  consent,
  context,
  signal,
  events,
}: {
  question: string;
  history: StylistTurn[];
  consent: boolean;
  context: StylistContext;
  signal?: AbortSignal;
  events: StylistEvents;
}): Promise<void> {
  const res = await fetch("/api/stylist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal,
    body: JSON.stringify({ question, history, consent, context }),
  });

  if (!res.ok || !res.body) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    events.onFallback?.(fallbackReason(data?.error));
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  /* Whatever is left after the last complete frame. Frames straddle network
     chunks, and dropping those looks like the stylist skipping words. */
  let buffer = "";
  const toolsSeen: string[] = [];

  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";

    for (const frame of frames) {
      const event = frame.match(/^event: (.+)$/m)?.[1];
      const data = frame.match(/^data: (.+)$/m)?.[1];
      if (!event || !data) continue;

      let payload: {
        visible?: string;
        reply?: string;
        products?: string[];
        action?: string;
        name?: string;
        message?: string;
      };
      try {
        payload = JSON.parse(data);
      } catch {
        continue;
      }

      if (event === "tool" && payload.name) {
        const label = TOOL_LABEL[payload.name] ?? payload.name.replace(/_/g, " ");
        if (!toolsSeen.includes(label)) {
          toolsSeen.push(label);
          events.onTool?.(label);
        }
      } else if (event === "delta" && typeof payload.visible === "string") {
        events.onDelta?.(payload.visible);
      } else if (event === "done") {
        events.onDone?.({
          reply: payload.reply?.trim() ?? "",
          /* Catalogue-verified by the server. The only handles that may be
             rendered — anything the model merely said in prose is prose. */
          products: payload.products ?? [],
          action: payload.action,
        });
        return;
      } else if (event === "error") {
        events.onFallback?.(fallbackReason(payload.message));
        return;
      }
    }
  }
}
