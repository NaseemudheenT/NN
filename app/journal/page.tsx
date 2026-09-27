import type { Metadata } from "next";
import { Awaiting } from "@/components/layout/Awaiting";

export const metadata: Metadata = {
  title: "Journal",
  description: "The Nero Noren journal. The first issue has not been published yet.",
  alternates: { canonical: "/journal" },
};

export default function JournalPage() {
  return (
    <Awaiting
      label="Journal"
      title="Nothing published yet"
      body="The journal is where the making gets written down — the cloth, the corrections, the reasons a piece was cut from the range. There is no first issue yet, and a journal padded out to look busy is worse than an empty one."
      detail={
        <>
          <h2 className="nn-awaiting__detailtitle">What it will carry</h2>
          <dl className="nn-awaiting__list">
            <div>
              <dt>The cloth</dt>
              <dd>Where a fabric came from, how it behaves, and why it was chosen over the one we did not use.</dd>
            </div>
            <div>
              <dt>The corrections</dt>
              <dd>
                What the golden sample got wrong and what changed. The parts of making clothes that
                most brands do not show.
              </dd>
            </div>
            <div>
              <dt>Dressing</dt>
              <dd>How to wear eight pieces for a year without repeating yourself.</dd>
            </div>
          </dl>
        </>
      }
    />
  );
}
