"use client";

/**
 * Crafted in every detail.
 *
 * The four places the monogram appears on a finished garment: the woven neck
 * label, the hangtag, the engraved button and the embroidery.
 *
 * DRAWN, NOT PHOTOGRAPHED. The brief is explicit that the environment is to be
 * built from code rather than assembled from stock images, and this section is
 * where that pays off most obviously: every one of these four objects is the
 * SAME monogram geometry that the header, the favicon and the floor inlay use,
 * so none of them can drift from the others. A set of stock photographs of
 * someone else's labels would be four lies about the product.
 *
 * It is also the one section where gold is correct. The brand board shows the
 * foil, the engraved button and the embroidery in gold because those are
 * physical finishes catching light — which is exactly the distinction the rest
 * of the interface now observes by having none.
 */

import { motion } from "framer-motion";
import { N_INTERLOCK_X, N_PATH } from "@/components/brand/monogram";
import { usePrefersReducedMotion } from "@/components/motion/useReducedMotion";

const MARK_W = N_INTERLOCK_X + 84;

/** The monogram, at whatever size and fill the object it sits on needs. */
function Mark({ fill, height = 34 }: { fill: string; height?: number }) {
  return (
    <svg
      viewBox={`0 0 ${MARK_W} 100`}
      height={height}
      width={height * (MARK_W / 100)}
      aria-hidden="true"
    >
      <g fill={fill}>
        <path d={N_PATH} />
        <path d={N_PATH} transform={`translate(${N_INTERLOCK_X} 0)`} />
      </g>
    </svg>
  );
}

const DETAILS = [
  {
    id: "label",
    title: "The woven label",
    note: "Woven, not printed. A printed label cracks and lifts after a dozen washes; a woven one is part of the cloth and outlasts the garment.",
  },
  {
    id: "hangtag",
    title: "The hangtag",
    note: "Heavy uncoated board, foil-stamped, on a cotton cord. It is the first thing you hold and the last thing you throw away.",
  },
  {
    id: "button",
    title: "The engraved button",
    note: "The mark cut into the face rather than printed on it, so it is still there when the finish has worn.",
  },
  {
    id: "embroidery",
    title: "The embroidery",
    note: "Tone on tone at the cuff, visible only at the angle where light catches the thread.",
  },
] as const;

export function CraftDetail() {
  const reduced = usePrefersReducedMotion();

  return (
    <section className="nn-craft" aria-labelledby="nn-craft-title">
      <div className="nn-wrap">
        <div className="nn-craft__head">
          <p className="nn-label">The making</p>
          <h2 id="nn-craft-title" className="nn-craft__title">
            Crafted in
            <br />
            every detail.
          </h2>
          <p className="nn-craft__body">
            Four places the mark appears on a finished piece. Each one costs more to make than the
            version that would have done, and each one is the difference between a garment and a
            product.
          </p>
        </div>

        <ul className="nn-craft__grid">
          {DETAILS.map((d, i) => (
            <motion.li
              key={d.id}
              className="nn-craft__item"
              initial={reduced ? false : { y: 22 }}
              whileInView={{ y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.65, delay: i * 0.07, ease: [0.16, 0.84, 0.24, 1] }}
            >
              <div className={`nn-craft__object nn-craft__object--${d.id}`}>
                {d.id === "label" ? (
                  /* A satin label stitched to a back neck: the weave runs
                     across it, the mark is woven in ivory, and the two
                     stitch lines are where it is caught to the garment. */
                  <div className="nn-swatch">
                    <div className="nn-swatch__label">
                      <Mark fill="#f7f5ef" height={26} />
                      <span className="nn-swatch__wordmark">Nero Noren</span>
                    </div>
                  </div>
                ) : null}

                {d.id === "hangtag" ? (
                  /* Board, a punched eyelet and a cord. The mark is foil, so
                     it is the one thing here with a gradient across it. */
                  <div className="nn-tag">
                    <span className="nn-tag__cord" aria-hidden="true" />
                    <span className="nn-tag__eyelet" aria-hidden="true" />
                    <Mark fill="url(#nn-foil)" height={30} />
                    <span className="nn-tag__word">Nero Noren</span>
                    <span className="nn-tag__rule" aria-hidden="true" />
                    <span className="nn-tag__fine">Timeless style builds character</span>
                  </div>
                ) : null}

                {d.id === "button" ? (
                  /* Four thread holes, a rim, and the mark cut into the face.
                     The inner shadow is what makes it read as engraved rather
                     than printed — a cut catches light on one edge only. */
                  <div className="nn-button3d">
                    <span className="nn-button3d__rim" aria-hidden="true" />
                    <Mark fill="url(#nn-foil)" height={18} />
                    {[0, 1, 2, 3].map((h) => (
                      <span key={h} className={`nn-button3d__hole nn-button3d__hole--${h}`} aria-hidden="true" />
                    ))}
                  </div>
                ) : null}

                {d.id === "embroidery" ? (
                  /* Tone on tone: the mark is barely a shade off the cloth, and
                     reads by its raised edge rather than by its colour — which
                     is precisely what tone-on-tone embroidery does. */
                  <div className="nn-embroidery">
                    <Mark fill="url(#nn-thread)" height={30} />
                  </div>
                ) : null}
              </div>

              <h3 className="nn-craft__itemtitle">{d.title}</h3>
              <p className="nn-craft__itemnote">{d.note}</p>
            </motion.li>
          ))}
        </ul>
      </div>

      {/* The two gradients the objects above fill with. Declared once, here,
          rather than once per card. */}
      <svg width="0" height="0" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="nn-foil" x1="0" y1="0" x2="1" y2="0.5">
            <stop offset="0%" stopColor="var(--finish-shadow)" />
            <stop offset="34%" stopColor="var(--finish-body)" />
            <stop offset="52%" stopColor="var(--finish-spec)" />
            <stop offset="70%" stopColor="var(--finish-body)" />
            <stop offset="100%" stopColor="var(--finish-shadow)" />
          </linearGradient>
          <linearGradient id="nn-thread" x1="0" y1="0" x2="0.6" y2="1">
            <stop offset="0%" stopColor="#2a2a2c" />
            <stop offset="48%" stopColor="#3e3e41" />
            <stop offset="100%" stopColor="#242426" />
          </linearGradient>
        </defs>
      </svg>
    </section>
  );
}
