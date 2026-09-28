"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartLine } from "./types";

interface BagState {
  lines: CartLine[];
  /** Shopify cart id, once a real cart exists */
  cartId: string | null;
  checkoutUrl: string | null;
  open: boolean;
  /** Set briefly after an add, to drive the confirmation */
  justAdded: string | null;
  setOpen: (v: boolean) => void;
  add: (line: CartLine) => void;
  setQuantity: (variantId: string, qty: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
  hydrateFromShopify: (cartId: string, checkoutUrl: string, lines: CartLine[]) => void;
}

export const useBag = create<BagState>()(
  persist(
    (set, get) => ({
      lines: [],
      cartId: null,
      checkoutUrl: null,
      open: false,
      justAdded: null,
      setOpen: (v) => set({ open: v }),
      add: (line) => {
        const lines = [...get().lines];
        const i = lines.findIndex((l) => l.variantId === line.variantId);
        if (i >= 0) lines[i] = { ...lines[i], quantity: lines[i].quantity + line.quantity };
        else lines.push(line);
        set({ lines, justAdded: line.variantId });
        setTimeout(() => {
          if (get().justAdded === line.variantId) set({ justAdded: null });
        }, 2600);
      },
      setQuantity: (variantId, qty) =>
        set({
          lines: get()
            .lines.map((l) => (l.variantId === variantId ? { ...l, quantity: qty } : l))
            .filter((l) => l.quantity > 0),
        }),
      remove: (variantId) => set({ lines: get().lines.filter((l) => l.variantId !== variantId) }),
      clear: () => set({ lines: [], cartId: null, checkoutUrl: null }),
      hydrateFromShopify: (cartId, checkoutUrl, lines) => set({ cartId, checkoutUrl, lines }),
    }),
    { name: "nn.bag", partialize: (s) => ({ lines: s.lines, cartId: s.cartId, checkoutUrl: s.checkoutUrl }) },
  ),
);

export function bagCount(lines: CartLine[]) {
  return lines.reduce((n, l) => n + l.quantity, 0);
}

export function bagSubtotal(lines: CartLine[]) {
  const priced = lines.filter((l) => l.price);
  if (priced.length === 0) return null;
  const currency = priced[0].price!.currency;
  const amount = priced.reduce((s, l) => s + l.price!.amount * l.quantity, 0);
  return { amount, currency };
}

export function formatMoney(m: { amount: number; currency: string } | null, locale = "en-IN") {
  if (!m) return null;
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: m.currency,
      maximumFractionDigits: m.amount % 1 === 0 ? 0 : 2,
    }).format(m.amount);
  } catch {
    return `${m.currency} ${m.amount}`;
  }
}
