import { ImageResponse } from "next/og";
import { N_INTERLOCK_X, N_PATH } from "@/components/brand/monogram";

export const runtime = "edge";
export const alt = "Nero Noren — the art of dressing well";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * The share card, drawn rather than uploaded.
 *
 * Generated from the same monogram geometry as the site's own logo, so the card
 * can never fall out of step with the brand — and no image file has to be kept
 * in sync by hand.
 */
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#000000",
          color: "#efe9dd",
          padding: "72px 84px",
          fontFamily: "Georgia, serif",
        }}
      >
        {/* the gold sweep a showroom lamp would throw */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(120% 80% at 18% 0%, rgba(201,164,58,0.26), transparent 62%), radial-gradient(90% 70% at 88% 30%, rgba(138,123,106,0.22), transparent 66%)",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 26, position: "relative" }}>
          <svg width="76" height="76" viewBox="0 0 136 100">
            <g fill="#c9a43a">
              <path d={N_PATH} transform={`translate(${N_INTERLOCK_X} 0)`} opacity="0.62" />
              <path d={N_PATH} />
            </g>
          </svg>
          <span style={{ fontSize: 30, letterSpacing: 14, textTransform: "uppercase" }}>
            Nero Noren
          </span>
        </div>

        <div style={{ position: "relative", display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 96, lineHeight: 1.02 }}>The art</span>
          <span style={{ fontSize: 96, lineHeight: 1.02, color: "#c9a43a", fontStyle: "italic" }}>
            of dressing well.
          </span>
        </div>

        <div
          style={{
            position: "relative",
            display: "flex",
            justifyContent: "space-between",
            fontSize: 24,
            color: "#b8ae9c",
            letterSpacing: 3,
          }}
        >
          <span>Collection 001 — The Foundations</span>
          <span>Online first. Delivered across India.</span>
        </div>
      </div>
    ),
    size,
  );
}
