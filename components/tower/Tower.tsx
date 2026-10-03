"use client";

import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Cutaway } from "./Cutaway";
import { Elevator } from "./Elevator";
import { Facade } from "./Facade";
import { Drawer } from "./Drawer";
import { INTERIOR, type Hotspot, type Level } from "@/lib/tower/floors";
import { useStylist } from "@/components/stylist/StylistProvider";
import { useBag } from "@/lib/bag/BagProvider";
import { formatMinor } from "@/lib/money";
import type { Product } from "@/lib/catalog/types";

const VISITED = "nn-tower-visited";

/**
 * NN TOWER.
 *
 * The whole website is one building. The street is the front door, eight
 * floors are the eight things a customer can do, and the lift on the right
 * goes to all of them.
 *
 * ── the two surfaces ─────────────────────────────────────────────────
 * The BUILDING carries atmosphere, orientation and desire. The DRAWERS
 * carry anything that has to be read or decided — a size, a fabric, a
 * price, a payment. Keeping those apart is the whole design: a beautiful
 * perspective is the wrong place to pick a collar size, and a crisp panel
 * of type is the wrong place to fall in love with a room.
 */
export function Tower({ products }: { products: Product[] }) {
  const [inside, setInside] = useState(false);
  const [floor, setFloor] = useState(1);
  const [drawer, setDrawer] = useState<{ product?: Product; products?: Product[]; title?: string } | null>(null);

  const { open: openStylist } = useStylist();
  const { openBag } = useBag();

  const byHandle = useMemo(() => new Map(products.map((p) => [p.handle, p])), [products]);

  /* Prices come from the catalogue, every time, and nowhere else. */
  const price = useCallback(
    (handle: string) => {
      const p = byHandle.get(handle);
      return p ? formatMinor(p.priceMinor, p.currency) : null;
    },
    [byHandle],
  );

  const enter = useCallback(() => {
    setInside(true);
    setFloor(1);
    try { window.localStorage.setItem(VISITED, "yes"); } catch {}
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
          window.location.href = "/trial-room";
          break;
        case "ENTER":
        case "READ":
          if (spot.href) window.location.href = spot.href;
          break;
      }
    },
    [byHandle, products, openStylist, openBag],
  );

  const active = INTERIOR.find((l) => l.floor === floor) ?? INTERIOR[INTERIOR.length - 1];

  return (
    <div className="tower" data-inside={inside || undefined}>
      <AnimatePresence mode="wait">
        {!inside ? (
          <motion.div
            key="street"
            className="tower__view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.07 }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <Facade onEnter={enter} />
          </motion.div>
        ) : (
          <motion.div
            key="tower"
            className="tower__view"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <Cutaway activeFloor={floor} onHotspot={onHotspot} price={price} />

            <Elevator
              activeFloor={floor}
              onFloor={(l) => setFloor(l.floor)}
              onStreet={() => setInside(false)}
            />

            {/* the caption: which floor you are on, and the one thing to do on it */}
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                className="plate glass"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <p className="label label--soft">{active.code}</p>
                <h1 className="d-h3 plate__title">{active.title}</h1>
                <p className="small muted plate__note">{active.description}</p>
              </motion.div>
            </AnimatePresence>

            <button type="button" className="tower__out label" onClick={() => setInside(false)}>
              ← The street
            </button>
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
  );
}
