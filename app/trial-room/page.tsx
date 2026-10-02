import type { Metadata } from "next";
import { Suspense } from "react";
import { loadCatalogue } from "@/lib/catalog";
import { TrialRoom } from "@/components/trial/TrialRoom";

export const metadata: Metadata = {
  title: "Trial room",
  description: "Find your size before you buy. We compare your body with the finished garment.",
};

export default async function TrialRoomRoute() {
  const { products } = await loadCatalogue();
  return (
    <Suspense fallback={null}>
      <TrialRoom catalogue={products} />
    </Suspense>
  );
}
