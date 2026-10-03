"use client";

/**
 * The bag.
 *
 * Line items live on the device so the bag survives a reload and a lost
 * connection. When Shopify is configured the same lines are mirrored into a
 * real Shopify cart and the cart id is kept alongside them, because the cart
 * is what Shopify prices, taxes and eventually turns into an order. When
 * Shopify is not configured the bag still works, priced from the catalogue.
 *
 * Money is only ever read from the catalogue or from Shopify — never stored in
 * the bag — so a price change is reflected the next time the bag is opened.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "@/components/layout/Toaster";
import { track } from "@/components/layout/ConsentBanner";

const LINES_KEY = "nn-bag";
const CART_ID_KEY = "nn-cart-id";

export interface BagLine {
  handle: string;
  size: string;
  quantity: number;
  /** Shopify variant id, when the shop is live. */
  variantId?: string;
}

interface BagContextValue {
  lines: BagLine[];
  count: number;
  isOpen: boolean;
  openBag: () => void;
  closeBag: () => void;
  add: (line: BagLine, label?: string) => void;
  setQuantity: (handle: string, size: string, quantity: number) => void;
  remove: (handle: string, size: string) => void;
  clear: () => void;
  /** Shopify cart id, when one exists. */
  cartId: string | null;
  /** True when a Shopify cart is being synced. */
  syncing: boolean;
  shopLive: boolean;
}

const BagContext = createContext<BagContextValue | null>(null);

function readLines(): BagLine[] {
  try {
    const raw = window.localStorage.getItem(LINES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (l): l is BagLine =>
        typeof l === "object" &&
        l !== null &&
        typeof (l as BagLine).handle === "string" &&
        typeof (l as BagLine).size === "string" &&
        Number.isFinite((l as BagLine).quantity),
    );
  } catch {
    return [];
  }
}

export function BagProvider({
  children,
  shopLive,
}: {
  children: React.ReactNode;
  shopLive: boolean;
}) {
  const [lines, setLines] = useState<BagLine[]>([]);
  const [isOpen, setOpen] = useState(false);
  const [cartId, setCartId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const hydrated = useRef(false);

  /* restore */
  useEffect(() => {
    setLines(readLines());
    try {
      setCartId(window.localStorage.getItem(CART_ID_KEY));
    } catch {
      /* no storage, no restored cart */
    }
    hydrated.current = true;
  }, []);

  /* persist */
  useEffect(() => {
    if (!hydrated.current) return;
    try {
      window.localStorage.setItem(LINES_KEY, JSON.stringify(lines));
    } catch {
      /* the bag still works for this visit */
    }
  }, [lines]);

  /* mirror into a Shopify cart when the shop is live */
  useEffect(() => {
    if (!hydrated.current || !shopLive) return;
    if (!lines.length) return;

    let cancelled = false;
    const sync = async () => {
      setSyncing(true);
      try {
        const res = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cartId, lines }),
        });
        if (!res.ok) throw new Error(`cart sync ${res.status}`);
        const data = (await res.json()) as { cartId?: string };
        if (!cancelled && data.cartId && data.cartId !== cartId) {
          setCartId(data.cartId);
          try {
            window.localStorage.setItem(CART_ID_KEY, data.cartId);
          } catch {
            /* ignore */
          }
        }
      } catch (err) {
        // A failed sync must not lose the bag. It retries on the next change.
        console.warn("[bag] Shopify cart sync failed, bag kept on device:", err);
      } finally {
        if (!cancelled) setSyncing(false);
      }
    };

    const t = setTimeout(sync, 400); // debounce rapid quantity taps
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // cartId is deliberately not a dependency: we do not want to re-sync
    // simply because the sync returned an id.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines, shopLive]);

  const add = useCallback((line: BagLine, label?: string) => {
    setLines((prev) => {
      const i = prev.findIndex((l) => l.handle === line.handle && l.size === line.size);
      if (i === -1) return [...prev, { ...line, quantity: Math.max(1, line.quantity) }];
      const next = [...prev];
      next[i] = { ...next[i], quantity: next[i].quantity + Math.max(1, line.quantity) };
      return next;
    });
    toast(label ? `${label} added to your bag.` : "Added to your bag.");
    track("add_to_bag", { handle: line.handle, size: line.size });
  }, []);

  const setQuantity = useCallback((handle: string, size: string, quantity: number) => {
    setLines((prev) =>
      quantity <= 0
        ? prev.filter((l) => !(l.handle === handle && l.size === size))
        : prev.map((l) => (l.handle === handle && l.size === size ? { ...l, quantity } : l)),
    );
  }, []);

  const remove = useCallback((handle: string, size: string) => {
    setLines((prev) => prev.filter((l) => !(l.handle === handle && l.size === size)));
  }, []);

  const clear = useCallback(() => {
    setLines([]);
    setCartId(null);
    try {
      window.localStorage.removeItem(CART_ID_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const count = useMemo(() => lines.reduce((a, l) => a + l.quantity, 0), [lines]);

  const value = useMemo<BagContextValue>(
    () => ({
      lines,
      count,
      isOpen,
      openBag: () => setOpen(true),
      closeBag: () => setOpen(false),
      add,
      setQuantity,
      remove,
      clear,
      cartId,
      syncing,
      shopLive,
    }),
    [lines, count, isOpen, add, setQuantity, remove, clear, cartId, syncing, shopLive],
  );

  return <BagContext.Provider value={value}>{children}</BagContext.Provider>;
}

export function useBag(): BagContextValue {
  const ctx = useContext(BagContext);
  if (!ctx) throw new Error("useBag must be used inside <BagProvider>");
  return ctx;
}
