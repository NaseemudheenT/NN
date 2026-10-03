"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Lockup } from "@/components/brand/Monogram";
import { ArrowRight } from "@/components/ui/icons";
import { STREET, type Hotspot } from "@/lib/tower/floors";

const DUSK = "/assets/flagship/nn-tower-facade-dusk.webp";
const DAY = "/assets/flagship/nn-tower-facade-day.webp";

/**
 * The street.
 *
 * Where everyone arrives. Mouse moves the camera, not the building: ±14 px
 * of lean against a spring, which is enough that the facade has depth and
 * little enough that nobody notices it is happening — the moment a parallax
 * is noticeable it has stopped reading as architecture and started reading
 * as a slider.
 *
 * ── the hour ─────────────────────────────────────────────────────────
 * Dusk by default. A lit shopfront at dusk is the single most flattering
 * state a building has: the interior reads warm against a cool sky and the
 * windows become the brightest thing in the frame, which is exactly where
 * a customer's eye should go. Daylight is one touch away.
 *
 * ── the drawn facade ─────────────────────────────────────────────────
 * Until the photographs arrive this draws itself: travertine courses, the
 * arcade, the lit arch, the mark above it. Again — a drawing, honestly a
 * drawing, not a blurry stand-in for a photograph.
 */
export function Facade({ onEnter }: { onEnter: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const [hour, setHour] = useState<"dusk" | "day">("dusk");
  const [photo, setPhoto] = useState<string | null>(null);
  const [open, setOpen] = useState<Hotspot | null>(null);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 46, damping: 20 });
  const sy = useSpring(my, { stiffness: 46, damping: 20 });
  const px = useTransform(sx, [-0.5, 0.5], [14, -14]);
  const py = useTransform(sy, [-0.5, 0.5], [10, -10]);
  const scale = useTransform(sy, [-0.5, 0.5], [1.03, 1.05]);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      mx.set((e.clientX - r.left) / r.width - 0.5);
      my.set((e.clientY - r.top) / r.height - 0.5);
    };
    el.addEventListener("pointermove", move, { passive: true });
    return () => el.removeEventListener("pointermove", move);
  }, [mx, my]);

  useEffect(() => {
    let live = true;
    const want = hour === "dusk" ? DUSK : DAY;
    void fetch(want, { method: "HEAD" })
      .then((r) => { if (live) setPhoto(r.ok ? want : null); })
      .catch(() => { if (live) setPhoto(null); });
    return () => { live = false; };
  }, [hour]);

  return (
    <section ref={host} className="facade" data-hour={hour}>
      <motion.div className="facade__plate" style={{ x: px, y: py, scale }}>
        {photo ? (
          /* next/image rather than a bare <img>: this is the largest paint
             on the site and an 8K facade render is the heaviest thing it
             will ever load. Letting Next serve AVIF at the viewport's own
             width is the difference between a two-second arrival and a
             ten-second one. */
          <Image src={photo} alt="" fill priority sizes="100vw" className="facade__photo" />
        ) : (
          <DrawnFacade hour={hour} />
        )}
      </motion.div>

      <div className="facade__sky" aria-hidden />
      <div className="facade__ground" aria-hidden />

      {/* ── the hour ─────────────────────────────────────────────── */}
      <div className="facade__hour glass">
        <button type="button" data-on={hour === "dusk" || undefined} onClick={() => setHour("dusk")} className="label">
          Evening
        </button>
        <button type="button" data-on={hour === "day" || undefined} onClick={() => setHour("day")} className="label">
          Daylight
        </button>
      </div>

      {/* ── the mark ─────────────────────────────────────────────── */}
      <div className="facade__brand">
        <Lockup size={54} tagline />
      </div>

      {/* ── what is on the facade ───────────────────────────────── */}
      {STREET.hotspots.map((spot, i) => (
        <motion.button
          key={spot.id}
          type="button"
          className="spot spot--facade"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.1 + i * 0.12, type: "spring", stiffness: 220, damping: 20 }}
          style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
          onClick={() => (spot.action === "ENTER" ? onEnter() : setOpen(spot))}
          aria-label={spot.label}
        >
          <span className="spot__pulse" aria-hidden />
          <span className="spot__dot" aria-hidden />
          <span className="spot__tip"><span className="spot__name">{spot.label}</span></span>
        </motion.button>
      ))}

      {/* ── the door ─────────────────────────────────────────────── */}
      <motion.div
        className="facade__enter"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 1, ease: [0.22, 1, 0.36, 1] }}
      >
        <button type="button" className="btn btn--glass btn--lg facade__go" onClick={onEnter}>
          Step inside <ArrowRight size={16} />
        </button>
      </motion.div>

      {open ? (
        <motion.aside
          className="facade__note glass"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="label label--soft">{open.label}</p>
          {open.note ? <p className="small">{open.note}</p> : null}
          <button type="button" className="ul-grow label" onClick={() => setOpen(null)}>Close</button>
        </motion.aside>
      ) : null}
    </section>
  );
}

/**
 * The facade, drawn.
 *
 * Travertine laid in courses, a five-bay arcade, the entrance arch lit from
 * within, and the mark on the frieze. The courses are irregular on purpose —
 * ashlar laid in equal bands is a texture, laid in varying ones it is
 * masonry, and that difference is most of what stops a drawn wall reading
 * as wallpaper.
 */
function DrawnFacade({ hour }: { hour: "dusk" | "day" }) {
  const warm = hour === "dusk";
  return (
    <svg viewBox="0 0 1200 800" className="facade__drawn" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id="nn-stone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={warm ? "#43382c" : "#9d9183"} />
          <stop offset="55%" stopColor={warm ? "#574839" : "#b3a695"} />
          <stop offset="100%" stopColor={warm ? "#33291f" : "#8b8072"} />
        </linearGradient>
        <radialGradient id="nn-bay" cx="50%" cy="78%">
          <stop offset="0%" stopColor={warm ? "rgba(255,186,110,.92)" : "rgba(226,232,240,.72)"} />
          <stop offset="100%" stopColor={warm ? "rgba(255,160,70,.2)" : "rgba(200,212,228,.18)"} />
        </radialGradient>
      </defs>

      <rect width="1200" height="800" fill="url(#nn-stone)" />

      {/* courses: irregular, because ashlar is */}
      {Array.from({ length: 26 }, (_, i) => {
        const y = 40 + i * 29 + (i % 3) * 3;
        return <line key={i} x1="0" y1={y} x2="1200" y2={y} stroke="rgba(0,0,0,.16)" strokeWidth="1" />;
      })}

      {/* the cornice and the frieze */}
      <rect x="0" y="92" width="1200" height="26" fill="rgba(0,0,0,.22)" />
      <rect x="0" y="118" width="1200" height="8" fill="rgba(255,255,255,.07)" />

      {/* the arcade — four bays, lit from inside */}
      {[150, 400, 800, 1050].map((cx) => (
        <g key={cx}>
          <path
            d={`M ${cx - 74} 620 L ${cx - 74} 340 A 74 74 0 0 1 ${cx + 74} 340 L ${cx + 74} 620 Z`}
            fill="url(#nn-bay)"
            opacity={warm ? 0.95 : 0.6}
          />
          <path
            d={`M ${cx - 74} 620 L ${cx - 74} 340 A 74 74 0 0 1 ${cx + 74} 340 L ${cx + 74} 620`}
            fill="none"
            stroke="rgba(0,0,0,.4)"
            strokeWidth="9"
          />
          {/* glazing bars */}
          <line x1={cx} y1="270" x2={cx} y2="620" stroke="rgba(30,24,18,.6)" strokeWidth="3" />
          {[360, 440, 520].map((y) => (
            <line key={y} x1={cx - 72} y1={y} x2={cx + 72} y2={y} stroke="rgba(30,24,18,.45)" strokeWidth="2" />
          ))}
        </g>
      ))}

      {/* the entrance, taller and brighter than the bays */}
      <path
        d="M 530 700 L 530 300 A 70 70 0 0 1 670 300 L 670 700 Z"
        fill="url(#nn-bay)"
      />
      <path
        d="M 530 700 L 530 300 A 70 70 0 0 1 670 300 L 670 700"
        fill="none"
        stroke="rgba(22,17,12,.72)"
        strokeWidth="14"
      />
      {/* the two leaves, shut */}
      <line x1="600" y1="312" x2="600" y2="700" stroke="rgba(22,17,12,.7)" strokeWidth="4" />

      {/* the mark, on the frieze, lit */}
      <rect x="548" y="186" width="104" height="78" fill="rgba(14,11,8,.78)" rx="2" />
      <circle cx="600" cy="225" r="58" fill={warm ? "rgba(232,212,164,.14)" : "transparent"} />

      {/* the pavement */}
      <rect x="0" y="700" width="1200" height="100" fill={warm ? "#1b1610" : "#4a443c"} />
      {Array.from({ length: 30 }, (_, i) => (
        <line key={i} x1={i * 41} y1="700" x2={i * 41 - 26} y2="800" stroke="rgba(0,0,0,.22)" strokeWidth="1" />
      ))}
    </svg>
  );
}
