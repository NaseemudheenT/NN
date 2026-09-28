"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Monogram } from "@/components/brand/Monogram";
import { GlassButton } from "@/components/ui/glass/Glass";

/**
 * Supabase returns the access token in the URL fragment, which never reaches
 * the server. This exchanges it for a signed, http-only session cookie and
 * then removes it from the address bar.
 */
export function EnterConsole() {
  const router = useRouter();
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const accessToken = fragment.get("access_token");

      if (!accessToken) {
        setProblem("That link did not carry a sign-in token. Request a new one.");
        return;
      }

      const res = await fetch("/api/owner/session", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken }),
      });
      window.history.replaceState(null, "", "/owner/enter");

      if (res.ok) {
        router.replace("/owner");
      } else {
        const data = (await res.json()) as { message?: string };
        setProblem(data.message ?? "That link could not be used.");
      }
    })();
  }, [router]);

  return (
    <div className="relative z-10 flex min-h-[80svh] flex-col items-center justify-center gap-6 px-6 text-center">
      <Monogram className="h-9 w-auto text-line" />
      {problem ? (
        <>
          <p className="nn-body max-w-sm text-ink-soft">{problem}</p>
          <GlassButton href="/owner" variant="quiet">
            Back to sign in
          </GlassButton>
        </>
      ) : (
        <p className="nn-meta text-ink-faint">Opening the console…</p>
      )}
    </div>
  );
}
