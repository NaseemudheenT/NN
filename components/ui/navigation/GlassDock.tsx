"use client";

/**
 * The dock.
 *
 * NN's three tools — the stylist, the trial room, the bag — reachable from
 * every page without taking space in the navigation, which belongs to the
 * collection.
 *
 * On a phone it sits along the bottom, inside the safe area, where a thumb
 * already is. On a desktop it floats at the lower right, out of the reading
 * column. It hides itself on the pages it would be redundant on: there is no
 * point offering the trial room from inside the trial room.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { SPRING } from "@/lib/motion";
import { useBag } from "@/components/shop/BagProvider";
import { useMagnetic } from "@/components/motion/useMagnetic";

interface DockItem {
  href?: string;
  onClick?: () => void;
  label: string;
  icon: React.ReactNode;
  count?: number;
  /** Routes where this item is redundant. */
  hideOn?: string[];
}

function DockButton({ item }: { item: DockItem }) {
  const magnetic = useMagnetic(4);
  const shared = {
    className: "nn-dock__item",
    onPointerMove: magnetic.onPointerMove,
    onPointerLeave: magnetic.onPointerLeave,
    style: { x: magnetic.x, y: magnetic.y },
    whileTap: { scale: 0.93 },
    transition: SPRING.tap,
  };

  const body = (
    <>
      <span className="nn-dock__icon" aria-hidden="true">
        {item.icon}
      </span>
      <span className="nn-dock__label">{item.label}</span>
      {item.count ? <span className="nn-dock__count">{item.count}</span> : null}
    </>
  );

  if (item.href) {
    return (
      <motion.div {...shared} style={shared.style}>
        <Link href={item.href} aria-label={item.label} className="nn-dock__link">
          {body}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.button type="button" aria-label={item.label} onClick={item.onClick} {...shared}>
      {body}
    </motion.button>
  );
}

export function GlassDock() {
  const pathname = usePathname();
  const { count, openBag } = useBag();

  const items: DockItem[] = [
    {
      href: "/stylist",
      label: "Stylist",
      hideOn: ["/stylist"],
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
          <path d="M12 3.4l1.7 4.6 4.6 1.7-4.6 1.7L12 16l-1.7-4.6L5.7 9.7l4.6-1.7z" />
          <path d="M18.4 15.6l.7 1.9 1.9.7-1.9.7-.7 1.9-.7-1.9-1.9-.7 1.9-.7z" />
        </svg>
      ),
    },
    {
      href: "/trial-room",
      label: "Trial room",
      hideOn: ["/trial-room"],
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
          <path d="M3.6 14.4L14.4 3.6l6 6L9.6 20.4z" />
          <path d="M7.2 10.8l2 2M10.4 7.6l2 2M13.6 4.4l2 2" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      onClick: openBag,
      label: "Bag",
      count,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
          <path d="M5.5 8h13l-1.1 11.6H6.6z" />
          <path d="M9 8V6.4a3 3 0 0 1 6 0V8" strokeLinecap="round" />
        </svg>
      ),
    },
  ];

  const visible = items.filter((item) => !item.hideOn?.some((route) => pathname.startsWith(route)));
  if (!visible.length) return null;

  // The entrance is a CSS animation on transform only. It must never animate
  // opacity from 0: a frozen animation would leave the dock — and with it the
  // bag — invisible and unreachable.
  return (
    <div className="nn-dock glass glass--pane glass--dispersive" role="group" aria-label="Nero Noren tools">
      {visible.map((item) => (
        <DockButton key={item.label} item={item} />
      ))}
    </div>
  );
}
