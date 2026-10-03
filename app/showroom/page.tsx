import type { Metadata } from "next";
import Link from "next/link";
import { Showroom } from "@/components/showroom/Showroom";
import { loadCatalogue } from "@/lib/catalog";
import { clothColours } from "@/lib/catalog/group";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "The showroom",
  description: "Walk the Nero Noren hall. The light is the light where you are standing.",
};

export default async function ShowroomRoute() {
  const { products } = await loadCatalogue();

  return (
    <section className="hall nn-room">
      <Showroom colours={clothColours(products)} />
      <div className="hero__veil" aria-hidden />
      <div className="wrap hall__in">
        <p className="label label--wide">The showroom</p>
        <h1 className="d-h1">A hall, lit by your own hour</h1>
        <p className="lead hall__lead">
          Nothing here is a theme. The sun is where the sun is where you are standing, the weather
          is your weather, and the lamps come up when it gets dark outside — the same reason a shop
          turns its lights on.
        </p>
        <div className="hall__acts">
          <Link href="/collection" className="btn btn--solid btn--lg">See the collection</Link>
          <Link href="/trial-room" className="btn btn--glass btn--lg">Enter the trial room</Link>
        </div>
      </div>
    </section>
  );
}
