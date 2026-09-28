"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Orb, type OrbState } from "./Orb";
import { useCatalog } from "@/components/layout/CatalogProvider";
import { GlassButton } from "@/components/ui/glass/Glass";
import { formatMoney } from "@/lib/bag";
import { MOTION } from "@/lib/tokens";

export interface Turn {
  role: "you" | "stylist";
  text: string;
  handles?: string[];
}

const OPENERS = [
  "What should I wear to a summer wedding?",
  "How does the Oxford fit across the shoulder?",
  "Build me a week of shirts and trousers.",
];

/**
 * The stylist. Real Claude, called only from the server, and allowed to
 * recommend only products that exist in the catalogue it was handed.
 */
export function StylistPanel({
  compact = false,
  onClose,
}: {
  compact?: boolean;
  onClose?: () => void;
}) {
  const { products, configured } = useCatalog();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [state, setState] = useState<OrbState>("idle");
  const [unavailable, setUnavailable] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [turns, state]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || state === "thinking" || state === "responding") return;
    setDraft("");
    setTurns((t) => [...t, { role: "you", text: question }]);
    setState("thinking");
    setUnavailable(null);

    try {
      const res = await fetch("/api/stylist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          history: turns.slice(-6).map((t) => ({ role: t.role, text: t.text })),
        }),
      });

      if (res.status === 503) {
        const body = (await res.json()) as { message?: string };
        setUnavailable(body.message ?? "The stylist is not available right now.");
        setState("error");
        return;
      }
      if (!res.ok || !res.body) throw new Error(`stylist ${res.status}`);

      setState("responding");
      setTurns((t) => [...t, { role: "stylist", text: "" }]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        const visible = acc.split("<<<products")[0];
        setTurns((t) => {
          const next = [...t];
          next[next.length - 1] = { role: "stylist", text: visible };
          return next;
        });
      }

      const [, tail] = acc.split("<<<products");
      const handles = tail
        ? tail
            .replace(/[>]+$/g, "")
            .split(",")
            .map((h) => h.trim())
            .filter((h) => products.some((p) => p.handle === h))
        : [];

      setTurns((t) => {
        const next = [...t];
        next[next.length - 1] = {
          role: "stylist",
          text: acc.split("<<<products")[0].trim(),
          handles,
        };
        return next;
      });
      setState("idle");
    } catch {
      setUnavailable("The stylist could not be reached. You can keep browsing the collection.");
      setState("error");
    }
  }

  return (
    <div className={`flex min-h-0 flex-col ${compact ? "h-[28rem]" : "h-full"}`}>
      <header className="flex items-center gap-3.5 border-b border-line px-5 py-4">
        <Orb state={state} size={38} />
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg leading-none text-ink">Stylist</p>
          <p className="nn-meta mt-1.5 text-ink-faint">
            {state === "thinking"
              ? "Considering the collection"
              : state === "responding"
                ? "Answering"
                : "Nero Noren"}
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="nn-label text-ink-faint transition-colors hover:text-ink"
          >
            Close
          </button>
        )}
      </header>

      <div ref={scroller} className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5">
        {turns.length === 0 && (
          <div className="space-y-5">
            <p className="nn-body text-sm text-ink-soft">
              I know Collection 001 and nothing else. Ask about fit, fabric, what goes with what,
              or what to wear to something specific.
            </p>
            <div className="flex flex-wrap gap-2">
              {OPENERS.map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => send(o)}
                  className="nn-label rounded-full border border-line px-3.5 py-2 text-left text-ink-soft transition-colors hover:border-accent hover:text-ink"
                >
                  {o}
                </button>
              ))}
            </div>
          </div>
        )}

        {turns.map((t, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: MOTION.base, ease: MOTION.ease }}
            className={t.role === "you" ? "flex justify-end" : ""}
          >
            {t.role === "you" ? (
              <p className="max-w-[80%] rounded-sm bg-ink px-4 py-3 text-sm leading-relaxed text-bg">
                {t.text}
              </p>
            ) : (
              <div className="space-y-4">
                <p className="nn-body whitespace-pre-wrap text-sm text-ink">
                  {t.text}
                  {state === "responding" && i === turns.length - 1 && (
                    <span className="ml-0.5 inline-block h-3.5 w-px translate-y-0.5 animate-pulse bg-accent" />
                  )}
                </p>
                {t.handles && t.handles.length > 0 && (
                  <ul className="grid gap-2.5">
                    {t.handles.map((h) => {
                      const p = products.find((x) => x.handle === h);
                      if (!p) return null;
                      return (
                        <li key={h}>
                          <Link
                            href={`/product/${p.handle}`}
                            onClick={onClose}
                            className="nn-glass nn-glass-live flex items-center gap-4 rounded-sm p-3 transition-colors hover:border-accent/60"
                          >
                            <span
                              className="h-16 w-12 shrink-0 border border-line"
                              style={{
                                background: p.images[0]
                                  ? `center/cover no-repeat url(${p.images[0].url})`
                                  : p.swatch,
                              }}
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block font-display text-lg leading-tight text-ink">
                                {p.title}
                              </span>
                              <span className="nn-meta block text-ink-faint">
                                {p.colour} · {p.fabric}
                              </span>
                            </span>
                            <span className="nn-label text-ink-soft">
                              {formatMoney(p.price) ?? "In store"}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </motion.div>
        ))}

        <AnimatePresence>
          {unavailable && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-sm border border-line px-4 py-3.5"
            >
              <p className="nn-body text-sm text-ink-soft">{unavailable}</p>
              <GlassButton href="/collection" variant="quiet" size="sm" className="mt-3">
                Browse the collection
              </GlassButton>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <form
        className="flex items-center gap-2 border-t border-line px-4 py-3"
        onSubmit={(e) => {
          e.preventDefault();
          send(draft);
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask the stylist…"
          aria-label="Ask the stylist"
          className="min-w-0 flex-1 bg-transparent px-1 py-2.5 text-sm text-ink outline-none placeholder:text-ink-faint"
        />
        <GlassButton
          type="submit"
          variant="solid"
          size="sm"
          magnetic={false}
          disabled={!draft.trim() || state === "thinking" || state === "responding"}
        >
          Ask
        </GlassButton>
      </form>

      {!configured && (
        <p className="nn-meta border-t border-line-soft px-5 py-2.5 leading-relaxed text-ink-faint">
          The stylist only ever recommends pieces that exist in the catalogue.
        </p>
      )}
    </div>
  );
}
