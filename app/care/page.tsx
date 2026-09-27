import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { Prose } from "@/components/layout/Prose";

export const metadata: Metadata = {
  title: "Fabric care",
  description:
    "How to wash, dry and press Nero Noren shirts and trousers so they last, in Indian conditions.",
  alternates: { canonical: "/care" },
};

export default function CarePage() {
  return (
    <>
      <PageHeader
        eyebrow="Care"
        title="Making them last"
        lede="Cotton is forgiving if you treat it well. Most of what shortens a shirt's life is heat: hot water, a hot dryer, a hot iron on a dry shirt."
      />
      <Prose>
        <h2>Shirts</h2>
        <p>
          Machine wash cold, on a gentle cycle, with a mild detergent. Turn the shirt inside out
          and fasten the cuffs so they do not catch. Do not bleach, and do not use a fabric
          softener — it coats the fibre and, over time, makes cotton feel worse rather than better.
        </p>
        <p>
          Line dry in shade. Direct Indian sun will fade a colour faster than anything else you
          can do to it, and a tumble dryer on heat is what makes a shirt shrink and the collar
          curl. Hang it while it is still slightly damp and most of the creasing will fall out on
          its own.
        </p>
        <p>
          Iron warm, on the reverse, while the cloth is still a little damp. Press the collar and
          the cuffs from the inside first, then the yoke, then the body. The Oxford weave takes a
          slightly hotter iron than the poplin; if you are unsure, start cooler.
        </p>

        <h2>Trousers</h2>
        <p>
          Dry cleaning is kindest to a tailored trouser, and it keeps the crease. If you would
          rather wash them at home, turn them inside out, wash cold on a gentle cycle, and hang
          them by the waistband to dry — never over a rail at the knee, which sets a line you will
          not get out.
        </p>
        <p>
          Press on the reverse with a cloth between the iron and the fabric. The twill has two
          per cent elastane, so avoid a hot iron directly on the face of the cloth: heat is what
          damages elastane.
        </p>

        <h2>Between wearings</h2>
        <p>
          A shirt does not need washing every time it is worn. Air it on a hanger overnight and
          it will often be ready again. Trousers last considerably longer if you alternate them
          and give each pair a day to recover its shape.
        </p>

        <h2>Storage</h2>
        <p>
          Hang shirts on a proper hanger with shaped shoulders, not a wire one. Fold trousers
          along the crease over a bar. In humid months, leave air between garments in the wardrobe
          — cotton packed tight against a damp wall is how mildew starts.
        </p>
      </Prose>
    </>
  );
}
