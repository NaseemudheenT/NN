/**
 * Which Claude model does which job.
 *
 * One engine, three tiers. Mixing providers doubles the cost and the failure
 * modes for no gain to the customer.
 *
 * Note on the brief: it named `claude-opus-5-5` for the owner console. That is
 * not a model id that exists, so the owner console runs on `claude-opus-5`,
 * which is the strongest reasoning model available. Change it here if a newer
 * one ships — it is the only place a model name appears.
 */

export const MODELS = {
  /** Customer stylist. Fast, and smart enough to reason about a wardrobe. */
  stylist: "claude-sonnet-5",
  /** Owner command centre. Strongest reasoning, for business decisions. */
  owner: "claude-opus-5",
  /** Background work: tagging questions, summarising. Cheap and quick. */
  background: "claude-haiku-4-5-20251001",
} as const;

/** Caps, so a single conversation cannot run up a bill. */
export const LIMITS = {
  stylist: { maxTokens: 900, maxToolCalls: 5, maxQuestionChars: 600, historyTurns: 8 },
  owner: { maxTokens: 1600, maxToolCalls: 8, maxQuestionChars: 800, historyTurns: 10 },
  /** Messages per visitor per hour. */
  rateLimitPerHour: 20,
} as const;
