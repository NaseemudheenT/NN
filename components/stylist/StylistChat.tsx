"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Monogram } from "@/components/brand/Monogram";
import { ArrowRight, Close } from "@/components/ui/icons";
import { askStylist, type StylistTurn } from "@/lib/stylist-client";
import { formatMinor } from "@/lib/money";
import type { Product } from "@/lib/catalog/types";
import { useBag } from "@/lib/bag/BagProvider";
import { useStylist } from "./StylistProvider";
import { useEscape, useFocusTrap, useLockScroll } from "@/lib/ui/overlay";
import { hasConsent } from "@/components/layout/ConsentBanner";

const PROMPTS = ["Wedding look", "Business attire", "European style", "Winter outfit"];

/**
 * The stylist.
 *
 * The one rule that governs this whole component: the ONLY products that
 * may be shown are the handles the server returned in its `done` event.
 * Those have been checked against the real catalogue. Anything the model
 * merely wrote in prose is prose — a confidently-named piece that does not
 * exist is the single worst thing a shop's assistant can do, so nothing is
 * rendered from the text, ever.
 */
export function StylistChat({ catalogue }: { catalogue: Product[] }) {
  const { isOpen, close } = useStylist();
  const { add } = useBag();
  const [turns, setTurns] = useState<StylistTurn[]>([]);
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState("");
  const [tool, setTool] = useState("");
  const [busy, setBusy] = useState(false);
  const [shown, setShown] = useState<Product[]>([]);
  const [error, setError] = useState("");
  const abort = useRef<AbortController | null>(null);
  const log = useRef<HTMLDivElement>(null);

  const ref = useFocusTrap<HTMLDivElement>(isOpen);
  useEscape(isOpen, close);
  useLockScroll(isOpen);

  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight, behavior: "smooth" });
  }, [turns, streaming, shown]);

  useEffect(() => () => abort.current?.abort(), []);

  const ask = useCallback(
    async (question: string) => {
      const q = question.trim();
      if (!q || busy) return;
      setDraft("");
      setError("");
      setShown([]);
      setBusy(true);
      setStreaming("");
      const history = turns;
      setTurns((t) => [...t, { role: "user", text: q }]);

      abort.current?.abort();
      const ac = new AbortController();
      abort.current = ac;

      await askStylist({
        question: q,
        history,
        consent: hasConsent(),
        context: {
          localTime: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
          dayPhase: document.documentElement.dataset.phase ?? "",
          currentPage: window.location.pathname,
          currentProduct: "",
          bagSummary: "",
        },
        signal: ac.signal,
        events: {
          onTool: setTool,
          onDelta: setStreaming,
          onDone: ({ reply, products }) => {
            setTurns((t) => [...t, { role: "assistant", text: reply }]);
            setStreaming("");
            setTool("");
            setBusy(false);
            /* server-verified handles only */
            setShown(products.map((h) => catalogue.find((p) => p.handle === h)).filter(Boolean) as Product[]);
          },
          onFallback: (reason) => {
            setError(reason);
            setStreaming("");
            setTool("");
            setBusy(false);
          },
        },
      });
    },
    [busy, turns, catalogue],
  );

  if (!isOpen) return null;

  return (
    <div className="sheet" role="presentation">
      <button type="button" className="sheet__scrim" aria-label="Close stylist" onClick={close} />
      <div
        ref={ref}
        className="sheet__panel sheet__panel--right nn-room glass"
        role="dialog"
        aria-modal="true"
        aria-label="Nero Noren stylist"
        tabIndex={-1}
      >
        <header className="sheet__head">
          <span className="sheet__title">
            <Monogram size={20} />
            <span className="label">AI Stylist</span>
          </span>
          <button type="button" className="icon-btn" onClick={close} aria-label="Close"><Close /></button>
        </header>

        <div className="styl__log" ref={log}>
          {turns.length === 0 && !streaming ? (
            <div className="styl__intro">
              <span className="styl__orb" aria-hidden />
              <h2 className="d-h2">Your personal styling assistant</h2>
              <p className="lead">
                Tell me what you are looking for. I read the real Nero Noren collection — so everything
                I put in front of you is a piece you can actually buy, in a size that is actually in stock.
              </p>
            </div>
          ) : null}

          {turns.map((t, i) => (
            <p key={i} className={t.role === "user" ? "styl__you" : "styl__me"}>{t.text}</p>
          ))}

          {streaming ? <p className="styl__me">{streaming}<span className="styl__caret" /></p> : null}
          {tool && busy ? <p className="styl__tool label label--soft">{tool}…</p> : null}
          {error ? (
            <p className="styl__error small">
              {error} — the collection is still right here:{" "}
              <Link href="/collection" className="ul-grow">browse it</Link>.
            </p>
          ) : null}

          {shown.length ? (
            <ul className="styl__picks">
              {shown.map((p) => (
                <li key={p.handle} className="styl__pick">
                  <Link href={`/product/${p.handle}`} className="styl__pick-img">
                    {p.images[0] ? (
                      <Image src={p.images[0].url} alt={p.images[0].alt} width={120} height={160} />
                    ) : (
                      <span className="styl__pick-swatch" style={{ background: p.hex }} />
                    )}
                  </Link>
                  <div className="styl__pick-body">
                    <Link href={`/product/${p.handle}`} className="styl__pick-name">{p.name}</Link>
                    <span className="small muted">{p.colour}</span>
                    <span className="tnum">{formatMinor(p.priceMinor, p.currency)}</span>
                    <button
                      type="button"
                      className="btn btn--glass btn--sm"
                      onClick={() => {
                        const v = p.variants.find((x) => x.available) ?? p.variants[0];
                        if (v) add({ handle: p.handle, size: v.size, quantity: 1, variantId: v.id }, p.name);
                      }}
                    >
                      Add to bag
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="styl__foot">
          <div className="styl__chips">
            {PROMPTS.map((p) => (
              <button key={p} type="button" className="chip" onClick={() => void ask(`I need a ${p.toLowerCase()}.`)} disabled={busy}>
                {p}
              </button>
            ))}
          </div>
          <form
            className="styl__form"
            onSubmit={(e) => { e.preventDefault(); void ask(draft); }}
          >
            <input
              className="field"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder='e.g. "I need a look for a formal dinner"'
              aria-label="Ask the stylist"
              disabled={busy}
            />
            <button type="submit" className="icon-btn styl__send" disabled={busy || !draft.trim()} aria-label="Send">
              <ArrowRight />
            </button>
          </form>
          <p className="label label--soft styl__sig">Style, refined by AI</p>
        </div>
      </div>
    </div>
  );
}
