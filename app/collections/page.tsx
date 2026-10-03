import { redirect } from "next/navigation";

/** The old plural URL. Kept so existing links and search results still land. */
export default function CollectionsRedirect() {
  redirect("/collection");
}
