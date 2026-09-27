"use client";

/**
 * The NN Stylist button — ThreeUI's GlassAiButton, rebranded to NN.
 *
 * Implemented from the registered ThreeUI source at revision
 * SHA-256 a484571de316, verified against all three published file hashes before
 * a line was written. The structure below is the authored component's: an
 * IntersectionObserver with an 80px root margin, a visibilitychange listener,
 * `mounted = hostVisible && documentVisible`, a ready flag, and an iframe that
 * fades in over 240ms. The scene inside — its GLSL, its geometry, its motion
 * and its interactions — is untouched.
 *
 * Two deliberate departures, both for reasons that matter here:
 *
 *  1. `src` rather than `srcDoc`. The authored component inlines the document
 *     through Vite's `?raw`. That document carries an embedded three.js r170
 *     and weighs 740 kB; inlining it would put all of it into the JavaScript
 *     bundle and break the performance budget in CLAUDE.md. Served from
 *     /public it is a separate, cached, compressed request that costs the
 *     first paint nothing. The sandbox is unchanged.
 *
 *  2. NN's palette and lettering. The original is "GPT 6 Sol" in a deep-blue
 *     galaxy on a grey-blue ground. NN's identity governs every component, so
 *     the emissive palette is rotated to NN gold with luminance preserved (the
 *     bloom threshold and additive blending behave exactly as authored), the
 *     environment the glass reflects is the warm NN showroom, the lettering
 *     reads NN STYLIST in a serif, and the traced brain is the NN monogram.
 *     Every one of those 19 edits is asserted in the retheme script, so a
 *     missed replacement fails loudly rather than shipping half-branded.
 */

import { useEffect, useRef, useState, type CSSProperties } from "react";

/** The rebranded document, served as a static asset. */
const SOURCE = "/threeui/nn-ai-button.html";

export interface NNAiButtonProps {
  className?: string;
  style?: CSSProperties;
  /** Called when the visitor activates the button. */
  onActivate?: () => void;
  /** Accessible label for the surrounding group. */
  label?: string;
}

export function NNAiButton({
  className = "",
  style,
  onActivate,
  label = "Ask the NN stylist",
}: NNAiButtonProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [documentVisible, setDocumentVisible] = useState(
    () => typeof document === "undefined" || !document.hidden,
  );
  const [hostVisible, setHostVisible] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    if (typeof IntersectionObserver === "undefined") {
      setHostVisible(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setHostVisible(entry?.isIntersecting ?? true),
      { rootMargin: "80px" },
    );
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    const update = () => setDocumentVisible(!document.hidden);
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  const mounted = hostVisible && documentVisible;

  useEffect(() => {
    setReady(false);
  }, [mounted]);

  return (
    <div
      ref={hostRef}
      className={`nn-threeui-frame${className ? ` ${className}` : ""}`}
      role="group"
      aria-label={label}
      data-state={!mounted ? "paused" : ready ? "ready" : "loading"}
      style={{
        position: "relative",
        overflow: "hidden",
        isolation: "isolate",
        background: "#0b0b0c",
        pointerEvents: "auto",
        ...style,
      }}
    >
      {mounted ? (
        <iframe
          title={label}
          src={SOURCE}
          sandbox="allow-scripts"
          loading="eager"
          onLoad={() => setReady(true)}
          style={{
            position: "absolute",
            inset: 0,
            display: "block",
            width: "100%",
            height: "100%",
            border: 0,
            background: "#0b0b0c",
            opacity: ready ? 1 : 0,
            pointerEvents: ready ? "auto" : "none",
            transition: "opacity 240ms ease-out",
          }}
        />
      ) : null}

      {/* The scene is sandboxed, so its own click cannot reach React. This
          transparent layer over it is what opens the stylist, and it is a real
          button — so the whole thing is reachable by keyboard. */}
      {onActivate ? (
        <button
          type="button"
          onClick={onActivate}
          aria-label={label}
          style={{
            position: "absolute",
            inset: 0,
            border: 0,
            background: "transparent",
            cursor: "pointer",
            WebkitTapHighlightColor: "transparent",
          }}
        />
      ) : null}
    </div>
  );
}
