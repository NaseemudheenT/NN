"use client";

/**
 * The owner console.
 *
 * Sign in with a magic link to an email on the OWNER_EMAILS list. Anyone else is
 * refused — and refused clearly, because a vague "access denied" wastes the
 * owner's time when they mistype their own address.
 *
 * Every figure shown here is either real or labelled as unavailable. There is no
 * placeholder data anywhere in this screen: a dashboard that shows an invented
 * conversion rate is actively harmful, because it gets acted on.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Product } from "@/lib/catalog/types";
import { formatMinor } from "@/lib/money";
import { LogoMark } from "@/components/brand/LogoMark";

interface Metric {
  label: string;
  value: number | null;
  kind: "currency" | "count" | "percent" | "ratio";
  unavailable?: string;
  basis?: string;
}

interface ProductPerformance {
  handle: string;
  title: string;
  unitsSold: number | null;
  revenueMinor: number | null;
  views: number;
  addsToBag: number;
  addRate: number | null;
}

export interface OwnerData {
  metrics: Metric[];
  products: ProductPerformance[];
  gaps: string[];
  windowDays: number;
  analyticsSource: string;
  catalogueSource: string;
  currency: string;
}

interface Settings {
  featuredHandle: string | null;
  forcedPhase: string | null;
  placements: Record<string, string>;
}

const PLACEMENT_LABELS: Record<string, string> = {
  "rail-a": "Rail one",
  "rail-b": "Rail two",
  table: "The oak table",
  "mannequin-1": "Mannequin one",
  "mannequin-2": "Mannequin two",
};

const PHASES = ["morning", "afternoon", "evening", "night"] as const;

export function OwnerConsole({
  data,
  products,
  supabaseConfigured,
  supabaseUrl,
  supabaseAnonKey,
  ownerListConfigured,
  settings: initialSettings,
  settingsNote,
}: {
  data: OwnerData;
  products: Product[];
  supabaseConfigured: boolean;
  supabaseUrl: string;
  supabaseAnonKey: string;
  ownerListConfigured: boolean;
  settings: Settings;
  settingsNote?: string;
}) {
  const [email, setEmail] = useState("");
  const [authState, setAuthState] = useState<"out" | "sending" | "sent" | "in" | "refused">("out");
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [signedInAs, setSignedInAs] = useState<string | null>(null);

  const [settings, setSettings] = useState<Settings>(initialSettings);
  const [saving, setSaving] = useState(false);
  const [saveNote, setSaveNote] = useState<string | null>(settingsNote ?? null);

  const [question, setQuestion] = useState("");
  const [insight, setInsight] = useState<string>("");
  const [thinking, setThinking] = useState(false);

  /* ── auth ── */

  /** Supabase returns the session in the URL fragment after a magic link. */
  useEffect(() => {
    if (!window.location.hash.includes("access_token")) return;
    const params = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = params.get("access_token");
    if (!accessToken) return;

    // Clear the fragment so the token is not left in the address bar or history.
    window.history.replaceState(null, "", window.location.pathname);

    void (async () => {
      try {
        const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
          headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${accessToken}` },
        });
        const user = (await res.json()) as { email?: string };
        if (!res.ok || !user.email) {
          setAuthState("refused");
          setAuthMessage("That sign-in link could not be verified. Ask for a new one.");
          return;
        }
        // Confirm with the server that this email is actually an owner.
        const check = await fetch("/api/owner/settings", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (check.status === 403) {
          setAuthState("refused");
          setAuthMessage(
            `${user.email} is not on the owner list. Add it to OWNER_EMAILS in .env.local if it should be.`,
          );
          return;
        }
        setToken(accessToken);
        setSignedInAs(user.email);
        setAuthState("in");
        const payload = (await check.json()) as { settings?: Settings };
        if (payload.settings) setSettings(payload.settings);
      } catch {
        setAuthState("refused");
        setAuthMessage("We could not complete the sign-in.");
      }
    })();
  }, [supabaseUrl, supabaseAnonKey]);

  const sendLink = useCallback(async () => {
    const address = email.trim().toLowerCase();
    if (!address) return;
    setAuthState("sending");
    setAuthMessage(null);
    try {
      const res = await fetch(`${supabaseUrl}/auth/v1/otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: supabaseAnonKey },
        body: JSON.stringify({
          email: address,
          create_user: false,
          options: { email_redirect_to: window.location.href.split("#")[0] },
        }),
      });
      if (!res.ok) {
        const detail = (await res.json().catch(() => null)) as { msg?: string } | null;
        setAuthState("out");
        setAuthMessage(detail?.msg ?? "Supabase would not send the link.");
        return;
      }
      setAuthState("sent");
      // Deliberately the same message whatever the address, so this page cannot
      // be used to find out which emails are owners.
      setAuthMessage(
        "If that address is on the owner list, a sign-in link is on its way. It is valid for one hour.",
      );
    } catch {
      setAuthState("out");
      setAuthMessage("We could not reach Supabase to send the link.");
    }
  }, [email, supabaseUrl, supabaseAnonKey]);

  /* ── settings ── */

  const saveSettings = useCallback(
    async (next: Partial<Settings>) => {
      if (!token) return;
      setSaving(true);
      setSaveNote(null);
      const merged = { ...settings, ...next };
      setSettings(merged);
      try {
        const res = await fetch("/api/owner/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(merged),
        });
        const payload = (await res.json()) as { message?: string; settings?: Settings };
        if (!res.ok) {
          setSaveNote(payload.message ?? "The settings could not be saved.");
        } else {
          setSaveNote("Saved. The live showroom will pick this up within the hour.");
          if (payload.settings) setSettings(payload.settings);
        }
      } catch {
        setSaveNote("The settings could not be saved.");
      } finally {
        setSaving(false);
      }
    },
    [token, settings],
  );

  /* ── the command centre ── */

  const ask = useCallback(
    async (q: string) => {
      if (!token || thinking) return;
      setThinking(true);
      setInsight("");
      try {
        const res = await fetch("/api/owner/insight", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ question: q }),
        });
        if (!res.ok || !res.body) {
          const payload = (await res.json().catch(() => null)) as { message?: string } | null;
          setInsight(payload?.message ?? "The command centre is unavailable.");
          return;
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const frames = buffer.split("\n\n");
          buffer = frames.pop() ?? "";
          for (const frame of frames) {
            const dataLine = frame.split("\n").find((l) => l.startsWith("data: "));
            if (!dataLine) continue;
            try {
              const payload = JSON.parse(dataLine.slice(6)) as {
                visible?: string;
                reply?: string;
                message?: string;
              };
              if (payload.visible) setInsight(payload.visible);
              else if (payload.reply) setInsight(payload.reply);
              else if (payload.message) setInsight(payload.message);
            } catch {
              /* ignore a malformed frame */
            }
          }
        }
      } catch {
        setInsight("The command centre could not answer just then.");
      } finally {
        setThinking(false);
      }
    },
    [token, thinking],
  );

  const render = useCallback(
    (m: Metric) => {
      if (m.value === null) return null;
      if (m.kind === "currency") return formatMinor(m.value, data.currency);
      if (m.kind === "percent") return `${(m.value * 100).toFixed(2)}%`;
      return new Intl.NumberFormat("en-IN").format(m.value);
    },
    [data.currency],
  );

  const byHandle = useMemo(() => new Map(products.map((p) => [p.handle, p])), [products]);

  /* ── not signed in ── */

  if (authState !== "in") {
    return (
      <div className="nn-wrap grid min-h-[70svh] place-items-center py-24">
        <div className="w-full max-w-[26rem]">
          <div className="flex justify-center">
            <LogoMark size={44} />
          </div>
          <h1 className="mt-9 text-center text-[var(--text-step-2)]">Owner console</h1>
          <p className="mt-4 text-center text-[var(--text-step--1)] text-[var(--ink-soft)]">
            Sign in with a link sent to your email. There is no password to remember, and none
            for us to store.
          </p>

          {!supabaseConfigured || !ownerListConfigured ? (
            <div
              className="mt-8 border p-5 text-[var(--text-step--1)] text-[var(--ink-soft)]"
              style={{ borderColor: "var(--accent)" }}
            >
              <p className="nn-eyebrow" style={{ color: "var(--accent)" }}>
                Not configured yet
              </p>
              <ul className="mt-3 flex list-none flex-col gap-2 p-0">
                {!supabaseConfigured ? (
                  <li>
                    Set <code className="text-[var(--ink)]">SUPABASE_URL</code> and{" "}
                    <code className="text-[var(--ink)]">SUPABASE_ANON_KEY</code> in{" "}
                    <code className="text-[var(--ink)]">.env.local</code>.
                  </li>
                ) : null}
                {!ownerListConfigured ? (
                  <li>
                    Set <code className="text-[var(--ink)]">OWNER_EMAILS</code> to the addresses
                    allowed in here, comma separated.
                  </li>
                ) : null}
              </ul>
            </div>
          ) : (
            <form
              className="mt-8 flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                void sendLink();
              }}
            >
              <div>
                <label className="nn-label" htmlFor="nn-owner-email">
                  Your email
                </label>
                <input
                  id="nn-owner-email"
                  className="nn-field"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="nn-btn nn-btn--solid w-full"
                disabled={authState === "sending"}
              >
                <span>{authState === "sending" ? "Sending…" : "Send me a link"}</span>
              </button>
            </form>
          )}

          {authMessage ? (
            <p
              className="mt-6 text-center text-[var(--text-step--1)]"
              role="status"
              style={{
                color: authState === "refused" ? "var(--color-nn-burgundy)" : "var(--ink-soft)",
              }}
            >
              {authMessage}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  /* ── signed in ── */

  return (
    <div className="nn-wrap py-16">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-6">
        <div>
          <p className="nn-eyebrow">Owner console</p>
          <h1 className="mt-2 text-[var(--text-step-2)]">Nero Noren</h1>
        </div>
        <p className="text-[var(--text-step--1)] text-[var(--ink-faint)]">
          {signedInAs} · last {data.windowDays} days
        </p>
      </div>

      {/* what we cannot tell you, said first */}
      {data.gaps.length ? (
        <section
          className="mt-8 border p-5"
          style={{ borderColor: "var(--accent)", background: "var(--surface)" }}
          aria-label="Data gaps"
        >
          <h2 className="nn-eyebrow" style={{ color: "var(--accent)" }}>
            What this dashboard cannot tell you yet
          </h2>
          <ul className="mt-3 flex list-none flex-col gap-2 p-0 text-[var(--text-step--1)] text-[var(--ink-soft)]">
            {data.gaps.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* the figures */}
      <section className="mt-10" aria-label="Headline figures">
        <div className="grid gap-px [grid-template-columns:repeat(auto-fit,minmax(min(200px,100%),1fr))]"
          style={{ background: "var(--line)", border: "1px solid var(--line)" }}
        >
          {data.metrics.map((m) => (
            <div key={m.label} className="p-6" style={{ background: "var(--bg)" }}>
              <p className="nn-eyebrow">{m.label}</p>
              {m.value === null ? (
                <>
                  <p className="mt-3 font-[family-name:var(--font-display)] text-[1.6rem] leading-none text-[var(--ink-faint)]">
                    Not available
                  </p>
                  <p className="mt-2 text-[0.68rem] text-[var(--ink-faint)]">{m.unavailable}</p>
                </>
              ) : (
                <>
                  <p className="nn-tabular mt-3 font-[family-name:var(--font-display)] text-[2.2rem] leading-none">
                    {render(m)}
                  </p>
                  {m.basis ? (
                    <p className="mt-2 text-[0.68rem] text-[var(--ink-faint)]">{m.basis}</p>
                  ) : null}
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* per product */}
      <section className="mt-14" aria-label="Product performance">
        <h2 className="text-[var(--text-step-1)]">By piece</h2>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[46rem] border-collapse text-[var(--text-step--1)]">
            <thead>
              <tr>
                <th scope="col" className="nn-eyebrow border-b p-3 text-left">Piece</th>
                <th scope="col" className="nn-eyebrow border-b p-3 text-right">Sold</th>
                <th scope="col" className="nn-eyebrow border-b p-3 text-right">Revenue</th>
                <th scope="col" className="nn-eyebrow border-b p-3 text-right">Views</th>
                <th scope="col" className="nn-eyebrow border-b p-3 text-right">Added</th>
                <th scope="col" className="nn-eyebrow border-b p-3 text-right">Add rate</th>
              </tr>
            </thead>
            <tbody>
              {data.products.map((p) => (
                <tr key={p.handle}>
                  <th scope="row" className="border-b p-3 text-left font-normal">
                    {p.title}
                  </th>
                  <td className="nn-tabular border-b p-3 text-right">
                    {p.unitsSold ?? <span className="text-[var(--ink-faint)]">—</span>}
                  </td>
                  <td className="nn-tabular border-b p-3 text-right">
                    {p.revenueMinor === null ? (
                      <span className="text-[var(--ink-faint)]">—</span>
                    ) : (
                      formatMinor(p.revenueMinor, data.currency)
                    )}
                  </td>
                  <td className="nn-tabular border-b p-3 text-right">{p.views}</td>
                  <td className="nn-tabular border-b p-3 text-right">{p.addsToBag}</td>
                  <td className="nn-tabular border-b p-3 text-right">
                    {p.addRate === null ? (
                      <span className="text-[var(--ink-faint)]" title="Too few views to state a rate">
                        —
                      </span>
                    ) : (
                      `${(p.addRate * 100).toFixed(1)}%`
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[0.68rem] text-[var(--ink-faint)]">
          A dash means the figure cannot be computed from the data held, not that it is zero.
        </p>
      </section>

      {/* showroom controls */}
      <section className="mt-14" aria-label="Showroom controls">
        <h2 className="text-[var(--text-step-1)]">The showroom floor</h2>
        <p className="mt-3 max-w-[60ch] text-[var(--text-step--1)] text-[var(--ink-soft)]">
          What sits where, and which piece the showroom leads with. Saved to Supabase; the live
          site reads it.
        </p>

        <div className="mt-8 grid gap-10 lg:grid-cols-2">
          <div>
            <label className="nn-label" htmlFor="nn-featured">Featured piece</label>
            <select
              id="nn-featured"
              className="nn-field"
              value={settings.featuredHandle ?? ""}
              disabled={saving}
              onChange={(e) => void saveSettings({ featuredHandle: e.target.value || null })}
            >
              <option value="">No featured piece</option>
              {products.map((p) => (
                <option key={p.handle} value={p.handle}>
                  {p.title}
                </option>
              ))}
            </select>

            <fieldset className="mt-8 border-0 p-0">
              <legend className="nn-label">Preview a time of day</legend>
              <p className="mb-3 text-[0.68rem] text-[var(--ink-faint)]">
                Forcing a phase overrides every visitor&rsquo;s own clock. Leave it on
                &ldquo;follow the visitor&rdquo; unless you are running a campaign.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void saveSettings({ forcedPhase: null })}
                  className="border px-3 py-2 text-[0.72rem] uppercase tracking-[0.14em]"
                  style={{
                    borderColor: settings.forcedPhase === null ? "var(--btn-bg)" : "var(--line)",
                    background: settings.forcedPhase === null ? "var(--btn-bg)" : "transparent",
                    color: settings.forcedPhase === null ? "var(--btn-ink)" : "var(--ink-soft)",
                  }}
                >
                  Follow the visitor
                </button>
                {PHASES.map((phase) => {
                  const on = settings.forcedPhase === phase;
                  return (
                    <button
                      key={phase}
                      type="button"
                      disabled={saving}
                      onClick={() => void saveSettings({ forcedPhase: phase })}
                      className="border px-3 py-2 text-[0.72rem] uppercase tracking-[0.14em]"
                      style={{
                        borderColor: on ? "var(--btn-bg)" : "var(--line)",
                        background: on ? "var(--btn-bg)" : "transparent",
                        color: on ? "var(--btn-ink)" : "var(--ink-soft)",
                      }}
                    >
                      {phase}
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-[0.68rem] text-[var(--ink-faint)]">
                To look at a phase yourself without changing anything for anyone, open{" "}
                <code className="text-[var(--ink)]">/?phase=night</code>.
              </p>
            </fieldset>
          </div>

          <div>
            <p className="nn-label">Where each piece stands</p>
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {products.map((p) => {
                const current = settings.placements[p.handle] ?? p.placement;
                return (
                  <li key={p.handle} className="flex items-center justify-between gap-4 border-b py-2">
                    <span className="min-w-0 truncate text-[var(--text-step--1)]">{p.title}</span>
                    <select
                      className="nn-field w-auto py-1.5 text-[0.8rem]"
                      value={current}
                      disabled={saving}
                      aria-label={`Where ${p.title} stands`}
                      onChange={(e) =>
                        void saveSettings({
                          placements: { ...settings.placements, [p.handle]: e.target.value },
                        })
                      }
                    >
                      {Object.entries(PLACEMENT_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {saveNote ? (
          <p className="mt-6 text-[var(--text-step--1)] text-[var(--ink-soft)]" role="status">
            {saveNote}
          </p>
        ) : null}
      </section>

      {/* the command centre */}
      <section className="mt-14" aria-label="NN Command Centre">
        <h2 className="text-[var(--text-step-1)]">NN Command Centre</h2>
        <p className="mt-3 max-w-[60ch] text-[var(--text-step--1)] text-[var(--ink-soft)]">
          Ask about the business. It is given exactly the figures above and nothing else, so it
          cannot invent one — where a number is missing it will say so.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {[
            "Give me today's summary.",
            "What is selling and what is not?",
            "Anything unusual this week?",
            "Which piece should I restock first?",
          ].map((q) => (
            <button
              key={q}
              type="button"
              disabled={thinking}
              onClick={() => void ask(q)}
              className="border px-3 py-2 text-[0.72rem] text-[var(--ink-soft)] transition-colors duration-500 hover:border-[var(--accent)] hover:text-[var(--ink)] disabled:opacity-40"
              style={{ borderColor: "var(--line)" }}
            >
              {q}
            </button>
          ))}
        </div>

        <form
          className="mt-5 flex gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            const q = question;
            setQuestion("");
            void ask(q);
          }}
        >
          <label className="sr-only" htmlFor="nn-owner-question">Ask the command centre</label>
          <input
            id="nn-owner-question"
            className="nn-field flex-1"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about the numbers…"
            maxLength={500}
            disabled={thinking}
          />
          <button type="submit" className="nn-btn" disabled={thinking || !question.trim()}>
            <span>{thinking ? "Thinking" : "Ask"}</span>
          </button>
        </form>

        {insight || thinking ? (
          <div
            className="mt-6 whitespace-pre-wrap border p-6 text-[var(--text-step--1)]"
            style={{ background: "var(--surface)", borderColor: "var(--line)" }}
            aria-live="polite"
          >
            {insight || "Reading the dashboard…"}
          </div>
        ) : null}
      </section>

      <p className="mt-16 border-t pt-6 text-[0.68rem] text-[var(--ink-faint)]">
        Catalogue source: {data.catalogueSource}. Visitor figures: {data.analyticsSource}, and
        only from visitors who agreed to be counted. {byHandle.size} pieces in the range.
      </p>
    </div>
  );
}
