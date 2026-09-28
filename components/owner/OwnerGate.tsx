"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Monogram } from "@/components/brand/Monogram";
import { GlassButton } from "@/components/ui/glass/Glass";
import { MOTION } from "@/lib/tokens";

export function OwnerGate({ configured }: { configured: boolean }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  async function request(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setProblem(null);
    try {
      const res = await fetch("/api/owner/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { message?: string };
      if (res.status === 503) {
        setProblem(data.message ?? "Owner access is not configured.");
      } else {
        setSent(true);
      }
    } catch {
      setProblem("The request could not be sent. Check your connection.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative z-10 flex min-h-[80svh] items-center justify-center px-6 py-24">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: MOTION.slow, ease: MOTION.ease }}
        className="nn-glass w-full max-w-md rounded-md p-8"
      >
        <Monogram className="h-8 w-auto text-ink" />
        <p className="nn-meta mt-6 text-ink-faint">Private</p>
        <h1 className="nn-display mt-2 text-3xl text-ink">Operations</h1>

        {!configured ? (
          <p className="nn-body mt-6 text-[0.875rem] text-ink-soft">
            The console is not configured on this deployment. It needs{" "}
            <code className="text-ink">SUPABASE_URL</code>,{" "}
            <code className="text-ink">SUPABASE_ANON_KEY</code> and{" "}
            <code className="text-ink">OWNER_EMAILS</code>.
          </p>
        ) : sent ? (
          <p className="nn-body mt-6 text-[0.875rem] text-ink-soft">
            If that address can open the console, a one-time link is on its way. It expires
            shortly.
          </p>
        ) : (
          <form onSubmit={request} className="mt-7 space-y-4">
            <div>
              <label htmlFor="owner-email" className="nn-meta text-ink-faint">
                Email
              </label>
              <input
                id="owner-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full border border-line bg-transparent px-4 py-3.5 text-[0.95rem] text-ink outline-none focus-visible:border-accent"
              />
            </div>
            <GlassButton type="submit" variant="solid" className="w-full" magnetic={false} disabled={busy}>
              {busy ? "Sending…" : "Send the link"}
            </GlassButton>
          </form>
        )}

        {problem && (
          <p className="nn-body mt-5 text-[0.8rem] text-[var(--nn-burgundy)]" role="alert">
            {problem}
          </p>
        )}
      </motion.div>
    </div>
  );
}
