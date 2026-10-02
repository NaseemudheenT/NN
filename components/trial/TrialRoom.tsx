"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { GarmentImage } from "@/components/shop/GarmentImage";
import { Chevron, Hanger, Ruler } from "@/components/ui/icons";
import { useBag } from "@/lib/bag/BagProvider";
import { MEASUREMENT_LIMITS, recommendForProduct, validateMeasurements, type FitPreference, type Measurements } from "@/lib/fit";
import { formatMinor } from "@/lib/money";
import type { Product } from "@/lib/catalog/types";

const FITS: { id: FitPreference; label: string; note: string }[] = [
  { id: "close", label: "Slim", note: "Close to the body" },
  { id: "regular", label: "Regular", note: "How the piece was drafted" },
  { id: "easy", label: "Relaxed", note: "Room to move" },
];

/**
 * The trial room.
 *
 * The fitting itself is lib/fit.ts and is not touched here: height, weight
 * and an optional jeans waist estimate the body, the body is compared with
 * the finished garment, and the difference — the ease — decides the size.
 * This screen's whole job is to SHOW that working, area by area, because a
 * size recommendation a customer cannot check is a size recommendation they
 * will not trust.
 *
 * It also states its own confidence, including when it is low. A fitting
 * room that is certain about everything is a fitting room nobody returns to.
 */
export function TrialRoom({ catalogue }: { catalogue: Product[] }) {
  const params = useSearchParams();
  const { add } = useBag();

  const [handle, setHandle] = useState(() => params.get("piece") ?? catalogue[0]?.handle ?? "");
  const [heightCm, setHeight] = useState(175);
  const [weightKg, setWeight] = useState(72);
  const [jeansWaistIn, setJeans] = useState<number | "">("");
  const [preference, setPreference] = useState<FitPreference>("regular");
  const [submitted, setSubmitted] = useState(false);

  const product = catalogue.find((p) => p.handle === handle) ?? catalogue[0];

  const measurements: Measurements = useMemo(
    () => ({ heightCm, weightKg, jeansWaistIn: jeansWaistIn === "" ? undefined : jeansWaistIn, preference }),
    [heightCm, weightKg, jeansWaistIn, preference],
  );

  const errors = validateMeasurements(measurements);
  const result = useMemo(
    () => (product && !errors.length ? recommendForProduct(product, measurements) : null),
    [product, measurements, errors.length],
  );

  if (!product) return null;

  return (
    <div className="trial nn-room">
      <div className="wrap trial__in">
        <header className="trial__head">
          <p className="label label--wide">Virtual trial room</p>
          <h1 className="d-h1">Find your size before you buy</h1>
          <p className="lead">
            Four numbers, and we compare your body with the finished garment — not with a
            generic chart. You can see every measurement we used.
          </p>
        </header>

        <div className="trial__body">
          {/* ── the piece on the stand ────────────────────────── */}
          <div className="trial__stand">
            <div className="trial__piece">
              <GarmentImage product={product} sizes="(max-width: 900px) 100vw, 34vw" priority />
            </div>
            <div className="trial__piece-meta">
              <p className="d-h3">{product.name}</p>
              <p className="small muted">{product.colour} · {formatMinor(product.priceMinor, product.currency)}</p>
            </div>
          </div>

          {/* ── the fitting ──────────────────────────────────── */}
          <div className="trial__panel glass">
            <label className="trial__field">
              <span className="label label--soft">The piece</span>
              <span className="coll__select">
                <select className="field" value={handle} onChange={(e) => setHandle(e.target.value)}>
                  {catalogue.map((p) => (
                    <option key={p.handle} value={p.handle}>{p.name} — {p.colour}</option>
                  ))}
                </select>
                <Chevron size={15} />
              </span>
            </label>

            <Slider
              label="Height" unit="cm" value={heightCm} onChange={setHeight}
              min={MEASUREMENT_LIMITS.heightCm[0]} max={MEASUREMENT_LIMITS.heightCm[1]}
            />
            <Slider
              label="Weight" unit="kg" value={weightKg} onChange={setWeight}
              min={MEASUREMENT_LIMITS.weightKg[0]} max={MEASUREMENT_LIMITS.weightKg[1]}
            />

            <label className="trial__field">
              <span className="label label--soft">
                Your usual jeans waist <span className="muted">— optional, but it sharpens the result</span>
              </span>
              <input
                className="field" type="number" inputMode="numeric"
                min={MEASUREMENT_LIMITS.jeansWaistIn[0]} max={MEASUREMENT_LIMITS.jeansWaistIn[1]}
                value={jeansWaistIn}
                placeholder="inches"
                onChange={(e) => setJeans(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </label>

            <fieldset className="trial__fits">
              <legend className="label label--soft">Fit style</legend>
              <div className="trial__fit-row">
                {FITS.map((f) => (
                  <button
                    key={f.id} type="button" className="trial__fit"
                    data-on={preference === f.id || undefined}
                    aria-pressed={preference === f.id}
                    onClick={() => setPreference(f.id)}
                  >
                    <span>{f.label}</span>
                    <span className="small muted">{f.note}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            {errors.length ? (
              <ul className="trial__errors small">{errors.map((e) => <li key={e}>{e}</li>)}</ul>
            ) : null}

            <button type="button" className="btn btn--solid btn--lg btn--block" onClick={() => setSubmitted(true)} disabled={!!errors.length}>
              <Hanger size={16} /> Enter trial room
            </button>
          </div>
        </div>

        {/* ── the working ─────────────────────────────────────── */}
        {submitted && result ? (
          <section className="trial__result glass" aria-live="polite">
            <header className="trial__result-head">
              <div>
                <p className="label label--soft">Recommended size</p>
                <p className="trial__size">{result.recommendedSize}</p>
              </div>
              <button
                type="button"
                className="btn btn--solid"
                onClick={() => {
                  const v = product.variants.find((x) => x.size === result.recommendedSize);
                  if (v) add({ handle: product.handle, size: v.size, quantity: 1, variantId: v.id }, product.name);
                }}
              >
                Add size {result.recommendedSize} to bag
              </button>
            </header>

            <p className="lead">{result.confidence}</p>
            {result.caution ? <p className="trial__caution small">{result.caution}</p> : null}

            <table className="trial__table">
              <caption className="label label--soft">How size {result.chosen.size} sits on you</caption>
              <thead>
                <tr><th scope="col">Where</th><th scope="col">You</th><th scope="col">Garment</th><th scope="col">Ease</th><th scope="col">Reads as</th></tr>
              </thead>
              <tbody>
                {result.chosen.areas.map((a) => (
                  <tr key={a.area}>
                    <th scope="row">{a.label}</th>
                    <td className="tnum">{a.bodyCm.toFixed(0)} cm</td>
                    <td className="tnum">{a.garmentCm.toFixed(0)} cm</td>
                    <td className="tnum">{a.easeCm > 0 ? "+" : ""}{a.easeCm.toFixed(1)} cm</td>
                    <td data-verdict={a.verdict}>{a.verdict}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {result.alternatives.length ? (
              <div className="trial__alts">
                <p className="label label--soft">The sizes either side</p>
                <ul>
                  {result.alternatives.map((alt) => (
                    <li key={alt.size}>
                      <strong>{alt.size}</strong>
                      <span className="small muted">
                        {alt.areas.map((a) => `${a.label.toLowerCase()} ${a.verdict}`).join(", ")}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <p className="small muted trial__sizelink">
              <Ruler size={14} /> Prefer to measure properly? <Link href="/sizing" className="ul-grow">The size guide</Link> has the full chart.
            </p>
          </section>
        ) : null}
      </div>
    </div>
  );
}

function Slider({
  label, unit, value, onChange, min, max,
}: {
  label: string; unit: string; value: number; onChange: (v: number) => void; min: number; max: number;
}) {
  return (
    <label className="trial__field">
      <span className="label label--soft">
        {label} <span className="trial__value tnum">{value} {unit}</span>
      </span>
      <input
        className="trial__range" type="range" min={min} max={max} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
