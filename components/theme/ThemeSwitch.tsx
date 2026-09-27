"use client";

/**
 * Theme switch — auto, light, dark. A three-way segmented control, keyboard
 * operable, with the current phase announced so a screen reader user knows
 * what "auto" resolved to.
 */

import { useTheme } from "./ThemeProvider";
import type { ThemeMode } from "@/lib/daytime";

const OPTIONS: { value: ThemeMode; label: string; hint: string }[] = [
  { value: "auto", label: "Auto", hint: "Follow the time where you are" },
  { value: "light", label: "Day", hint: "Always the ivory showroom" },
  { value: "dark", label: "Night", hint: "Always the matte black showroom" },
];

const PHASE_WORD = {
  morning: "morning",
  afternoon: "afternoon",
  evening: "evening",
  night: "night",
} as const;

export function ThemeSwitch({ className = "" }: { className?: string }) {
  const { mode, setMode, phase } = useTheme();

  return (
    <div
      className={`inline-flex items-center border border-[var(--line)] ${className}`}
      role="group"
      aria-label="Showroom light"
    >
      {OPTIONS.map((o) => {
        const active = mode === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => setMode(o.value)}
            aria-pressed={active}
            title={o.hint}
            className="px-3 py-2 text-eyebrow font-medium uppercase tracking-[0.16em] transition-colors duration-500 data-[on=true]:bg-[var(--btn-bg)] data-[on=true]:text-[var(--btn-ink)] text-[var(--ink-faint)] hover:text-[var(--ink)]"
            data-on={active}
          >
            {o.label}
            {o.value === "auto" && active ? (
              <span className="sr-only"> — currently {PHASE_WORD[phase]}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
