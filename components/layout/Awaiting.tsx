import Link from "next/link";
import type { ReactNode } from "react";
import { GlassButton } from "@/components/ui/glass/GlassButton";
import { N_INTERLOCK_X, N_PATH } from "@/components/brand/monogram";

/**
 * An honest waiting state.
 *
 * For parts of the house that exist in the identity but not yet in stock: the
 * boys' line is on every label the board shows, and the journal is in the
 * navigation, but neither has anything real behind it. Inventing products or
 * articles to fill them would be the one thing this brand must never do.
 *
 * So the page says plainly what is coming and what is not, in the same
 * materials as everywhere else, and points at what the customer can actually
 * buy today. A designed empty state is worth more than a fabricated full one.
 */
export function Awaiting({
  label,
  title,
  body,
  detail,
  action = { href: "/collection", label: "See Collection 001" },
  children,
}: {
  label: string;
  title: string;
  body: string;
  /** The honest specifics: what exists, what does not, what happens next. */
  detail?: ReactNode;
  action?: { href: string; label: string };
  children?: ReactNode;
}) {
  const width = N_INTERLOCK_X + 84;

  return (
    <div className="nn-awaiting">
      <div className="nn-wrap nn-awaiting__inner">
        <svg className="nn-awaiting__mark" viewBox={`0 0 ${width} 100`} aria-hidden="true">
          <defs>
            <linearGradient id="nn-await-metal" x1="0" y1="0" x2="1" y2="0.42">
              <stop offset="0%" stopColor="var(--metal-shadow)" />
              <stop offset="40%" stopColor="var(--metal-body)" />
              <stop offset="52%" stopColor="var(--metal-light)" />
              <stop offset="100%" stopColor="var(--metal-shadow)" />
            </linearGradient>
          </defs>
          <g fill="url(#nn-await-metal)" opacity="0.5">
            <path d={N_PATH} />
            <path d={N_PATH} transform={`translate(${N_INTERLOCK_X} 0)`} />
          </g>
        </svg>

        <p className="nn-label nn-label--metal">{label}</p>
        <h1 className="nn-awaiting__title">{title}</h1>
        <p className="nn-awaiting__body">{body}</p>

        {detail ? <div className="nn-awaiting__detail glass glass--panel">{detail}</div> : null}

        <div className="nn-awaiting__actions">
          <Link href={action.href}>
            <GlassButton tone="metal" size="md">
              {action.label}
            </GlassButton>
          </Link>
          <Link href="/" className="nn-link text-[var(--text-micro)] uppercase tracking-[var(--tracking-label)]">
            Back to the showroom
          </Link>
        </div>

        {children}
      </div>
    </div>
  );
}
