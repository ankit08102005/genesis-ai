import { z } from "zod";

/** Structured agent output contracts. Every agent response is validated against these. */

export const priorityEnum = z.enum(["low", "medium", "high", "critical"]);
export const riskEnum = z.enum(["low", "medium", "high", "critical"]);

export const requirementAgentSchema = z.object({
  summary: z.string().default(""),
  requirements: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
        type: z.enum(["functional", "non-functional"]).default("functional"),
        priority: priorityEnum.default("medium"),
      }),
    )
    .default([]),
});

export const architectureAgentSchema = z.object({
  summary: z.string().default(""),
  changes: z
    .array(
      z.object({
        component: z.string(),
        change: z.string(),
        reason: z.string(),
      }),
    )
    .default([]),
  risks: z.array(z.string()).default([]),
  dependencies: z.array(z.string()).default([]),
});

export const impactAgentSchema = z.object({
  summary: z.string().default(""),
  directlyAffected: z.array(z.string()).default([]),
  indirectlyAffected: z.array(z.string()).default([]),
  affectedApis: z.array(z.string()).default([]),
  affectedDatabaseModels: z.array(z.string()).default([]),
  affectedTests: z.array(z.string()).default([]),
  relatedRequirements: z.array(z.string()).default([]),
  riskLevel: riskEnum.default("medium"),
});

export const codingAgentSchema = z.object({
  summary: z.string().default(""),
  filesToCreate: z.array(z.string()).default([]),
  filesToModify: z.array(z.string()).default([]),
  filesToDelete: z.array(z.string()).default([]),
  changes: z
    .array(
      z.object({
        file: z.string(),
        description: z.string(),
        before: z.string().default(""),
        after: z.string().default(""),
      }),
    )
    .default([]),
});

export const testingAgentSchema = z.object({
  summary: z.string().default(""),
  testsRequired: z
    .array(
      z.object({
        suite: z.string(),
        name: z.string(),
        kind: z.enum(["unit", "integration", "regression", "edge"]).default("unit"),
      }),
    )
    .default([]),
  regressionRisks: z.array(z.string()).default([]),
  testPlan: z.array(z.string()).default([]),
});

export const securityAgentSchema = z.object({
  summary: z.string().default(""),
  score: z.number().default(70),
  issues: z
    .array(
      z.object({
        title: z.string(),
        location: z.string().default("unknown"),
        severity: riskEnum.default("medium"),
        risk: z.string().default(""),
        recommendation: z.string().default(""),
      }),
    )
    .default([]),
  recommendations: z.array(z.string()).default([]),
});

export const documentationAgentSchema = z.object({
  summary: z.string().default(""),
  documentsToUpdate: z.array(z.string()).default([]),
  changes: z
    .array(
      z.object({
        document: z.string(),
        change: z.string(),
        reason: z.string().default(""),
      }),
    )
    .default([]),
});

export type RequirementAgentOutput = z.infer<typeof requirementAgentSchema>;
export type ArchitectureAgentOutput = z.infer<typeof architectureAgentSchema>;
export type ImpactAgentOutput = z.infer<typeof impactAgentSchema>;
export type CodingAgentOutput = z.infer<typeof codingAgentSchema>;
export type TestingAgentOutput = z.infer<typeof testingAgentSchema>;
export type SecurityAgentOutput = z.infer<typeof securityAgentSchema>;
export type DocumentationAgentOutput = z.infer<typeof documentationAgentSchema>;

export const agentSchemas = {
  requirement: requirementAgentSchema,
  architecture: architectureAgentSchema,
  impact: impactAgentSchema,
  coding: codingAgentSchema,
  testing: testingAgentSchema,
  security: securityAgentSchema,
  documentation: documentationAgentSchema,
} as const;

export type AgentKey = keyof typeof agentSchemas;
