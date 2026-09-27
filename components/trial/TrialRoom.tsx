"use client";

/**
 * The trial room, version one.
 *
 * No photo upload and no camera, deliberately: this version works on every
 * phone, needs no third-party service and asks for no consent beyond the
 * measurements the customer types. It is the version that can ship.
 *
 * Measurements stay on the device unless the customer chooses to keep them, and
 * "keep them" means localStorage on their own phone — they are never sent to us.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Product } from "@/lib/catalog/types";
import {
  cmToIn,
  estimateBody,
  recommendSize,
  validateMeasurements,
  type FitPreference,
  type FitResult,
} from "@/lib/fit";
import { useBag } from "@/components/shop/BagProvider";
import { GarmentArt } from "@/components/shop/GarmentArt";
import { track } from "@/components/layout/ConsentBanner";
import { toast } from "@/components/layout/Toaster";

const TrialRoomCanvas = dynamic(() => import("./TrialRoomCanvas"), {
  ssr: false,
  loading: () => null,
});

const STORAGE_KEY = "nn-measurements";

interface Saved {
  heightCm: number;
  weightKg: number;
  jeansWaistIn?: number;
  preference: FitPreference;
}

const PREFERENCES: { value: FitPreference; label: string; hint: string }[] = [
  { value: "close", label: "Close", hint: "Cut near the body" },
  { value: "regular", label: "Regular", hint: "As the piece is designed to sit" },
  { value: "easy", label: "Easy", hint: "Room to move" },
];

const VERDICT_COLOUR: Record<string, string> = {
  tight: "var(--color-nn-burgundy)",
  close: "var(--accent)",
  regular: "var(--color-nn-olive)",
  easy: "var(--accent)",
  loose: "var(--color-nn-burgundy)",
};

export function TrialRoom({ products }: { products: Product[] }) {
  const search = useSearchParams();
  const requested = search.get("product");

  const [handle, setHandle] = useState(
    () => products.find((p) => p.handle === requested)?.handle ?? products[0]?.handle ?? "",
  );
  const [heightCm, setHeight] = useState("175");
  const [weightKg, setWeight] = useState("70");
  const [jeansWaistIn, setJeans] = useState("");
  const [preference, setPreference] = useState<FitPreference>("regular");
  const [remember, setRemember] = useState(false);
  const [turn, setTurn] = useState(0);
  const [show3D, setShow3D] = useState(true);

  const product = products.find((p) => p.handle === handle) ?? null;

  /* restore, if the customer chose to be remembered */
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as Saved;
      if (Number.isFinite(saved.heightCm)) setHeight(String(saved.heightCm));
      if (Number.isFinite(saved.weightKg)) setWeight(String(saved.weightKg));
      if (saved.jeansWaistIn) setJeans(String(saved.jeansWaistIn));
      if (saved.preference) setPreference(saved.preference);
      setRemember(true);
    } catch {
      /* nothing saved, nothing to restore */
    }
  }, []);

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
  const body = useMemo(
    () => (errors.length ? null : estimateBody(measurements)),
    [measurements, errors.length],
  );

  const fit: FitResult | null = useMemo(() => {
    if (!body || !product) return null;
    return recommendSize(product.sizeChart, measurements, body);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [body, product?.handle, measurements]);

  /* persist or forget, as chosen */
  useEffect(() => {
    try {
      if (remember && body) {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            heightCm: Number(heightCm),
            weightKg: Number(weightKg),
            jeansWaistIn: jeansWaistIn ? Number(jeansWaistIn) : undefined,
            preference,
          } satisfies Saved),
        );
      } else if (!remember) {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      /* storage refused; the session still works */
    }
  }, [remember, body, heightCm, weightKg, jeansWaistIn, preference]);

  const { add, openBag } = useBag();

  const addRecommended = useCallback(() => {
    if (!product || !fit) return;
    const variant = product.variants.find((v) => v.size === fit.recommendedSize);
    if (!variant?.available) {
      toast(`Size ${fit.recommendedSize} is not in stock just now.`);
      return;
    }
    add(
      { handle: product.handle, size: fit.recommendedSize, quantity: 1, variantId: variant.id },
      `${product.name}, ${product.colour}, size ${fit.recommendedSize},`,
    );
    track("trial_room", { handle: product.handle, size: fit.recommendedSize });
    openBag();
  }, [product, fit, add, openBag]);

  if (!product) {
    return <p className="nn-wrap text-[var(--ink-soft)]">The trial room needs a catalogue to work with.</p>;
  }

  return (
    <div className="nn-wrap grid gap-12 py-16 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
      {/* ── the room ── */}
      <div>
        <div
          className="relative overflow-hidden border"
          style={{ aspectRatio: "3 / 4", background: "#1a1713", borderColor: "var(--line)" }}
        >
          {show3D && body ? (
            <TrialRoomCanvas body={body} product={product} fit={fit?.chosen ?? null} turn={turn} />
          ) : (
            <div className="grid h-full place-items-center p-10">
              <GarmentArt product={product} className="w-2/3 opacity-90" />
            </div>
          )}

          {/* turn the figure */}
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTurn((t) => t - Math.PI / 4)}
                className="nn-hotspot"
                aria-label="Turn the figure to the left"
              >
                <span className="nn-hotspot__label" aria-hidden="true">←</span>
              </button>
              <button
                type="button"
                onClick={() => setTurn(Math.PI)}
                className="nn-hotspot"
                aria-label="Show the back, and the woven NN label"
              >
                <span className="nn-hotspot__label">Back</span>
              </button>
              <button
                type="button"
                onClick={() => setTurn((t) => t + Math.PI / 4)}
                className="nn-hotspot"
                aria-label="Turn the figure to the right"
              >
                <span className="nn-hotspot__label" aria-hidden="true">→</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShow3D((v) => !v)}
              className="nn-hotspot"
              aria-pressed={show3D}
            >
              <span className="nn-hotspot__label">{show3D ? "3D off" : "3D on"}</span>
            </button>
          </div>
        </div>

        <p className="mt-4 text-[0.72rem] text-[var(--ink-faint)]">
          The figure is scaled to the measurements you give. The gap you can see between the
          cloth and the body is the ease reported on the right — the same numbers, drawn.
        </p>
      </div>

      {/* ── the measurements and the answer ── */}
      <div>
        {/* which piece */}
        <fieldset className="border-0 p-0">
          <legend className="nn-label">Trying on</legend>
          <div className="flex flex-wrap gap-2">
            {products.map((p) => {
              const on = p.handle === handle;
              return (
                <button
                  key={p.handle}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setHandle(p.handle)}
                  className="flex items-center gap-2 border px-2 py-1.5 text-left transition-colors duration-500"
                  style={{
                    borderColor: on ? "var(--accent)" : "var(--line)",
                    background: on ? "var(--surface)" : "transparent",
                  }}
                >
                  <span className="grid h-9 w-7 place-items-center" style={{ background: "var(--paper)" }}>
                    <GarmentArt product={p} className="w-full" />
                  </span>
                  <span className="text-[0.72rem]">
                    {p.name.replace("The ", "")}
                    <br />
                    <span className="text-[var(--ink-faint)]">{p.colour}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* measurements */}
        <div className="mt-9 grid gap-5 sm:grid-cols-2">
          <div>
            <label className="nn-label" htmlFor="nn-tr-height">Height, cm</label>
            <input
              id="nn-tr-height"
              className="nn-field"
              type="number"
              inputMode="numeric"
              min={140}
              max={210}
              value={heightCm}
              onChange={(e) => setHeight(e.target.value)}
            />
          </div>
          <div>
            <label className="nn-label" htmlFor="nn-tr-weight">Weight, kg</label>
            <input
              id="nn-tr-weight"
              className="nn-field"
              type="number"
              inputMode="numeric"
              min={40}
              max={160}
              value={weightKg}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-5">
          <label className="nn-label" htmlFor="nn-tr-jeans">
            Your usual jeans waist, inches — optional
          </label>
          <input
            id="nn-tr-jeans"
            className="nn-field"
            type="number"
            inputMode="numeric"
            min={26}
            max={46}
            placeholder="32"
            value={jeansWaistIn}
            onChange={(e) => setJeans(e.target.value)}
          />
        </div>

        <fieldset className="mt-5 border-0 p-0">
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

        {errors.length ? (
          <ul className="mt-5 m-0 list-none p-0" role="alert">
            {errors.map((e) => (
              <li key={e} className="text-[var(--text-step--1)]" style={{ color: "var(--accent)" }}>
                {e}
              </li>
            ))}
          </ul>
        ) : null}

        {/* ── the answer ── */}
        {fit && body ? (
          <div
            className="mt-9 border p-6"
            style={{ background: "var(--surface)", borderColor: "var(--line)" }}
            aria-live="polite"
          >
            <div className="flex items-baseline justify-between gap-4">
              <div>
                <p className="nn-eyebrow">We would put you in</p>
                <p className="mt-1 font-[family-name:var(--font-display)] text-[3.4rem] leading-none">
                  {fit.recommendedSize}
                </p>
              </div>
              <p className="text-right text-[0.72rem] text-[var(--ink-faint)]">
                {product.type === "shirt" ? "Shirt size" : "Trouser waist"}
                <br />
                {product.name}, {product.colour}
              </p>
            </div>

            {/* ease, per area */}
            <div className="mt-7 flex flex-col gap-3 border-t pt-5">
              {fit.chosen.areas.map((a) => (
                <div key={a.area}>
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-[var(--text-step--1)]">{a.label}</span>
                    <span className="text-[var(--text-step--1)]">
                      <span style={{ color: VERDICT_COLOUR[a.verdict] ?? "var(--ink)" }}>
                        {a.verdict}
                      </span>
                      <span className="nn-tabular ml-2 text-[var(--ink-faint)]">
                        {a.easeCm > 0 ? "+" : ""}
                        {a.easeCm} cm
                      </span>
                    </span>
                  </div>
                  {/* the ease, drawn as a bar so it can be read at a glance */}
                  <div className="mt-1.5 h-1" style={{ background: "var(--paper)" }}>
                    <div
                      className="h-full transition-[width] duration-700 ease-[var(--ease-showroom)]"
                      style={{
                        width: `${Math.min(100, Math.max(3, (a.easeCm / 24) * 100))}%`,
                        background: VERDICT_COLOUR[a.verdict] ?? "var(--accent)",
                      }}
                    />
                  </div>
                  <p className="mt-1 text-[0.68rem] text-[var(--ink-faint)]">{a.note}</p>
                </div>
              ))}
            </div>

            {fit.caution ? (
              <p
                className="mt-5 border-l-2 pl-3 text-[var(--text-step--1)]"
                style={{ borderColor: "var(--accent)", color: "var(--ink-soft)" }}
              >
                {fit.caution}
              </p>
            ) : null}

            <p className="mt-5 text-[0.72rem] text-[var(--ink-faint)]">{fit.confidence}</p>

            {/* the body we estimated, shown openly */}
            <details className="mt-5 border-t pt-4">
              <summary className="cursor-pointer text-[var(--text-step--1)] text-[var(--ink-soft)]">
                What we worked out about you
              </summary>
              <dl className="mt-4 flex flex-col gap-2 text-[var(--text-step--1)]">
                {[
                  { term: "Chest", cm: body.chestCm, measured: false },
                  { term: "Waist", cm: body.waistCm, measured: body.measured.waist },
                  { term: "Hip", cm: body.hipCm, measured: false },
                  { term: "Shoulder", cm: body.shoulderCm, measured: false },
                  { term: "Inside leg", cm: body.inseamCm, measured: false },
                ].map((row) => (
                  <div key={row.term} className="flex justify-between gap-4">
                    <dt className="text-[var(--ink-faint)]">
                      {row.term}
                      <span className="ml-2 text-[0.62rem] uppercase tracking-[0.14em]">
                        {row.measured ? "yours" : "estimated"}
                      </span>
                    </dt>
                    <dd className="nn-tabular m-0">
                      {Math.round(row.cm)} cm · {cmToIn(row.cm)} in
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-[0.68rem] text-[var(--ink-faint)]">
                Estimated girths come from your height and weight using a physical scaling law,
                accurate to about three centimetres. A tape measure beats it. Nothing here
                leaves your device.
              </p>
            </details>

            {/* alternatives */}
            {fit.alternatives.length ? (
              <div className="mt-6 border-t pt-5">
                <p className="nn-eyebrow">The sizes either side</p>
                <div className="mt-3 flex flex-wrap gap-4">
                  {fit.alternatives.map((alt) => {
                    const chest = alt.areas.find((a) => a.area === "chest" || a.area === "waist");
                    return (
                      <div key={alt.size} className="text-[var(--text-step--1)]">
                        <span className="font-[family-name:var(--font-display)] text-[1.5rem]">
                          {alt.size}
                        </span>
                        {chest ? (
                          <span className="ml-2 text-[var(--ink-faint)]">
                            {chest.label.toLowerCase()} {chest.verdict}
                          </span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div className="mt-7 flex flex-col gap-3">
              <button type="button" className="nn-btn nn-btn--solid w-full" onClick={addRecommended}>
                <span>Add size {fit.recommendedSize} to bag</span>
              </button>
              <Link href={`/product/${product.handle}`} className="nn-link text-center text-[var(--text-step--1)]">
                See the full measurements for {product.name}
              </Link>
            </div>

            {/* the one privacy choice on the page */}
            <label className="mt-6 flex cursor-pointer items-start gap-3 border-t pt-5 text-[var(--text-step--1)]">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="mt-1"
              />
              <span className="text-[var(--ink-soft)]">
                Keep my measurements on this device, so I do not have to type them again.
                <span className="block text-[0.68rem] text-[var(--ink-faint)]">
                  Stored in this browser only. We never receive them.
                </span>
              </span>
            </label>
          </div>
        ) : null}
      </div>
    </div>
  );
}
