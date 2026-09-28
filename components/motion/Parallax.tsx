"use client";

import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { useRef, type ReactNode } from "react";

/** Depth layer. Negative depth moves against the scroll (background). */
export function Parallax({
  children,
  depth = 0.12,
  className = "",
}: {
  children: ReactNode;
  depth?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const raw = useTransform(scrollYProgress, [0, 1], [depth * 180, depth * -180]);
  const y = useSpring(raw, { stiffness: 90, damping: 26, mass: 0.7 });

  return (
    <div ref={ref} className={className}>
      <motion.div style={reduced ? undefined : { y }}>{children}</motion.div>
    </div>
  );
}
