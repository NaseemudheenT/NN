"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { GlassButton } from "@/components/ui/glass/Glass";
import { estimateBody, fitGarment, type Build, type Measurements, type Preference } from "@/lib/fit";
import { useBag } from "@/lib/bag";
import { MOTION } from "@/lib/tokens";
import { localPref } from "@/lib/client-prefs";
import type { Product } from "@/lib/types";

/**
 * Measurements live on the visitor's own device. They are read straight from
 * storage on the first render rather than fetched in afterwards, so the
 * figure on the stand never flashes at the wrong proportions.
 */
const stored = localPref<Measurements | null>(
  "nn.measurements",
  (raw) => {
    if (!raw) return null;
    try {
      return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Measurements>) };
    } catch {
      return null;
    }
  },
  (v) => (v ? JSON.stringify(v) : null),
  null,
);

const BUILDS: { id: Build; label: string; note: string }[] = [
  { id: "slim", label: "Slim", note: "Narrow through the shoulder and chest" },
  { id: "regular", label: "Regular", note: "Shoulder and waist in proportion" },
  { id: "broad", label: "Broad", note: "Wide through the shoulder and back" },
];

const PREFS: { id: Preference; label: string; note: string }[] = [
  { id: "close", label: "Close", note: "Follows the body" },
  { id: "regular", label: "Regular", note: "How the piece is cut to sit" },
  { id: "easy", label: "Easy", note: "Room through the body" },
];

const DEFAULTS: Measurements = {
  height: 175,
  weight: 72,
  waistInches: 32,
  build: "regular",
  preference: "regular",
};

/* ------------------------------------------------------------------ */
/* The figure on the stand — scaled to the entered measurements         */
/* ------------------------------------------------------------------ */

function Figure({ m }: { m: Measurements }) {
  const body = estimateBody(m);
  // Drawn to proportion: the silhouette widens with the chest and the
  // frame grows with height, so the change is visible, not decorative.
  const w = 34 + (body.chest - 96) * 0.62;
  const waistW = 26 + (body.waist - 82) * 0.6;
  const h = 150 + (m.height - 175) * 0.9;
  const shoulder = w * 1.06;

  return (
    <svg viewBox="0 0 140 260" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="nn-figure" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--ink)" stopOpacity="0.16" />
          <stop offset="100%" stopColor="var(--ink)" stopOpacity="0.05" />
        </linearGradient>
      </defs>

      {/* the mirror behind */}
      <rect x="18" y="14" width="104" height="216" fill="var(--bg-elev)" opacity="0.6" />
      <rect x="18" y="14" width="104" height="216" fill="none" stroke="var(--line)" />

      <motion.g
        animate={{ scaleY: h / 150 }}
        style={{ originY: 1, originX: 0.5 }}
        transition={MOTION.springSoft}
      >
        {/* head and neck */}
        <circle cx="70" cy={230 - h - 2} r="11" fill="url(#nn-figure)" stroke="var(--line)" />
        <rect x="66" y={230 - h + 8} width="8" height="9" fill="url(#nn-figure)" />

        {/* torso, widening with the chest */}
        <motion.path
          animate={{
            d: `M${70 - shoulder / 2} ${230 - h + 16}
                L${70 + shoulder / 2} ${230 - h + 16}
                L${70 + w / 2} ${230 - h + 62}
                L${70 + waistW / 2} ${230 - h + 108}
                L${70 - waistW / 2} ${230 - h + 108}
                L${70 - w / 2} ${230 - h + 62} Z`,
          }}
          transition={MOTION.springSoft}
          fill="url(#nn-figure)"
          stroke="var(--line)"
        />

        {/* legs */}
        <motion.rect
          animate={{ x: 70 - waistW / 2 + 1, width: waistW / 2 - 2 }}
          y={230 - h + 108}
          height={h - 124}
          fill="url(#nn-figure)"
          stroke="var(--line)"
          transition={MOTION.springSoft}
        />
        <motion.rect
          animate={{ x: 70 + 1, width: waistW / 2 - 2 }}
          y={230 - h + 108}
          height={h - 124}
          fill="url(#nn-figure)"
          stroke="var(--line)"
          transition={MOTION.springSoft}
        />
      </motion.g>

      {/* the bench */}
      <rect x="26" y="232" width="88" height="5" fill="var(--nn-taupe)" opacity="0.5" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */

function Field({
  label,
  value,
  unit,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  step?: number;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label htmlFor={label} className="nn-label text-ink">
          {label}
        </label>
        <span className="font-display text-xl text-ink">
          {value}
          <span className="nn-meta ml-1.5 text-ink-faint">{unit}</span>
        </span>
      </div>
      <input
        id={label}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 h-1 w-full cursor-pointer appearance-none rounded-full bg-line accent-[var(--accent)] outline-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--accent)]"
      />
    </div>
  );
}

function Choice<T extends string>({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string;
  options: { id: T; label: string; note: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <fieldset>
      <legend className="nn-label text-ink">{legend}</legend>
      <div className="mt-3 grid gap-1.5 sm:grid-cols-3">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            aria-pressed={value === o.id}
            className={`border px-3.5 py-3 text-left transition-colors duration-300 ${
              value === o.id
                ? "border-ink bg-ink text-bg"
                : "border-line text-ink-soft hover:border-ink/50 hover:text-ink"
            }`}
          >
            <span className="nn-label block">{o.label}</span>
            <span
              className={`nn-meta mt-1 block text-[0.5rem] leading-snug ${
                value === o.id ? "text-bg/70" : "text-ink-faint"
              }`}
            >
              {o.note}
            </span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function TrialRoom({
  products,
  initialHandle,
}: {
  products: Product[];
  initialHandle?: string;
}) {
  const kept = useSyncExternalStore(stored.subscribe, stored.get, stored.server);
  const [entered, setEntered] = useState<Measurements | null>(null);
  const m = entered ?? kept ?? DEFAULTS;
  const setM = (next: Measurements | ((prev: Measurements) => Measurements)) =>
    setEntered(typeof next === "function" ? next(m) : next);

  const [handle, setHandle] = useState(initialHandle ?? products[0]?.handle ?? "");
  const saved = kept !== null;
  const add = useBag((s) => s.add);

  const piece = useMemo(
    () => products.find((p) => p.handle === handle) ?? products[0],
    [products, handle],
  );

  const result = useMemo(() => (piece ? fitGarment(piece, m) : null), [piece, m]);

  function save() {
    stored.set(m);
  }

  function forget() {
    stored.set(null);
    setEntered(m);
  }

  function addRecommended() {
    if (!piece || !result?.size) return;
    const variant = piece.variants.find((v) => v.size === result.size);
    add({
      variantId: variant?.id ?? `${piece.handle}:${result.size}`,
      handle: piece.handle,
      title: piece.title,
      colour: piece.colour,
      size: result.size,
      quantity: 1,
      price: variant?.price ?? piece.price,
      image: piece.images[0]?.url ?? null,
    });
  }

  if (!piece) {
    return (
      <p className="nn-body py-20 text-ink-faint">
        There is nothing on the rail to try on yet.
      </p>
    );
  }

  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
      {/* --------------- the fitting room --------------- */}
      <div className="lg:sticky lg:top-28 lg:self-start">
        <div className="nn-glass relative overflow-hidden rounded-md p-6">
          {/* the curtain */}
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-10 opacity-60"
            style={{
              background:
                "repeating-linear-gradient(90deg, var(--nn-stone) 0 4px, transparent 4px 11px)",
            }}
          />
          <div className="aspect-4/5 w-full">
            <Figure m={m} />
          </div>
          <p className="nn-meta mt-4 text-center text-ink-faint">
            A figure at your proportions, in the three-way mirror
          </p>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-3">
          {result &&
            (
              [
                ["Chest", result.body.chest],
                ["Waist", result.body.waist],
                ["Hip", result.body.hip],
                ["Shoulder", result.body.shoulder],
                ["Sleeve", result.body.sleeve],
                ["Inseam", result.body.inseam],
              ] as const
            ).map(([k, v]) => (
              <div key={k} className="bg-bg px-4 py-3.5">
                <dt className="nn-meta text-ink-faint">{k}</dt>
                <dd className="mt-1 font-display text-xl text-ink">
                  {v}
                  <span className="nn-meta ml-1 text-ink-faint">cm</span>
                </dd>
              </div>
            ))}
        </dl>
        <p className="nn-meta mt-3 leading-relaxed text-ink-faint">
          Estimated from what you entered. Measure yourself for a closer read — the{" "}
          <a href="/sizing" className="underline underline-offset-4">
            size guide
          </a>{" "}
          shows how.
        </p>
      </div>

      {/* --------------- what you entered --------------- */}
      <div className="space-y-10">
        <div className="space-y-7">
          <Field
            label="Height"
            unit="cm"
            value={m.height}
            min={150}
            max={205}
            onChange={(height) => setM((p) => ({ ...p, height }))}
          />
          <Field
            label="Weight"
            unit="kg"
            value={m.weight}
            min={45}
            max={140}
            onChange={(weight) => setM((p) => ({ ...p, weight }))}
          />
          <Field
            label="Trousers you already wear"
            unit="in waist"
            value={m.waistInches}
            min={26}
            max={46}
            onChange={(waistInches) => setM((p) => ({ ...p, waistInches }))}
          />
          <Choice
            legend="Build"
            options={BUILDS}
            value={m.build}
            onChange={(build) => setM((p) => ({ ...p, build }))}
          />
          <Choice
            legend="How you like it to sit"
            options={PREFS}
            value={m.preference}
            onChange={(preference) => setM((p) => ({ ...p, preference }))}
          />
        </div>

        {/* --------------- the garment --------------- */}
        <div>
          <label htmlFor="piece" className="nn-label text-ink">
            The piece
          </label>
          <select
            id="piece"
            value={piece.handle}
            onChange={(e) => setHandle(e.target.value)}
            className="mt-3 w-full cursor-pointer border border-line bg-transparent px-4 py-3.5 font-display text-lg text-ink outline-none focus-visible:border-accent"
          >
            {products.map((p) => (
              <option key={p.handle} value={p.handle} className="bg-bg-elev text-ink">
                {p.title} — {p.colour}
              </option>
            ))}
          </select>
        </div>

        {/* --------------- the result --------------- */}
        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              key={`${piece.handle}-${result.size ?? "none"}`}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: MOTION.base, ease: MOTION.ease }}
              className="nn-glass rounded-md p-6"
            >
              <p className="nn-meta text-ink-faint">The fitting</p>

              {result.size ? (
                <p className="mt-3 font-display text-[2.6rem] font-light leading-none text-ink">
                  Size {result.size}
                </p>
              ) : (
                <p className="mt-3 font-display text-[1.6rem] font-light leading-tight text-ink">
                  No size can be named yet
                </p>
              )}

              <p className="nn-body mt-4 text-[0.9rem] text-ink-soft">{result.summary}</p>

              {result.areas.length > 0 && (
                <ul className="mt-6 space-y-px border border-line bg-line">
                  {result.areas.map((a) => (
                    <li
                      key={a.area}
                      className="flex items-center justify-between gap-4 bg-bg px-4 py-3"
                    >
                      <span className="nn-label capitalize text-ink">{a.area}</span>
                      <span className="flex items-center gap-3">
                        <span className="nn-body text-[0.8rem] text-ink-soft">{a.note}</span>
                        <span
                          className={`nn-meta rounded-full px-2.5 py-1 ${
                            a.verdict === "tight"
                              ? "bg-[var(--nn-burgundy)] text-ivory"
                              : a.verdict === "regular"
                                ? "bg-ink text-bg"
                                : "border border-line text-ink-soft"
                          }`}
                        >
                          {a.ease > 0 ? "+" : ""}
                          {a.ease} cm
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-7 flex flex-wrap gap-3">
                <GlassButton
                  variant="solid"
                  onClick={addRecommended}
                  disabled={!result.size}
                >
                  {result.size ? `Add size ${result.size} to bag` : "No size to add"}
                </GlassButton>
                <GlassButton href={`/product/${piece.handle}`} variant="quiet">
                  See the piece
                </GlassButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --------------- privacy --------------- */}
        <div className="border-t border-line pt-6">
          <p className="nn-body text-[0.85rem] text-ink-soft">
            Your measurements stay on this device. Nothing is sent to us unless you choose to keep
            them here for next time.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <GlassButton variant="quiet" size="sm" onClick={save}>
              {saved ? "Saved on this device" : "Keep on this device"}
            </GlassButton>
            {saved && (
              <GlassButton variant="ghost" size="sm" onClick={forget}>
                Forget them
              </GlassButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
