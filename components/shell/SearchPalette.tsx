"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Search } from "@/components/ui/icons";
import { formatMinor } from "@/lib/money";
import type { Product } from "@/lib/catalog/types";
import { useSearch } from "./SearchProvider";
import { useEscape, useFocusTrap, useLockScroll } from "@/lib/ui/overlay";

/**
 * Search.
 *
 * The catalogue is eight pieces, so there is nothing to fetch and nothing to
 * debounce: the whole thing is already on the client and the filter runs on
 * every keystroke in well under a frame. Reaching for a search endpoint here
 * would add a round trip and a loading state to a problem that has neither.
 *
 * ⌘K / Ctrl-K opens it from anywhere, and the arrow keys walk the results,
 * because someone who searches twice will search a hundred times.
 */
export function SearchPalette({ catalogue }: { catalogue: Product[] }) {
  const { isOpen, open, close } = useSearch();
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(0);

  const ref = useFocusTrap<HTMLDivElement>(isOpen);
  useEscape(isOpen, close);
  useLockScroll(isOpen);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        open();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => { if (!isOpen) { setQ(""); setCursor(0); } }, [isOpen]);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return catalogue.slice(0, 6);
    return catalogue
      .filter((p) =>
        [p.name, p.colour, p.title, p.fabric, p.type, p.style, p.bestFor]
          .join(" ")
          .toLowerCase()
          .includes(needle),
      )
      .slice(0, 8);
  }, [q, catalogue]);

  useEffect(() => { setCursor(0); }, [q]);

  if (!isOpen) return null;

  return (
    <div className="sheet sheet--top" role="presentation">
      <button type="button" className="sheet__scrim" aria-label="Close search" onClick={close} />
      <div
        ref={ref}
        className="pal glass glass--light"
        role="dialog"
        aria-modal="true"
        aria-label="Search the collection"
        tabIndex={-1}
      >
        <div className="pal__bar">
          <Search size={18} />
          <input
            className="pal__input"
            value={q}
            autoFocus
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setCursor((c) => Math.min(c + 1, results.length - 1)); }
              if (e.key === "ArrowUp") { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)); }
              if (e.key === "Enter" && results[cursor]) {
                window.location.href = `/product/${results[cursor].handle}`;
              }
            }}
            placeholder="Search products, styles, fabrics…"
            aria-label="Search products, styles, fabrics"
          />
          <kbd className="pal__kbd label">esc</kbd>
        </div>

        <ul className="pal__list">
          {results.map((p, i) => (
            <li key={p.handle}>
              <Link
                href={`/product/${p.handle}`}
                className="pal__row"
                data-on={i === cursor || undefined}
                onMouseEnter={() => setCursor(i)}
                onClick={close}
              >
                <span className="pal__img">
                  {p.images[0] ? (
                    <Image src={p.images[0].url} alt="" width={44} height={56} />
                  ) : (
                    <span className="pal__swatch" style={{ background: p.hex }} />
                  )}
                </span>
                <span className="pal__name">{p.name}</span>
                <span className="small muted">{p.colour}</span>
                <span className="tnum pal__price">{formatMinor(p.priceMinor, p.currency)}</span>
              </Link>
            </li>
          ))}
          {results.length === 0 ? (
            <li className="pal__none">
              <p className="lead">Nothing matches “{q}”.</p>
              <p className="small muted">Collection 001 is eight pieces — <Link href="/collection" className="ul-grow" onClick={close}>see them all</Link>.</p>
            </li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}
