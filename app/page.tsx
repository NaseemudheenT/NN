import Link from "next/link";
import { Hero } from "@/components/home/Hero";
import { ShowroomExperience } from "@/components/home/ShowroomExperience";
import { CraftDetail } from "@/components/home/CraftDetail";
import { Generations } from "@/components/home/Generations";
import { ProductCard } from "@/components/shop/ProductCard";
import { ArrowRight } from "@/components/ui/icons";
import { loadCatalogue } from "@/lib/catalog";
import { clothColours, groupByCut } from "@/lib/catalog/group";

export const revalidate = 300;

export default async function Home() {
  const { products, source, missingEnv } = await loadCatalogue();
  const cuts = groupByCut(products);

  return (
    <>
      <Hero colours={clothColours(products)} />

      <ShowroomExperience />

      {/* ── the collection, as it stands on the floor ───────────── */}
      <section className="band feat" aria-labelledby="feat-h">
        <div className="wrap">
          <header className="feat__head reveal">
            <div>
              <p className="label label--soft">Collection 001 — The Foundations</p>
              <h2 id="feat-h" className="d-h2">The pieces everything else is built on</h2>
            </div>
            <Link href="/collection" className="ul-grow label feat__all">
              See all {products.length} pieces <ArrowRight size={15} />
            </Link>
          </header>

          <ul className="grid grid--4">
            {cuts.slice(0, 4).map(({ lead, siblings }, i) => (
              <li key={lead.handle} className="reveal" style={{ "--reveal-delay": `${i * 60}ms` } as React.CSSProperties}>
                <ProductCard product={lead} siblings={siblings} priority={i < 2} />
              </li>
            ))}
          </ul>

          {source === "seed" && missingEnv.length ? (
            <p className="small muted feat__notice">
              Showing the Collection 001 seed. Live prices and stock begin the moment{" "}
              {missingEnv.join(" and ")} {missingEnv.length > 1 ? "are" : "is"} set.
            </p>
          ) : null}
        </div>
      </section>

      <CraftDetail />
      <Generations />
    </>
  );
}
