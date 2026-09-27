import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { Prose } from "@/components/layout/Prose";

export const metadata: Metadata = {
  title: "About Nero Noren",
  description:
    "NERO NOREN Private Limited: European-inspired menswear, cut for Indian life, made and sold online first.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="The house"
        title="European in design, honest about origin"
        lede="Nero Noren is an online-first menswear house. The design language is European. The clothes are made in India, for Indian life, and we say so."
      />
      <Prose>
        <h2>What we are</h2>
        <p>
          Nero Noren Private Limited makes a small, deliberate range of menswear and sells it
          directly. There is no shop to walk into yet, which is why we built one you can walk
          through — the showroom on this site is the shop, and it is lit by the time of day where
          you are standing.
        </p>
        <p>
          The founder is Naseemudheen. The first range, Collection 001, is called The Foundations
          because that is what it is: the shirts and trousers a wardrobe is built on, cut so that
          every piece meets every other piece.
        </p>

        <h2>Fabric, fit and finish first</h2>
        <p>
          The cloth is chosen before the colour, and the pattern is corrected before the range is
          signed off. A shirt that fits badly in a beautiful fabric is still a shirt that fits
          badly. We would rather cut a piece from the range than ship one we are not sure of.
        </p>

        <h2>Fair prices, no permanent sale</h2>
        <p>
          One price, held. A brand that discounts continuously has told you its first price was
          not real. We would rather be honest about what a piece costs and stand behind it.
        </p>

        <h2>Honest about origin</h2>
        <p>
          The design references are European — the cut of the Oxford, the rise of the trouser,
          the restraint. The garments are made in India. We will not imply otherwise, use an
          Italian-sounding phrase we have not earned, or print a city on a label that nothing
          has ever been near.
        </p>

        <h2>Details</h2>
        <p>
          A woven label at the back neck. NN engraved buttons. A pressed crease that holds. Single
          needle side seams on the shirts. These cost more to make and they are the difference
          between a garment and a product.
        </p>

        <h2>The company</h2>
        <dl>
          <dt>Registered name</dt>
          <dd>Nero Noren Private Limited</dd>
          <dt>Founder</dt>
          <dd>Naseemudheen</dd>
          <dt>Trade</dt>
          <dd>Online-first menswear, delivered across India</dd>
        </dl>
      </Prose>
    </>
  );
}
