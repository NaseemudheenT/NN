import type { Metadata } from "next";
import { PageHeader, Prose, Section } from "@/components/layout/PageHeader";
import { GlassButton } from "@/components/ui/glass/Glass";
import { Reveal } from "@/components/motion/Reveal";

export const metadata: Metadata = {
  title: "Sizing",
  description:
    "How to measure yourself, how Nero Noren pieces are cut, and how to read a size chart before you order.",
};

const STEPS = [
  {
    t: "Chest",
    b: "Tape around the fullest part of the chest, under the arms, with the tape level at the back. Breathe normally — do not hold your breath or puff out.",
  },
  {
    t: "Waist",
    b: "Around the natural waist, which is the narrowest point, usually just above the navel. Keep one finger under the tape.",
  },
  {
    t: "Hip",
    b: "Around the fullest part of the seat, with your feet together.",
  },
  {
    t: "Shoulder",
    b: "Across the back, from the bone at one shoulder point to the other. This is the one measurement a tailor cannot easily change.",
  },
  {
    t: "Inseam",
    b: "From the crotch seam of trousers that already fit you, straight down to the hem. Measure the trousers flat, not yourself.",
  },
];

export default function SizingPage() {
  return (
    <>
      <PageHeader
        eyebrow="Sizing"
        title={["Measuring", "properly"]}
        lede="Five measurements, taken over a shirt rather than a coat, with the tape snug and level. Ten minutes now saves a return later."
      >
        <GlassButton href="/trial-room" variant="solid" className="mt-8">
          Use the trial room instead
        </GlassButton>
      </PageHeader>

      <Section className="pb-20">
        <ol className="grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.t} as="li" delay={i * 0.05} className="bg-bg p-7">
              <span className="nn-meta text-accent">{String(i + 1).padStart(2, "0")}</span>
              <h2 className="mt-3 font-display text-2xl font-light text-ink">{s.t}</h2>
              <p className="nn-body mt-2.5 text-[0.875rem] text-ink-soft">{s.b}</p>
            </Reveal>
          ))}
        </ol>
      </Section>

      <Prose>
        <h2>How the pieces are cut</h2>
        <p>
          Shirting is cut clean through the body with room to move at the shoulder — close enough
          to tuck without bunching, easy enough to reach across a table. Trousers are cut straight
          from hip to hem, except the pleated trouser, which sits higher on the waist and has room
          through the thigh.
        </p>

        <h2>Reading a size chart</h2>
        <p>
          A size chart gives the measurements of the garment, not of the body it is meant for. The
          difference between the two is the ease. Around eight centimetres of ease at the chest
          reads as close; thirteen is how most of our shirting is meant to sit; nineteen is roomy.
        </p>

        <h2>Between two sizes</h2>
        <p>
          Take the larger one for shirting and have the body taken in if you want it closer — a
          shoulder that is too narrow cannot be fixed, but a body that is too wide can. For
          trousers, take the size that fits the waist and have the leg and hem adjusted.
        </p>

        <h2>Boys</h2>
        <p>
          Boys&apos; pieces are cut to the same standard at a smaller scale. Measure the chest and
          the inseam and size to the larger of the two — sleeves and hems are easier to shorten than
          a body is to let out.
        </p>

        <h2>Still unsure</h2>
        <p>
          The <a href="/trial-room">trial room</a> reads your measurements against the published
          chart for a specific piece and says where it will sit close and where it will be easy. The{" "}
          <a href="/stylist">stylist</a> can talk through the cut of anything in the collection.
        </p>
      </Prose>
    </>
  );
}
