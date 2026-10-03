import Link from "next/link";
import { Showroom } from "@/components/showroom/Showroom";
import { ArrowRight } from "@/components/ui/icons";

/**
 * The entrance.
 *
 * The hall fills the screen and the words sit in it. There is no card behind
 * the type and no scrim across the whole frame — only a gradient up from the
 * floor, which is where the room is darkest anyway, so the contrast is bought
 * from the architecture rather than painted over it.
 *
 * The type carries its own shadow as well. A hall whose light changes through
 * the day will, at some hour, put something bright exactly behind a letter;
 * a two-layer shadow keeps ivory legible against it without needing a plate.
 */
export function Hero({ colours }: { colours: string[] }) {
  return (
    <section className="hero nn-room">
      <Showroom colours={colours} />
      <div className="hero__veil" aria-hidden />

      <div className="wrap hero__in">
        <p className="label label--wide hero__eyebrow reveal">Nero Noren</p>
        <h1 className="hero__title reveal" style={{ "--reveal-delay": "90ms" } as React.CSSProperties}>
          Timeless style
          <br />
          builds character
        </h1>
        <p className="hero__sub reveal" style={{ "--reveal-delay": "180ms" } as React.CSSProperties}>
          More than clothing. A lifestyle.
        </p>
        <div className="hero__acts reveal" style={{ "--reveal-delay": "260ms" } as React.CSSProperties}>
          <Link href="/collection" className="btn btn--solid btn--lg">Explore collection</Link>
          <Link href="/atelier" className="btn btn--glass btn--lg">Enter the atelier</Link>
        </div>
      </div>

      <p className="hero__scroll label">
        <span className="hero__scroll-line" aria-hidden />
        Scroll to explore
      </p>

      <Link href="/collection" className="hero__next" aria-label="Skip to the collection">
        <ArrowRight size={16} />
      </Link>
    </section>
  );
}
