"use client";

import { usePathname } from "next/navigation";
import { Header } from "./Header";
import { FloatingPanel } from "./FloatingPanel";
import { SearchPalette } from "./SearchPalette";
import { SoundscapeProvider } from "./SoundscapeProvider";
import { SearchProvider } from "./SearchProvider";
import { StylistProvider } from "@/components/stylist/StylistProvider";
import { StylistChat } from "@/components/stylist/StylistChat";
import { BagDrawer } from "@/components/shop/BagDrawer";
import { Toaster } from "@/components/layout/Toaster";
import { ConsentBanner } from "@/components/layout/ConsentBanner";
import { LiquidFilter } from "@/components/ui/LiquidFilter";
import { usePointer } from "@/lib/ui/usePointer";
import { useReveal } from "@/lib/ui/useReveal";
import { usePhase } from "@/lib/ui/useDaylight";
import type { Product } from "@/lib/catalog/types";

/** Pages whose first screen is the showroom, so the header starts as ivory. */
const DARK_TOP = ["/showroom", "/atelier", "/stylist", "/trial-room"];

/**
 * Routes that ARE the building rather than pages about it.
 *
 * The world brings its own navigation — a rail on the right that teleports
 * between places — so the shop's header, dock and footer stand down. Two
 * navigations over one building is one too many, and the second one always
 * looks like it was bolted on.
 */
const IMMERSIVE = ["/"];

/**
 * The shell.
 *
 * Everything that persists across routes lives here and only here: the
 * header, the floating panel, the three overlays, and the two listeners the
 * whole site shares. Putting them in the layout rather than on each page is
 * what makes moving between the collection and a product feel like walking
 * between rooms of one building instead of loading a second website — the
 * panel never blinks, the bag never re-reads itself, the room tone does not
 * restart.
 */
export function Shell({
  catalogue,
  footer,
  children,
}: {
  catalogue: Product[];
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const phase = usePhase();
  usePointer();
  useReveal();

  const immersive = IMMERSIVE.includes(pathname);

  return (
    <SearchProvider>
      <StylistProvider>
        <SoundscapeProvider phase={phase}>
          <LiquidFilter />

          <a className="skip" href="#main">Skip to content</a>

          {!immersive ? <Header overRoom={DARK_TOP.includes(pathname)} /> : null}

          <main id="main" data-immersive={immersive || undefined}>{children}</main>

          {!immersive ? footer : null}
          {!immersive ? <FloatingPanel /> : null}
          <SearchPalette catalogue={catalogue} />
          <StylistChat catalogue={catalogue} />
          <BagDrawer catalogue={catalogue} />
          <Toaster />
          <ConsentBanner />
        </SoundscapeProvider>
      </StylistProvider>
    </SearchProvider>
  );
}
