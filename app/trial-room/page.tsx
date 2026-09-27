import type { Metadata } from "next";
import { Suspense } from "react";
import { loadCatalogue } from "@/lib/catalog";
import { TrialRoom } from "@/components/trial/TrialRoom";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata: Metadata = {
  title: "The trial room",
  description:
    "Enter your height, weight and usual jeans waist. The Nero Noren trial room scales a body to match and works out how much room each size leaves you.",
  alternates: { canonical: "/trial-room" },
};

export default async function TrialRoomPage() {
  const { products } = await loadCatalogue();

  return (
    <>
      <PageHeader
        eyebrow="Sizing"
        title="The trial room"
        lede="Tell us your height, your weight and the waist of the jeans you already wear. We scale a body to match and show you the piece on it, with the room each measurement leaves you."
      />

      <Suspense
        fallback={
          <p className="nn-wrap py-16 text-[var(--ink-soft)]">Opening the fitting room…</p>
        }
      >
        <TrialRoom products={products} />
      </Suspense>
    </>
  );
}
