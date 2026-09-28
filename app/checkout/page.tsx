import type { Metadata } from "next";
import { PageHeader, Section } from "@/components/layout/PageHeader";
import { Checkout } from "@/components/shop/Checkout";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <>
      <PageHeader eyebrow="Checkout" title={["Where it", "should go"]} />
      <Section className="pb-28 md:pb-40">
        <Checkout />
      </Section>
    </>
  );
}
