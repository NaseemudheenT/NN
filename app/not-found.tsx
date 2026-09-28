import Link from "next/link";
import { Monogram } from "@/components/brand/Monogram";
import { GlassButton } from "@/components/ui/glass/Glass";

export default function NotFound() {
  return (
    <div className="relative z-10 flex min-h-[70svh] flex-col items-center justify-center gap-7 px-6 py-32 text-center">
      <Monogram className="h-11 w-auto text-line" />
      <p className="nn-meta text-ink-faint">Nothing here</p>
      <h1 className="nn-display max-w-xl text-[clamp(2.2rem,6vw,4rem)] text-ink">
        This part of the showroom is empty
      </h1>
      <p className="nn-body max-w-md text-ink-soft">
        The piece or page you were looking for is not on this floor. The collection is through the
        hall.
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <GlassButton href="/collection" variant="solid">
          Collection 001
        </GlassButton>
        <GlassButton href="/" variant="quiet">
          Back to the entrance
        </GlassButton>
      </div>
      <Link href="/stylist" className="nn-label mt-4 text-ink-faint hover:text-ink">
        Or ask the stylist
      </Link>
    </div>
  );
}
