"use client";

/**
 * A single quiet line of confirmation, bottom centre. Announced politely to
 * screen readers so an "added to bag" is never silent.
 */

import { useEffect, useState } from "react";

const EVENT = "nn:toast";

export function toast(message: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<string>(EVENT, { detail: message }));
}

export function Toaster() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const onToast = (e: Event) => {
      setMessage((e as CustomEvent<string>).detail);
      clearTimeout(timer);
      timer = setTimeout(() => setMessage(null), 2800);
    };
    window.addEventListener(EVENT, onToast);
    return () => {
      window.removeEventListener(EVENT, onToast);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed inset-x-0 bottom-8 z-50 flex justify-center px-4"
    >
      {message ? (
        <p
          className="nn-panel nn-fade-up m-0 px-5 py-3 text-[var(--text-step--1)]"
          style={{ borderColor: "var(--accent)" }}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
