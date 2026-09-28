"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";
import { MOTION } from "@/lib/tokens";

/**
 * Viewport config. `amount` is used rather than a percentage `margin`:
 * IntersectionObserver rootMargin does not accept percentages, and passing
 * one silently stops the observer from ever firing.
 */
const VIEWPORT = { once: true, amount: 0.2 } as const;

export function Reveal({
  children,
  delay = 0,
  y = MOTION.distance,
  className = "",
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "section" | "header" | "li" | "article";
}) {
  const reduced = useReducedMotion();
  const M = motion[as] as typeof motion.div;
  if (reduced) return <M className={className}>{children}</M>;
  return (
    <M
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={{ duration: MOTION.slow, ease: MOTION.ease, delay }}
    >
      {children}
    </M>
  );
}

/**
 * Line-by-line editorial reveal — a curtain lifting off the type.
 *
 * Runs on mount rather than on scroll: these headings live inside sections
 * and acts that are already being revealed by their own container, and a
 * second observer only risks the type never arriving.
 */
export function RevealLines({
  lines,
  className = "",
  lineClassName = "",
  delay = 0,
}: {
  lines: string[];
  className?: string;
  lineClassName?: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();

  return (
    <span className={className}>
      {lines.map((line, i) => (
        <span
          key={line + i}
          // Descenders need room: the display face is set on a tight leading,
          // and the clipping mask must not cut the tails off the glyphs.
          className={`block overflow-hidden pb-[0.14em] [margin-bottom:-0.14em] ${lineClassName}`}
        >
          <motion.span
            className="block"
            initial={reduced ? false : { y: "112%" }}
            animate={{ y: "0%" }}
            transition={{
              duration: 1,
              ease: MOTION.ease,
              delay: delay + i * 0.085,
            }}
          >
            {line}
            {/* Collapses visually, but keeps the words apart when the
                heading is read aloud or copied. */}
            {i < lines.length - 1 ? " " : null}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

export const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: MOTION.stagger, delayChildren: 0.05 } },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: MOTION.slow, ease: MOTION.ease },
  },
};
