import type { Metadata } from "next";
import { loadCatalogue } from "@/lib/catalog";
import { razorpayReady } from "@/lib/env";
import { Checkout } from "@/components/checkout/Checkout";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your Nero Noren order.",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const { products } = await loadCatalogue();
  return (
    <>
      <PageHeader
        eyebrow="Checkout"
        title="Almost there"
        lede="Your details, then payment through Razorpay. Nothing is charged until you complete it."
      />
      <Checkout products={products} razorpayLive={razorpayReady()} />
    </>
  );
}
