import { ImageResponse } from "next/og";
import { MARK_PATH, MARK_RATIO, MARK_VIEWBOX } from "@/components/brand/Monogram";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/**
 * The home-screen icon.
 *
 * There is room here for the mark to breathe, so it gets the same ivory on
 * Deep Black with wider margins. No gold, for the same reason as everywhere
 * else: the board makes gold a finish on a physical object, and a home
 * screen is not one.
 */
export default function AppleIcon() {
  const w = size.width * 0.56;

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
