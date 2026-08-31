import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { agentSchemas, type AgentKey } from "./agent-schemas";
import { agentKeys, stageInput, systemPromptFor } from "./agent-runtime";
import { demoAgentOutput } from "./demo-agent-outputs";

/**
 * Typed RPC boundary. All provider credentials stay on the server; the browser
 * only ever sees structured agent output plus an execution mode (REAL | DEMO).
 */

export type StageResult = {
  agent: AgentKey;
  mode: "REAL" | "DEMO";
  model: string | null;
  output: Record<string, unknown>;
  durationMs: number;
  tokens: number | null;
  notice: string | null;
};

export const getProviderStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { readProviderConfig } = await import("./llm.server");
  const cfg = readProviderConfig();
  return {
    provider: "NVIDIA NIM",
    configured: cfg.configured,
    model: cfg.model,
    baseUrl: cfg.baseUrl,
    mode: cfg.configured ? ("REAL" as const) : ("DEMO" as const),
  };
});

export const runAgentStage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => stageInput.parse(input))
  .handler(async ({ data }): Promise<StageResult> => {
    const started = Date.now();
    const agent = data.agent as AgentKey;
    const schema = agentSchemas[agent];

    const { getProvider, LlmError } = await import("./llm.server");
    const provider = getProvider();

    if (!provider) {
      return {
        agent,
        mode: "DEMO",
        model: null,
        output: schema.parse(demoAgentOutput(agent, data.prompt)) as Record<string, unknown>,
        durationMs: Date.now() - started,
        tokens: null,
        notice: "AI provider is not configured — showing labelled demo output.",
      };
    }

    try {
      const { value, raw } = await provider.generateStructured(
        [
          { role: "system", content: systemPromptFor(agent) },
          {
            role: "user",
            content: [
              `USER REQUEST: ${data.prompt}`,
              "",
              data.context,
              data.priorOutputs ? `\nPRIOR AGENT OUTPUTS:\n${data.priorOutputs}` : "",
            ].join("\n"),
          },
        ],
        (rawJson) => schema.parse(rawJson),
        { temperature: 0.2, maxTokens: 1600 },
      );

      return {
        agent,
        mode: "REAL",
        model: raw.model,
        output: value as Record<string, unknown>,
        durationMs: Date.now() - started,
        tokens: raw.tokens ?? null,
        notice: null,
      };
    } catch (error) {
      const message =
        error instanceof LlmError
          ? error.message
          : error instanceof z.ZodError
            ? "AI response did not match the required agent schema."
            : "AI provider request failed.";
      console.error(`[genesis] ${agent} agent failed:`, error);

      return {
        agent,
        mode: "DEMO",
        model: null,
        output: schema.parse(demoAgentOutput(agent, data.prompt)) as Record<string, unknown>,
        durationMs: Date.now() - started,
        tokens: null,
        notice: `${message} Falling back to labelled demo output.`,
      };
    }
  });
