"use client";

import { useState } from "react";
import { Monogram } from "@/components/brand/Monogram";
import { Bag as BagIcon, Search, Sound, Sparkle, User } from "@/components/ui/icons";
import { useBag } from "@/lib/bag/BagProvider";
import { useSearch } from "@/components/shell/SearchProvider";
import { useStylist } from "@/components/stylist/StylistProvider";
import { useSoundscape } from "@/components/shell/SoundscapeProvider";
import { ZONES, type Zone } from "./plan";

/**
 * The panel.
 *
 * Everything a customer can do reaches them through this one object on the
 * right-hand edge: the places in the building, and the things they can do
 * anywhere in it. It is deliberately NARROW — a column of marks, with the
 * names sliding out only when a hand is near — because the building is the
 * page, and a menu that covers a quarter of it is a shutter over the shop
 * window.
 *
 * Touching a place TELEPORTS there, and that is a journey rather than a
 * cut: the camera travels, eased, so the customer keeps their sense of
 * where they are. Walking there instead works exactly the same.
 *
 * ── the one visible setting ─────────────────────────────────────────
 * Sound. Everything else about the atmosphere is automatic and silent —
 * the light follows the visitor's own hour and weather and nothing
 * announces it. Sound cannot work that way: no browser will start audio
 * without a gesture, so the choice is a discreet control or no sound.
 */

export function SidePanel({
  onTeleport,
  activeZone,
}: {
  onTeleport: (zone: Zone) => void;
  activeZone: string;
}) {
  const [open, setOpen] = useState(false);
  const { count, openBag } = useBag();
  const { open: openSearch } = useSearch();
  const { open: openStylist } = useStylist();
  const sound = useSoundscape();

  return (
    <nav
      className="rail"
      data-open={open || undefined}
      aria-label="The building"
      onPointerEnter={() => setOpen(true)}
      onPointerLeave={() => setOpen(false)}
    >
      <div className="rail__glass glass glass--refract">
        {/* ── the places ──────────────────────────────────────── */}
        <ul className="rail__list">
          {ZONES.map((z) => (
            <li key={z.id}>
              <button
                type="button"
                className="rail__item"
                data-on={activeZone === z.id || undefined}
                onClick={() => onTeleport(z)}
                /* The visible label is clipped to nothing when the rail is
                   folded, which hides it from assistive technology as well
                   as from the eye — so every item carries its name here too.
                   A column of unnamed buttons is not a navigation. */
                aria-label={z.floor === 1 ? `${z.label} — second floor` : z.label}
                aria-current={activeZone === z.id ? "true" : undefined}
              >
                <span className="rail__glyph" aria-hidden>
                  {z.id === "entrance" ? (
                    <Monogram size={15} />
                  ) : (
                    <span className="rail__dot" data-floor={z.floor} />
                  )}
                </span>
                <span className="rail__label">{z.label}</span>
                {z.floor === 1 ? <span className="rail__floor label" aria-hidden>2</span> : null}
              </button>
            </li>
          ))}
        </ul>

        <span className="rail__rule" aria-hidden />

        {/* ── the things you can do anywhere ──────────────────── */}
        <ul className="rail__list">
          <li>
            <button type="button" className="rail__item" onClick={openStylist} aria-label="Ask the stylist">
              <span className="rail__glyph" aria-hidden><Sparkle size={16} /></span>
              <span className="rail__label">Stylist</span>
            </button>
          </li>
          <li>
            <button type="button" className="rail__item" onClick={openSearch} aria-label="Search the collection">
              <span className="rail__glyph" aria-hidden><Search size={16} /></span>
              <span className="rail__label">Search</span>
            </button>
          </li>
          <li>
            <button type="button" className="rail__item" onClick={openBag} aria-label={`Bag, ${count} pieces`}>
              <span className="rail__glyph" aria-hidden>
                <BagIcon size={16} />
                {count > 0 ? <span className="rail__count tnum">{count}</span> : null}
              </span>
              <span className="rail__label">Bag</span>
            </button>
          </li>
          <li>
            <a className="rail__item" href="/account" aria-label="Account">
              <span className="rail__glyph" aria-hidden><User size={16} /></span>
              <span className="rail__label">Account</span>
            </a>
          </li>
          <li>
            <button
              type="button"
              className="rail__item"
              onClick={sound.toggle}
              aria-pressed={sound.playing}
              data-on={sound.playing || undefined}
              aria-label={sound.playing ? "Turn the room sound off" : "Turn the room sound on"}
            >
              <span className="rail__glyph" aria-hidden><Sound size={16} on={sound.playing} /></span>
              <span className="rail__label">{sound.playing ? "Sound on" : "Sound"}</span>
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}
