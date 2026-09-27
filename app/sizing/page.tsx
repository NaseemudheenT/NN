import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Prose } from "@/components/layout/Prose";

export const metadata: Metadata = {
  title: "Sizing and fit",
  description:
    "How Nero Noren sizes its shirts and trousers, how the trial room works out your size, and what to do if it is wrong.",
  alternates: { canonical: "/sizing" },
};

export default function SizingPage() {
  return (
    <>
      <PageHeader
        eyebrow="Sizing"
        title="How we size"
        lede="Shirts by chest, trousers by the waist of the jeans you already wear. And a trial room that shows its working."
      />
      <Prose>
        <h2>Shirts</h2>
        <p>
          Our shirt sizes are stated as the body they are cut to fit, not as the finished garment.
          A medium is cut to fit a chest of 38 to 40 inches; the shirt itself measures 110 cm
          around the chest, which leaves about nine centimetres of room. That difference is called
          ease, and it is what decides whether a shirt feels close, regular or easy.
        </p>
        <p>
          Every product page carries both numbers — the body it fits and the finished garment — so
          you can work it out yourself if you would rather.
        </p>

        <h2>Trousers</h2>
        <p>
          Trousers are sized by waist in inches, from 28 to 38, matching the jeans you already
          own. If your jeans are a 32, order a 32. We add about one and a half centimetres of
          wearing ease at the waistband, which is why they do not feel tight at your usual size.
        </p>

        <h2>The trial room</h2>
        <p>
          If you do not know your chest measurement, the{" "}
          <Link href="/trial-room">trial room</Link> will estimate it. It is not a lookup table:
          it treats the body as a cylinder of a given height and mass, which means girth scales
          with the square root of weight over height. Fitted against measured male anthropometry,
          that lands within about three centimetres across the normal range.
        </p>
        <p>
          It then compares that estimate against the finished measurements of the actual garment
          and reports the room you have at the chest, the waist and the hip. It also tells you
          which numbers it estimated and which you gave it, because a recommendation that hides
          its own confidence is not worth much.
        </p>
        <p>
          <strong>A tape measure beats it.</strong> If you know your chest, use the tables on the
          product page instead. If you know your jeans waist, tell the trial room — a measured
          number always wins over a modelled one.
        </p>

        <h2>If we get it wrong</h2>
        <p>
          Free size exchanges within seven days of delivery. Tell us what was wrong and where, and
          we will send the right size. We would rather learn that a piece runs small than have you
          keep something that does not fit.
        </p>

        <h2>Your measurements</h2>
        <p>
          Measurements you enter stay in your own browser. They are not sent to us unless you
          place an order, and even then we only receive the size you chose, never the numbers
          behind it. If you tick &ldquo;keep my measurements on this device&rdquo;, they are saved
          in that browser and nowhere else.
        </p>
      </Prose>
    </>
  );
}
