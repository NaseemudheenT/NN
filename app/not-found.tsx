import Link from "next/link";
import { LogoMark } from "@/components/brand/LogoMark";

export const metadata = { title: "Not found" };

export default function NotFound() {
  return (
    <div className="nn-wrap grid min-h-[72svh] place-items-center py-28 text-center">
      <div className="max-w-[42ch]">
        <div className="flex justify-center">
          <LogoMark size={48} />
        </div>
        <p className="nn-eyebrow mt-10">404</p>
        <h1 className="mt-4 text-[var(--text-step-2)]">This room does not exist</h1>
        <p className="mt-5 text-[var(--ink-soft)]">
          The page you were looking for is not here. The showroom is, and so is the whole
          collection.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link href="/" className="nn-btn nn-btn--gold">
            <span>Back to the showroom</span>
          </Link>
          <Link href="/collection" className="nn-btn nn-btn--quiet">
            <span>See Collection 001</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
