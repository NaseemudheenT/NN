/**
 * The icon set.
 *
 * Drawn on one 24-unit grid at one stroke weight, so a row of them reads as
 * a set rather than as a collection. Stroke, not fill, because the interface
 * runs on hairlines and a filled icon beside hairline type is a blot.
 */

type P = { size?: number; className?: string; strokeWidth?: number };

const base = (size: number, strokeWidth: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
});

export const Search = ({ size = 18, className, strokeWidth = 1.5 }: P) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.6-3.6" />
  </svg>
);

export const User = ({ size = 18, className, strokeWidth = 1.5 }: P) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
  </svg>
);

export const Bag = ({ size = 18, className, strokeWidth = 1.5 }: P) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <path d="M5.4 7.5h13.2l-1 12.2a1.4 1.4 0 0 1-1.4 1.3H7.8a1.4 1.4 0 0 1-1.4-1.3Z" />
    <path d="M9 9.5V6.6a3 3 0 1 1 6 0v2.9" />
  </svg>
);

export const Menu = ({ size = 18, className, strokeWidth = 1.5 }: P) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

export const Close = ({ size = 18, className, strokeWidth = 1.5 }: P) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
);

export const Chevron = ({ size = 18, className, strokeWidth = 1.5 }: P) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const ArrowRight = ({ size = 18, className, strokeWidth = 1.5 }: P) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <path d="M4 12h15" />
    <path d="m13 6 6 6-6 6" />
  </svg>
);

export const Heart = ({ size = 18, className, strokeWidth = 1.5 }: P) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <path d="M12 20s-7.5-4.6-7.5-9.6A4.4 4.4 0 0 1 12 7.4a4.4 4.4 0 0 1 7.5 3c0 5-7.5 9.6-7.5 9.6Z" />
  </svg>
);

export const Trash = ({ size = 18, className, strokeWidth = 1.5 }: P) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <path d="M4.5 7h15M9.5 7V5.4A1.4 1.4 0 0 1 10.9 4h2.2a1.4 1.4 0 0 1 1.4 1.4V7" />
    <path d="M6.6 7l.8 12.1a1.4 1.4 0 0 0 1.4 1.3h6.4a1.4 1.4 0 0 0 1.4-1.3L17.4 7" />
  </svg>
);

export const Plus = ({ size = 16, className, strokeWidth = 1.5 }: P) => (
  <svg {...base(size, strokeWidth)} className={className}><path d="M12 5v14M5 12h14" /></svg>
);

export const Minus = ({ size = 16, className, strokeWidth = 1.5 }: P) => (
  <svg {...base(size, strokeWidth)} className={className}><path d="M5 12h14" /></svg>
);

export const Hanger = ({ size = 18, className, strokeWidth = 1.5 }: P) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <path d="M12 8.4a2.2 2.2 0 1 1 2.2-2.2" />
    <path d="M12 8.4 3.8 14.6a1.2 1.2 0 0 0 .7 2.2h15a1.2 1.2 0 0 0 .7-2.2L12 8.4Z" />
  </svg>
);

export const Sound = ({ size = 18, className, strokeWidth = 1.5, on = true }: P & { on?: boolean }) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <path d="M4 9.6h3.2L11.4 6v12L7.2 14.4H4Z" />
    {on ? (
      <>
        <path d="M14.8 9.4a3.6 3.6 0 0 1 0 5.2" />
        <path d="M17.4 7a7.2 7.2 0 0 1 0 10" />
      </>
    ) : (
      <path d="m15.4 9.8 4.2 4.4M19.6 9.8l-4.2 4.4" />
    )}
  </svg>
);

export const Sparkle = ({ size = 18, className, strokeWidth = 1.5 }: P) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <path d="M12 3.6 13.6 9 19 10.6 13.6 12.2 12 17.6 10.4 12.2 5 10.6 10.4 9Z" />
    <path d="M18.4 16.2 19 18l1.8.6-1.8.6-.6 1.8-.6-1.8-1.8-.6 1.8-.6Z" />
  </svg>
);

export const Ruler = ({ size = 18, className, strokeWidth = 1.5 }: P) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <rect x="2.6" y="8.4" width="18.8" height="7.2" rx="1.2" />
    <path d="M7 8.4v3M11 8.4v4.4M15 8.4v3M19 8.4v4.4" />
  </svg>
);

export const Shield = ({ size = 18, className, strokeWidth = 1.5 }: P) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <path d="M12 3.4 19 6v6c0 4.2-2.9 7.4-7 8.6-4.1-1.2-7-4.4-7-8.6V6Z" />
    <path d="m9.2 12 2 2 3.6-3.8" />
  </svg>
);

export const Truck = ({ size = 18, className, strokeWidth = 1.5 }: P) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <path d="M2.8 7h10.4v9H2.8z" />
    <path d="M13.2 10.4h3.8L20.6 14v2h-7.4z" />
    <circle cx="7" cy="18" r="1.8" /><circle cx="17.2" cy="18" r="1.8" />
  </svg>
);

export const Star = ({ size = 14, className, filled = false }: P & { filled?: boolean }) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24" aria-hidden
    fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.4}
    strokeLinejoin="round" className={className}
  >
    <path d="m12 3.6 2.7 5.6 6 .9-4.3 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.3 10.1l6-.9Z" />
  </svg>
);
