import { ImageResponse } from "next/og";
import { MARK_PATH, MARK_RATIO, MARK_VIEWBOX } from "@/components/brand/Monogram";

export const runtime = "edge";
export const alt = "Nero Noren — timeless style builds character";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * The share card.
 *
 * The stacked lockup on Deep Black: mark, wordmark, audience line, tagline.
 * Flat ivory throughout — this is the most-shared instance of the identity,
 * and gold here would be the loudest possible place to break the one rule
 * the board is unambiguous about.
 */
export default function OpengraphImage() {
  const w = 190;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 34,
          background: "#0a0a0a",
          color: "#f7f5ef",
        }}
      >
        <svg width={w} height={w / MARK_RATIO} viewBox={MARK_VIEWBOX}>
          <path d={MARK_PATH} fill="#f7f5ef" fillRule="nonzero" />
        </svg>
        <div style={{ display: "flex", fontSize: 58, letterSpacing: 18, paddingLeft: 18 }}>
          NERO NOREN
        </div>
        <div style={{ display: "flex", fontSize: 20, letterSpacing: 13, paddingLeft: 13, opacity: 0.62 }}>
          MEN &amp; BOYS
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 14,
            paddingTop: 26,
            borderTop: "1px solid rgba(247,245,239,0.22)",
            fontSize: 17,
            letterSpacing: 9,
            paddingLeft: 9,
            opacity: 0.74,
          }}
        >
          TIMELESS STYLE BUILDS CHARACTER
        </div>
      </div>
    ),
    size,
  );
}
