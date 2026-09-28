"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Monogram } from "@/components/brand/Monogram";
import { GlassButton, GlassPanel } from "@/components/ui/glass/Glass";
import { Reveal } from "@/components/motion/Reveal";
import { PHASES } from "@/lib/tokens";
import { useShowroom } from "@/components/layout/ShowroomProvider";
import type { Catalog } from "@/lib/types";

interface Status {
  label: string;
  connected: boolean;
  detail: string;
  vars: string[];
}

export function Console({
  email,
  catalog,
  statuses,
}: {
  email: string;
  catalog: Catalog;
  statuses: Status[];
}) {
  const router = useRouter();
  const { setOverride, phase } = useShowroom();
  const [signingOut, setSigningOut] = useState(false);

  const live = catalog.configured && !catalog.error;
  const priced = catalog.products.filter((p) => p.price).length;
  const withImages = catalog.products.filter((p) => p.images.length > 0).length;
  const withChart = catalog.products.filter((p) => p.sizeChart).length;

  async function signOut() {
    setSigningOut(true);
    await fetch("/api/owner/session", { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="relative z-10 px-5 pb-28 pt-28 sm:px-8 md:pt-36">
      <div className="mx-auto max-w-[84rem]">
        <header className="flex flex-wrap items-end justify-between gap-6 border-b border-line pb-8">
          <div>
            <div className="flex items-center gap-3">
              <Monogram className="h-5 w-auto text-ink" />
              <p className="nn-meta text-ink-faint">Operations</p>
            </div>
            <h1 className="nn-display mt-4 text-[clamp(2rem,5vw,3.2rem)] text-ink">
              The back office
            </h1>
            <p className="nn-meta mt-3 text-ink-faint">Signed in as {email}</p>
          </div>
          <GlassButton variant="quiet" size="sm" onClick={signOut} disabled={signingOut}>
            {signingOut ? "Signing out…" : "Sign out"}
          </GlassButton>
        </header>

        {/* ---------------- catalogue ---------------- */}
        <section className="mt-12">
          <h2 className="nn-label text-ink">Catalogue</h2>
          <dl className="mt-5 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {[
              { k: "Pieces published", v: String(catalog.products.length) },
              { k: "With a price", v: `${priced} of ${catalog.products.length}` },
              { k: "With photography", v: `${withImages} of ${catalog.products.length}` },
              { k: "With a size chart", v: `${withChart} of ${catalog.products.length}` },
            ].map((s, i) => (
              <Reveal key={s.k} delay={i * 0.05} className="bg-bg px-6 py-7">
                <dt className="nn-meta text-ink-faint">{s.k}</dt>
                <dd className="mt-2.5 font-display text-[2rem] font-light leading-none text-ink">
                  {s.v}
                </dd>
              </Reveal>
            ))}
          </dl>

          <GlassPanel className="mt-4 p-5" live={false}>
            <p className="nn-body text-[0.875rem] text-ink-soft">
              {live ? (
                <>
                  The catalogue is live from Shopify. Pieces, prices, stock and photography are
                  edited there and appear here and on the storefront within two minutes.
                </>
              ) : catalog.error ? (
                <>
                  Shopify is configured but did not respond:{" "}
                  <span className="text-ink">{catalog.error}</span>. The storefront is showing
                  Collection 001 without prices rather than showing stale or invented numbers.
                </>
              ) : (
                <>
                  Shopify is not connected, so the storefront shows Collection 001 as display forms
                  with no price and no stock. Publishing happens in Shopify — this console reads it,
                  it does not duplicate it.
                </>
              )}
            </p>
          </GlassPanel>

          {catalog.products.length > 0 && (
            <div className="mt-6 overflow-x-auto border border-line">
              <table className="w-full min-w-[46rem] border-collapse">
                <thead>
                  <tr className="border-b border-line">
                    {["Piece", "Colour", "Cloth", "Price", "Sizes", "Chart"].map((h) => (
                      <th key={h} className="nn-meta px-4 py-3 text-left text-ink-faint">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {catalog.products.map((p) => (
                    <tr key={p.id} className="border-b border-line-soft last:border-0">
                      <td className="px-4 py-3">
                        <Link
                          href={`/product/${p.handle}`}
                          className="font-display text-lg text-ink hover:text-accent"
                        >
                          {p.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-2">
                          <span
                            className="h-3 w-3 rounded-full border border-line"
                            style={{ background: p.swatch }}
                          />
                          <span className="nn-body text-[0.8rem] text-ink-soft">{p.colour || "—"}</span>
                        </span>
                      </td>
                      <td className="nn-body px-4 py-3 text-[0.8rem] text-ink-soft">
                        {p.fabric || "—"}
                      </td>
                      <td className="nn-label px-4 py-3 text-ink">
                        {p.price ? `${p.price.currency} ${p.price.amount}` : "—"}
                      </td>
                      <td className="nn-body px-4 py-3 text-[0.8rem] text-ink-soft">
                        {p.sizes.length || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`nn-meta rounded-full px-2.5 py-1 ${
                            p.sizeChart ? "bg-ink text-bg" : "border border-line text-ink-faint"
                          }`}
                        >
                          {p.sizeChart ? "Yes" : "No"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ---------------- services ---------------- */}
        <section className="mt-16">
          <h2 className="nn-label text-ink">Services</h2>
          <ul className="mt-5 grid gap-px border border-line bg-line sm:grid-cols-2">
            {statuses.map((s, i) => (
              <Reveal key={s.label} as="li" delay={i * 0.05} className="bg-bg p-6">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-display text-xl font-light text-ink">{s.label}</h3>
                  <span
                    className={`nn-meta rounded-full px-3 py-1.5 ${
                      s.connected ? "bg-ink text-bg" : "border border-line text-ink-faint"
                    }`}
                  >
                    {s.connected ? "Connected" : "Not connected"}
                  </span>
                </div>
                <p className="nn-body mt-3 text-[0.85rem] text-ink-soft">{s.detail}</p>
                {!s.connected && (
                  <p className="nn-meta mt-3 text-ink-faint">Needs {s.vars.join(", ")}</p>
                )}
              </Reveal>
            ))}
          </ul>
        </section>

        {/* ---------------- showroom ---------------- */}
        <section className="mt-16">
          <h2 className="nn-label text-ink">Showroom</h2>
          <GlassPanel className="mt-5 p-6">
            <p className="nn-body text-[0.875rem] text-ink-soft">
              The showroom follows each visitor&apos;s own clock. Preview any hour here — this
              changes only what you see, not what visitors see.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setOverride(null)}
                className="nn-label rounded-sm border border-line px-4 py-2.5 text-ink-soft transition-colors hover:border-ink hover:text-ink"
              >
                Follow the clock
              </button>
              {PHASES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setOverride(p)}
                  className={`nn-label rounded-sm border px-4 py-2.5 capitalize transition-colors ${
                    phase === p ? "border-accent text-accent" : "border-line text-ink-soft hover:text-ink"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </GlassPanel>
        </section>

        {/* ---------------- honesty note ---------------- */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="nn-meta mt-14 max-w-3xl leading-relaxed text-ink-faint"
        >
          This console reports only what the connected services actually return. Revenue, orders and
          conversion appear here once Shopify and Razorpay are connected and have real data — no
          placeholder figures are ever shown.
        </motion.p>
      </div>
    </div>
  );
}
