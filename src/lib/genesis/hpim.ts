import type {
  ArchitectureDecision,
  ContextStats,
  GraphEdge,
  GraphNode,
  HistoryEvent,
  ImpactReport,
  MemoryDocument,
  ProjectGraph,
  Repository,
  Requirement,
  RiskLevel,
  UnifiedContext,
} from "./types";

/**
 * HPIM — Hybrid Project Intelligence Memory.
 *
 * Three memory providers behind one retrieval interface:
 *   SemanticMemoryProvider  (vector store adapter — local scorer today, ChromaDB later)
 *   GraphMemoryProvider     (dependency graph adapter — in-memory today, Neo4j later)
 *   HistoryMemoryProvider   (append-only event log — client store today, MongoDB later)
 *
 * Every provider is an interface so an external service can replace it without
 * touching the retrieval pipeline or the agents.
 */

const STOPWORDS = new Set([
  "the", "a", "an", "to", "for", "of", "in", "on", "and", "or", "is", "are", "be", "with",
  "add", "can", "should", "what", "how", "if", "it", "this", "that", "my", "we", "i",
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

/** Split identifiers like AuthService / auth_service into searchable tokens. */
function expandIdentifier(id: string): string[] {
  return id
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[^a-zA-Z0-9]+/)
    .map((s) => s.toLowerCase())
    .filter(Boolean);
}

export interface SemanticMemoryProvider {
  readonly name: string;
  search(query: string, limit?: number): { id: string; title: string; snippet: string; score: number }[];
  count(): number;
}

export interface GraphMemoryProvider {
  readonly name: string;
  findNodes(query: string): GraphNode[];
  neighbors(nodeId: string, depth?: number): { nodes: GraphNode[]; edges: GraphEdge[] };
  callers(nodeId: string): string[];
  dependencies(nodeId: string): string[];
  stats(): { nodes: number; edges: number; lastUpdated: string };
}

export interface HistoryMemoryProvider {
  readonly name: string;
  recent(limit?: number): HistoryEvent[];
  search(query: string, limit?: number): HistoryEvent[];
  count(): number;
}

/** Local scoring semantic provider — a drop-in stand-in for ChromaDB. */
export class LocalSemanticMemory implements SemanticMemoryProvider {
  readonly name = "local-vector-adapter";
  constructor(private docs: MemoryDocument[]) {}

  count() {
    return this.docs.length;
  }

  search(query: string, limit = 6) {
    const terms = tokenize(query);
    return this.docs
      .map((doc) => {
        const haystack = `${doc.title} ${doc.content} ${doc.component ?? ""} ${doc.file ?? ""}`.toLowerCase();
        const hits = terms.reduce((acc, t) => acc + (haystack.includes(t) ? 1 : 0), 0);
        const score = terms.length ? hits / terms.length : 0;
        return {
          id: doc.id,
          title: doc.title,
          snippet: doc.content.slice(0, 220),
          score: Number(score.toFixed(2)),
        };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}

export class InMemoryGraphMemory implements GraphMemoryProvider {
  readonly name = "in-memory-graph-adapter";
  constructor(private graph: ProjectGraph) {}

  stats() {
    return {
      nodes: this.graph.nodes.length,
      edges: this.graph.edges.length,
      lastUpdated: this.graph.lastUpdated,
    };
  }

  findNodes(query: string) {
    const terms = tokenize(query);
    if (!terms.length) return [];
    return this.graph.nodes.filter((n) => {
      const tokens = [...expandIdentifier(n.id), ...expandIdentifier(n.file ?? ""), ...(n.methods ?? []).flatMap(expandIdentifier)];
      return terms.some((t) => tokens.some((tok) => tok.includes(t) || t.includes(tok)));
    });
  }

  neighbors(nodeId: string, depth = 2) {
    const seen = new Set<string>([nodeId]);
    const edges: GraphEdge[] = [];
    let frontier = [nodeId];
    for (let d = 0; d < depth; d++) {
      const next: string[] = [];
      for (const id of frontier) {
        for (const e of this.graph.edges) {
          if (e.from === id || e.to === id) {
            if (!edges.includes(e)) edges.push(e);
            const other = e.from === id ? e.to : e.from;
            if (!seen.has(other)) {
              seen.add(other);
              next.push(other);
            }
          }
        }
      }
      frontier = next;
    }
    return {
      nodes: this.graph.nodes.filter((n) => seen.has(n.id)),
      edges,
    };
  }

  callers(nodeId: string) {
    return this.graph.edges.filter((e) => e.to === nodeId).map((e) => e.from);
  }

  dependencies(nodeId: string) {
    return this.graph.edges.filter((e) => e.from === nodeId).map((e) => e.to);
  }
}

export class InMemoryHistoryMemory implements HistoryMemoryProvider {
  readonly name = "in-memory-history-adapter";
  constructor(private events: HistoryEvent[]) {}

  count() {
    return this.events.length;
  }

  recent(limit = 10) {
    return [...this.events]
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, limit);
  }

  search(query: string, limit = 6) {
    const terms = tokenize(query);
    return this.events
      .filter((e) => {
        const hay = `${e.description} ${e.components.join(" ")} ${e.files.join(" ")}`.toLowerCase();
        return terms.some((t) => hay.includes(t));
      })
      .slice(0, limit);
  }
}

export interface HpimSources {
  requirements: Requirement[];
  decisions: ArchitectureDecision[];
  graph: ProjectGraph;
  history: HistoryEvent[];
  memoryDocs: MemoryDocument[];
  repository: Repository;
}

export class HpimService {
  readonly semantic: SemanticMemoryProvider;
  readonly graph: GraphMemoryProvider;
  readonly history: HistoryMemoryProvider;

  constructor(private sources: HpimSources) {
    this.semantic = new LocalSemanticMemory(sources.memoryDocs);
    this.graph = new InMemoryGraphMemory(sources.graph);
    this.history = new InMemoryHistoryMemory(sources.history);
  }

  /** Lexical / exact-match retrieval across the indexed repository. */
  lexicalSearch(query: string) {
    const terms = tokenize(query);
    const out: { path: string; match: string }[] = [];
    for (const file of this.sources.repository.files) {
      const symbols = file.symbols.flatMap((s) => [s, ...expandIdentifier(s)]);
      const hit = terms.find(
        (t) => file.path.toLowerCase().includes(t) || symbols.some((s) => s.toLowerCase() === t),
      );
      if (hit) out.push({ path: file.path, match: hit });
    }
    return out.slice(0, 10);
  }

  /** Unified retrieval interface: retrieveProjectContext(projectId, query, component?). */
  retrieveProjectContext(projectId: string, query: string, component?: string): UnifiedContext {
    const semanticContext = this.semantic.search(query);
    const lexicalContext = this.lexicalSearch(query);

    const focusNodes = component
      ? this.sources.graph.nodes.filter((n) => n.id === component)
      : this.graph.findNodes(query);

    const nodeSet = new Map<string, GraphNode>();
    const edgeSet: GraphEdge[] = [];
    for (const n of focusNodes) {
      const nb = this.graph.neighbors(n.id, 2);
      nb.nodes.forEach((x) => nodeSet.set(x.id, x));
      nb.edges.forEach((e) => {
        if (!edgeSet.some((x) => x.from === e.from && x.to === e.to && x.kind === e.kind)) edgeSet.push(e);
      });
    }

    const historyContext = [...this.history.search(query), ...this.history.recent(4)]
      .filter((e, i, arr) => arr.findIndex((x) => x.id === e.id) === i)
      .slice(0, 8);

    const relevantFiles = Array.from(
      new Set([
        ...lexicalContext.map((l) => l.path),
        ...Array.from(nodeSet.values())
          .map((n) => n.file)
          .filter((f): f is string => Boolean(f)),
      ]),
    );

    const dependencies = Array.from(
      new Set(focusNodes.flatMap((n) => this.graph.dependencies(n.id))),
    );

    const stats: ContextStats = {
      requirements: this.sources.requirements.length,
      files: relevantFiles.length,
      graphRelations: edgeSet.length,
      decisions: this.sources.decisions.length,
      historyEvents: historyContext.length,
    };

    return {
      projectId,
      query,
      semanticContext,
      lexicalContext,
      graphContext: { focus: focusNodes.map((n) => n.id), nodes: Array.from(nodeSet.values()), edges: edgeSet },
      historyContext,
      relevantFiles,
      dependencies,
      stats,
    };
  }

  /** Deterministic, graph-derived change-impact analysis. */
  analyzeImpact(target: string[] | string, query = ""): ImpactReport {
    const targets = Array.isArray(target) ? target : [target];
    const resolved = targets.length
      ? targets
      : this.graph.findNodes(query).map((n) => n.id);

    const direct = new Set<string>();
    const indirect = new Set<string>();

    for (const t of resolved) {
      this.graph.callers(t).forEach((c) => direct.add(c));
      this.graph.dependencies(t).forEach((d) => direct.add(d));
    }
    for (const d of Array.from(direct)) {
      this.graph.callers(d).forEach((c) => {
        if (!resolved.includes(c) && !direct.has(c)) indirect.add(c);
      });
      this.graph.dependencies(d).forEach((c) => {
        if (!resolved.includes(c) && !direct.has(c)) indirect.add(c);
      });
    }

    const all = [...resolved, ...direct, ...indirect];
    const nodeById = new Map(this.sources.graph.nodes.map((n) => [n.id, n]));
    const kindOf = (id: string) => nodeById.get(id)?.kind;

    const affectedApis = all.filter((id) => kindOf(id) === "api");
    const affectedDatabaseModels = all.filter((id) => kindOf(id) === "model" || kindOf(id) === "database");
    const affectedTests = this.sources.graph.edges
      .filter((e) => all.includes(e.to) && kindOf(e.from) === "test")
      .map((e) => nodeById.get(e.from)?.file ?? e.from);

    const relatedRequirements = this.sources.requirements
      .filter((r) => r.linkedComponents.some((c) => all.includes(c)))
      .map((r) => `${r.id} — ${r.title}`);

    const previousDecisions = this.sources.decisions
      .filter((d) => all.some((c) => `${d.decision} ${d.title}`.toLowerCase().includes(c.toLowerCase().slice(0, 4))))
      .map((d) => `${d.id} — ${d.title}`);

    const surface = direct.size + indirect.size + affectedApis.length * 2 + affectedDatabaseModels.length;
    const riskLevel: RiskLevel =
      surface >= 10 ? "critical" : surface >= 6 ? "high" : surface >= 3 ? "medium" : "low";

    return {
      target: resolved,
      directlyAffected: Array.from(direct),
      indirectlyAffected: Array.from(indirect),
      affectedApis,
      affectedDatabaseModels,
      affectedTests: Array.from(new Set(affectedTests)),
      relatedRequirements,
      previousDecisions,
      riskLevel,
      rationale: `${resolved.length} target component(s) with ${direct.size} direct and ${indirect.size} transitive dependents across ${affectedApis.length} API surface(s).`,
      origin: "DEMO",
    };
  }

  memoryHealth() {
    const g = this.graph.stats();
    return {
      semantic: { documents: this.semantic.count(), provider: this.semantic.name, healthy: this.semantic.count() > 0 },
      graph: { ...g, provider: this.graph.name, healthy: g.nodes > 0 },
      history: { events: this.history.count(), provider: this.history.name, healthy: this.history.count() > 0 },
    };
  }
}

/** Compact, token-efficient serialization of the unified context for the LLM. */
export function serializeContext(ctx: UnifiedContext): string {
  const lines: string[] = [];
  lines.push(`PROJECT CONTEXT (HPIM unified retrieval)`);
  lines.push(`Query: ${ctx.query}`);
  if (ctx.semanticContext.length) {
    lines.push(`\nSEMANTIC MEMORY:`);
    ctx.semanticContext.forEach((s) => lines.push(`- (${s.score}) ${s.title}: ${s.snippet}`));
  }
  if (ctx.lexicalContext.length) {
    lines.push(`\nLEXICAL MATCHES:`);
    ctx.lexicalContext.forEach((l) => lines.push(`- ${l.path} (match: ${l.match})`));
  }
  if (ctx.graphContext.edges.length) {
    lines.push(`\nPROJECT GRAPH:`);
    ctx.graphContext.edges.forEach((e) => lines.push(`- ${e.from} -[${e.kind}]-> ${e.to}`));
  }
  if (ctx.historyContext.length) {
    lines.push(`\nPROJECT HISTORY:`);
    ctx.historyContext.forEach((h) => lines.push(`- ${h.timestamp} ${h.actor}: ${h.description}`));
  }
  if (ctx.relevantFiles.length) lines.push(`\nRELEVANT FILES: ${ctx.relevantFiles.join(", ")}`);
  if (ctx.dependencies.length) lines.push(`DEPENDENCIES: ${ctx.dependencies.join(", ")}`);
  return lines.join("\n");
}
