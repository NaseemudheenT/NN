"use client";

/**
 * The stylist, reachable from anywhere.
 *
 * A small gold mark at the corner of every page, and a panel that slides up
 * over whatever the customer was looking at. The same conversation component as
 * the stylist page — one implementation, two places — so an answer given here
 * behaves exactly as it does there.
 *
 * It stays out of the way: nothing opens by itself, nothing appears on a timer,
 * and it hides itself on the stylist page, where it would be absurd.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { Product } from "@/lib/catalog/types";
import { StylistChat } from "./StylistChat";
import { AtelierOrb } from "@/components/ai/AtelierOrb";

/** Other parts of the site open the stylist by dispatching this. */
const OPEN_EVENT = "nn:stylist-open";

export function openStylist() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export function StylistDock({ products }: { products: Product[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  const close = useCallback(() => setOpen(false), []);

  /* opened from the showroom's concierge, or anywhere else */
  useEffect(() => {
    const onOpen = () => {
      opener.current = document.activeElement as HTMLElement | null;
      setOpen(true);
    };
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, []);

  /* a route change closes it */
  useEffect(() => setOpen(false), [pathname]);

  /* focus in and back out, and Escape closes */
  useEffect(() => {
    if (open) {
      panel.current
        ?.querySelector<HTMLElement>('button, [href], input, [tabindex]:not([tabindex="-1"])')
        ?.focus();
    } else {
      opener.current?.focus?.();
    }
  }, [open]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      close();
      return;
    }
    if (e.key !== "Tab" || !panel.current) return;
    const focusable = Array.from(
      panel.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => el.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  // The stylist page is the stylist. A dock on it would be silly.
  if (pathname === "/stylist") return null;

  return (
    <>
      {!open ? (
        <button
          type="button"
          onClick={() => {
            opener.current = document.activeElement as HTMLElement | null;
            setOpen(true);
          }}
          className="nn-panel fixed bottom-4 right-4 z-40 flex items-center gap-2.5 p-3 transition-[border-color,transform] duration-500 hover:-translate-y-0.5 hover:border-[var(--accent)] sm:bottom-5 sm:right-5 sm:px-4"
          aria-label="Ask the NN stylist"
        >
          <AtelierOrb size="sm" state="idle" />
          {/* On a phone the mark alone: the label would crowd the bar above it. */}
          <span className="hidden text-eyebrow uppercase tracking-[0.16em] sm:inline">
            Ask the stylist
          </span>
        </button>
      ) : null}

      {open ? (
        <>
          <button
            type="button"
            aria-label="Close the stylist"
            onClick={close}
            tabIndex={-1}
            className="fixed inset-0 z-40 cursor-default border-0 p-0"
            style={{ background: "color-mix(in srgb, #000 42%, transparent)" }}
          />

          <div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="nn-dock-title"
            onKeyDown={onKeyDown}
            className="nn-panel fixed bottom-0 left-0 right-0 z-50 mx-auto flex max-h-[86svh] w-full max-w-[34rem] flex-col overflow-y-auto sm:bottom-5 sm:left-auto sm:right-5"
            style={{ animation: "nn-slide-up 460ms var(--ease-showroom) both" }}
          >
            <div className="flex items-start justify-between gap-4 border-b p-5">
              <div className="flex items-center gap-3">
                <AtelierOrb size="md" state="listening" />
                <div>
                  <h2 id="nn-dock-title" className="text-lead">
                    Your NN stylist
                  </h2>
                  <p className="m-0 text-[0.68rem] text-[var(--ink-faint)]">
                    Collection 001 only. No invented offers.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={close}
                className="nn-link text-eyebrow uppercase tracking-[0.16em]"
              >
                Close
              </button>
            </div>

            <div className="p-5">
              <StylistChat products={products} compact />
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
