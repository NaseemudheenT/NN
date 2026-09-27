"use client";

/**
 * The NN button.
 *
 * Glass body, lit edge, a specular that tracks the pointer, a magnetic lean
 * toward it, and a press that actually compresses. Four tones:
 *
 *   metal    the primary action. Gold as a finish — three stops and a moving
 *            specular — never a flat fill, which is what the brand board is
 *            careful to show and what makes gold read as brass rather than
 *            yellow paint.
 *   solid    ivory on black, or black on ivory. The workhorse.
 *   glass    translucent, for actions over imagery or the showroom.
 *   quiet    a hairline. For anything that must not compete.
 *
 * Square by default. The board has no rounded corners in it anywhere.
 */

import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef, type ReactNode } from "react";
import { DURATION, EASE, SPRING } from "@/lib/motion";
import { useMagnetic } from "@/components/motion/useMagnetic";

export type GlassButtonTone = "metal" | "solid" | "glass" | "quiet";
export type GlassButtonSize = "sm" | "md" | "lg";

/* Based on HTMLMotionProps, not React's button props: Framer Motion redefines
   the drag and animation handlers with different signatures, and mixing the
   two sets makes the intersection unassignable. */
export interface GlassButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  tone?: GlassButtonTone;
  size?: GlassButtonSize;
  children: ReactNode;
  /** Fill the available width. */
  block?: boolean;
  /** Strength of the magnetic lean, in pixels. 0 disables it. */
  magnetism?: number;
}

const SIZES: Record<GlassButtonSize, string> = {
  sm: "px-4 py-2.5 text-[var(--text-micro)]",
  md: "px-7 py-3.5 text-[var(--text-label)]",
  lg: "px-9 py-4.5 text-[var(--text-fine)]",
};

export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(function GlassButton(
  { tone = "solid", size = "md", children, block = false, magnetism = 5, className = "", disabled, ...rest },
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
      whileTap={disabled ? undefined : { scale: 0.975 }}
      transition={SPRING.tap}
      className={[
        "nn-btn",
        `nn-btn--${tone}`,
        SIZES[size],
        block ? "w-full" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {/* The fill rises from the floor. A wipe reads as a curtain being
          raised; a fade reads as a colour change. */}
      <span className="nn-btn__fill" aria-hidden="true" />
      <span className="nn-btn__label">{children}</span>
    </motion.button>
  );
});

/* ── icon button ───────────────────────────────────────────────── */

export interface GlassIconButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  /** Required: an icon alone is not a label. */
  label: string;
  children: ReactNode;
  tone?: GlassButtonTone;
  size?: "sm" | "md";
}

export const GlassIconButton = forwardRef<HTMLButtonElement, GlassIconButtonProps>(
  function GlassIconButton({ label, children, tone = "glass", size = "md", className = "", disabled, ...rest }, ref) {
    const magnetic = useMagnetic(disabled ? 0 : 4);

    return (
      <motion.button
        ref={ref}
        aria-label={label}
        title={label}
        disabled={disabled}
        style={{ x: magnetic.x, y: magnetic.y }}
        onPointerMove={magnetic.onPointerMove}
        onPointerLeave={magnetic.onPointerLeave}
        whileTap={disabled ? undefined : { scale: 0.94 }}
        transition={SPRING.tap}
        className={[
          "nn-btn nn-btn--icon",
          `nn-btn--${tone}`,
          size === "sm" ? "h-9 w-9" : "h-11 w-11",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...rest}
      >
        <span className="nn-btn__fill" aria-hidden="true" />
        <span className="nn-btn__label grid place-items-center">{children}</span>
      </motion.button>
    );
  },
);

/* ── pill: a small piece of metadata, sometimes tappable ───────── */

export function GlassPill({
  children,
  tone = "quiet",
  active = false,
  onClick,
  className = "",
}: {
  children: ReactNode;
  tone?: "quiet" | "metal";
  active?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const Tag = onClick ? motion.button : motion.span;

  return (
    <Tag
      onClick={onClick}
      data-active={active}
      whileTap={onClick ? { scale: 0.96 } : undefined}
      transition={{ duration: DURATION.tap, ease: EASE.out }}
      className={["nn-pill", `nn-pill--${tone}`, className].filter(Boolean).join(" ")}
    >
      {children}
    </Tag>
  );
}
