"use client";

/**
 * The parts an iOS settings screen is made of.
 *
 * Grouped cards on a recessed ground, a tinted icon tile at the head of each
 * row, the label left, the value and chevron right, and dividers that inset
 * past the icon rather than cutting the card in half. That pattern, because it
 * is the one every customer already knows — built in NN's materials rather
 * than Apple's.
 */

import Link from "next/link";

export function Group({
  title,
  footnote,
  children,
}: {
  title: string;
  footnote?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-9">
      <h2 className="nn-set-title">{title}</h2>
      <div className="nn-set-card">{children}</div>
      {footnote ? <p className="nn-set-footnote">{footnote}</p> : null}
    </section>
  );
}

export function Row({
  icon,
  tint,
  label,
  detail,
  value,
  action,
  onClick,
  href,
  destructive,
}: {
  icon: React.ReactNode;
  /** The icon tile's fill. */
  tint: string;
  label: string;
  detail?: string;
  value?: string;
  /** A control on the right, instead of a value and chevron. */
  action?: React.ReactNode;
  onClick?: () => void;
  href?: string;
  destructive?: boolean;
}) {
  const body = (
    <>
      <span className="nn-set-tile" style={{ background: tint }} aria-hidden="true">
        {icon}
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate" style={destructive ? { color: "var(--color-nn-burgundy)" } : undefined}>
          {label}
        </span>
        {detail ? <span className="nn-set-detail">{detail}</span> : null}
      </span>
      {action ?? null}
      {value ? <span className="nn-set-value">{value}</span> : null}
      {(onClick || href) && !action ? (
        <svg className="nn-set-chevron" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className="nn-set-row">
        {body}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" className="nn-set-row" onClick={onClick}>
        {body}
      </button>
    );
  }
  return <div className="nn-set-row">{body}</div>;
}

/** A switch. A real checkbox underneath, so it is keyboard operable. */
export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <label className="nn-switch">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={label}
      />
      <span className="nn-switch__track" aria-hidden="true">
        <span className="nn-switch__knob" />
      </span>
    </label>
  );
}

/** A segmented control, for a small set of choices. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (next: T) => void;
  label: string;
}) {
  return (
    <div className="nn-segmented" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          data-on={value === o.value}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** The icon set, drawn rather than imported. */
export const ICONS = {
  sun: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="4.4" />
      <path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.4 5.4l1.6 1.6M17 17l1.6 1.6M18.6 5.4L17 7M7 17l-1.6 1.6" />
    </svg>
  ),
  cube: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
      <path d="M12 2.8l8 4.6v9.2l-8 4.6-8-4.6V7.4z" />
      <path d="M4 7.4l8 4.6 8-4.6M12 12v9.2" />
    </svg>
  ),
  motion: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M3 12h4l2.5-6 3 12 2.5-6h4" />
    </svg>
  ),
  globe: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9.2" />
      <path d="M2.8 12h18.4M12 2.8c2.6 3 2.6 15.4 0 18.4M12 2.8c-2.6 3-2.6 15.4 0 18.4" />
    </svg>
  ),
  ruler: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
      <path d="M3.4 14.6L14.6 3.4l6 6L9.4 20.6z" />
      <path d="M7 11l2 2M10 8l2 2M13 5l2 2" strokeLinecap="round" />
    </svg>
  ),
  lock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
      <rect x="4.4" y="10.4" width="15.2" height="10.2" rx="2.2" />
      <path d="M8 10.4V7.6a4 4 0 0 1 8 0v2.8" />
    </svg>
  ),
  chart: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </svg>
  ),
  bag: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
      <path d="M5 8h14l-1.2 12.2H6.2z" />
      <path d="M8.8 8V6.2a3.2 3.2 0 0 1 6.4 0V8" strokeLinecap="round" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="9.2" />
      <path d="M12 11v6M12 7.6v.2" />
    </svg>
  ),
  trash: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
      <path d="M4.6 7h14.8M9 7V5.4a1.6 1.6 0 0 1 1.6-1.6h2.8A1.6 1.6 0 0 1 15 5.4V7" />
      <path d="M6.6 7l1 13.2h8.8L17.4 7" />
    </svg>
  ),
  sparkle: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
    </svg>
  ),
} as const;
