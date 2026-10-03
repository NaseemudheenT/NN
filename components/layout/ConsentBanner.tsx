"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * Consent, under the DPDP Act.
 *
 * Nothing is measured before the visitor says yes. That is not a banner
 * behaviour, it is a code behaviour: `track()` reads the stored decision and
 * returns without sending anything until there is an explicit yes, so a
 * visitor who never answers is never counted — not counted anonymously, not
 * counted "essentially", not counted at all.
 *
 * Declining is one click and the same size as accepting. A decline that
 * takes three taps through a settings sheet is not a decline.
 */

const KEY = "nn-consent";
type Decision = "yes" | "no" | null;

function read(): Decision {
  try {
    const v = window.localStorage.getItem(KEY);
    return v === "yes" || v === "no" ? v : null;
  } catch {
    return null;
  }
}

export function hasConsent(): boolean {
  if (typeof window === "undefined") return false;
  return read() === "yes";
}

/** Send an event — or, far more often, do nothing at all. */
export function track(name: string, detail?: Record<string, string | number>) {
  if (!hasConsent()) return;
  try {
    const body = JSON.stringify({ name, detail, at: Date.now() });
    if (navigator.sendBeacon) navigator.sendBeacon("/api/analytics", new Blob([body], { type: "application/json" }));
    else void fetch("/api/analytics", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true });
  } catch {
    /* measurement is never allowed to break a purchase */
  }
}

export function ConsentBanner() {
  const [decision, setDecision] = useState<Decision>("yes"); // assume decided until read
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setDecision(read());
    setReady(true);
  }, []);

  const answer = (v: "yes" | "no") => {
    try { window.localStorage.setItem(KEY, v); } catch {}
    setDecision(v);
  };

  if (!ready || decision !== null) return null;

  return (
    <div className="consent glass" role="dialog" aria-label="Analytics consent">
      <p className="small consent__text">
        We would like to count anonymous visits so we know which pieces people look at. Nothing is
        recorded unless you agree. <Link href="/privacy" className="ul-grow">Privacy</Link>
      </p>
      <div className="consent__acts">
        <button type="button" className="btn btn--line btn--sm" onClick={() => answer("no")}>Decline</button>
        <button type="button" className="btn btn--solid btn--sm" onClick={() => answer("yes")}>Allow</button>
      </div>
    </div>
  );
}
