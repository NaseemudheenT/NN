"use client";

/**
 * The stylist's own entrance.
 *
 * The NN Stylist button, at the head of the stylist page. Activating it puts
 * the cursor in the question field, which is the one thing a customer arriving
 * here actually wants.
 *
 * It sits on the stylist page rather than the home page deliberately: the home
 * page already runs the showroom and the living monogram, and a third WebGL
 * context there would cost more than it returns.
 */

import { useCallback } from "react";
import { NNAiButton } from "@/components/brand/NNAiButton";

export function StylistHero() {
  const focusInput = useCallback(() => {
    const input = document.getElementById("nn-stylist-input") as HTMLInputElement | null;
    input?.focus();
    input?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  return (
    <div
      className="relative mx-auto w-full overflow-hidden border"
      style={{
        maxWidth: "46rem",
        aspectRatio: "16 / 7",
        borderColor: "var(--line)",
        background: "#0b0b0c",
      }}
    >
      <NNAiButton onActivate={focusInput} label="Ask the NN stylist" />
    </div>
  );
}
