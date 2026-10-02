import { ImageResponse } from "next/og";
import { MARK_PATH, MARK_RATIO, MARK_VIEWBOX } from "@/components/brand/Monogram";

export const runtime = "edge";
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/**
 * The browser-tab mark.
 *
 * Ivory on Deep Black, flat. The board sets the monogram solid in black or
 * white and never in gold — and at the 16 CSS pixels this is actually seen
 * at, a gradient across a letterform resolves to mud regardless. Flat is
 * both the correct mark and the only one that survives a tab strip.
 */
export default function Icon() {
  const pad = 8;
  const w = size.width - pad * 2;

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
        <svg width={w} height={w / MARK_RATIO} viewBox={MARK_VIEWBOX}>
          <path d={MARK_PATH} fill="#f7f5ef" fillRule="nonzero" />
        </svg>
      </div>
    ),
    size,
  );
}
