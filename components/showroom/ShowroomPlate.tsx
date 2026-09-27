"use client";

/**
 * The still frame of the room, drawn in CSS.
 *
 * Three jobs. It is what a visitor sees in the first few hundred milliseconds
 * while the 3D canvas mounts, so the page is never blank. It is the whole
 * background when 3D is off or unavailable. And it is the living backdrop on
 * every other page, which is why it takes a phase rather than reading one.
 *
 * The light drifts, dust crosses the window light, and the whole thing changes
 * with the hour — all from four gradients and two keyframes. No canvas, no
 * images, nothing to download.
 */

import type { DayPhase } from "@/lib/daytime";

/** How the window light reads at each hour of the day. */
const PHASE_LIGHT: Record<
  DayPhase,
  {
    /** Sky seen through the glass. */
    sky: string;
    /** The pool of light on the floor. */
    pool: string;
    /** Warmth of the room's own surfaces. */
    room: string;
    /** How far across the floor the light falls, as a percentage. */
    throwX: number;
    /** Opacity of the light shafts. */
    shaft: number;
  }
> = {
  // A low, cool sun: the light reaches a long way into the room.
  morning: { sky: "#cfe0ec", pool: "#f5efe0", room: "#e8e1d2", throwX: 68, shaft: 0.5 },
  // High and neutral: a short, bright pool close to the windows.
  afternoon: { sky: "#e6edf2", pool: "#fffaf0", room: "#eee7d8", throwX: 38, shaft: 0.62 },
  // Golden hour, raking right across the floor.
  evening: { sky: "#e8b87a", pool: "#f8dfae", room: "#e3d4bb", throwX: 82, shaft: 0.7 },
  // Windows dark; what light there is comes from the lamps.
  night: { sky: "#0a1018", pool: "#3a2f1c", room: "#0c0b0a", throwX: 20, shaft: 0.16 },
};

export function ShowroomPlate({
  phase,
  visible = true,
  /** Quieter, for use as a page background rather than the hero. */
  subtle = false,
}: {
  phase: DayPhase;
  visible?: boolean;
  subtle?: boolean;
}) {
  const light = PHASE_LIGHT[phase];
  const strength = subtle ? 0.45 : 1;

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden transition-opacity duration-1000"
      style={{
        opacity: visible ? 1 : 0,
        background: `linear-gradient(180deg, ${light.room} 0%, var(--bg) 78%)`,
      }}
    >
      {/* the far wall and the floor line */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          height: "38%",
          background: `linear-gradient(180deg, color-mix(in srgb, ${light.room} 70%, #000) 0%, ${light.room} 12%, color-mix(in srgb, ${light.room} 86%, #000) 100%)`,
        }}
      />

      {/* four arched windows, as tall rectangles of sky with rounded heads */}
      <div className="absolute inset-x-0 top-0 flex justify-around" style={{ height: "62%" }}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="relative"
            style={{
              width: "11%",
              marginTop: "8%",
              background: light.sky,
              borderRadius: "50% 50% 0 0 / 22% 22% 0 0",
              boxShadow: `0 0 90px 30px color-mix(in srgb, ${light.sky} 42%, transparent)`,
              opacity: 0.9 * strength,
            }}
          >
            {/* steel mullions */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "repeating-linear-gradient(90deg, transparent 0 32%, #232326 32% 34%, transparent 34% 100%), repeating-linear-gradient(180deg, transparent 0 28%, #232326 28% 29.5%, transparent 29.5% 100%)",
                borderRadius: "inherit",
                opacity: 0.8,
              }}
            />
          </div>
        ))}
      </div>

      {/* the light the windows throw across the floor */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          height: "46%",
          background: `linear-gradient(${90 + (light.throwX - 50) * 0.5}deg, color-mix(in srgb, ${light.pool} ${Math.round(
            light.shaft * 70,
          )}%, transparent) 0%, transparent ${light.throwX}%)`,
          opacity: strength,
        }}
      />

      {/* the drifting light and the dust in it */}
      <div className="nn-livelight absolute inset-0" style={{ opacity: 0.8 * strength }} />
      {phase === "night" ? null : <div className="nn-motes" style={{ opacity: 0.4 * strength }} />}

      {/* at night, two warm pools from the picture lamps */}
      {phase === "night" ? (
        <>
          <div
            className="absolute"
            style={{
              left: "22%",
              bottom: "8%",
              width: "26%",
              height: "46%",
              background: `radial-gradient(closest-side, color-mix(in srgb, ${light.pool} 85%, transparent), transparent 70%)`,
              filter: "blur(28px)",
              opacity: 0.85 * strength,
            }}
          />
          <div
            className="absolute"
            style={{
              right: "16%",
              bottom: "12%",
              width: "22%",
              height: "38%",
              background: `radial-gradient(closest-side, color-mix(in srgb, ${light.pool} 70%, transparent), transparent 72%)`,
              filter: "blur(34px)",
              opacity: 0.7 * strength,
            }}
          />
        </>
      ) : null}

      {/* a vignette, to seat the whole thing */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 100% at 50% 40%, transparent 42%, color-mix(in srgb, var(--bg) 70%, #000) 100%)",
          opacity: 0.6,
        }}
      />
    </div>
  );
}
