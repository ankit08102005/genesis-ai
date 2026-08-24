/** Core domain types for Genesis AI. */

export type DataOrigin = "REAL" | "DEMO" | "MOCK";

export type Priority = "low" | "medium" | "high" | "critical";
export type RiskLevel = "low" | "medium" | "high" | "critical";
export type RequirementType = "functional" | "non-functional";
export type RequirementStatus = "draft" | "approved" | "implemented" | "deprecated";

export interface Requirement {
  id: string;
  projectId: string;
  title: string;
  description: string;
  type: RequirementType;
  priority: Priority;
  status: RequirementStatus;
  source: string;
  linkedComponents: string[];
  linkedFiles: string[];
  createdAt: string;
  updatedAt: string;
  origin: DataOrigin;
}

export interface ArchitectureDecision {
  id: string;
  projectId: string;
  title: string;
  decision: string;
  reason: string;
  alternatives: string[];
  consequences: string[];
  author: string;
  createdAt: string;
  origin: DataOrigin;
}

export type NodeKind =
  | "service"
  | "controller"
  | "api"
  | "repository"
  | "database"
  | "model"
  | "middleware"
  | "component"
  | "test"
  | "config";

export type EdgeKind =
  | "CONTAINS"
  | "CALLS"
  | "USES"
  | "DEPENDS_ON"
  | "IMPLEMENTS"
  | "EXPOSES"
  | "REQUIRES"
  | "IMPORTS"
  | "EXTENDS";

export interface GraphNode {
  id: string;
  label: string;
  kind: NodeKind;
  file?: string;
  methods?: string[];
  language?: string;
  summary?: string;
}

export interface GraphEdge {
  from: string;
  to: string;
  kind: EdgeKind;
}

export interface ProjectGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  lastUpdated: string;
  origin: DataOrigin;
}

export type HistoryEventType =
  | "requirement"
  | "decision"
  | "code"
  | "dependency"
  | "agent"
  | "user"
  | "repository"
  | "memory"
  | "security"
  | "testing";

export interface HistoryEvent {
  id: string;
  projectId: string;
  actor: string;
  type: HistoryEventType;
  description: string;
  components: string[];
  files: string[];
  timestamp: string;
  origin: DataOrigin;
}

export interface MemoryDocument {
  id: string;
  projectId: string;
  kind: "requirement" | "decision" | "code" | "doc" | "api";
  title: string;
  content: string;
  component?: string;
  file?: string;
  updatedAt: string;
}

export interface RepoFile {
  path: string;
  language: string;
  loc: number;
  exports: string[];
  imports: string[];
  symbols: string[];
  isTest?: boolean;
}

export interface Repository {
  connected: boolean;
  provider: "github";
  fullName: string;
  branch: string;
  lastIndexedAt: string | null;
  files: RepoFile[];
  frameworks: string[];
  packages: { name: string; version: string; risk?: RiskLevel }[];
  origin: DataOrigin;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  stack: string[];
  health: "good" | "warning" | "critical";
  createdAt: string;
  origin: DataOrigin;
}

export type ChangeStatus =
  | "Proposed"
  | "Approved"
  | "Rejected"
  | "Applied"
  | "Testing"
  | "Failed"
  | "Rolled Back";

export interface FileDiff {
  path: string;
  before: string;
  after: string;
  rationale: string;
}

export interface ChangeSet {
  id: string;
  projectId: string;
  description: string;
  files: FileDiff[];
  components: string[];
  risk: RiskLevel;
  agent: string;
  status: ChangeStatus;
  requirement?: string;
  createdAt: string;
  origin: DataOrigin;
}

export type AgentName =
  | "Requirement Agent"
  | "Architecture Agent"
  | "Impact Analyzer"
  | "Coding Agent"
  | "Testing Agent"
  | "Security Agent"
  | "Documentation Agent";

export type AgentStatus = "waiting" | "running" | "completed" | "failed" | "skipped";

export interface AgentRun {
  id: string;
  projectId: string;
  agent: AgentName;
  status: AgentStatus;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  summary?: string;
  output?: unknown;
  error?: string;
  retries: number;
  origin: DataOrigin;
  contextStats?: ContextStats;
  tokens?: number;
}

export interface ContextStats {
  requirements: number;
  files: number;
  graphRelations: number;
  decisions: number;
  historyEvents: number;
}

export interface UnifiedContext {
  projectId: string;
  query: string;
  semanticContext: { id: string; title: string; snippet: string; score: number }[];
  lexicalContext: { path: string; match: string }[];
  graphContext: {
    focus: string[];
    nodes: GraphNode[];
    edges: GraphEdge[];
  };
  historyContext: HistoryEvent[];
  relevantFiles: string[];
  dependencies: string[];
  stats: ContextStats;
}

export interface ImpactReport {
  target: string[];
  directlyAffected: string[];
  indirectlyAffected: string[];
  affectedApis: string[];
  affectedDatabaseModels: string[];
  affectedTests: string[];
  relatedRequirements: string[];
  previousDecisions: string[];
  riskLevel: RiskLevel;
  rationale: string;
  origin: DataOrigin;
}

export interface SecurityFinding {
  id: string;
  title: string;
  location: string;
  severity: RiskLevel;
  risk: string;
  recommendation: string;
  origin: DataOrigin;
}

export interface TestCase {
  id: string;
  suite: string;
  name: string;
  kind: "unit" | "integration" | "regression" | "edge";
  status: "planned" | "generated" | "not-executed";
}

export interface DocUpdate {
  document: string;
  change: string;
  reason: string;
}
