import "server-only";
import type Anthropic from "@anthropic-ai/sdk";

/**
 * A tool the AI can call.
 *
 * `definition` is what Claude sees. `execute` is what actually runs, on the
 * server, with real data. `confirms` marks a tool that changes something the
 * customer or owner would want to approve first — those never execute directly;
 * they return a proposal the interface turns into a confirm step.
 */
export interface NNTool<TInput = Record<string, unknown>> {
  definition: Anthropic.Tool;
  execute: (input: TInput, ctx: ToolContext) => Promise<unknown>;
  /** True when this tool proposes an action rather than performing one. */
  confirms?: boolean;
}

export interface ToolContext {
  /** Set for owner tools; null for a customer conversation. */
  ownerEmail: string | null;
  /** Rough locale of the visitor, for delivery estimates. */
  pin?: string;
}

export const ok = (data: unknown) => data;
export const refuse = (reason: string) => ({ error: reason });
