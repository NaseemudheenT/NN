import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Plate } from "@/components/ui/Plate";

export const metadata: Metadata = {
  title: "The atelier",
  description: "How a Nero Noren piece is made — the cloth, the cut, the finishing.",
};

const STAGES = [
  {
    kind: "cloth" as const,
    head: "The cloth",
    body: "Long-staple cotton for the shirting, a mid-weight wool blend for the trousers. Chosen for how they behave after thirty washes, not for how they photograph on day one.",
  },
  {
    kind: "detail" as const,
    head: "The cut",
    body: "Drafted once, then corrected on a body. The golden sample is worn for a week before anything is cut in bulk, and what the week finds goes back into the pattern.",
  },
  {
    kind: "stone" as const,
    head: "The finishing",
    body: "Side seams run flat-felled, so there is nothing inside to rub. Buttons are sewn with a shank, which is the difference between a placket that lies down and one that gapes.",
  },
  {
    kind: "detail" as const,
    head: "What arrives",
    body: "A woven label, a foil-blocked hangtag, and a box that will survive the journey. The gold on those three is a finish on a physical object — the only place the house uses it.",
  },
];

export default function AtelierPage() {
  return (
    <>
      <PageHeader
        eyebrow="The atelier"
        title="Crafted in every detail"
        lede="European in design, made in India, and honest about both. Here is what happens between the cloth arriving and the box leaving."
      />

      <div className="band band--tight">
        <div className="wrap atl">
          {STAGES.map((s, i) => (
            <article key={s.head} className="atl__row reveal" style={{ "--reveal-delay": `${i * 60}ms` } as React.CSSProperties}>
              <Plate kind={s.kind} alt="" ratio="4 / 3" className="atl__img" sizes="(max-width: 860px) 100vw, 40vw" />
              <div className="atl__body">
                <p className="label label--soft tnum">0{i + 1}</p>
                <h2 className="d-h2">{s.head}</h2>
                <p className="lead">{s.body}</p>
              </div>
            </article>
          ))}

          <p className="atl__cta reveal">
            <Link href="/collection" className="btn btn--solid btn--lg">See the collection</Link>
          </p>
        </div>
      </div>
    </>
  );
}
