"use client";

/**
 * Men and boys.
 *
 * The board's audience lockup is MEN & BOYS, and it is not a marketing line —
 * it is the reason the range is cut the way it is. This band says so, and
 * sends you to the two halves of the collection.
 *
 * The two figures are drawn, not photographed: a tall silhouette and a short
 * one, same proportions, same coat. That IS the proposition — a boy's piece
 * cut like a man's rather than scaled down from one — and a pair of stock
 * photographs of models who are not wearing NN would say nothing true.
 */

import Link from "next/link";
import { motion } from "framer-motion";
import { MetalButton } from "@/components/ui/glass/LiquidButton";
import { usePrefersReducedMotion } from "@/components/motion/useReducedMotion";

/** One figure, as a silhouette. `scale` is the only difference between them. */
function Figure({ scale, delay }: { scale: number; delay: number }) {
  const reduced = usePrefersReducedMotion();
  return (
    <motion.svg
      viewBox="0 0 120 300"
      className="nn-gen__figure"
      style={{ height: `${scale * 100}%` }}
      initial={reduced ? false : { y: 26 }}
      whileInView={{ y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.8, delay, ease: [0.16, 0.84, 0.24, 1] }}
      aria-hidden="true"
    >
      {/* head, shoulders, a long overcoat, trousers below it */}
      <circle cx="60" cy="26" r="17" />
      <path d="M43 46 L77 46 L92 62 L96 150 L88 150 L86 96 L86 236 L68 236 L66 150 L54 150 L52 236 L34 236 L34 96 L32 150 L24 150 L28 62 Z" />
      <rect x="36" y="236" width="20" height="52" rx="3" />
      <rect x="64" y="236" width="20" height="52" rx="3" />
    </motion.svg>
  );
}

export function Generations() {
  return (
    <section className="nn-gen" aria-labelledby="nn-gen-title">
      <div className="nn-wrap nn-gen__inner">
        <div className="nn-gen__stage" aria-hidden="true">
          <Figure scale={1} delay={0} />
          <Figure scale={0.68} delay={0.12} />
        </div>

        <div className="nn-gen__copy">
          <p className="nn-label">Men &amp; Boys</p>
          <h2 id="nn-gen-title" className="nn-gen__title">
            Generations
            <br />
            of style.
          </h2>
          <p className="nn-gen__body">
            The boys&rsquo; pieces are cut like the men&rsquo;s, not scaled down from them — same
            cloth, same collar, same finished seams, drafted again at a smaller scale. A boy in a
            shrunken adult coat looks like a boy in a shrunken adult coat.
          </p>
          <div className="nn-gen__ways">
            <Link href="/collection" aria-label="Explore the collection">
              <MetalButton size="lg" tabIndex={-1}>
                Explore the collection
              </MetalButton>
            </Link>
            <Link href="/boys" className="nn-link text-[var(--text-micro)] uppercase tracking-[var(--tracking-label)]">
              The boys&rsquo; range
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
