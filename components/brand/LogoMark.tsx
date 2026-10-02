import { Monogram } from "./Monogram";

/**
 * The mark, where a page asks for it by its old name.
 *
 * `sheen` is accepted and ignored. It described a gold animation that used
 * to run across the logo; the brand board is explicit that gold is a finish
 * on a physical object and never the mark's own colour, so the mark is now
 * ink — or ivory on the dark rooms — and nothing sweeps across it.
 */
export function LogoMark({
  size = 40,
  className,
  sheen: _sheen,
}: {
  size?: number;
  className?: string;
  sheen?: "loop" | "hover" | "none";
}) {
  return <Monogram size={size} className={className} title="Nero Noren" />;
}
