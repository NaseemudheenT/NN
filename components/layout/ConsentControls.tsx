"use client";

import { useEffect, useState } from "react";

/**
 * Changing your mind.
 *
 * The decision taken in the banner is stored on the device, so this reads
 * and rewrites the same key. A privacy page that explains a choice without
 * offering to reverse it is a notice, not a control.
 */
export function ConsentControls() {
  const [state, setState] = useState<"yes" | "no" | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const v = window.localStorage.getItem("nn-consent");
      setState(v === "yes" || v === "no" ? v : null);
    } catch {
      /* no storage: the answer below is "not decided", which is the truth */
    }
    setReady(true);
  }, []);

  const set = (v: "yes" | "no") => {
    try { window.localStorage.setItem("nn-consent", v); } catch {}
    setState(v);
  };

  if (!ready) return null;

  return (
    <div className="consent-ctl">
      <p className="small">
        <strong>On this device:</strong>{" "}
        {state === "yes" ? "analytics allowed." : state === "no" ? "analytics declined." : "you have not decided yet."}
      </p>
      <div className="consent-ctl__acts">
        <button type="button" className="btn btn--line btn--sm" onClick={() => set("no")} disabled={state === "no"}>
          Decline
        </button>
        <button type="button" className="btn btn--solid btn--sm" onClick={() => set("yes")} disabled={state === "yes"}>
          Allow
        </button>
      </div>
    </div>
  );
}
