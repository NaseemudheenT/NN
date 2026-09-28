"use client";

import { useEffect } from "react";
import { Monogram } from "@/components/brand/Monogram";
import { GlassButton } from "@/components/ui/glass/Glass";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[nn]", error);
  }, [error]);

  return (
    <div className="relative z-10 flex min-h-[70svh] flex-col items-center justify-center gap-7 px-6 py-32 text-center">
      <Monogram className="h-11 w-auto text-line" />
      <p className="nn-meta text-ink-faint">Something went wrong</p>
      <h1 className="nn-display max-w-xl text-[clamp(2rem,5vw,3.4rem)] text-ink">
        The lights went out for a moment
      </h1>
      <p className="nn-body max-w-md text-ink-soft">
        This part of the showroom could not be shown. Nothing in your bag has been lost.
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <GlassButton variant="solid" onClick={reset}>
          Try again
        </GlassButton>
        <GlassButton href="/collection" variant="quiet">
          Go to the collection
        </GlassButton>
      </div>
      {error.digest && <p className="nn-meta text-ink-faint">Reference {error.digest}</p>}
    </div>
  );
}
