import Link from "next/link";
import { Monogram } from "@/components/brand/Monogram";

export const metadata = { title: "Not found" };

export default function NotFound() {
  return (
    <section className="miss band">
      <div className="wrap miss__in">
        <Monogram size={44} className="miss__mark" />
        <p className="label label--soft">404</p>
        <h1 className="d-h1">This room does not exist</h1>
        <p className="lead">
          The page you were looking for is not here. The showroom is, and so is the whole
          collection.
        </p>
        <div className="miss__acts">
          <Link href="/" className="btn btn--solid btn--lg">Back to the showroom</Link>
          <Link href="/collection" className="btn btn--line btn--lg">See Collection 001</Link>
        </div>
      </div>
    </section>
  );
}
