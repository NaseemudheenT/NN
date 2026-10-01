import { ImageResponse } from "next/og";
import { N_INTERLOCK_X, N_PATH, RING } from "@/components/brand/monogram";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/**
 * The home-screen mark.
 *
 * iOS rounds and may add its own gloss, so this carries more margin than the
 * tab icon and keeps the ring — at 180px the ring reads as the board's
 * stacked lockup rather than as a smudge, and it is what makes the tile look
 * like a house mark instead of a cropped letterform.
 */
export default function AppleIcon() {
  const markWidth = N_INTERLOCK_X + 84;
  const inner = 104;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
        }}
      >
        <svg width={size.width} height={size.height} viewBox="0 0 180 180">
          <defs>
            <linearGradient id="apple-metal" x1="0" y1="0" x2="1" y2="0.42">
              <stop offset="0%" stopColor="#6e561c" />
              <stop offset="34%" stopColor="#b4913a" />
              <stop offset="50%" stopColor="#e8cd82" />
              <stop offset="68%" stopColor="#b4913a" />
              <stop offset="100%" stopColor="#6e561c" />
            </linearGradient>
          </defs>
          <circle
            cx={90}
            cy={90}
            r={74}
            fill="none"
            stroke="#8a6d22"
            strokeWidth={RING.thickness * 1.4}
          />
          <g
            fill="url(#apple-metal)"
            transform={`translate(${90 - inner / 2} ${90 - (inner * (100 / markWidth)) / 2}) scale(${inner / markWidth})`}
          >
            <path d={N_PATH} />
            <path d={N_PATH} transform={`translate(${N_INTERLOCK_X} 0)`} />
          </g>
        </svg>
      </div>
    ),
    size,
  );
}
