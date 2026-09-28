import { Monogram } from "./Monogram";

export function Wordmark({
  className = "",
  sub = true,
}: {
  className?: string;
  sub?: boolean;
}) {
  return (
    <span className={`inline-flex flex-col items-center leading-none ${className}`}>
      <span className="nn-wordmark text-[inherit]">Nero Noren</span>
      {sub && (
        <span className="nn-meta mt-[0.45em] text-ink-faint">Men &amp; Boys</span>
      )}
    </span>
  );
}

export function StackedLockup({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex flex-col items-center gap-3 ${className}`}>
      <Monogram className="h-[1.9em] w-auto" />
      <span className="nn-wordmark text-[0.42em]">Nero Noren</span>
    </span>
  );
}
