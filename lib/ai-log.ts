import "server-only";

/**
 * Conversation logging, for the get_ai_insights tool.
 *
 * Only ever called after the visitor has consented under the DPDP banner, and
 * only the question, the reply and which tools ran. No address, no identifier,
 * no bag contents, no measurements. The hour is rounded, as everywhere else.
 *
 * Expects a table created by hand — this code never creates one:
 *
 *   create table nn_ai_conversations (
 *     id         bigint generated always as identity primary key,
 *     surface    text not null,
 *     question   text not null,
 *     reply      text not null,
 *     tools      text[] not null default '{}',
 *     hour       text not null,
 *     created_at timestamptz not null default now()
 *   );
 *   alter table nn_ai_conversations enable row level security;
 */

import { env, supabaseReady } from "./env";

const TABLE = "nn_ai_conversations";

export interface ConversationLog {
  surface: "stylist" | "owner";
  question: string;
  reply: string;
  tools: string[];
}

export async function logConversation(entry: ConversationLog): Promise<void> {
  if (!supabaseReady()) return;
  const key = env.supabaseServiceKey || env.supabaseAnonKey;
  if (!env.supabaseUrl || !key) return;

  try {
    const res = await fetch(`${env.supabaseUrl}/rest/v1/${TABLE}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: key,
        Authorization: `Bearer ${key}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        surface: entry.surface,
        question: entry.question.slice(0, 1000),
        reply: entry.reply.slice(0, 4000),
        tools: entry.tools,
        hour: new Date().toISOString().slice(0, 13),
      }),
      cache: "no-store",
    });
    if (!res.ok) {
      console.warn(`[ai-log] Supabase rejected the entry (${res.status}). Has ${TABLE} been created?`);
    }
  } catch (err) {
    // Logging must never break a conversation.
    console.warn("[ai-log] could not record conversation:", err);
  }
}
