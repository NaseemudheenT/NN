import type { Metadata } from "next";
import { getCatalog } from "@/lib/shopify";
import { PageHeader, Section } from "@/components/layout/PageHeader";
import { TrialRoom } from "@/components/trial-room/TrialRoom";

export const metadata: Metadata = {
  title: "Trial room",
  description:
    "Three measurements, read against the real size chart. The trial room names your size and says where the garment will sit close and where it will be easy.",
};

export default async function TrialRoomPage(props: PageProps<"/trial-room">) {
  const [catalog, params] = await Promise.all([getCatalog(), props.searchParams]);
  const piece = typeof params.piece === "string" ? params.piece : undefined;

  return (
    <>
      <PageHeader
        eyebrow="Trial room"
        title={["Step behind", "the curtain"]}
        lede="Height, weight, and the waist of trousers you already wear. That is enough to estimate your measurements and read them against the size chart — and to say where a piece will sit close and where it will be easy."
      />
      <Section className="pb-28 md:pb-40">
        <TrialRoom products={catalog.products} initialHandle={piece} />
      </Section>
    </>
  );
}
