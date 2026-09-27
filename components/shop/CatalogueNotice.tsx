import type { CatalogueResult } from "@/lib/catalog/types";

/**
 * An honest notice when the shop is not yet connected.
 *
 * It says exactly which environment variable is missing, because "something
 * went wrong" costs an hour and "SHOPIFY_STOREFRONT_TOKEN is not set" costs a
 * minute. It disappears on its own the moment Shopify answers.
 */
export function CatalogueNotice({ catalogue }: { catalogue: CatalogueResult }) {
  if (catalogue.source === "shopify") return null;

  const envVars = catalogue.missingEnv.filter((v) => !v.startsWith("("));
  const notes = catalogue.missingEnv.filter((v) => v.startsWith("("));

  return (
    <aside
      className="nn-wrap"
      aria-label="Catalogue status"
    >
      <div className="my-8 border p-6" style={{ borderColor: "var(--accent)", background: "var(--surface)" }}>
        <p className="nn-eyebrow" style={{ color: "var(--accent)" }}>
          Reference catalogue
        </p>
        <p className="mt-3 max-w-[70ch] text-fine text-[var(--ink-soft)]">
          The showroom is running on the Collection 001 reference catalogue, so everything on
          the site works — but prices and stock are not yet live.
          {envVars.length ? (
            <>
              {" "}
              Set{" "}
              {envVars.map((v, i) => (
                <span key={v}>
                  {i > 0 ? (i === envVars.length - 1 ? " and " : ", ") : ""}
                  <code className="text-[var(--ink)]">{v}</code>
                </span>
              ))}{" "}
              in <code className="text-[var(--ink)]">.env.local</code> to serve live data from
              Shopify.
            </>
          ) : null}
          {notes.length ? <> {notes.join(" ")}</> : null}
        </p>
      </div>
    </aside>
  );
}
