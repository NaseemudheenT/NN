import type { Metadata } from "next";
import { PageHeader, Section } from "@/components/layout/PageHeader";
import { BagPage } from "@/components/shop/BagPage";

export const metadata: Metadata = {
  title: "Bag",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <>
      <PageHeader eyebrow="Bag" title=
{["What you have", "chosen"]} />
      <Section className="pb-28 md:pb-40">
        <BagPage />
      </Section>
    </>
  );
}
