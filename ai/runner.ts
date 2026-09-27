import "server-only";

/**
 * The tool-use loop.
 *
 * Claude answers, and where it needs a real fact it asks for one. This runs
 * that exchange: stream the text out as it is written, execute any tool the
 * model calls, hand the results back, and let it continue — up to a hard cap,
 * so a confused model cannot loop forever at the founder's expense.
 *
 * Tools marked `confirms` never act. They return a proposal, which is passed to
 * the interface as a pending confirmation for a person to approve.
 */

import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/lib/env";
import type { NNTool, ToolContext } from "./tools/types";

export interface RunOptions {
  model: string;
  system: string;
  messages: Anthropic.MessageParam[];
  tools: readonly NNTool<never>[];
  maxToolCalls: number;
  maxTokens: number;
  ctx: ToolContext;
  /** Called with the visible text so far, every time it grows. */
  onText?: (visible: string) => void;
  /** Called when a tool is about to run, for the server log. */
  onTool?: (name: string, input: unknown) => void;
}

export interface RunResult {
  text: string;
  /** Tools that ran, in order. */
  toolsUsed: { name: string; input: unknown; result: unknown }[];
  /** Proposals awaiting a person's confirmation. */
  confirmations: { tool: string; payload: unknown }[];
  stopReason: string | null;
}

export async function runConversation(options: RunOptions): Promise<RunResult> {
  const client = new Anthropic({ apiKey: env.anthropicKey });
  const byName = new Map(options.tools.map((t) => [t.definition.name, t]));
  const definitions = options.tools.map((t) => t.definition);

  const messages: Anthropic.MessageParam[] = [...options.messages];
  const toolsUsed: RunResult["toolsUsed"] = [];
  const confirmations: RunResult["confirmations"] = [];

  let text = "";
  let calls = 0;
  let stopReason: string | null = null;

  for (;;) {
    const stream = client.messages.stream({
      model: options.model,
      max_tokens: options.maxTokens,
      system: options.system,
      messages,
      tools: definitions,
    });

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        text += event.delta.text;
        options.onText?.(text);
      }
    }

    const message = await stream.finalMessage();
    stopReason = message.stop_reason;

    if (message.stop_reason !== "tool_use") break;

    const toolUses = message.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
    );
    if (!toolUses.length) break;

    // Record the assistant's turn verbatim, tool calls included.
    messages.push({ role: "assistant", content: message.content });

    const results: Anthropic.ToolResultBlockParam[] = [];
    for (const use of toolUses) {
      calls += 1;
      if (calls > options.maxToolCalls) {
        results.push({
          type: "tool_result",
          tool_use_id: use.id,
          content:
            "Tool call limit reached for this reply. Answer with what you already have, and say plainly if something is still unknown.",
          is_error: true,
        });
        continue;
      }

      const tool = byName.get(use.name);
      if (!tool) {
        results.push({
          type: "tool_result",
          tool_use_id: use.id,
          content: `No tool named ${use.name} exists.`,
          is_error: true,
        });
        continue;
      }

      options.onTool?.(use.name, use.input);

      try {
        const result = await tool.execute(use.input as never, options.ctx);
        toolsUsed.push({ name: use.name, input: use.input, result });
        if (tool.confirms) confirmations.push({ tool: use.name, payload: result });
        results.push({
          type: "tool_result",
          tool_use_id: use.id,
          content: JSON.stringify(result),
        });
      } catch (err) {
        console.error(`[ai] tool ${use.name} failed:`, err);
        results.push({
          type: "tool_result",
          tool_use_id: use.id,
          content: "That lookup failed. Say you could not retrieve it rather than guessing.",
          is_error: true,
        });
      }
    }

    messages.push({ role: "user", content: results });

    if (calls >= options.maxToolCalls) {
      // One final turn to answer with what it has, then stop.
      const final = await client.messages.create({
        model: options.model,
        max_tokens: options.maxTokens,
        system: options.system,
        messages,
      });
      for (const block of final.content) {
        if (block.type === "text") {
          text += block.text;
          options.onText?.(text);
        }
      }
      stopReason = final.stop_reason;
      break;
    }
  }

  return { text, toolsUsed, confirmations, stopReason };
}
