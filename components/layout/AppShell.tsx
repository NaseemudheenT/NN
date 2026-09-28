"use client";

import { useState } from "react";
import { ShowroomProvider } from "./ShowroomProvider";
import { CatalogProvider } from "./CatalogProvider";
import { LiveAtmosphere } from "./LiveAtmosphere";
import { Grain } from "./Grain";
import { Navigation } from "./Navigation";
import { Entrance } from "@/components/ui/loaders/Entrance";
import { BagSheet, AddConfirmation } from "@/components/shop/BagSheet";
import { Search } from "@/components/shop/Search";
import { OrbLauncher } from "@/components/ai/OrbLauncher";
import { Footer } from "./Footer";
import type { Catalog } from "@/lib/types";

/**
 * One building. The atmosphere, the navigation, the orb and the bag persist
 * across every route — the visitor moves through the showroom, not between
 * unrelated pages.
 */
export function AppShell({
  catalog,
  children,
}: {
  catalog: Catalog;
  children: React.ReactNode;
}) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <ShowroomProvider>
      <CatalogProvider catalog={catalog}>
        <LiveAtmosphere />
        <Grain />
        <Entrance />
        <Navigation onOpenSearch={() => setSearchOpen(true)} />

        <main id="main" className="relative z-10 flex-1">
          {children}
        </main>

        <Footer />

        <Search open={searchOpen} onClose={() => setSearchOpen(false)} />
        <BagSheet />
        <AddConfirmation />
        <OrbLauncher />
      </CatalogProvider>
    </ShowroomProvider>
  );
}
