"use client";

import { useState } from "react";
import { ArrowRight } from "@/components/ui/icons";

/**
 * Join our world.
 *
 * Posts to the real route and SAYS WHAT HAPPENED. A newsletter field that
 * clears itself and shows a tick regardless of whether anything was stored
 * is the most common small lie on the web, and this site does not tell it:
 * when the list is not connected the reply says the address was not saved.
 *
 * The form still submits natively if the JavaScript never arrives — the
 * action and method are real — so the field is never a dead box.
 */
export function Subscribe() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "failed">("idle");
  const [message, setMessage] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || state === "sending") return;
    setState("sending");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string };
      setMessage(json.message ?? "");
      setState(json.ok ? "done" : "failed");
      if (json.ok) setEmail("");
    } catch {
      setState("failed");
      setMessage("We could not reach the server. Please try again.");
    }
  };

  return (
    <>
      <form className="ftr__form" action="/api/subscribe" method="post" onSubmit={submit}>
        <input
          className="field"
          type="email"
          name="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email address"
          aria-label="Your email address"
          disabled={state === "sending"}
        />
        <button type="submit" className="icon-btn ftr__send" aria-label="Subscribe" disabled={state === "sending"}>
          <ArrowRight size={17} />
        </button>
      </form>
      {message ? (
        <p className="small ftr__says" data-failed={state === "failed" || undefined} role="status">
          {message}
        </p>
      ) : null}
    </>
  );
}
