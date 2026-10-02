import { ImageResponse } from "next/og";
import { N_INTERLOCK_X, N_PATH } from "@/components/brand/monogram";

export const runtime = "edge";
export const alt = "Nero Noren — timeless style builds character";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * The share card, drawn rather than uploaded.
 *
 * Generated from the same monogram geometry as the site's own mark, so the
 * card can never drift from the brand — and no image file has to be kept in
 * sync by hand. Laid out as the board lays out the lockup: mark, wordmark,
 * audience, rule, line.
 */
export default async function Image() {
  const markWidth = N_INTERLOCK_X + 84;

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
          background: "#0a0a0a",
          color: "#f7f5ef",
          fontFamily: "Georgia, serif",
        }}
      >
        {/* the single lamp the gold catches */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(52% 44% at 50% 40%, rgba(180,145,58,0.20), transparent 70%)",
          }}
        />

        <svg width="150" height="107" viewBox={`0 0 ${markWidth} 100`} style={{ position: "relative" }}>
          {/* Stark Ivory on Deep Black — the board's own logo panel, and
              the brief's "NO GOLD", applied to the single most public
              instance of the mark there is. Every link anyone shares
              renders this image. */}
          <g fill="#f7f5ef">
            <path d={N_PATH} />
            <path d={N_PATH} transform={`translate(${N_INTERLOCK_X} 0)`} />
          </g>
        </svg>

        <div
          style={{
            position: "relative",
            marginTop: 42,
            fontSize: 78,
            letterSpacing: 26,
            textTransform: "uppercase",
          }}
        >
          Nero Noren
        </div>

        <div
          style={{
            position: "relative",
            marginTop: 20,
            fontSize: 20,
            letterSpacing: 16,
            textTransform: "uppercase",
            color: "#b7b1a7",
          }}
        >
          Men &amp; Boys
        </div>

        {/* Stone, not gold: this is a flat PNG, and a gold that cannot catch
            light is just a yellow line. The monogram above keeps its metal
            because a gradient still reads as plating in a still image. */}
        <div style={{ position: "relative", marginTop: 44, width: 1, height: 34, background: "#b7b1a7" }} />

        {/* Two stacked lines rather than a <br>.
            Satori requires any element with more than one child to declare
            display, and it does not lay out <br> at all — this div had a text
            node, a break and another text node, which is what was making the
            whole card fail to render. The site was advertising an og:image
            that 500d on every request. */}
        <div
          style={{
            position: "relative",
            marginTop: 30,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            fontSize: 22,
            letterSpacing: 11,
            textTransform: "uppercase",
            lineHeight: 1.7,
          }}
        >
          <div style={{ display: "flex" }}>Timeless style</div>
          <div style={{ display: "flex" }}>builds character</div>
        </div>
      </div>
    ),
    size,
  );
}
