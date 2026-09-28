import type { Metadata } from "next";
import { PageHeader, Prose } from "@/components/layout/PageHeader";

export const metadata: Metadata = {
  title: "Care",
  description: "How to wash, dry, press and store Nero Noren pieces so they last.",
};

export default function CarePage() {
  return (
    <>
      <PageHeader
        eyebrow="Care"
        title={["Keeping a", "garment well"]}
        lede="Most clothes are worn out by laundering, not by wearing. Washing less often and drying more gently does more for a shirt than anything else."
      />
      <Prose>
        <h2>Cotton shirting</h2>
        <ul>
          <li>Wash at 30°C on a gentle cycle, with like colours, turned inside out.</li>
          <li>Use about half the detergent you think you need, and no fabric softener — it coats the fibre and dulls the weave.</li>
          <li>Hang to dry on a shaped hanger, away from direct sun. A tumble dryer is what shrinks a collar and wears a cuff.</li>
          <li>Press warm on the reverse while very slightly damp. Do the collar and cuffs first, the body last.</li>
        </ul>

        <h2>Wool-blend trousers</h2>
        <ul>
          <li>Dry clean, and no more than a few times a year. Dry cleaning is a solvent process and is hard on cloth.</li>
          <li>Between cleans, brush along the grain with a soft clothes brush and hang them out overnight.</li>
          <li>Steam to lift creases and let the fibre recover before the next wear.</li>
          <li>Hang from the waistband on a clamp hanger, not folded over a bar, so the crease stays where it was pressed.</li>
        </ul>

        <h2>Between wears</h2>
        <p>
          Give a garment a day off. Wool in particular recovers its shape if it is allowed to hang
          and breathe for twenty-four hours, which is why two trousers in rotation outlast one worn
          every day by more than double.
        </p>

        <h2>Storing</h2>
        <ul>
          <li>Hang shirting and trousers with a hand&apos;s width between pieces so air moves.</li>
          <li>Fold knitwear. Hanging stretches the shoulder permanently.</li>
          <li>Store clean. Moths are drawn to what is on the cloth, not the cloth itself.</li>
          <li>Use cedar rather than mothballs, and keep the wardrobe dry and out of direct light.</li>
        </ul>

        <h2>Repairs</h2>
        <p>
          A replaced button or a restitched seam is a normal part of a garment&apos;s life. Keep the
          spare buttons that come with each piece — they are matched to the run, and a later batch
          will not be identical.
        </p>
      </Prose>
    </>
  );
}
