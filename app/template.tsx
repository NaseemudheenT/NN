"use client";

/**
 * Page transitions.
 *
 * `template.tsx` re-mounts on every navigation, which is exactly what a
 * transition needs — a layout would not. Each page rises a little and settles,
 * the way a card is laid on a counter rather than snapping into place.
 *
 * It is deliberately quick: 420ms in, nothing on the way out. A long exit
 * animation makes a fast site feel slow, because the customer is already
 * waiting for what they asked for. With reduced motion there is no movement at
 * all, only the content.
 */

import { motion, useReducedMotion } from "framer-motion";

export default function Template({ children }: { children: React.ReactNode }) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) return <>{children}</>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: [0.22, 0.61, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
