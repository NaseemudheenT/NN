"use client";

/**
 * Find your fit — the quick version, on the home page.
 *
 * Runs the same engine as the trial room (lib/fit.ts): the body is estimated
 * from height and weight by a physical scaling law, then matched against the
 * finished garment measurements. It reports which number was measured and which
 * was estimated, because a recommendation that hides its own confidence is
 * worth very little.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Product } from "@/lib/catalog/types";
import {
  cmToIn,
  estimateBody,
  recommendSize,
  validateMeasurements,
  type FitPreference,
} from "@/lib/fit";
import { track } from "@/components/layout/ConsentBanner";

const PREFERENCES: { value: FitPreference; label: string; hint: string }[] = [
  { value: "close", label: "Close", hint: "Cut near the body" },
  { value: "regular", label: "Regular", hint: "As the piece is designed" },
  { value: "easy", label: "Easy", hint: "Room to move" },
];

export function FitFinder({ products }: { products: Product[] }) {
  const [heightCm, setHeight] = useState("175");
  const [weightKg, setWeight] = useState("70");
  const [jeansWaistIn, setJeans] = useState("");
  const [preference, setPreference] = useState<FitPreference>("regular");
  const [submitted, setSubmitted] = useState(false);

  const shirt = products.find((p) => p.type === "shirt");
  const trouser = products.find((p) => p.type === "trouser");

  const measurements = useMemo(
    () => ({
      heightCm: Number(heightCm),
      weightKg: Number(weightKg),
      jeansWaistIn: jeansWaistIn ? Number(jeansWaistIn) : undefined,
      preference,
    }),
    [heightCm, weightKg, jeansWaistIn, preference],
  );

  const errors = validateMeasurements(measurements);

  const result = useMemo(() => {
    if (errors.length || !shirt || !trouser) return null;
    const body = estimateBody(measurements);
    return {
      body,
      shirt: recommendSize(shirt.sizeChart, measurements, body),
      trouser: recommendSize(trouser.sizeChart, measurements, body),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measurements, errors.length, shirt?.handle, trouser?.handle]);

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      {/* the form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
          track("fit_finder", { preference });
        }}
        className="flex flex-col gap-5"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="nn-label" htmlFor="nn-fit-height">
              Height, cm
            </label>
            <input
              id="nn-fit-height"
              className="nn-field"
              type="number"
              inputMode="numeric"
              min={140}
              max={210}
              value={heightCm}
              onChange={(e) => setHeight(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="nn-label" htmlFor="nn-fit-weight">
              Weight, kg
            </label>
            <input
              id="nn-fit-weight"
              className="nn-field"
              type="number"
              inputMode="numeric"
              min={40}
              max={160}
              value={weightKg}
              onChange={(e) => setWeight(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label className="nn-label" htmlFor="nn-fit-jeans">
            Your usual jeans waist, inches — optional
          </label>
          <input
            id="nn-fit-jeans"
            className="nn-field"
            type="number"
            inputMode="numeric"
            min={26}
            max={46}
            placeholder="32"
            value={jeansWaistIn}
            onChange={(e) => setJeans(e.target.value)}
            aria-describedby="nn-fit-jeans-hint"
          />
          <p id="nn-fit-jeans-hint" className="mt-2 text-[0.72rem] text-[var(--ink-faint)]">
            A measured number beats an estimated one. If you know it, this makes the trouser
            size exact.
          </p>
        </div>

        <fieldset className="border-0 p-0">
          <legend className="nn-label">How do you like things to sit?</legend>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Fit preference">
            {PREFERENCES.map((p) => {
              const on = preference === p.value;
              return (
                <button
                  key={p.value}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  title={p.hint}
                  onClick={() => setPreference(p.value)}
                  className="border px-4 py-2.5 text-[var(--text-step--1)] transition-colors duration-500"
                  style={{
                    borderColor: on ? "var(--btn-bg)" : "var(--line)",
                    background: on ? "var(--btn-bg)" : "transparent",
                    color: on ? "var(--btn-ink)" : "var(--ink)",
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" className="nn-btn">
            <span>Find my size</span>
          </button>
          <Link href="/trial-room" className="nn-link text-[var(--text-step--1)]">
            Or take it into the trial room
          </Link>
        </div>

        {submitted && errors.length ? (
          <ul className="m-0 list-none p-0" role="alert">
            {errors.map((e) => (
              <li key={e} className="text-[var(--text-step--1)]" style={{ color: "var(--accent)" }}>
                {e}
              </li>
            ))}
          </ul>
        ) : null}
      </form>

      {/* the answer */}
      <div
        className="border p-7"
        style={{ borderColor: "var(--line)", background: "var(--surface)" }}
        aria-live="polite"
      >
        {!submitted ? (
          <p className="text-[var(--ink-soft)]">
            Your sizes will appear here, with the room each measurement leaves you.
          </p>
        ) : !result ? (
          <p className="text-[var(--ink-soft)]">
            Correct the measurements above and we will work it out.
          </p>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="nn-eyebrow">Shirts</p>
                <p className="mt-2 font-[family-name:var(--font-display)] text-[3.2rem] leading-none">
                  {result.shirt.recommendedSize}
                </p>
              </div>
              <div>
                <p className="nn-eyebrow">Trousers</p>
                <p className="mt-2 font-[family-name:var(--font-display)] text-[3.2rem] leading-none">
                  {result.trouser.recommendedSize}
                </p>
              </div>
            </div>

            <dl className="mt-7 flex flex-col gap-2 border-t pt-5 text-[var(--text-step--1)]">
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--ink-faint)]">Chest, estimated</dt>
                <dd className="nn-tabular">
                  {Math.round(result.body.chestCm)} cm · {cmToIn(result.body.chestCm)} in
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--ink-faint)]">
                  Waist, {result.body.measured.waist ? "as you told us" : "estimated"}
                </dt>
                <dd className="nn-tabular">
                  {Math.round(result.body.waistCm)} cm · {cmToIn(result.body.waistCm)} in
                </dd>
              </div>
            </dl>

            <div className="mt-6 flex flex-col gap-3 border-t pt-5">
              {result.shirt.chosen.areas.slice(0, 3).map((a) => (
                <div key={a.area} className="flex items-baseline justify-between gap-4">
                  <span className="text-[var(--text-step--1)] text-[var(--ink-faint)]">{a.label}</span>
                  <span className="text-[var(--text-step--1)]">
                    <span style={{ color: "var(--accent)" }}>{a.verdict}</span>{" "}
                    <span className="nn-tabular text-[var(--ink-faint)]">
                      ({a.easeCm > 0 ? "+" : ""}
                      {a.easeCm} cm)
                    </span>
                  </span>
                </div>
              ))}
            </div>

            <p className="mt-6 text-[0.72rem] text-[var(--ink-faint)]">
              {result.trouser.confidence} Free size exchanges within 7 days of delivery.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
