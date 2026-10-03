"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { Monogram } from "@/components/brand/Monogram";
import { formatMinor } from "@/lib/money";
import { askInsight, readSettings, writeSettings } from "@/lib/owner-client";
import type { Metric } from "@/lib/business";
import type { Product } from "@/lib/catalog/types";

export interface OwnerData {
  metrics: Metric[];
  products: {
    handle: string; title: string; unitsSold: number | null; revenueMinor: number | null;
    views: number; addsToBag: number; addRate: number | null;
  }[];
  gaps: string[];
  windowDays: number;
  analyticsSource: string;
  catalogueSource: string;
  currency: string;
}

const PHASES = ["morning", "afternoon", "evening", "night"] as const;

/**
 * A figure, or an em dash.
 *
 * `null` from the business layer means the number cannot be computed from
 * the data we hold — Shopify orders are not connected, or there are too few
 * views for a rate to mean anything. Printing 0 there would be a claim about
 * the business that is not true. A dash, with the reason under it, is.
 */
function renderMetric(m: Metric, currency: string): string {
  if (m.value === null) return "—";
  switch (m.kind) {
    case "currency": return formatMinor(m.value, currency);
    case "percent":  return `${(m.value * 100).toFixed(1)}%`;
    case "ratio":    return m.value.toFixed(2);
    default:         return new Intl.NumberFormat("en-IN").format(m.value);
  }
}

/**
 * The operations room.
 *
 * Not an admin dashboard with the showroom's wallpaper on it. It is plain,
 * dense and fast, because the Founder opens it to answer a question and
 * close it again — and because the one thing a business console must never
 * do is make a number harder to read than it has to be.
 *
 * Sign-in is a Supabase magic link. The anon key below is publishable by
 * design: it is what a browser needs to START a sign-in. It authorises
 * nothing on its own. Every route this console calls re-checks the returned
 * token server-side against OWNER_EMAILS, so holding the key gets you a
 * login form and nothing else.
 */
export function OwnerConsole({
  data,
  products,
  supabaseConfigured,
  supabaseUrl,
  supabaseAnonKey,
  ownerListConfigured,
  settings,
  settingsNote,
}: {
  data: OwnerData;
  products: Product[];
  supabaseConfigured: boolean;
  supabaseUrl: string;
  supabaseAnonKey: string;
  ownerListConfigured: boolean;
  settings: { placements?: Record<string, string>; featuredHandle?: string | null; forcedPhase?: string | null };
  settingsNote?: string;
}) {
  const [client, setClient] = useState<SupabaseClient | null>(null);
  const [email, setEmail] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [who, setWho] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [note, setNote] = useState("");

  const [featured, setFeatured] = useState(settings.featuredHandle ?? "");
  const [forced, setForced] = useState(settings.forcedPhase ?? "");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [thinking, setThinking] = useState(false);

  useEffect(() => {
    if (!supabaseConfigured || !supabaseUrl || !supabaseAnonKey) return;
    const c = createClient(supabaseUrl, supabaseAnonKey);
    setClient(c);
    void c.auth.getSession().then(({ data: s }) => {
      setToken(s.session?.access_token ?? null);
      setWho(s.session?.user?.email ?? null);
    });
    const { data: sub } = c.auth.onAuthStateChange((_e, session) => {
      setToken(session?.access_token ?? null);
      setWho(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, [supabaseConfigured, supabaseUrl, supabaseAnonKey]);

  /* Read the live settings once signed in — the server-rendered copy above
     was read without a token and may be the defaults. */
  useEffect(() => {
    if (!token) return;
    void readSettings(token).then((s) => {
      if (!s) return;
      setFeatured(s.featuredHandle ?? "");
      setForced(s.forcedPhase ?? "");
    });
  }, [token]);

  const signIn = useCallback(async () => {
    if (!client || !email) return;
    const { error } = await client.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/owner` },
    });
    setNote(error ? error.message : "Check your email for the link.");
    setSent(!error);
  }, [client, email]);

  const save = useCallback(
    async (patch: Parameters<typeof writeSettings>[1]) => {
      if (!token) return;
      const res = await writeSettings(token, patch);
      setNote(res.ok ? "Saved." : res.message ?? "Could not save.");
    },
    [token],
  );

  const ask = useCallback(async () => {
    if (!token || !question.trim()) return;
    setThinking(true);
    const res = await askInsight(token, question.trim());
    setAnswer(res.answer);
    setThinking(false);
  }, [token, question]);

  const topProducts = useMemo(
    () => [...data.products].sort((a, b) => (b.revenueMinor ?? -1) - (a.revenueMinor ?? -1)),
    [data.products],
  );

  /* ── not signed in ──────────────────────────────────────────── */
  if (!token) {
    return (
      <div className="own own--gate">
        <div className="own__gate glass glass--light">
          <Monogram size={30} />
          <h1 className="d-h3">Operations</h1>
          {!supabaseConfigured ? (
            <p className="small">
              Sign-in is not connected. Set SUPABASE_URL and SUPABASE_ANON_KEY, and put your email
              on OWNER_EMAILS.
            </p>
          ) : !ownerListConfigured ? (
            <p className="small">
              OWNER_EMAILS is empty, so no account can be an owner yet. Add your email to it.
            </p>
          ) : sent ? (
            <p className="small">{note}</p>
          ) : (
            <>
              <p className="small muted">A sign-in link will be emailed to you.</p>
              <input
                className="field" type="email" value={email} placeholder="you@neronoren.com"
                onChange={(e) => setEmail(e.target.value)} autoComplete="email"
              />
              <button type="button" className="btn btn--solid btn--block" onClick={() => void signIn()}>
                Email me a link
              </button>
              {note ? <p className="small">{note}</p> : null}
            </>
          )}
        </div>
      </div>
    );
  }

  /* ── signed in ──────────────────────────────────────────────── */
  return (
    <div className="own wrap band">
      <header className="own__head">
        <div>
          <p className="label label--soft">Operations · last {data.windowDays} days</p>
          <h1 className="d-h2">Nero Noren</h1>
        </div>
        <p className="small muted">
          {who}
          <button type="button" className="ul-grow label own__out" onClick={() => void client?.auth.signOut()}>
            Sign out
          </button>
        </p>
      </header>

      <ul className="own__metrics">
        {data.metrics.map((m) => (
          <li key={m.label} className="own__metric glass glass--light">
            <p className="label label--soft">{m.label}</p>
            <p className="own__value tnum">{renderMetric(m, data.currency)}</p>
            {m.value === null && m.unavailable ? (
              <p className="small muted">{m.unavailable}</p>
            ) : m.basis ? (
              <p className="small muted">{m.basis}</p>
            ) : null}
          </li>
        ))}
      </ul>

      <section className="own__block" aria-labelledby="own-prod">
        <h2 id="own-prod" className="d-h3">By piece</h2>
        <div className="own__tablewrap">
          <table className="own__table">
            <thead>
              <tr>
                <th scope="col">Piece</th><th scope="col">Views</th><th scope="col">Added</th>
                <th scope="col">Add rate</th><th scope="col">Sold</th><th scope="col">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((p) => (
                <tr key={p.handle}>
                  <th scope="row">{p.title}</th>
                  <td className="tnum">{p.views}</td>
                  <td className="tnum">{p.addsToBag}</td>
                  <td className="tnum">{p.addRate === null ? "—" : `${(p.addRate * 100).toFixed(1)}%`}</td>
                  <td className="tnum">{p.unitsSold ?? "—"}</td>
                  <td className="tnum">
                    {p.revenueMinor === null ? "—" : formatMinor(p.revenueMinor, data.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="small muted">
          Figures from {data.analyticsSource}; catalogue is {data.catalogueSource}.
        </p>
        {data.gaps.length ? (
          <ul className="own__gaps small">{data.gaps.map((g) => <li key={g}>{g}</li>)}</ul>
        ) : null}
      </section>

      <section className="own__block" aria-labelledby="own-room">
        <h2 id="own-room" className="d-h3">The showroom</h2>
        <div className="own__controls">
          <label className="own__ctl">
            <span className="label label--soft">Featured piece</span>
            <select
              className="field" value={featured}
              onChange={(e) => { setFeatured(e.target.value); void save({ featuredHandle: e.target.value || null }); }}
            >
              <option value="">None</option>
              {products.map((p) => <option key={p.handle} value={p.handle}>{p.title}</option>)}
            </select>
          </label>

          <label className="own__ctl">
            <span className="label label--soft">
              Pin the hour <span className="muted">— for photography. Leave on Automatic for customers.</span>
            </span>
            <select
              className="field" value={forced}
              onChange={(e) => { setForced(e.target.value); void save({ forcedPhase: e.target.value || null }); }}
            >
              <option value="">Automatic — the visitor&rsquo;s own hour</option>
              {PHASES.map((p) => <option key={p} value={p}>{p[0].toUpperCase() + p.slice(1)}</option>)}
            </select>
          </label>
        </div>
        {settingsNote ? <p className="small muted">{settingsNote}</p> : null}
        {note ? <p className="small">{note}</p> : null}
      </section>

      <section className="own__block" aria-labelledby="own-ask">
        <h2 id="own-ask" className="d-h3">Ask about the business</h2>
        <form className="own__ask" onSubmit={(e) => { e.preventDefault(); void ask(); }}>
          <input
            className="field" value={question} onChange={(e) => setQuestion(e.target.value)}
            placeholder="Which piece is viewed most but bought least?"
            aria-label="Ask about the business"
          />
          <button type="submit" className="btn btn--solid" disabled={thinking || !question.trim()}>
            {thinking ? "Thinking…" : "Ask"}
          </button>
        </form>
        {answer ? <p className="own__answer prose">{answer}</p> : null}
      </section>
    </div>
  );
}
