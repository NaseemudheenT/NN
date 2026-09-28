"use client";

import { motion, useReducedMotion } from "framer-motion";

export type OrbState = "idle" | "listening" | "thinking" | "responding" | "error";

/**
 * The NN orb: a small piece of house technology, not a chat bubble.
 * Brass and glass with light moving inside it. Its state is legible at a
 * glance — and never louder than the garments behind it.
 */
export function Orb({
  state = "idle",
  size = 56,
  className = "",
}: {
  state?: OrbState;
  size?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const speed = state === "thinking" ? 2.2 : state === "responding" ? 3.2 : 7;
  const glow =
    state === "error" ? "#7a4a4a" : state === "listening" ? "#d8c37a" : "var(--nn-brass)";

  return (
    <span
      className={`relative grid shrink-0 place-items-center ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {/* outer glass shell */}
      <span
        className="nn-glass absolute inset-0 rounded-full"
        style={{ boxShadow: `0 0 ${size * 0.5}px -${size * 0.22}px ${glow}` }}
      />
      {/* the light inside */}
      <motion.span
        className="absolute rounded-full"
        style={{
          width: size * 0.56,
          height: size * 0.56,
          background: `radial-gradient(circle at 34% 30%, var(--nn-brass-light), ${glow} 46%, transparent 72%)`,
          filter: "blur(0.4px)",
        }}
        animate={
          reduced
            ? undefined
            : {
                scale: state === "idle" ? [1, 1.07, 1] : [0.92, 1.12, 0.92],
                opacity: state === "idle" ? [0.75, 1, 0.75] : [0.6, 1, 0.6],
              }
        }
        transition={{ duration: speed, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* a ring that turns while it thinks */}
      <motion.svg
        viewBox="0 0 100 100"
        className="absolute inset-0"
        animate={reduced || state === "idle" ? undefined : { rotate: 360 }}
        transition={{ duration: state === "thinking" ? 2.6 : 9, repeat: Infinity, ease: "linear" }}
      >
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke={glow}
          strokeWidth="1.2"
          strokeOpacity={state === "idle" ? 0.35 : 0.8}
          strokeDasharray={state === "thinking" ? "22 42" : "4 10"}
          strokeLinecap="round"
        />
      </motion.svg>
    </span>
  );
}
