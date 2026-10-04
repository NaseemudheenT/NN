"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { Hotspot, Level } from "@/lib/tower/floors";
import { Plate } from "./Plate";

/**
 * What is on this floor.
 *
 * The building carries atmosphere and orientation. The moment a customer
 * has to READ something — a name, a price, what a room is for — it moves
 * onto glass and into type. Asking someone to choose a collar size off a
 * wall in an isometric render would be beautiful and unusable, and that
 * split is the entire architecture of this site.
 *
 * Three of the nine levels have a plate of their own among the renders —
 * the roof is the aerial view, the gallery is the great hall, the street
 * is the facade. The other six do not, and are not given a borrowed one:
 * an interior that does not exist is exactly the kind of invention this
 * brand cannot afford.
 */
export function FloorCard({
  level,
  price,
  onHotspot,
}: {
  level: Level;
  price: (handle: string) => string | null;
  onHotspot: (spot: Hotspot, level: Level) => void;
}) {
  return (
    <motion.section
      className="floor glass glass--refract"
      key={level.id}
      initial={{ opacity: 0, y: 26 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 14 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      aria-label={`${level.code} — ${level.title}`}
    >
      {level.plate && (
        <div className="floor__view">
          <Plate
            id={level.plate}
            alt={`${level.title} — ${level.subtitle}`}
            sizes="(max-width: 900px) 90vw, 380px"
            className="floor__plate"
          />
        </div>
      )}

      <div className="floor__body">
        <p className="label label--soft">{level.code}</p>
        <h2 className="floor__title">{level.title}</h2>
        <p className="floor__sub small muted">{level.subtitle}</p>

        <ul className="floor__spots">
          {level.hotspots.map((s) => {
            const p = s.handle ? price(s.handle) : null;
            return (
              <li key={s.id}>
                <button type="button" className="spot" onClick={() => onHotspot(s, level)}>
                  <span className="spot__label">{s.label}</span>
                  {p && <span className="spot__price">{p}</span>}
                </button>
              </li>
            );
          })}
        </ul>

        <Link className="btn btn--glass floor__go" href={level.route}>
          {level.floor === 0 ? "Step outside" : `Open ${level.code.toLowerCase()}`}
        </Link>
      </div>
    </motion.section>
  );
}
