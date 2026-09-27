import type { Metadata } from "next";
import { Awaiting } from "@/components/layout/Awaiting";

export const metadata: Metadata = {
  title: "Boys",
  description:
    "The Nero Noren boys' line is in development. Men & Boys is on every label; the clothes follow.",
  alternates: { canonical: "/boys" },
};

export default function BoysPage() {
  return (
    <Awaiting
      label="Men &amp; Boys"
      title="The boys' line is being cut"
      body="Men &amp; Boys is on the label, the hangtag and the door, because it is what Nero Noren is for. The clothes are not ready yet, and we would rather tell you that than show you something we cannot send."
      detail={
        <>
          <h2 className="nn-awaiting__detailtitle">Where it stands</h2>
          <dl className="nn-awaiting__list">
            <div>
              <dt>The intention</dt>
              <dd>
                The same cloth and the same construction as the men&rsquo;s range, cut for boys.
                Not a shrunken copy — a boy&rsquo;s shoulders are not a small man&rsquo;s.
              </dd>
            </div>
            <div>
              <dt>What exists today</dt>
              <dd>Collection 001, in men&rsquo;s sizes. Eight pieces.</dd>
            </div>
            <div>
              <dt>What does not</dt>
              <dd>
                Boys&rsquo; patterns, boys&rsquo; sizing and boys&rsquo; samples. No date has been
                set, and we will not invent one.
              </dd>
            </div>
          </dl>
        </>
      }
    />
  );
}
