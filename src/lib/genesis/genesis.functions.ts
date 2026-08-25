import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { agentSchemas, type AgentKey } from "./agent-schemas";
import { demoAgentOutput } from "./demo-agent-outputs";

/**
 * Typed RPC boundary. All provider credentials stay on the server; the browser
 * only ever sees structured agent output plus an execution mode (REAL | DEMO).
 */

const agentKeys = [
  "requirement",
  "architecture",
  "impact",
  "coding",
  "testing",
  "security",
  "documentation",
] as const;

const stageInput = z.object({
  agent: z.enum(agentKeys),
  prompt: z.string().min(1),
  context: z.string().default(""),
  priorOutputs: z.string().default(""),
});

const SYSTEM_PROMPTS: Record<AgentKey, string> = {
  requirement:
    "You are the Requirement Agent of Genesis AI. Convert the user request into precise, testable software requirements grounded in the supplied project context. Return JSON: {summary, requirements:[{title,description,type,priority}]}. type is functional|non-functional, priority is low|medium|high|critical.",
  architecture:
    "You are the Architecture Agent of Genesis AI. Propose the minimal architectural change consistent with existing decisions in the project context. Return JSON: {summary, changes:[{component,change,reason}], risks:[string], dependencies:[string]}.",
  impact:
    "You are the Change Impact Analyzer of Genesis AI. Using the project graph, requirements and history in the context, determine the blast radius of the proposed change. Return JSON: {summary, directlyAffected:[], indirectlyAffected:[], affectedApis:[], affectedDatabaseModels:[], affectedTests:[], relatedRequirements:[], riskLevel}.",
  coding:
    "You are the Coding Agent of Genesis AI. Produce a concrete implementation plan with before/after code snippets for each touched file. Never invent files that are absent from the context unless they are new. Return JSON: {summary, filesToCreate:[], filesToModify:[], filesToDelete:[], changes:[{file,description,before,after}]}.",
  testing:
    "You are the Testing Agent of Genesis AI. Plan tests for the proposed change. You do NOT execute tests and must never claim tests passed. Return JSON: {summary, testsRequired:[{suite,name,kind}], regressionRisks:[], testPlan:[]}. kind is unit|integration|regression|edge.",
  security:
    "You are the Security Agent of Genesis AI. Review the proposed change for auth, authorization, secrets, injection, dependency, exposure and validation problems. Return JSON: {summary, score, issues:[{title,location,severity,risk,recommendation}], recommendations:[]}. severity is low|medium|high|critical, score is 0-100.",
  documentation:
    "You are the Documentation Agent of Genesis AI. Identify documentation impacted by the change and describe the update. Return JSON: {summary, documentsToUpdate:[], changes:[{document,change,reason}]}.",
};

export type StageResult = {
  agent: AgentKey;
  mode: "REAL" | "DEMO";
  model: string | null;
  output: unknown;
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
        output: schema.parse(demoAgentOutput(agent, data.prompt)),
        durationMs: Date.now() - started,
        tokens: null,
        notice: "AI provider is not configured — showing labelled demo output.",
      };
    }

    try {
      const { value, raw } = await provider.generateStructured(
        [
          { role: "system", content: SYSTEM_PROMPTS[agent] },
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
        output: value,
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
        output: schema.parse(demoAgentOutput(agent, data.prompt)),
        durationMs: Date.now() - started,
        tokens: null,
        notice: `${message} Falling back to labelled demo output.`,
      };
    }
  });
