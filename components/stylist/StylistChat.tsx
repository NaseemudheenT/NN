"use client";

/**
 * The stylist, as a conversation.
 *
 * Streams the reply token by token from /api/stylist. When the key is not set
 * or the request fails it falls back to the house style guide below, which is
 * built from the same catalogue — so the stylist is never simply broken, it is
 * either answering from the model or answering from the range.
 *
 * Recommended pieces arrive as handles and are rendered as real product cards.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Product } from "@/lib/catalog/types";
import { GarmentArt } from "@/components/shop/GarmentArt";
import { track } from "@/components/layout/ConsentBanner";

interface Message {
  role: "user" | "assistant";
  text: string;
  products?: string[];
  /** Still arriving. */
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

/* ── the fallback, from the range itself ───────────────────────── */

function houseAnswer(question: string, products: Product[]): { text: string; products: string[] } {
  const q = question.toLowerCase();
  const find = (fragment: string) =>
    products.find((p) => `${p.name} ${p.colour}`.toLowerCase().includes(fragment))?.handle;

  const oxford = find("oxford") ?? products[0]?.handle;
  const charcoal = find("charcoal");
  const poplin = find("poplin");
  const pleated = find("pleated");
  const azure = find("azure");
  const sable = find("sable");
  const marine = find("marine");
  const stripe = find("stripe");
  const keep = (...h: (string | undefined)[]) => h.filter((x): x is string => !!x).slice(0, 3);

  if (/size|fit|tall|slim|kg|cm|waist|feet|ft|'/.test(q)) {
    return {
      text: "Most men of a slim build around 175 cm are a medium in our shirts and a 30 or 32 in the trouser. The trial room will give you a firmer answer: it works your measurements against the finished garment rather than a chart.",
      products: keep(oxford, charcoal),
    };
  }
  if (/wedding|reception|party|dinner|festive|celebrat/.test(q)) {
    return {
      text: "For a reception, the Poplin in Écru with the Pleated Trouser in Pierre looks considered without trying too hard. The pleat gives you room through a long evening.",
      products: keep(poplin, pleated),
    };
  }
  if (/office|work|interview|meeting|first day/.test(q)) {
    return {
      text: "Start with the Oxford in Bianco and the Tailored Trouser in Charcoal. It is the most reliable pairing in the collection and it reads correctly in any office.",
      products: keep(oxford, charcoal),
    };
  }
  if (/care|wash|iron|shrink|dry/.test(q)) {
    return {
      text: "Wash the shirts cold on a gentle cycle and line dry them in shade; iron on the reverse while slightly damp. The trousers prefer dry cleaning, though a cold wash inside out and a hang to dry will do.",
      products: keep(oxford, charcoal),
    };
  }
  if (/stripe/.test(q)) {
    return {
      text: "The Stripe works with every trouser we make. Marine keeps it tonal and sharp; Sable lifts it for the day.",
      products: keep(stripe, marine, sable),
    };
  }
  if (/weekend|casual|brunch|travel|holiday/.test(q)) {
    return {
      text: "The Oxford in Azure with the Tailored Trouser in Sable is easy and bright for daytime, and it travels well.",
      products: keep(azure, sable),
    };
  }
  return {
    text: "A good first pairing is the Oxford in Bianco with the Tailored Trouser in Marine. Tell me the occasion and I will narrow it down.",
    products: keep(oxford, marine),
  };
}

/* ── the component ─────────────────────────────────────────────── */

export function StylistChat({
  products,
  compact = false,
}: {
  products: Product[];
  compact?: boolean;
}) {
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", text: OPENING }]);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const log = useRef<HTMLDivElement>(null);
  const abort = useRef<AbortController | null>(null);

  const byHandle = new Map(products.map((p) => [p.handle, p]));

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
        .filter((m) => m.text !== OPENING)
        .map((m) => ({ role: m.role, text: m.text }));

      setMessages((prev) => [
        ...prev,
        { role: "user", text: q },
        { role: "assistant", text: "", streaming: true },
      ]);

      const fallback = (message?: string) => {
        const answer = houseAnswer(q, products);
        if (message) setNote(message);
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = {
            role: "assistant",
            text: answer.text,
            products: answer.products,
          };
          return next;
        });
      };

      try {
        abort.current?.abort();
        abort.current = new AbortController();

        const res = await fetch("/api/stylist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: q, history }),
          signal: abort.current.signal,
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

        while (!finished) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const frames = buffer.split("\n\n");
          buffer = frames.pop() ?? "";

          for (const frame of frames) {
            const eventLine = frame.split("\n").find((l) => l.startsWith("event: "));
            const dataLine = frame.split("\n").find((l) => l.startsWith("data: "));
            if (!eventLine || !dataLine) continue;

            const event = eventLine.slice(7).trim();
            let payload: { visible?: string; reply?: string; products?: string[]; message?: string };
            try {
              payload = JSON.parse(dataLine.slice(6));
            } catch {
              continue;
            }

            if (event === "delta" && typeof payload.visible === "string") {
              const visible = payload.visible;
              setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1] = { role: "assistant", text: visible, streaming: true };
                return next;
              });
            } else if (event === "done") {
              finished = true;
              setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1] = {
                  role: "assistant",
                  text: payload.reply?.trim() || houseAnswer(q, products).text,
                  products: payload.products ?? [],
                };
                return next;
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
    [busy, messages, products],
  );

  return (
    <div className="grid gap-6">
      {/* the conversation */}
      <div
        ref={log}
        className="flex flex-col gap-5 overflow-y-auto border p-6"
        style={{
          background: "var(--surface)",
          height: compact ? "22rem" : "min(60vh, 32rem)",
        }}
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
            {m.role === "assistant" ? (
              <p className="nn-eyebrow mb-2">NN stylist</p>
            ) : null}
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
                        <span className="block text-fine text-[var(--ink)]">
                          {p.name}
                        </span>
                        <span className="block text-[0.72rem] text-[var(--ink-faint)]">
                          {p.colour}
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

      {note ? (
        <p className="m-0 text-[0.72rem] text-[var(--ink-faint)]">{note}</p>
      ) : null}

      {/* suggestions */}
      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            disabled={busy}
            onClick={() => ask(s)}
            className="border px-3 py-2 text-[0.72rem] text-[var(--ink-soft)] transition-colors duration-500 hover:border-[var(--accent)] hover:text-[var(--ink)] disabled:opacity-40"
            style={{ borderColor: "var(--line)" }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* the composer */}
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
