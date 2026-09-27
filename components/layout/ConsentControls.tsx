"use client";

/**
 * The consent choice, on the privacy page.
 *
 * A promise on a privacy page is worth nothing without a control beside it, so
 * this is the same decision the banner asks, changeable at any time, showing
 * which way it currently stands.
 */

import { useEffect, useState } from "react";
import { readConsent } from "./ConsentBanner";

type Consent = "granted" | "declined" | null;

export function ConsentControls() {
  const [consent, setConsent] = useState<Consent>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setConsent(readConsent());
    setReady(true);
  }, []);

  const choose = (value: Consent) => {
    try {
      if (value === null) window.localStorage.removeItem("nn-consent");
      else window.localStorage.setItem("nn-consent", value);
    } catch {
      /* the choice still applies for this visit */
    }
    setConsent(value);
  };

  if (!ready) return null;

  return (
    <div
      className="my-6 border p-5"
      style={{ borderColor: "var(--line)", background: "var(--surface)" }}
    >
      <p className="m-0 text-[var(--text-step--1)] text-[var(--ink)]">
        Right now:{" "}
        <strong>
          {consent === "granted"
            ? "you have agreed to be counted."
            : consent === "declined"
              ? "you have declined, and nothing is being recorded."
              : "you have not been asked yet."}
        </strong>
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          className="nn-btn nn-btn--sm"
          onClick={() => choose("granted")}
          disabled={consent === "granted"}
        >
          <span>Allow counting</span>
        </button>
        <button
          type="button"
          className="nn-btn nn-btn--sm nn-btn--quiet"
          onClick={() => choose("declined")}
          disabled={consent === "declined"}
        >
          <span>Do not count me</span>
        </button>
        {consent !== null ? (
          <button
            type="button"
            className="nn-link text-[var(--text-eyebrow)] uppercase tracking-[0.14em]"
            onClick={() => choose(null)}
          >
            Forget my answer
          </button>
        ) : null}
      </div>
    </div>
  );
}
