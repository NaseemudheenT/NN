"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Orb } from "./Orb";
import { StylistPanel } from "./StylistPanel";
import { MOTION } from "@/lib/tokens";

/** The orb waits at the counter. It never interrupts. */
export function OrbLauncher() {
  const pathname = usePathname();
  // The panel belongs to the room you are standing in: moving to another
  // route closes it, without an effect chasing the pathname.
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const open = openedOn === pathname;
  const setOpen = (next: boolean) => setOpenedOn(next ? pathname : null);

  // The stylist has its own room; the orb steps aside there.
  if (pathname.startsWith("/stylist") || pathname.startsWith("/owner")) return null;

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={open ? "Close the stylist" : "Ask the Nero Noren stylist"}
        aria-expanded={open}
        className="fixed bottom-24 right-4 z-[68] rounded-full md:bottom-7 md:right-7"
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ ...MOTION.spring, delay: 0.9 }}
        whileTap={{ scale: 0.93 }}
      >
        <Orb state={open ? "listening" : "idle"} size={54} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="nn-glass fixed bottom-40 right-4 z-[69] w-[min(23rem,calc(100vw-2rem))] overflow-hidden rounded-md md:bottom-24 md:right-7"
            initial={{ opacity: 0, y: 24, scale: 0.97, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 16, scale: 0.98, filter: "blur(10px)" }}
            transition={MOTION.spring}
            role="dialog"
            aria-label="Nero Noren stylist"
          >
            <StylistPanel compact onClose={() => setOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
