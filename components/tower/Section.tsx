"use client";

import { BAND_BOTTOM, BAND_TOP, INTERIOR, bandFor } from "@/lib/tower/floors";

/**
 * NN Tower, drawn.
 *
 * ── what this is, and what it is not ─────────────────────────────────
 * It is an architect's section through the building: floor plates, the
 * cut masonry hatched the way a section hatches anything the plane passes
 * through, the stair core, the dome, the arched bays. Hairlines in ivory
 * on obsidian.
 *
 * It is NOT a placeholder for a photograph, and it does not pretend to be
 * one. That distinction matters. A low-fidelity attempt at photorealism
 * reads as a broken photograph; a drawing reads as a drawing, which is
 * exactly what a building has before it is built — and it is the one
 * honest thing to show while the renders are being made.
 *
 * It is also load-bearing: every band here is positioned from the SAME
 * bandFor() the hotspots and the elevator use, so when the photographs
 * arrive they drop in behind geometry that is already correct. Nothing has
 * to be re-measured.
 */
export function Section({ activeFloor }: { activeFloor: number }) {
  const W = 1000;
  const H = 1000;
  const px = (f: number) => f * H;

  const left = 150;
  const right = 850;
  const width = right - left;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="tower__section"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        {/* The hatch a section drawing uses for anything the cutting plane
            passes through. 45°, fine, and faint. */}
        <pattern id="nn-hatch" width="7" height="7" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="7" stroke="rgba(247,245,239,.17)" strokeWidth="1" />
        </pattern>
        {/* Interior light: warm, falling off upward, so each floor reads as
            lit from its own windows rather than flood-lit. */}
        <linearGradient id="nn-glow" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="rgba(255,190,114,.26)" />
          <stop offset="100%" stopColor="rgba(255,190,114,0)" />
        </linearGradient>
        <radialGradient id="nn-dome" cx="50%" cy="80%">
          <stop offset="0%" stopColor="rgba(214,228,244,.3)" />
          <stop offset="100%" stopColor="rgba(214,228,244,.04)" />
        </radialGradient>
      </defs>

      {/* ── the ground, and the street it stands on ─────────────── */}
      <line x1="0" y1={px(BAND_BOTTOM)} x2={W} y2={px(BAND_BOTTOM)} stroke="rgba(247,245,239,.4)" strokeWidth="1.5" />
      <rect x="0" y={px(BAND_BOTTOM)} width={W} height={H - px(BAND_BOTTOM)} fill="url(#nn-hatch)" />

      {/* ── the dome ────────────────────────────────────────────── */}
      <path
        d={`M ${W / 2 - 92} ${px(BAND_TOP)} A 92 78 0 0 1 ${W / 2 + 92} ${px(BAND_TOP)} Z`}
        fill="url(#nn-dome)"
        stroke="rgba(247,245,239,.42)"
        strokeWidth="1.2"
      />
      {[-62, -31, 0, 31, 62].map((dx) => (
        <path
          key={dx}
          d={`M ${W / 2 + dx} ${px(BAND_TOP)} Q ${W / 2 + dx * 0.55} ${px(BAND_TOP) - 58} ${W / 2} ${px(BAND_TOP) - 78}`}
          fill="none"
          stroke="rgba(247,245,239,.2)"
          strokeWidth="0.8"
        />
      ))}

      {/* ── the floors ──────────────────────────────────────────── */}
      {INTERIOR.map((level) => {
        const band = bandFor(level.floor);
        const top = px(band.top);
        const h = px(band.height);
        const on = level.floor === activeFloor;

        return (
          <g key={level.id} opacity={on ? 1 : 0.42} style={{ transition: "opacity 700ms cubic-bezier(.22,1,.36,1)" }}>
            {/* the volume of the floor, lit from below by its own windows */}
            <rect x={left} y={top} width={width} height={h} fill={on ? "url(#nn-glow)" : "transparent"} />

            {/* the slab: a section cuts it, so it is hatched and heavy */}
            <rect x={left - 14} y={top + h - 9} width={width + 28} height="9" fill="url(#nn-hatch)" />
            <line x1={left - 14} y1={top + h - 9} x2={right + 14} y2={top + h - 9} stroke="rgba(247,245,239,.5)" strokeWidth="1.2" />
            <line x1={left - 14} y1={top + h} x2={right + 14} y2={top + h} stroke="rgba(247,245,239,.3)" strokeWidth="0.8" />

            {/* the two outer walls, cut */}
            <rect x={left - 14} y={top} width="14" height={h} fill="url(#nn-hatch)" />
            <rect x={right} y={top} width="14" height={h} fill="url(#nn-hatch)" />
            <line x1={left} y1={top} x2={left} y2={top + h} stroke="rgba(247,245,239,.34)" strokeWidth="0.9" />
            <line x1={right} y1={top} x2={right} y2={top + h} stroke="rgba(247,245,239,.34)" strokeWidth="0.9" />

            {/* arched bays, five to a floor, drawn as elevation behind the cut */}
            {[0, 1, 2, 3, 4].map((i) => {
              const bayW = width / 5;
              const cx = left + bayW * i + bayW / 2;
              const bw = bayW * 0.46;
              const bh = h * 0.56;
              const sill = top + h - 18;
              return (
                <path
                  key={i}
                  d={`M ${cx - bw / 2} ${sill} L ${cx - bw / 2} ${sill - bh + bw / 2} A ${bw / 2} ${bw / 2} 0 0 1 ${cx + bw / 2} ${sill - bh + bw / 2} L ${cx + bw / 2} ${sill} Z`}
                  fill={on ? "rgba(255,206,142,.1)" : "rgba(214,228,244,.035)"}
                  stroke="rgba(247,245,239,.26)"
                  strokeWidth="0.8"
                />
              );
            })}

            {/* the level marker, outside the building, where a drawing puts it */}
            <line x1={right + 22} y1={top + h} x2={right + 74} y2={top + h} stroke="rgba(247,245,239,.3)" strokeWidth="0.7" />
            <circle cx={right + 74} cy={top + h} r={on ? 3.4 : 2} fill={on ? "#f7f5ef" : "rgba(247,245,239,.42)"} />
          </g>
        );
      })}

      {/* ── the stair core, running the whole height ────────────── */}
      <g opacity="0.5">
        {Array.from({ length: 46 }, (_, i) => {
          const t = i / 45;
          const y = px(BAND_TOP + (BAND_BOTTOM - BAND_TOP) * t);
          const sway = Math.sin(t * Math.PI * 7) * 34;
          return (
            <line
              key={i}
              x1={W / 2 - 40 + sway}
              y1={y}
              x2={W / 2 + 40 + sway}
              y2={y}
              stroke="rgba(247,245,239,.2)"
              strokeWidth="0.8"
            />
          );
        })}
        <line x1={W / 2} y1={px(BAND_TOP)} x2={W / 2} y2={px(BAND_BOTTOM)} stroke="rgba(247,245,239,.22)" strokeWidth="1" />
      </g>

      {/* ── the entrance arch, cut through the base ─────────────── */}
      <path
        d={`M ${W / 2 - 54} ${px(BAND_BOTTOM)} L ${W / 2 - 54} ${px(BAND_BOTTOM) - 62} A 54 54 0 0 1 ${W / 2 + 54} ${px(BAND_BOTTOM) - 62} L ${W / 2 + 54} ${px(BAND_BOTTOM)} Z`}
        fill="rgba(255,206,142,.12)"
        stroke="rgba(247,245,239,.4)"
        strokeWidth="1.1"
      />
    </svg>
  );
}
