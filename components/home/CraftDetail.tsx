import Link from "next/link";
import { Plate } from "@/components/ui/Plate";
import { ArrowRight } from "@/components/ui/icons";

const TILES = [
  { kind: "detail" as const, alt: "The woven neck label" },
  { kind: "cloth" as const, alt: "The hangtag, foil-blocked" },
  { kind: "detail" as const, alt: "The engraved button" },
  { kind: "cloth" as const, alt: "The packaging" },
];

/**
 * The four details.
 *
 * Neck label, hangtag, button, packaging — the four places on the brand
 * board where gold appears, and the only four places on this website where
 * it is allowed to: as a FINISH on a physical object catching the light,
 * never as a flat colour and never as type. That rule is the whole reason
 * this band exists as a photograph rather than as an ornament.
 */
export function CraftDetail() {
  return (
    <section className="craft band" aria-labelledby="craft-h">
      <div className="wrap craft__in">
        <ul className="craft__tiles">
          {TILES.map((t, i) => (
            <li key={i} className="reveal" style={{ "--reveal-delay": `${i * 60}ms` } as React.CSSProperties}>
              <Plate kind={t.kind} alt={t.alt} ratio="1 / 1" sizes="(max-width: 900px) 50vw, 20vw" />
            </li>
          ))}
        </ul>

        <div className="craft__body reveal">
          <h2 id="craft-h" className="d-h2">Crafted in<br />every detail</h2>
          <p className="lead">
            From the woven label to the box it arrives in, every element reflects the same
            commitment to quality, heritage and timeless design.
          </p>
          <Link href="/atelier" className="ul-grow label craft__more">
            Explore the craft <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}
