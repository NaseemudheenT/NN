import type { Metadata } from "next";
import { PageHeader, Prose } from "@/components/layout/PageHeader";

export const metadata: Metadata = {
  title: "Terms",
  description: "The terms on which Nero Noren sells.",
};

export default function TermsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Terms"
        title={["The terms", "of sale"]}
        lede="Short, and in plain language."
      />
      <Prose>
        <h2>Who you are buying from</h2>
        <p>
          Nero Noren sells the pieces listed on this site. These terms apply to every order placed
          here.
        </p>

        <h2>Orders</h2>
        <p>
          Placing an order is an offer to buy. The contract is formed when we confirm dispatch. If a
          piece turns out to be unavailable after you have paid, we refund it in full.
        </p>

        <h2>Prices</h2>
        <p>
          Prices are shown in the currency of the store and include applicable taxes unless stated
          otherwise at checkout. Delivery is calculated and shown before payment. If a price is
          listed in obvious error, we will tell you before dispatch and you may cancel.
        </p>

        <h2>Colour and description</h2>
        <p>
          Screens differ. We describe cloth, weight, colourway and cut as accurately as we can, and
          the colour you see may vary slightly from the piece. That variation alone is not a fault,
          but it is a perfectly good reason to return something under the returns policy.
        </p>

        <h2>Returns</h2>
        <p>
          The <a href="/delivery">delivery and returns</a> page forms part of these terms. Your
          statutory rights as a consumer are not affected by anything written here.
        </p>

        <h2>The stylist</h2>
        <p>
          The stylist offers suggestions about the collection. It is advice, not a guarantee of fit
          or suitability, and it does not change your rights or ours.
        </p>

        <h2>Using this site</h2>
        <p>
          The designs, photographs, text and the Nero Noren marks on this site belong to the house.
          Please do not copy them for commercial use.
        </p>

        <h2>Law</h2>
        <p>These terms are governed by Indian law.</p>
      </Prose>
    </>
  );
}
