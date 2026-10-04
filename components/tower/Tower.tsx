"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { Overture } from "./Overture";
import { Elevation } from "./Elevation";
import { FloorCard } from "./FloorCard";
import { Lift } from "./Lift";
import { Drawer } from "./Drawer";
import { BY_HEIGHT, levelById, type Hotspot, type Level } from "@/lib/tower/floors";
import { useStylist } from "@/components/stylist/StylistProvider";
import { useBag } from "@/lib/bag/BagProvider";
import { formatMinor } from "@/lib/money";
import type { Product } from "@/lib/catalog/types";

/**
 * NN TOWER.
 *
 * The whole website is one building. You arrive on the street, you go in,
 * and the lift on the right reaches all nine levels. The separate routes
 * still exist underneath — links and search engines need URLs — but no
 * customer has to touch one to shop.
 */
export function Tower({ products }: { products: Product[] }) {
  const router = useRouter();
  const [inside, setInside] = useState(false);
  const [active, setActive] = useState<Level>(() => levelById("gallery"));
  const [drawer, setDrawer] = useState<{ product?: Product; products?: Product[]; title?: string } | null>(null);

  const { open: openStylist } = useStylist();
  const { openBag } = useBag();

  const byHandle = useMemo(() => new Map(products.map((p) => [p.handle, p])), [products]);

  /* Prices are read from the catalogue at render, and written down nowhere. */
  const price = useCallback(
    (handle: string) => {
      const p = byHandle.get(handle);
      return p ? formatMinor(p.priceMinor, p.currency) : null;
    },
    [byHandle],
  );

  const onLevel = useCallback((l: Level) => {
    if (l.floor === 0) {
      setInside(false);
      return;
    }
    setActive(l);
  }, []);

  const onHotspot = useCallback(
    (spot: Hotspot, level: Level) => {
      switch (spot.action) {
        case "PRODUCT": {
          const p = spot.handle ? byHandle.get(spot.handle) : undefined;
          if (p) setDrawer({ product: p });
          break;
        }
        case "COLLECTION":
          setDrawer({ products, title: level.title });
          break;
        case "STYLIST":
          openStylist();
          break;
        case "BAG":
          openBag();
          break;
        case "FIT":
          router.push("/trial-room");
          break;
        case "ENTER":
        case "READ":
          if (spot.href) router.push(spot.href);
          break;
      }
    },
    [byHandle, products, openStylist, openBag, router],
  );

  return (
    /* `reducedMotion="user"` is the one switch that covers the whole
       building: for a visitor who has asked their system for less motion,
       Framer drops every transform and layout animation in here — the lift
       arriving, the push on the plates, the card rising — and keeps the
       opacity cross-fades, which is what the guidance actually asks for.
       Gating each component by hand missed some; this cannot. */
    <MotionConfig reducedMotion="user">
    <div className="tower" data-inside={inside || undefined}>
      <AnimatePresence mode="wait">
        {!inside ? (
          <motion.div
            key="outside"
            className="tower__view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          >
            <Overture
              onEnter={() => {
                setInside(true);
                setActive(levelById("gallery"));
              }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="inside"
            className="tower__view tower__view--in"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <Elevation active={active} onLevel={onLevel} />

            <AnimatePresence mode="wait">
              <FloorCard key={active.id} level={active} price={price} onHotspot={onHotspot} />
            </AnimatePresence>

            <Lift active={active} onLevel={onLevel} />

            <button
              type="button"
              className="tower__out label"
              onClick={() => setInside(false)}
            >
              ← The street
            </button>

            <nav className="tower__routes" aria-label="All levels">
              {BY_HEIGHT.map((l) => (
                <a key={l.id} href={l.route}>
                  {l.title}
                </a>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <Drawer
        product={drawer?.product}
        products={drawer?.products}
        title={drawer?.title}
        onClose={() => setDrawer(null)}
      />
    </div>
    </MotionConfig>
  );
}
