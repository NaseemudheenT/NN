import { getCatalog } from "@/lib/shopify";
import { HomeJourney } from "@/components/home/HomeJourney";

export default async function Page() {
  const catalog = await getCatalog();
  return <HomeJourney products={catalog.products} configured={catalog.configured && !catalog.error} />;
}
