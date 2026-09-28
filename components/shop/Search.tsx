"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useCatalog } from "@/components/layout/CatalogProvider";
import { formatMoney } from "@/lib/bag";
import { MOTION } from "@/lib/tokens";
import type { Product } from "@/lib/types";

/**
 * A command surface, not a search box. Results are real catalogue entries
 * only — it never invents a product to fill the list.
 */
export function Search({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { products, configured } = useCatalog();
  const [q, setQ] = useState("");
  // The highlighted row resets whenever the query changes, without an effect.
  const [cursorFor, setCursorFor] = useState<{ q: string; index: number }>({ q: "", index: 0 });
  const cursor = cursorFor.q === q ? cursorFor.index : 0;
  const setCursor = useCallback(
    (next: number | ((n: number) => number)) =>
      setCursorFor((prev) => {
        const base = prev.q === q ? prev.index : 0;
        return { q, index: typeof next === "function" ? next(base) : next };
      }),
    [q],
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const pool = needle
      ? products.filter((p) =>
          `${p.title} ${p.colour} ${p.fabric} ${p.category} ${p.fit}`
            .toLowerCase()
            .includes(needle),
        )
      : products;
    return pool.slice(0, 7);
  }, [q, products]);

  useEffect(() => {
    if (open) {
      const t = window.setTimeout(() => inputRef.current?.focus(), 60);
      document.body.style.overflow = "hidden";
      return () => {
        window.clearTimeout(t);
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setCursor((c) => Math.min(c + 1, results.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setCursor((c) => Math.max(c - 1, 0));
      }
      if (e.key === "Enter" && results[cursor]) {
        onClose();
        router.push(`/product/${results[cursor].handle}`);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, results, cursor, onClose, router, setCursor]);

  const go = (p: Product) => {
    onClose();
    router.push(`/product/${p.handle}`);
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[75]" role="dialog" aria-modal="true" aria-label="Search">
          <motion.button
            type="button"
            aria-label="Close search"
            className="absolute inset-0 bg-nnblack/50 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="nn-glass absolute inset-x-0 bottom-0 max-h-[82vh] overflow-hidden rounded-t-md sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-[14vh] sm:w-[min(38rem,92vw)] sm:-translate-x-1/2 sm:rounded-md"
            initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 24, filter: "blur(10px)" }}
            transition={MOTION.spring}
          >
            <div className="flex items-center gap-3 border-b border-line px-5 py-4">
              <span className="nn-meta text-ink-faint">Find</span>
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Oxford, trouser, marine…"
                aria-label="Search the collection"
                className="flex-1 bg-transparent font-display text-xl font-light text-ink outline-none placeholder:text-ink-faint"
              />
              <kbd className="nn-meta hidden rounded-sm border border-line px-2 py-1 text-ink-faint sm:block">
                Esc
              </kbd>
            </div>

            <ul className="max-h-[60vh] overflow-y-auto p-2">
              {results.length === 0 && (
                <li className="px-4 py-8 text-center">
                  <p className="nn-body text-sm text-ink-faint">
                    Nothing in the collection matches that.
                  </p>
                </li>
              )}
              {results.map((p, i) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onMouseEnter={() => setCursor(i)}
                    onClick={() => go(p)}
                    className={`flex w-full items-center gap-4 rounded-sm px-3 py-3 text-left transition-colors ${
                      i === cursor ? "bg-ink/[0.06]" : ""
                    }`}
                  >
                    <span
                      className="h-11 w-8 shrink-0 border border-line"
                      style={{
                        background: p.images[0]
                          ? `center/cover no-repeat url(${p.images[0].url})`
                          : p.swatch,
                      }}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block font-display text-lg leading-tight text-ink">
                        {p.title}
                      </span>
                      <span className="nn-meta block text-ink-faint">
                        {p.colour} · {p.fabric}
                      </span>
                    </span>
                    <span className="nn-label shrink-0 text-ink-soft">
                      {formatMoney(p.price) ?? "In store"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            {!configured && (
              <p className="nn-meta border-t border-line px-5 py-3 leading-relaxed text-ink-faint">
                Showing Collection 001 as displayed in the showroom. Prices and stock arrive with
                the store connection.
              </p>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
