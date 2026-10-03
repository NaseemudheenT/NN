"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

interface Value { isOpen: boolean; open: () => void; close: () => void; toggle: () => void }
const Ctx = createContext<Value | null>(null);

export function StylistProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const open = useCallback(() => setOpen(true), []);
  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((v) => !v), []);
  const value = useMemo(() => ({ isOpen, open, close, toggle }), [isOpen, open, close, toggle]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStylist(): Value {
  const ctx = useContext(Ctx);
  const fallback = useMemo<Value>(() => ({ isOpen: false, open: () => {}, close: () => {}, toggle: () => {} }), []);
  return ctx ?? fallback;
}
