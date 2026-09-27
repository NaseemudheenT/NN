"use client";

/** One labelled field, with its error and hint wired up for screen readers. */
export function Field({
  id,
  label,
  error,
  hint,
  ...props
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const describedBy = [error ? `${id}-error` : null, hint ? `${id}-hint` : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div>
      <label className="nn-label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className="nn-field"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        style={error ? { borderColor: "var(--color-nn-burgundy)" } : undefined}
        {...props}
      />
      {hint && !error ? (
        <p id={`${id}-hint`} className="mt-1.5 text-[0.68rem] text-[var(--ink-faint)]">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-[0.72rem]" style={{ color: "var(--color-nn-burgundy)" }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
