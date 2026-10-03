import type { Metadata } from "next";
import { loadCatalogue } from "@/lib/catalog";
import { razorpayReady } from "@/lib/env";
import { Checkout } from "@/components/checkout/Checkout";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your order.",
  robots: { index: false, follow: false },
};

export default async function CheckoutRoute() {
  const { products } = await loadCatalogue();
  return <Checkout catalogue={products} razorpayLive={razorpayReady()} />;
}
