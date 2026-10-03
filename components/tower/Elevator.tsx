"use client";

import { Monogram } from "@/components/brand/Monogram";
import { Bag as BagIcon, Hanger, Search, Sound, Sparkle, User } from "@/components/ui/icons";
import { useBag } from "@/lib/bag/BagProvider";
import { useSearch } from "@/components/shell/SearchProvider";
import { useStylist } from "@/components/stylist/StylistProvider";
import { useSoundscape } from "@/components/shell/SoundscapeProvider";
import { INTERIOR, STREET, type Level } from "@/lib/tower/floors";

/**
 * The elevator.
 *
 * One liquid-glass column on the right edge: every floor of the tower, top
 * to bottom the way a real call panel reads, and under it the five things a
 * customer can do from anywhere in the building.
 *
 * ── why the names stay visible ───────────────────────────────────────
 * An earlier version folded them away to a column of dots and only showed
 * them on hover. It looked better and it was worse: a dot has no name on a
 * touch screen, where there is no hover, and a lift whose buttons are
 * unlabelled is a lift you press at random. The floor NUMBER is always
 * there, the name expands, and both are in the accessible name regardless.
 */
export function Elevator({
  activeFloor,
  onFloor,
  onStreet,
}: {
  activeFloor: number;
  onFloor: (level: Level) => void;
  onStreet: () => void;
}) {
  const { count, openBag } = useBag();
  const { open: openSearch } = useSearch();
  const { open: openStylist } = useStylist();
  const sound = useSoundscape();

  return (
    <nav className="lift" aria-label="NN Tower">
      <div className="lift__glass glass glass--refract">
        <p className="lift__head label" aria-hidden>Levels</p>

        <ul className="lift__floors">
          {INTERIOR.map((level) => (
            <li key={level.id}>
              <button
                type="button"
                className="lift__floor"
                data-on={activeFloor === level.floor || undefined}
                aria-current={activeFloor === level.floor ? "true" : undefined}
                aria-label={`${level.code} — ${level.title}`}
                onClick={() => onFloor(level)}
              >
                <span className="lift__no tnum" aria-hidden>
                  {level.floor === 8 ? "R" : level.floor}
                </span>
                <span className="lift__name">{level.title}</span>
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              className="lift__floor lift__floor--street"
              data-on={activeFloor === 0 || undefined}
              aria-label="Street — the facade"
              onClick={onStreet}
            >
              <span className="lift__no" aria-hidden><Monogram size={13} /></span>
              <span className="lift__name">{STREET.title}</span>
            </button>
          </li>
        </ul>

        <span className="lift__rule" aria-hidden />

        <ul className="lift__tools">
          <li>
            <button type="button" className="lift__tool" onClick={openStylist} aria-label="Ask the stylist">
              <Sparkle size={15} />
              <span className="lift__name">Stylist</span>
            </button>
          </li>
          <li>
            <a className="lift__tool" href="/trial-room" aria-label="Trial room">
              <Hanger size={15} />
              <span className="lift__name">Trial room</span>
            </a>
          </li>
          <li>
            <button type="button" className="lift__tool" onClick={openSearch} aria-label="Search the collection">
              <Search size={15} />
              <span className="lift__name">Search</span>
            </button>
          </li>
          <li>
            <button type="button" className="lift__tool" onClick={openBag} aria-label={`Bag, ${count} pieces`}>
              <span className="lift__badge">
                <BagIcon size={15} />
                {count > 0 ? <span className="lift__count tnum">{count}</span> : null}
              </span>
              <span className="lift__name">Bag</span>
            </button>
          </li>
          <li>
            <a className="lift__tool" href="/account" aria-label="Account">
              <User size={15} />
              <span className="lift__name">Account</span>
            </a>
          </li>
          <li>
            <button
              type="button"
              className="lift__tool"
              onClick={sound.toggle}
              aria-pressed={sound.playing}
              data-on={sound.playing || undefined}
              aria-label={sound.playing ? "Turn the room sound off" : "Turn the room sound on"}
            >
              <Sound size={15} on={sound.playing} />
              <span className="lift__name">{sound.playing ? "Sound on" : "Sound"}</span>
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}
