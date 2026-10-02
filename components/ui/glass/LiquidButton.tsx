"use client";

/**
 * The two physical buttons: liquid glass, and brushed metal.
 *
 * Both come from the Founder's reference implementation, rebuilt on NN's own
 * tokens rather than pasted. Three things changed in the rebuild, and each
 * one is the difference between a demo and a shipped control.
 *
 * NO GOLD. The reference ships a "gold" variant; the brief is explicit that
 * the identity carries none, so the metal here is brushed IVORY — Deep Black
 * body, Stone and Ivory in the bevel. A brushed ivory bezel over a near-black
 * face reads as polished steel, which is what the board's hardware actually
 * looks like.
 *
 * REAL REFRACTION, FEATURE-DETECTED. The reference puts
 * `backdropFilter: url("#container-glass")` on an inline style
 * unconditionally. Chromium resolves that; Safari does not, and a reference
 * Safari cannot resolve makes the backdrop VANISH — a black hole where the
 * button should be. So the displacement is applied through a class that
 * ./LiquidFilter switches on only where it genuinely works, and everywhere
 * else keeps the blur, which already looks like glass.
 *
 * AND IT IS A BUTTON. The reference's metal variant renders a <div> wrapper
 * around the <button>, which breaks `block`, `disabled` styling and focus
 * ring geometry. Here the wrapper is a pseudo-element, so the control is one
 * element: focusable, disableable, and correctly outlined.
 */

import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef, useState, type ReactNode } from "react";
import { SPRING } from "@/lib/motion";
import { useMagnetic } from "@/components/motion/useMagnetic";

export type LiquidSize = "sm" | "md" | "lg" | "xl";

const SIZES: Record<LiquidSize, string> = {
  sm: "h-9 px-5 text-[var(--text-micro)]",
  md: "h-11 px-7 text-[var(--text-label)]",
  lg: "h-13 px-9 text-[var(--text-label)]",
  xl: "h-15 px-11 text-[var(--text-fine)]",
};

export interface LiquidButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  children: ReactNode;
  size?: LiquidSize;
  block?: boolean;
  /** Strength of the magnetic lean, in pixels. 0 disables it. */
  magnetism?: number;
}

/**
 * Liquid glass.
 *
 * A pill of optical glass: the backdrop is bent by a fractal displacement map
 * before it is blurred, the rim carries a lit edge, and a specular sweeps
 * across on approach. The label sits above all of it and is never displaced,
 * because text pushed around by a noise field is unreadable — only the
 * BACKDROP refracts, which is also how a real lens works.
 */
export const LiquidButton = forwardRef<HTMLButtonElement, LiquidButtonProps>(
  function LiquidButton(
    { children, size = "lg", block = false, magnetism = 6, className = "", disabled, ...rest },
    ref,
  ) {
    const magnetic = useMagnetic(disabled ? 0 : magnetism);

    return (
      <motion.button
        ref={ref}
        disabled={disabled}
        style={{ x: magnetic.x, y: magnetic.y }}
        onPointerMove={magnetic.onPointerMove}
        onPointerLeave={magnetic.onPointerLeave}
        whileTap={disabled ? undefined : { scale: 0.97 }}
        transition={SPRING.tap}
        className={["nn-liquid", SIZES[size], block ? "w-full" : "", className]
          .filter(Boolean)
          .join(" ")}
        {...rest}
      >
        {/* the refracting pane — purely decorative, never the label */}
        <span className="nn-liquid__pane" aria-hidden="true" />
        {/* the specular that crosses the rim on approach */}
        <span className="nn-liquid__sheen" aria-hidden="true" />
        <span className="nn-liquid__label">{children}</span>
      </motion.button>
    );
  },
);

/* ── brushed metal ─────────────────────────────────────────────── */

export interface MetalButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  children: ReactNode;
  size?: LiquidSize;
  block?: boolean;
}

/**
 * Brushed metal, with press physics.
 *
 * Three layers stacked: an outer bezel, a bright inner bevel, and the face.
 * On press the whole stack drops 2.5 px and compresses — which is the detail
 * that sells it, because a real button travels, and one that only changes
 * colour reads as an image of a button.
 *
 * The bezel and bevel are pseudo-elements rather than wrapper divs, so this
 * stays a single focusable control.
 */
export const MetalButton = forwardRef<HTMLButtonElement, MetalButtonProps>(
  function MetalButton(
    { children, size = "lg", block = false, className = "", disabled, ...rest },
    ref,
  ) {
    const [pressed, setPressed] = useState(false);

    return (
      <motion.button
        ref={ref}
        disabled={disabled}
        data-pressed={pressed ? "true" : "false"}
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => setPressed(false)}
        onPointerLeave={() => setPressed(false)}
        onPointerCancel={() => setPressed(false)}
        /* Keyboard activation presses it too. Without this the control
           travels for a mouse and sits inert for a keyboard, which is the
           kind of asymmetry nobody notices until they cannot use it. */
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") setPressed(true);
        }}
        onKeyUp={() => setPressed(false)}
        transition={SPRING.tap}
        className={["nn-metal", SIZES[size], block ? "w-full" : "", className]
          .filter(Boolean)
          .join(" ")}
        {...rest}
      >
        <span className="nn-metal__shine" aria-hidden="true" />
        <span className="nn-metal__label">{children}</span>
      </motion.button>
    );
  },
);
