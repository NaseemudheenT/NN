import type { Metadata } from "next";
import { PageHeader, Section } from "@/components/layout/PageHeader";
import { StylistPanel } from "@/components/ai/StylistPanel";

export const metadata: Metadata = {
  title: "Stylist",
  description:
    "The Nero Noren stylist answers on occasion, pairing, fabric and fit — and only ever points at pieces that exist in the collection.",
};

export default function StylistPage() {
  return (
    <>
      <PageHeader
        eyebrow="Stylist"
        title={["At the counter"]}
        lede="Someone who knows Collection 001 and nothing else, which is exactly why the advice is useful. Ask about an occasion, a pairing, a cloth, or how a piece is cut."
      />
      <Section className="pb-28 md:pb-40">
        <div className="nn-glass h-[34rem] overflow-hidden rounded-md md:h-[40rem]">
          <StylistPanel />
        </div>
        <p className="nn-meta mt-5 max-w-2xl leading-relaxed text-ink-faint">
          The stylist is given the live catalogue with each question and may recommend only what is
          in it. It will not invent a piece, a price, a discount or a delivery promise — if it does
          not know, it says so.
        </p>
      </Section>
    </>
  );
}
