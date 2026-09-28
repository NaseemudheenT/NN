"use client";

import { createContext, useContext } from "react";
import type { Catalog } from "@/lib/types";

const Ctx = createContext<Catalog>({
  configured: false,
  source: "preview",
  products: [],
  error: null,
});

export function CatalogProvider({
  catalog,
  children,
}: {
  catalog: Catalog;
  children: React.ReactNode;
}) {
  return <Ctx.Provider value={catalog}>{children}</Ctx.Provider>;
}

export function useCatalog() {
  return useContext(Ctx);
}
