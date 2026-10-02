import Link from "next/link";
import { Plate } from "@/components/ui/Plate";

/**
 * Men & boys.
 *
 * The audience lockup from the brand board, given a band of its own. It is
 * not a marketing line — it is the shape of the label: the same cloth and
 * the same cut at two scales, which is the whole reason the collection
 * exists in both.
 */
export function Generations() {
  return (
    <section className="gen nn-room" aria-labelledby="gen-h">
      <Plate kind="street" alt="" className="gen__bg" sizes="100vw" />
      <span className="gen__shade" aria-hidden />
      <div className="wrap gen__in reveal">
        <h2 id="gen-h" className="d-h1">Men &amp; boys</h2>
        <p className="lead gen__sub">Generations of style</p>
        <Link href="/collection" className="btn btn--glass btn--lg">Explore collection</Link>
      </div>
    </section>
  );
}
