"use client";

import {

  useEffect,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
} from "react";
import Link from "next/link";

/**
 * Glass reacts to the pointer the way real glass reacts to a moving light:
 * a highlight travels across it, and a primary control leans very slightly
 * toward the hand.
 *
 * Both behaviours attach their own listeners to the node once React has
 * given it to us, so nothing is read out of a ref while rendering.
 */

const FINE_POINTER = "(hover: hover) and (pointer: fine)";
const REDUCED = "(prefers-reduced-motion: reduce)";

function allows(query: string) {
  try {
    return window.matchMedia(query).matches;
  } catch {
    return false;
  }
}

/** Writes --mx/--my so the CSS refraction sweep can follow the pointer. */
function useGlassPointer<T extends HTMLElement>(enabled = true) {
  const [node, setNode] = useState<T | null>(null);

  useEffect(() => {
    if (!node || !enabled) return;

    const onMove = (e: PointerEvent) => {
      const r = node.getBoundingClientRect();
      node.style.setProperty("--mx", `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
      node.style.setProperty("--my", `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
    };

    node.addEventListener("pointermove", onMove, { passive: true });
    return () => node.removeEventListener("pointermove", onMove);
  }, [node, enabled]);

  return setNode;
}

/** A gentle pull toward the pointer. Desktop only, and never with reduced motion. */
function useMagnetic<T extends HTMLElement>(strength: number) {
  const [node, setNode] = useState<T | null>(null);

  useEffect(() => {
    if (!node || strength === 0) return;
    if (!allows(FINE_POINTER) || allows(REDUCED)) return;

    const onMove = (e: PointerEvent) => {
      const r = node.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) * strength;
      const dy = (e.clientY - (r.top + r.height / 2)) * strength;
      node.style.transform = `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0)`;
      node.style.setProperty("--mx", `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
      node.style.setProperty("--my", `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
    };

    const onLeave = () => {
      node.style.transform = "";
    };

    node.addEventListener("pointermove", onMove, { passive: true });
    node.addEventListener("pointerleave", onLeave);
    return () => {
      node.removeEventListener("pointermove", onMove);
      node.removeEventListener("pointerleave", onLeave);
      node.style.transform = "";
    };
  }, [node, strength]);

  return setNode;
}

/* ------------------------------------------------------------------ */
/* Panel                                                               */
/* ------------------------------------------------------------------ */

type PanelProps = HTMLAttributes<HTMLDivElement> & {
  live?: boolean;
  as?: "div" | "section" | "aside" | "nav";
};

export function GlassPanel({
  className = "",
  live = true,
  as: Tag = "div",
  children,
  ...rest
}: PanelProps) {
  const attach = useGlassPointer<HTMLDivElement>(live);
  return (
    <Tag
      ref={attach}
      className={`nn-glass ${live ? "nn-glass-live" : ""} rounded-md ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/* ------------------------------------------------------------------ */
/* Buttons — physical press, magnetic pull on fine pointers only       */
/* ------------------------------------------------------------------ */

const BASE =
  "relative inline-flex items-center justify-center gap-2.5 nn-label select-none " +
  "transition-[transform,background-color,color,border-color,box-shadow] duration-200 " +
  "[transition-timing-function:var(--ease-out)] active:scale-[0.975] " +
  "disabled:opacity-45 disabled:pointer-events-none";

const VARIANTS = {
  solid:
    "bg-ink text-bg border border-ink hover:bg-accent hover:border-accent hover:text-accent-ink shadow-[var(--shadow-press)]",
  accent: "bg-accent text-accent-ink border border-accent hover:brightness-110 shadow-[var(--shadow-press)]",
  glass: "nn-glass nn-glass-live text-ink hover:border-accent/60",
  quiet: "border border-line text-ink-soft hover:text-ink hover:border-ink/45 bg-transparent",
  ghost: "text-ink-soft hover:text-ink bg-transparent border border-transparent",
} as const;

const SIZES = {
  sm: "h-9 px-4 text-[0.625rem]",
  md: "h-11 px-6",
  lg: "h-14 px-9 text-[0.75rem]",
} as const;

export type ButtonVariant = keyof typeof VARIANTS;

type GlassButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: keyof typeof SIZES;
  magnetic?: boolean;
  href?: string;
};

export function GlassButton({
  variant = "glass",
  size = "md",
  magnetic = true,
  className = "",
  href,
  children,
  ...rest
}: GlassButtonProps) {
  const cls = `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`;
  const strength = magnetic ? 0.2 : 0;

  const attachLink = useMagnetic<HTMLAnchorElement>(strength);
  const attachButton = useMagnetic<HTMLButtonElement>(strength);

  if (href) {
    return (
      <Link href={href} ref={attachLink} className={cls} onClick={rest.onClick as never}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" ref={attachButton} className={cls} {...rest}>
      {children}
    </button>
  );
}

export function GlassIconButton({
  label,
  className = "",
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  const attach = useGlassPointer<HTMLButtonElement>();
  return (
    <button
      type="button"
      ref={attach}
      aria-label={label}
      title={label}
      className={`nn-glass nn-glass-live relative grid h-10 w-10 place-items-center rounded-full text-ink transition-[transform,border-color] duration-200 [transition-timing-function:var(--ease-out)] hover:border-accent/60 active:scale-95 ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function GlassPill({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`nn-glass inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 nn-meta text-ink-soft ${className}`}
    >
      {children}
    </span>
  );
}

/** Exported for panels that need the same pointer highlight. */
export { useGlassPointer };
