"use client";

/**
 * The stylist, as a conversation.
 *
 * Streams from /api/stylist, which runs the tool loop server-side. While the
 * stylist is checking something real — stock, a size chart, the policy — the
 * interface says so, because "checking the size chart" is a more honest thing
 * to show than a spinner.
 *
 * When it proposes adding something to the bag, nothing is added: a confirm
 * step appears and the customer taps it themselves. That is a rule from the NN
 * AI brief and a good one — an AI that puts things in your bag unasked is an AI
 * you stop trusting.
 *
 * If the key is missing or the request fails it answers from the house style
 * guide, built from the same catalogue. The stylist is never simply broken.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/catalog/types";
import { formatMinor } from "@/lib/money";
import { GarmentArt } from "@/components/shop/GarmentArt";
import { track, readConsent } from "@/components/layout/ConsentBanner";
import { useBag } from "@/components/shop/BagProvider";
import { useDayPhase } from "@/components/theme/ThemeProvider";

interface Confirm {
  handle: string;
  size: string;
  quantity: number;
  title: string;
  price: string;
}

interface Message {
  role: "user" | "assistant";
  text: string;
  products?: string[];
  action?: string;
  confirm?: Confirm | null;
  /** Tools the stylist called, shown while it works. */
  checking?: string[];
  streaming?: boolean;
}

const OPENING =
  "Hello. I can help you choose from Collection 001, plan an outfit for an occasion, or work out your size. What are you dressing for?";

const SUGGESTIONS = [
  "What should I wear to a reception?",
  "First day at a new office",
  "I'm 5'9\" and slim — what size?",
  "How do I care for the Oxford?",
];

/** Plain English for what the stylist is doing. */
const TOOL_LABEL: Record<string, string> = {
  search_products: "looking through the collection",
  get_product: "reading the product details",
  check_stock: "checking what is in stock",
  get_size_chart: "reading the size chart",
  recommend_size: "working out your size",
  get_policy: "checking the policy",
  get_order_status: "looking up the order",
  add_to_bag: "preparing your bag",
  handoff_to_human: "passing this to NN care",
};

/* ── the fallback, built from the range itself ──────────────────── */

function houseAnswer(question: string, products: Product[]): { text: string; products: string[] } {
  const q = question.toLowerCase();
  const find = (fragment: string) =>
    products.find((p) => `${p.name} ${p.colour}`.toLowerCase().includes(fragment))?.handle;

  const oxford = find("oxford") ?? products[0]?.handle;
  const keep = (...h: (string | undefined)[]) => h.filter((x): x is string => !!x).slice(0, 3);

  if (/size|fit|tall|slim|kg|cm|waist|feet|ft|'/.test(q)) {
    return {
      text: "Most men of a slim build around 175 cm are a medium in our shirts and a 30 or 32 in the trouser. The trial room will give you a firmer answer: it works your measurements against the finished garment rather than a chart.",
      products: keep(oxford, find("charcoal")),
    };
  }
  if (/wedding|reception|party|dinner|festive|celebrat/.test(q)) {
    return {
      text: "For a reception, the Poplin in Écru with the Pleated Trouser in Pierre looks considered without trying too hard. The pleat gives you room through a long evening.",
      products: keep(find("poplin"), find("pleated")),
    };
  }
  if (/office|work|interview|meeting|first day/.test(q)) {
    return {
      text: "Start with the Oxford in Bianco and the Tailored Trouser in Charcoal. It is the most reliable pairing in the collection and it reads correctly in any office.",
      products: keep(oxford, find("charcoal")),
    };
  }
  if (/care|wash|iron|shrink|dry/.test(q)) {
    return {
      text: "Wash the shirts cold on a gentle cycle and line dry them in shade; iron on the reverse while slightly damp. The trousers prefer dry cleaning, though a cold wash inside out and a hang to dry will do.",
      products: keep(oxford),
    };
  }
  if (/stripe/.test(q)) {
    return {
      text: "The Stripe works with every trouser we make. Marine keeps it tonal and sharp; Sable lifts it for the day.",
      products: keep(find("stripe"), find("marine"), find("sable")),
    };
  }
  if (/weekend|casual|brunch|travel|holiday/.test(q)) {
    return {
      text: "The Oxford in Azure with the Tailored Trouser in Sable is easy and bright for daytime, and it travels well.",
      products: keep(find("azure"), find("sable")),
    };
  }
  return {
    text: "A good first pairing is the Oxford in Bianco with the Tailored Trouser in Marine. Tell me the occasion and I will narrow it down.",
    products: keep(oxford, find("marine")),
  };
}

/* ── the component ─────────────────────────────────────────────── */

export function StylistChat({
  products,
  compact = false,
  /** The piece the customer is looking at, if any. */
  currentProduct,
}: {
  products: Product[];
  compact?: boolean;
  currentProduct?: string;
}) {
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", text: OPENING }]);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const log = useRef<HTMLDivElement>(null);
  const abort = useRef<AbortController | null>(null);

  const { add, lines } = useBag();
  const { phase } = useDayPhase();
  const router = useRouter();

  const byHandle = useMemo(() => new Map(products.map((p) => [p.handle, p])), [products]);

  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => () => abort.current?.abort(), []);

  const ask = useCallback(
    async (text: string) => {
      const q = text.trim();
      if (!q || busy) return;

      setBusy(true);
      setNote(null);
      track("stylist_question", {});

      const history = messages
        .filter((m) => m.text && m.text !== OPENING)
        .map((m) => ({ role: m.role, text: m.text }));

      setMessages((prev) => [
        ...prev,
        { role: "user", text: q },
        { role: "assistant", text: "", streaming: true, checking: [] },
      ]);

      const replaceLast = (message: Message) =>
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = message;
          return next;
        });

      const fallback = (message?: string) => {
        const answer = houseAnswer(q, products);
        if (message) setNote(message);
        replaceLast({ role: "assistant", text: answer.text, products: answer.products });
      };

      try {
        abort.current?.abort();
        abort.current = new AbortController();

        const res = await fetch("/api/stylist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: abort.current.signal,
          body: JSON.stringify({
            question: q,
            history,
            consent: readConsent() === "granted",
            context: {
              localTime: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
              dayPhase: phase,
              currentPage: window.location.pathname,
              currentProduct: currentProduct ?? "none",
              bagSummary: lines.length
                ? lines
                    .map((l) => `${byHandle.get(l.handle)?.title ?? l.handle} size ${l.size} ×${l.quantity}`)
                    .join("; ")
                : "empty",
            },
          }),
        });

        if (!res.ok || !res.body) {
          const data = (await res.json().catch(() => null)) as { error?: string } | null;
          fallback(
            data?.error === "not_configured"
              ? "Answering from the NN style guide. Set ANTHROPIC_API_KEY to bring the full stylist online."
              : data?.error === "rate_limited"
                ? "The stylist is busy, so this is from the style guide."
                : "Answering from the NN style guide.",
          );
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let finished = false;
        const checking: string[] = [];

        while (!finished) {
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
              confirm?: Confirm | null;
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
              if (!checking.includes(label)) checking.push(label);
              replaceLast({ role: "assistant", text: "", streaming: true, checking: [...checking] });
            } else if (event === "delta" && typeof payload.visible === "string") {
              replaceLast({
                role: "assistant",
                text: payload.visible,
                streaming: true,
                checking: [...checking],
              });
            } else if (event === "done") {
              finished = true;
              replaceLast({
                role: "assistant",
                text: payload.reply?.trim() || houseAnswer(q, products).text,
                products: payload.products ?? [],
                action: payload.action,
                confirm: payload.confirm ?? null,
              });
            } else if (event === "error") {
              finished = true;
              fallback(payload.message);
            }
          }
        }

        if (!finished) fallback();
      } catch (err) {
        if ((err as Error)?.name !== "AbortError") fallback("Answering from the NN style guide.");
      } finally {
        setBusy(false);
      }
    },
    [busy, messages, products, phase, currentProduct, lines, byHandle],
  );

  /** The customer confirms; only then does anything reach the bag. */
  const confirmAdd = useCallback(
    (confirm: Confirm, index: number) => {
      add(
        { handle: confirm.handle, size: confirm.size, quantity: confirm.quantity },
        `${confirm.title}, size ${confirm.size},`,
      );
      setMessages((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], confirm: null, text: next[index].text };
        return next;
      });
    },
    [add],
  );

  return (
    <div className="grid gap-6">
      <div
        ref={log}
        className="flex flex-col gap-5 overflow-y-auto border p-6"
        style={{ background: "var(--surface)", height: compact ? "22rem" : "min(60vh, 32rem)" }}
        role="log"
        aria-live="polite"
        aria-label="Conversation with the NN stylist"
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={m.role === "user" ? "self-end text-right" : "self-start"}
            style={{ maxWidth: "min(46ch, 92%)" }}
          >
            {m.role === "assistant" ? <p className="nn-eyebrow mb-2">NN stylist</p> : null}

            {/* what it is checking, while it checks it */}
            {m.streaming && m.checking?.length ? (
              <p className="mb-2 text-[0.68rem] italic text-[var(--ink-faint)]">
                {m.checking.join(" · ")}…
              </p>
            ) : null}

            {m.text || !m.streaming ? (
              <p
                className="m-0 whitespace-pre-wrap px-4 py-3 text-fine"
                style={{
                  background: m.role === "user" ? "var(--btn-bg)" : "var(--bg)",
                  color: m.role === "user" ? "var(--btn-ink)" : "var(--ink)",
                  border: m.role === "user" ? "none" : "1px solid var(--line)",
                }}
              >
                {m.text || (m.streaming ? "Thinking about it…" : "")}
              </p>
            ) : m.checking?.length ? null : (
              <p className="m-0 px-4 py-3 text-fine text-[var(--ink-faint)]">Thinking about it…</p>
            )}

            {/* the confirm step — nothing reaches the bag without it */}
            {m.confirm ? (
              <div
                className="mt-3 border p-4"
                style={{ borderColor: "var(--accent)", background: "var(--bg)" }}
              >
                <p className="m-0 text-fine">
                  Add <strong>{m.confirm.title}</strong>, size {m.confirm.size}
                  {m.confirm.quantity > 1 ? ` ×${m.confirm.quantity}` : ""} — {m.confirm.price}?
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="nn-btn nn-btn--sm nn-btn--solid"
                    onClick={() => confirmAdd(m.confirm!, i)}
                  >
                    <span>Yes, add it</span>
                  </button>
                  <button
                    type="button"
                    className="nn-btn nn-btn--sm nn-btn--quiet"
                    onClick={() =>
                      setMessages((prev) => {
                        const next = [...prev];
                        next[i] = { ...next[i], confirm: null };
                        return next;
                      })
                    }
                  >
                    <span>Not yet</span>
                  </button>
                </div>
              </div>
            ) : null}

            {/* where it suggests going next */}
            {m.action === "open_trial_room" ? (
              <button
                type="button"
                onClick={() => router.push("/trial-room")}
                className="nn-link mt-3 text-eyebrow uppercase tracking-[0.14em]"
              >
                Open the trial room →
              </button>
            ) : null}

            {/* the pieces it suggested */}
            {m.products?.length ? (
              <div className="mt-3 flex flex-wrap gap-3">
                {m.products.map((handle) => {
                  const p = byHandle.get(handle);
                  if (!p) return null;
                  return (
                    <Link
                      key={handle}
                      href={`/product/${handle}`}
                      className="flex items-center gap-3 border p-2 no-underline transition-colors duration-500 hover:border-[var(--accent)]"
                      style={{ background: "var(--bg)", borderColor: "var(--line)" }}
                    >
                      <span
                        className="grid h-14 w-11 shrink-0 place-items-center"
                        style={{ background: "var(--paper)" }}
                      >
                        <GarmentArt product={p} className="w-full" />
                      </span>
                      <span className="text-left">
                        <span className="block text-fine text-[var(--ink)]">{p.name}</span>
                        <span className="block text-[0.72rem] text-[var(--ink-faint)]">
                          {p.colour} · {formatMinor(p.priceMinor, p.currency)}
                        </span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {note ? <p className="m-0 text-[0.72rem] text-[var(--ink-faint)]">{note}</p> : null}

      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            disabled={busy}
            onClick={() => void ask(s)}
            className="border px-3 py-2 text-[0.72rem] text-[var(--ink-soft)] transition-colors duration-500 hover:border-[var(--accent)] hover:text-[var(--ink)] disabled:opacity-40"
            style={{ borderColor: "var(--line)" }}
          >
            {s}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const q = question;
          setQuestion("");
          void ask(q);
        }}
        className="flex gap-3"
      >
        <label className="sr-only" htmlFor="nn-stylist-input">
          Ask the NN stylist
        </label>
        <input
          id="nn-stylist-input"
          className="nn-field flex-1"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="What are you dressing for?"
          maxLength={600}
          disabled={busy}
          autoComplete="off"
        />
        <button type="submit" className="nn-btn" disabled={busy || !question.trim()}>
          <span>{busy ? "Thinking" : "Ask"}</span>
        </button>
      </form>
    </div>
  );
}
