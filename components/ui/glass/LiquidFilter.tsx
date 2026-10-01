"use client";

/**
 * The refraction that makes glass liquid.
 *
 * Blur alone is frosted glass. What separates optical glass from frosting is
 * that it *bends* what is behind it: straight lines passing under the panel
 * come out displaced, and the displacement varies across the surface because
 * real glass is never perfectly flat. That is what this filter does —
 * fractal noise drives a displacement map, and the backdrop is pushed around
 * by it before the blur ever runs.
 *
 * Three strengths, because the amount of bend should follow the thickness of
 * the pane: a navigation bar is thin, a lens over imagery is thick.
 *
 * Browser support is the whole reason this is a separate component. Chromium
 * honours a filter reference inside backdrop-filter; Safari does not, and a
 * reference it cannot resolve makes the backdrop vanish — a black panel where
 * the showroom should be. So support is feature-detected at runtime and the
 * class is only switched on where it genuinely works. Everywhere else keeps
 * the blur, which already looks like glass. Safari must never break.
 */

import { useEffect } from "react";

/** Does this engine resolve a filter reference inside backdrop-filter? */
function supportsBackdropFilterReference(): boolean {
  if (typeof window === "undefined" || typeof CSS === "undefined") return false;
  try {
    // Both spellings: WebKit still needs the prefix where it supports it at all.
    return (
      CSS.supports("backdrop-filter", "url(#nn-liquid-panel)") ||
      CSS.supports("-webkit-backdrop-filter", "url(#nn-liquid-panel)")
    );
  } catch {
    return false;
  }
}

/**
 * Safari reports support for the *property* and then fails on the reference,
 * so the engine is checked too. This is the one place in the codebase that
 * sniffs a browser, and it is here because the alternative is a black panel.
 */
function isWebKitButNotChromium(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /AppleWebKit/.test(ua) && !/Chrome|Chromium|Edg\//.test(ua);
}

export function LiquidFilter() {
  useEffect(() => {
    const ok = supportsBackdropFilterReference() && !isWebKitButNotChromium();
    document.documentElement.dataset.liquid = ok ? "on" : "off";
  }, []);

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      // Out of flow and out of the accessibility tree, but still rendered:
      // display:none would stop the filters resolving at all.
      style={{ position: "absolute", width: 0, height: 0, pointerEvents: "none" }}
    >
      <defs>
        {/* A pane — navigation, docks. Thin glass bends very little. */}
        <filter id="nn-liquid-pane" x="-12%" y="-12%" width="124%" height="124%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.009"
            numOctaves={2}
            seed={7}
            result="noise"
          />
          <feGaussianBlur in="noise" stdDeviation="2.4" result="soft" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="soft"
            scale={11}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        {/* A panel — sheets, cards, modals. The house default. */}
        <filter id="nn-liquid-panel" x="-14%" y="-14%" width="128%" height="128%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.006"
            numOctaves={2}
            seed={7}
            result="noise"
          />
          <feGaussianBlur in="noise" stdDeviation="2" result="soft" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="soft"
            scale={20}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        {/* A lens — thick glass laid over imagery, where the bend is the point. */}
        <filter id="nn-liquid-lens" x="-18%" y="-18%" width="136%" height="136%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.0045"
            numOctaves={3}
            seed={7}
            result="noise"
          />
          <feGaussianBlur in="noise" stdDeviation="1.6" result="soft" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="soft"
            scale={30}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}
