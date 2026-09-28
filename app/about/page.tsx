import type { Metadata } from "next";
import { PageHeader, Section } from "@/components/layout/PageHeader";
import { Reveal } from "@/components/motion/Reveal";
import { LiveMonogram } from "@/components/brand/Monogram";
import { GlassButton } from "@/components/ui/glass/Glass";
import { SECONDARY_TAGLINE, TAGLINE } from "@/lib/tokens";

export const metadata: Metadata = {
  title: "The house",
  description:
    "Nero Noren is an online-first menswear house for men and boys. Timeless style builds character.",
};

const PRINCIPLES = [
  {
    n: "01",
    t: "One collection, worn together",
    b: "Every piece is chosen so it works with the others. A shirt that only goes with one trouser is a shirt that does not get worn.",
  },
  {
    n: "02",
    t: "Men and boys, the same standard",
    b: "A boy's blazer is not a toy. It is cut from the same cloth, to the same standard, at a smaller scale.",
  },
  {
    n: "03",
    t: "Say what the cloth is",
    b: "Fabric, weight, fit and care are published plainly. No claims about origin or heritage that we cannot stand behind.",
  },
  {
    n: "04",
    t: "The garment is the point",
    b: "The showroom, the light and the motion exist to present the clothes. When any of it competes with the clothes, it goes.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="The house"
        title={["Nero Noren"]}
        lede={`${TAGLINE}. An online-first house for men and boys, built to last longer than a season.`}
      />

      <Section className="pb-24 md:pb-32">
        <div className="grid gap-16 md:grid-cols-[0.85fr_1.15fr] md:gap-24">
          <Reveal>
            <LiveMonogram className="h-16 w-auto text-accent" />
            <p className="nn-meta mt-6 text-ink-faint">{SECONDARY_TAGLINE}</p>
          </Reveal>
          <Reveal delay={0.1} className="space-y-6">
            <p className="nn-body text-base text-ink-soft">
              The mark is two serif N&apos;s, interlocked. It is stamped on the neck label, cast
              into the buttons, embossed on the bag and set into the floor of the showroom at the
              threshold. It is the same drawing at every size, because a house should look like
              itself everywhere.
            </p>
            <p className="nn-body text-base text-ink-soft">
              We begin online. That is a practical decision, not a modest one: it means the money
              goes into cloth and cut rather than rent, and it means the room a customer walks into
              has to be built rather than leased. So we built one — the showroom on this site is
              drawn in code, lit by the hour of your own clock, and the clothes hang in it.
            </p>
            <p className="nn-body text-base text-ink-soft">
              Collection 001 is called The Foundations because that is what it is: the shirt the
              wardrobe is built around, and the trouser that goes with all of it. Everything that
              comes after has to earn its place beside them.
            </p>
          </Reveal>
        </div>
      </Section>

      <Section className="border-t border-line py-20 md:py-28">
        <p className="nn-meta text-ink-faint">How we work</p>
        <ul className="mt-12 grid gap-px border border-line bg-line sm:grid-cols-2">
          {PRINCIPLES.map((p, i) => (
            <Reveal key={p.n} as="li" delay={i * 0.06} className="bg-bg p-8 md:p-10">
              <span className="font-display text-3xl font-light text-accent">{p.n}</span>
              <h2 className="mt-4 font-display text-2xl font-light text-ink">{p.t}</h2>
              <p className="nn-body mt-3 text-[0.9rem] text-ink-soft">{p.b}</p>
            </Reveal>
          ))}
        </ul>
      </Section>

      <Section className="border-t border-line py-24 text-center md:py-32">
        <Reveal>
          <h2 className="nn-display mx-auto max-w-2xl text-[clamp(2rem,5vw,3.4rem)] text-ink">
            {TAGLINE}
          </h2>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <GlassButton href="/collection" variant="solid" size="lg">
              Collection 001
            </GlassButton>
            <GlassButton href="/" variant="quiet" size="lg">
              Walk the showroom
            </GlassButton>
          </div>
        </Reveal>
      </Section>
    </>
  );
}
