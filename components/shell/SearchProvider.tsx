"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

interface SearchValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const Ctx = createContext<SearchValue | null>(null);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const value = useMemo<SearchValue>(
    () => ({
      isOpen,
      open: () => setOpen(true),
      close: () => setOpen(false),
      toggle: () => setOpen((v) => !v),
    }),
    [isOpen],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSearch(): SearchValue {
  const ctx = useContext(Ctx);
  /* The header renders in layouts that may mount before the provider in a
     test or a storybook; a no-op is a better answer there than a crash. */
  const fallback = useMemo<SearchValue>(
    () => ({ isOpen: false, open: () => {}, close: () => {}, toggle: () => {} }),
    [],
  );
  return ctx ?? fallback;
}

/** The stylist panel and the trial room share the same open/close shape. */
export function makeToggleContext(name: string) {
  const C = createContext<SearchValue | null>(null);

  function Provider({ children }: { children: React.ReactNode }) {
    const [isOpen, setOpen] = useState(false);
    const open = useCallback(() => setOpen(true), []);
    const close = useCallback(() => setOpen(false), []);
    const toggle = useCallback(() => setOpen((v) => !v), []);
    const value = useMemo(() => ({ isOpen, open, close, toggle }), [isOpen, open, close, toggle]);
    return <C.Provider value={value}>{children}</C.Provider>;
  }
  Provider.displayName = `${name}Provider`;

  function use(): SearchValue {
    const ctx = useContext(C);
    if (!ctx) throw new Error(`use${name} must be used inside <${name}Provider>`);
    return ctx;
  }

  return { Provider, use };
}
