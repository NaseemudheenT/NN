"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Monogram } from "@/components/brand/Monogram";
import {
  ArrowRight, Bag as BagIcon, Close, Hanger, Menu, Ruler, Search as SearchIcon,
  Shield, Sound, Sparkle, Truck, User,
} from "@/components/ui/icons";
import { useBag } from "@/lib/bag/BagProvider";
import { useSearch } from "@/components/shell/SearchProvider";
import { useStylist } from "@/components/stylist/StylistProvider";
import { useSoundscape } from "@/components/shell/SoundscapeProvider";
import { useEscape, useFocusTrap, useLockScroll } from "@/lib/ui/overlay";

/**
 * The floating panel.
 *
 * Everything the customer can do on this site reaches them through this one
 * object. It is a liquid-glass dock resting over the showroom, and it opens
 * into the full index of the shop — so there is never a feature that lives
 * only on some page you have to already know about.
 *
 * It floats rather than docking to an edge because the hall is the page: a
 * bar welded to the bottom of the viewport cuts the room off, and a panel
 * hovering in front of it reads as something you are holding while you walk
 * around.
 *
 * ── on the one visible control in here ───────────────────────────────
 * The sound toggle. Everything else about the room's atmosphere is
 * automatic and silent — the light follows the visitor's own hour and
 * weather and nothing announces it, which is the brief. Sound cannot work
 * that way: no browser will start audio without a gesture, so the choice is
 * a discreet control or no sound at all. It sits in here with the rest.
 */

const SHOP = [
  { href: "/men", label: "Men", note: "Shirts, trousers, outerwear" },
  { href: "/boys", label: "Boys", note: "The same cut, scaled" },
  { href: "/collection", label: "The Collection", note: "Collection 001 — The Foundations" },
  { href: "/collection?category=outerwear", label: "Outerwear", note: "Coats and overcoats" },
  { href: "/collection?category=loafers", label: "Loafers", note: "Leather, hand-finished" },
];

const ROOMS = [
  { href: "/showroom", label: "The showroom", note: "Walk the hall", Icon: ArrowRight },
  { href: "/atelier", label: "The atelier", note: "How it is made", Icon: Sparkle },
  { href: "/trial-room", label: "Trial room", note: "Find your size before you buy", Icon: Hanger },
  { href: "/stylist", label: "AI stylist", note: "Styling, from the real catalogue", Icon: Sparkle },
];

const HELP = [
  { href: "/sizing", label: "Size guide", Icon: Ruler },
  { href: "/delivery", label: "Delivery & returns", Icon: Truck },
  { href: "/care", label: "Garment care", Icon: Shield },
  { href: "/about", label: "About Nero Noren", Icon: ArrowRight },
];

export function FloatingPanel() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { count, openBag } = useBag();
  const { open: openSearch } = useSearch();
  const { open: openStylist } = useStylist();
  const sound = useSoundscape();

  const ref = useFocusTrap<HTMLDivElement>(open);
  useEscape(open, () => setOpen(false));
  useLockScroll(open);

  /* Navigating is finishing with the panel. */
  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      <div className="dock" data-open={open || undefined}>
        {/* ── the dock: five things, always within thumb reach ──── */}
        <div className="dock__bar glass glass--refract">
          <button
            type="button"
            className="dock__btn"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="nn-panel"
            aria-label={open ? "Close the menu" : "Open the menu"}
          >
            {open ? <Close size={19} /> : <Menu size={19} />}
            <span className="dock__label">{open ? "Close" : "Menu"}</span>
          </button>

          <button type="button" className="dock__btn" onClick={openSearch} aria-label="Search the collection">
            <SearchIcon size={19} />
            <span className="dock__label">Search</span>
          </button>

          {/* the stylist, as the NN mark itself */}
          <button type="button" className="dock__orb" onClick={openStylist} aria-label="Ask the Nero Noren stylist">
            <span className="dock__orb-ring" aria-hidden />
            <Monogram size={17} />
          </button>

          <Link href="/trial-room" className="dock__btn" aria-label="Trial room">
            <Hanger size={19} />
            <span className="dock__label">Trial</span>
          </Link>

          <button type="button" className="dock__btn" onClick={openBag} aria-label={`Bag, ${count} items`}>
            <span className="dock__bag">
              <BagIcon size={19} />
              {count > 0 ? <span className="dock__count tnum">{count}</span> : null}
            </span>
            <span className="dock__label">Bag</span>
          </button>
        </div>

        {/* ── the panel the dock opens into ────────────────────── */}
        <div
          id="nn-panel"
          ref={ref}
          className="panel glass glass--refract"
          role="dialog"
          aria-modal={open}
          aria-label="Everything at Nero Noren"
          hidden={!open}
          tabIndex={-1}
        >
          <div className="panel__scroll">
            <div className="panel__grid">
              <section className="panel__col">
                <h2 className="label label--soft panel__head">Shop</h2>
                <ul className="panel__list">
                  {SHOP.map((s) => (
                    <li key={s.href}>
                      <Link href={s.href} className="panel__row">
                        <span className="panel__row-main">{s.label}</span>
                        <span className="panel__row-note">{s.note}</span>
                        <ArrowRight size={16} className="panel__row-arrow" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="panel__col">
                <h2 className="label label--soft panel__head">The showroom</h2>
                <ul className="panel__list">
                  {ROOMS.map(({ href, label, note, Icon }) => (
                    <li key={href}>
                      <Link href={href} className="panel__row">
                        <Icon size={16} className="panel__row-icon" />
                        <span className="panel__row-main">{label}</span>
                        <span className="panel__row-note">{note}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="panel__col">
                <h2 className="label label--soft panel__head">You</h2>
                <ul className="panel__list">
                  <li>
                    <button type="button" className="panel__row" onClick={openBag}>
                      <BagIcon size={16} className="panel__row-icon" />
                      <span className="panel__row-main">Your bag</span>
                      <span className="panel__row-note">{count === 0 ? "Empty" : `${count} piece${count === 1 ? "" : "s"}`}</span>
                    </button>
                  </li>
                  <li>
                    <Link href="/account" className="panel__row">
                      <User size={16} className="panel__row-icon" />
                      <span className="panel__row-main">Account</span>
                      <span className="panel__row-note">Orders and addresses</span>
                    </Link>
                  </li>
                  {HELP.map(({ href, label, Icon }) => (
                    <li key={href}>
                      <Link href={href} className="panel__row">
                        <Icon size={16} className="panel__row-icon" />
                        <span className="panel__row-main">{label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            {/* ── the room ─────────────────────────────────────
                The only atmosphere control that exists, and it exists
                only because browsers require a gesture before they will
                play anything. The light needs no control and has none. */}
            <div className="panel__room">
              <button
                type="button"
                className="btn btn--glass btn--sm"
                onClick={sound.toggle}
                aria-pressed={sound.playing}
              >
                <Sound size={16} on={sound.playing} />
                {sound.playing ? "Sound on" : "Sound off"}
              </button>
              <p className="panel__room-note small muted">
                {sound.playing ? sound.name : "The showroom has an atmosphere. It is off until you ask for it."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {open ? <button type="button" className="dock__scrim" aria-label="Close menu" onClick={() => setOpen(false)} /> : null}
    </>
  );
}
