"use client";

import Link from "next/link";
import { Monogram } from "@/components/brand/Monogram";
import { ArrowRight } from "@/components/ui/icons";
import { useStylist } from "./StylistProvider";

const PROMPTS = ["Wedding look", "Business attire", "European style", "Winter outfit"];

/**
 * The stylist's own page.
 *
 * The conversation itself lives in the panel, so that an answer given on a
 * product page and an answer given here are the same conversation — opening
 * this page and losing the thread you started two clicks ago would be a
 * different assistant wearing the same name.
 */
export function StylistHero({ live, count }: { live: boolean; count: number }) {
  const { open } = useStylist();

  return (
    <section className="sty nn-room">
      <div className="wrap sty__in">
        <div className="sty__body">
          <p className="sty__badge label"><Monogram size={18} /> AI stylist</p>
          <h1 className="d-h1">Your personal styling assistant</h1>
          <p className="lead sty__lead">
            Tell us what you are looking for and we will put together a look from the Nero Noren
            collection. Everything suggested is one of the {count} pieces actually in the catalogue —
            in a size that is actually in stock.
          </p>

          <button type="button" className="sty__ask" onClick={open}>
            <span className="sty__ask-text">e.g. &ldquo;I need a look for a formal dinner&rdquo;</span>
            <span className="sty__ask-go" aria-hidden><ArrowRight size={17} /></span>
          </button>

          <p className="label label--soft sty__popular">Popular requests</p>
          <ul className="sty__chips">
            {PROMPTS.map((p) => (
              <li key={p}><button type="button" className="chip" onClick={open}>{p}</button></li>
            ))}
          </ul>

          {!live ? (
            <p className="small sty__offline">
              The stylist is not connected yet. Until it is,{" "}
              <Link href="/collection" className="ul-grow">the collection</Link> is eight pieces and
              they all go together — that is what it was cut for.
            </p>
          ) : null}
        </div>

        <div className="sty__orb" aria-hidden>
          <span className="sty__orb-core" />
          <span className="sty__orb-halo" />
        </div>
      </div>
      <p className="wrap label label--soft sty__sig">Style, refined by AI</p>
    </section>
  );
}
