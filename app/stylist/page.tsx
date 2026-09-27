import type { Metadata } from "next";
import { loadCatalogue } from "@/lib/catalog";
import { StylistChat } from "@/components/stylist/StylistChat";
import { StylistHero } from "@/components/stylist/StylistHero";
import { PageHeader } from "@/components/layout/PageHeader";
import { anthropicReady } from "@/lib/env";

export const metadata: Metadata = {
  title: "Your NN stylist",
  description:
    "Ask the Nero Noren stylist about an occasion, a pairing, a fabric or a size. It knows Collection 001 and nothing else.",
  alternates: { canonical: "/stylist" },
};

export default async function StylistPage() {
  const { products } = await loadCatalogue();
  const live = anthropicReady();

  return (
    <>
      <PageHeader
        eyebrow="The stylist"
        title="Your NN stylist"
        lede="Ask about an occasion, a pairing, a fabric or a size. The stylist only knows Collection 001, so it will never send you after something we do not make."
      />

      <section className="nn-wrap pt-12">
        <StylistHero />
      </section>

      <section className="nn-wrap py-16">
        <div className="grid gap-12 lg:grid-cols-[1fr_minmax(0,18rem)]">
          <StylistChat products={products} />

          <aside>
            <h2 className="nn-eyebrow">What it will and will not do</h2>
            <ul className="mt-5 flex list-none flex-col gap-4 p-0 text-fine text-[var(--ink-soft)]">
              <li>
                It recommends only from the {products.length} pieces in Collection 001. It has
                not been shown anything else, so it cannot invent a product.
              </li>
              <li>
                It will not offer a discount, quote a delivery date, or claim an origin. Those
                are not its to give.
              </li>
              <li>
                For size it gives a reading and then sends you to the trial room, which
                computes the answer from your measurements against the finished garment.
              </li>
              <li>
                Your conversation is not stored. It is sent to answer your question and then
                it is gone.
              </li>
            </ul>

            {!live ? (
              <p
                className="mt-8 border p-4 text-[0.72rem] text-[var(--ink-soft)]"
                style={{ borderColor: "var(--accent)" }}
              >
                The stylist is answering from the NN style guide. Set{" "}
                <code className="text-[var(--ink)]">ANTHROPIC_API_KEY</code> in{" "}
                <code className="text-[var(--ink)]">.env.local</code> to bring the full stylist
                online.
              </p>
            ) : null}
          </aside>
        </div>
      </section>
    </>
  );
}
