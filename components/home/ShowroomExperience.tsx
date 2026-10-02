import Link from "next/link";
import { Plate } from "@/components/ui/Plate";
import { ArrowRight } from "@/components/ui/icons";

const ZONES = [
  { href: "/men", label: "Men's tailoring", note: "Cut for the way you actually stand", kind: "room" as const },
  { href: "/boys", label: "Boys collection", note: "The same cloth, the same cut, scaled", kind: "street" as const },
  { href: "/collection?category=outerwear", label: "Outerwear", note: "Coats that outlast the season", kind: "cloth" as const },
  { href: "/collection?category=loafers", label: "Loafers", note: "Leather, finished by hand", kind: "detail" as const },
];

/**
 * The four zones of the floor.
 *
 * Four tall doors in a row, which is what the arcade of the real hall looks
 * like from the middle of the nave — so the band is not decorating the
 * showroom idea, it is a plan of it.
 */
export function ShowroomExperience() {
  return (
    <section className="exp band" aria-labelledby="exp-h">
      <div className="wrap exp__in">
        <div className="exp__intro nn-room reveal">
          <Plate kind="room" alt="" className="exp__intro-bg" />
          <div className="exp__intro-body">
            <h2 id="exp-h" className="d-h2">The European<br />showroom experience</h2>
            <p className="lead">
              Step into a world of refined elegance. Explore our curated spaces, discover signature
              pieces, and experience the art of modern tailoring.
            </p>
            <Link href="/showroom" className="btn btn--glass">Start the tour</Link>
          </div>
          <p className="exp__count label tnum">01&nbsp;/&nbsp;04</p>
        </div>

        <ul className="exp__zones">
          {ZONES.map((z, i) => (
            <li key={z.href} className="reveal" style={{ "--reveal-delay": `${i * 70}ms` } as React.CSSProperties}>
              <Link href={z.href} className="zone">
                <Plate kind={z.kind} alt="" className="zone__img" sizes="(max-width: 900px) 50vw, 18vw" />
                <span className="zone__shade" aria-hidden />
                <span className="zone__body">
                  <span className="zone__label">{z.label}</span>
                  <span className="zone__note">{z.note}</span>
                  <ArrowRight size={16} className="zone__arrow" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
