import { ImageResponse } from "next/og";
import { N_INTERLOCK_X, N_PATH } from "@/components/brand/monogram";

export const runtime = "edge";
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/**
 * The browser-tab mark.
 *
 * Drawn from the same monogram geometry as every other use of the logo, so a
 * change to the letterform reaches the favicon without anyone remembering to
 * re-export a PNG.
 *
 * No ring at this size: at 16 CSS pixels a 2px ring closes into a blob and
 * the letters lose their counters. The ligature alone is the more legible
 * mark small, and it is the more distinctive one — a tab strip has nothing
 * else shaped like two Ns sharing a stem.
 */
export default function Icon() {
  const markWidth = N_INTERLOCK_X + 84;
  const pad = 7;

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
        <svg
          width={size.width - pad * 2}
          height={(size.height - pad * 2) * (100 / markWidth)}
          viewBox={`0 0 ${markWidth} 100`}
        >
          <defs>
            <linearGradient id="icon-metal" x1="0" y1="0" x2="1" y2="0.42">
              <stop offset="0%" stopColor="#8a6d22" />
              <stop offset="42%" stopColor="#e8cd82" />
              <stop offset="100%" stopColor="#8a6d22" />
            </linearGradient>
          </defs>
          <g fill="url(#icon-metal)">
            <path d={N_PATH} />
            <path d={N_PATH} transform={`translate(${N_INTERLOCK_X} 0)`} />
          </g>
        </svg>
      </div>
    ),
    size,
  );
}
