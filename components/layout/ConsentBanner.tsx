"use client";

/**
 * India DPDP Act consent.
 *
 * Nothing is measured before a visitor says yes. The banner asks once, stores
 * the answer on the device, and the analytics helper below refuses to send
 * anything until consent is "granted". Declining is a real choice with the same
 * visual weight as accepting — no dark pattern, no "manage preferences" maze.
 */

import { useCallback, useEffect, useState } from "react";

const KEY = "nn-consent";
type Consent = "granted" | "declined";

export function readConsent(): Consent | null {
  try {
    const v = window.localStorage.getItem(KEY);
    return v === "granted" || v === "declined" ? v : null;
  } catch {
    return null;
  }
}

/** Send an analytics event, but only with consent. Silent no-op otherwise. */
export function track(event: string, detail: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  if (readConsent() !== "granted") return;
  try {
    const body = JSON.stringify({ event, detail, at: new Date().toISOString() });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/analytics", new Blob([body], { type: "application/json" }));
    } else {
      void fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      });
    }
  } catch {
    /* analytics must never break the shop */
  }
}

export function ConsentBanner() {
  const [decided, setDecided] = useState<Consent | null>("granted"); // assume decided until read
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setDecided(readConsent());
    setReady(true);
  }, []);

  const choose = useCallback((value: Consent) => {
    try {
      window.localStorage.setItem(KEY, value);
    } catch {
      /* the choice still holds for this visit */
    }
    setDecided(value);
  }, []);

  if (!ready || decided !== null) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="nn-consent-title"
      className="nn-panel fixed inset-x-3 bottom-3 z-50 nn-fade-up md:inset-x-auto md:right-6 md:bottom-6 md:max-w-[26rem]"
    >
      <div className="p-6">
        <h2
          id="nn-consent-title"
          className="text-[var(--text-step-1)] font-[family-name:var(--font-display)]"
        >
          A word about measurement
        </h2>
        <p className="mt-3 text-[var(--text-step--1)] text-[var(--ink-soft)]">
          We would like to count which parts of the showroom people use, so we can make
          it better. Nothing is recorded until you agree, and we never sell what we
          learn. You can change your mind at any time on our{" "}
          <a href="/privacy" className="nn-link">
            privacy page
          </a>
          .
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" className="nn-btn nn-btn--sm" onClick={() => choose("granted")}>
            <span>Allow</span>
          </button>
          <button
            type="button"
            className="nn-btn nn-btn--sm nn-btn--quiet"
            onClick={() => choose("declined")}
          >
            <span>No thank you</span>
          </button>
        </div>
      </div>
    </div>
  );
}
