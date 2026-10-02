"use client";

/**
 * The European showroom experience.
 *
 * The dark band that sits between the walk and the collection, and the one
 * place on the homepage that says plainly what NN is: a house you can walk
 * through rather than a grid you scroll.
 *
 * Four ways in, built from the catalogue rather than written down. A hard-coded
 * list of categories is a list that goes wrong the first time the range
 * changes — these count what is actually in stock, so "Four shirts" is true
 * because four shirts exist, and the card disappears if they stop existing.
 */

import Link from "next/link";
import { motion } from "framer-motion";
import type { Product } from "@/lib/catalog/types";
import { LiquidButton } from "@/components/ui/glass/LiquidButton";
import { usePrefersReducedMotion } from "@/components/motion/useReducedMotion";

interface Zone {
  id: string;
  label: string;
  count: number;
  note: string;
  href: string;
}

/** A plain-English count. "Four shirts" reads; "4 shirts" is a spreadsheet. */
const WORDS = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];
const spell = (n: number) => WORDS[n] ?? String(n);

export function ShowroomExperience({ products }: { products: Product[] }) {
  const reduced = usePrefersReducedMotion();

  const shirts = products.filter((p) => p.type === "shirt");
  const trousers = products.filter((p) => p.type === "trouser");

  const zones: Zone[] = [
    {
      id: "rails",
      label: "The rails",
      count: shirts.length,
      note: `${spell(shirts.length)} ${shirts.length === 1 ? "shirt" : "shirts"}, hanging in the arched niches on the long wall.`,
      href: "/collection?type=shirt",
    },
    {
      id: "table",
      label: "The table",
      count: trousers.length,
      note: `${spell(trousers.length)} ${trousers.length === 1 ? "trouser" : "trousers"}, folded on the oak table under a tight beam.`,
      href: "/collection?type=trouser",
    },
    {
      id: "mirror",
      label: "The mirror",
      count: 0,
      note: "A full-length mirror and two dressed forms, for seeing a piece the way it will actually be worn.",
      href: "/trial-room",
    },
    {
      id: "atelier",
      label: "The atelier",
      count: 0,
      note: "A stylist who knows the whole range, and will put a shirt against a trouser for you.",
      href: "/stylist",
    },
  ].filter((z) => z.count !== 0 || z.id === "mirror" || z.id === "atelier");

  return (
    <section className="nn-experience" aria-labelledby="nn-experience-title">
      <div className="nn-wrap nn-experience__inner">
        <div className="nn-experience__lede">
          <p className="nn-label">The house</p>
          <h2 id="nn-experience-title" className="nn-experience__title">
            A showroom you
            <br />
            walk through.
          </h2>
          <p className="nn-experience__body">
            Troweled lime on thick masonry, Romanesque arches, dark walnut underfoot and a room lit
            by your own clock. The garments hang in the niches and the light is aimed at them,
            which is the only reason any of the architecture is here.
          </p>
          <Link href="/showroom" aria-label="Enter the showroom">
            <LiquidButton size="lg" tabIndex={-1}>
              Enter the showroom
            </LiquidButton>
          </Link>
        </div>

        <ul className="nn-experience__zones">
          {zones.map((zone, i) => (
            <motion.li
              key={zone.id}
              initial={reduced ? false : { y: 20 }}
              whileInView={{ y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.6, delay: i * 0.06, ease: [0.16, 0.84, 0.24, 1] }}
            >
              <Link href={zone.href} className="nn-zone glass glass--panel">
                <span className="nn-zone__index">{String(i + 1).padStart(2, "0")}</span>
                <span className="nn-zone__label">{zone.label}</span>
                <span className="nn-zone__note">{zone.note}</span>
                <span className="nn-zone__go" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
                    <path d="M4 12h15M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </Link>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
