"use client";

import { useEffect, useState } from "react";

/**
 * Confirmations.
 *
 * A module-level emitter rather than a context, because the thing that needs
 * to say "added" is often three providers below the thing that renders it,
 * and threading a callback through all of them to move one line of text is
 * not a design, it is plumbing.
 *
 * Announced politely to assistive technology: a confirmation should reach a
 * screen reader without interrupting whatever it was reading.
 */

export interface Toast { id: number; text: string; href?: string; label?: string }

type Listener = (t: Toast) => void;
const listeners = new Set<Listener>();
let nextId = 1;

export function toast(text: string, action?: { href: string; label: string }) {
  const t: Toast = { id: nextId++, text, href: action?.href, label: action?.label };
  listeners.forEach((l) => l(t));
}

export function Toaster() {
  const [items, setItems] = useState<Toast[]>([]);

  useEffect(() => {
    const on: Listener = (t) => {
      setItems((list) => [...list.slice(-2), t]);
      window.setTimeout(() => setItems((list) => list.filter((x) => x.id !== t.id)), 4200);
    };
    listeners.add(on);
    return () => { listeners.delete(on); };
  }, []);

  return (
    <div className="toasts" role="status" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className="toast glass">
          <span>{t.text}</span>
          {t.href ? <a href={t.href} className="ul-grow label">{t.label}</a> : null}
        </div>
      ))}
    </div>
  );
}
