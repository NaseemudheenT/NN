import { LIGHTING, type DayPhase } from "@/lib/tokens";

/**
 * When WebGL is unavailable, refused or too slow, the showroom becomes a
 * drawn elevation of the same room — same architecture, same light, no GPU.
 * The site is never broken and never blank.
 */
export function Fallback2D({ phase }: { phase: DayPhase }) {
  const L = LIGHTING[phase];
  const night = phase === "night";

  return (
    <svg
      className="h-full w-full"
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="nn-air" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={L.background} />
          <stop offset="58%" stopColor={L.fogColor} />
          <stop offset="100%" stopColor={L.floorTint} />
        </linearGradient>
        <linearGradient id="nn-window" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={L.keyColor} stopOpacity={night ? 0.16 : 0.95} />
          <stop offset="100%" stopColor={L.keyColor} stopOpacity={night ? 0.04 : 0.45} />
        </linearGradient>
        <radialGradient id="nn-pool" cx="0.5" cy="0.5">
          <stop offset="0%" stopColor={L.lampColor} stopOpacity={night ? 0.5 : 0.22} />
          <stop offset="100%" stopColor={L.lampColor} stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="1600" height="900" fill="url(#nn-air)" />

      {/* floor line and vanishing perspective */}
      <path d="M0 640 H1600 V900 H0 Z" fill={L.floorTint} opacity="0.85" />
      <path d="M520 640 L720 900 M1080 640 L880 900" stroke={L.background} strokeOpacity="0.25" />

      {/* tall arched windows, right */}
      {[1140, 1330, 1520].map((x) => (
        <g key={x}>
          <path
            d={`M${x - 70} 560 V300 A70 70 0 0 1 ${x + 70} 300 V560 Z`}
            fill="url(#nn-window)"
          />
          <path
            d={`M${x - 70} 560 V300 A70 70 0 0 1 ${x + 70} 300 V560`}
            fill="none"
            stroke={L.floorTint}
            strokeOpacity="0.6"
            strokeWidth="3"
          />
          <line x1={x} y1="230" x2={x} y2="560" stroke={L.floorTint} strokeOpacity="0.45" strokeWidth="2" />
        </g>
      ))}

      {/* back wall, counter, sign halo */}
      <ellipse cx="640" cy="470" rx="230" ry="150" fill="url(#nn-pool)" />
      <rect x="470" y="560" width="340" height="80" fill="#3d2a1c" opacity="0.9" />

      {/* garment rail with shirts, left */}
      <line x1="120" y1="380" x2="470" y2="380" stroke={L.lampColor} strokeWidth="4" opacity="0.85" />
      {[170, 240, 310, 380].map((x, i) => (
        <g key={x}>
          <path
            d={`M${x - 26} 392 L${x - 33} 412 L${x - 24} 560 L${x + 24} 560 L${x + 33} 412 L${x + 26} 392 Z`}
            fill={["#f2efe6", "#b9c8d6", "#e7dfcd", "#2f4257"][i]}
            opacity={night ? 0.8 : 0.95}
          />
          <line x1={x} y1="368" x2={x} y2="392" stroke={L.lampColor} strokeWidth="2" />
        </g>
      ))}

      {/* pools of lamp light on the floor */}
      <ellipse cx="300" cy="700" rx="260" ry="60" fill="url(#nn-pool)" />
      <ellipse cx="1200" cy="720" rx="280" ry="70" fill="url(#nn-pool)" />
    </svg>
  );
}
