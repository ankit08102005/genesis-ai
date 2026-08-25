import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  DEMO_PROJECT_ID,
  demoChanges,
  demoDecisions,
  demoGraph,
  demoHistory,
  demoMemoryDocs,
  demoProject,
  demoRepository,
  demoRequirements,
  demoSecurityFindings,
} from "./demo-data";
import { HpimService } from "./hpim";
import type {
  AgentRun,
  ArchitectureDecision,
  ChangeSet,
  ChangeStatus,
  HistoryEvent,
  MemoryDocument,
  Project,
  ProjectGraph,
  Repository,
  Requirement,
  SecurityFinding,
} from "./types";

const STORAGE_KEY = "genesis-ai:state:v1";

interface GenesisState {
  projects: Project[];
  activeProjectId: string;
  requirements: Requirement[];
  decisions: ArchitectureDecision[];
  graph: ProjectGraph;
  history: HistoryEvent[];
  memoryDocs: MemoryDocument[];
  repository: Repository;
  changes: ChangeSet[];
  agentRuns: AgentRun[];
  securityFindings: SecurityFinding[];
}

const initialState: GenesisState = {
  projects: [demoProject],
  activeProjectId: DEMO_PROJECT_ID,
  requirements: demoRequirements,
  decisions: demoDecisions,
  graph: demoGraph,
  history: demoHistory,
  memoryDocs: demoMemoryDocs,
  repository: demoRepository,
  changes: demoChanges,
  agentRuns: [],
  securityFindings: demoSecurityFindings,
};

interface GenesisContextValue extends GenesisState {
  project: Project;
  hpim: HpimService;
  addRequirement(input: Omit<Requirement, "id" | "projectId" | "createdAt" | "updatedAt" | "origin">): void;
  updateRequirement(id: string, patch: Partial<Requirement>): void;
  deleteRequirement(id: string): void;
  addDecision(input: Omit<ArchitectureDecision, "id" | "projectId" | "createdAt" | "origin">): void;
  addHistory(event: Omit<HistoryEvent, "id" | "projectId" | "timestamp">): void;
  addMemoryDoc(doc: Omit<MemoryDocument, "id" | "projectId" | "updatedAt">): void;
  addChange(change: Omit<ChangeSet, "id" | "projectId" | "createdAt">): string;
  setChangeStatus(id: string, status: ChangeStatus): void;
  upsertAgentRun(run: AgentRun): void;
  clearAgentRuns(): void;
  reindexRepository(): void;
  resetDemo(): void;
}

const GenesisContext = createContext<GenesisContextValue | null>(null);

let counter = 0;
const uid = (prefix: string) => `${prefix}_${Date.now().toString(36)}${(counter++).toString(36)}`;

export function GenesisProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GenesisState>(initialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState({ ...initialState, ...(JSON.parse(raw) as Partial<GenesisState>) });
    } catch {
      /* corrupted local state is ignored; demo seed is used instead */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full or unavailable — state stays in memory */
    }
  }, [state, hydrated]);

  const addHistory = useCallback<GenesisContextValue["addHistory"]>((event) => {
    setState((s) => ({
      ...s,
      history: [
        {
          ...event,
          id: uid("evt"),
          projectId: s.activeProjectId,
          timestamp: new Date().toISOString(),
        },
        ...s.history,
      ],
    }));
  }, []);

  const addMemoryDoc = useCallback<GenesisContextValue["addMemoryDoc"]>((doc) => {
    setState((s) => ({
      ...s,
      memoryDocs: [
        { ...doc, id: uid("mem"), projectId: s.activeProjectId, updatedAt: new Date().toISOString() },
        ...s.memoryDocs,
      ],
    }));
  }, []);

  const value = useMemo<GenesisContextValue>(() => {
    const project = state.projects.find((p) => p.id === state.activeProjectId) ?? state.projects[0];
    const hpim = new HpimService({
      requirements: state.requirements,
      decisions: state.decisions,
      graph: state.graph,
      history: state.history,
      memoryDocs: state.memoryDocs,
      repository: state.repository,
    });

    return {
      ...state,
      project,
      hpim,
      addHistory,
      addMemoryDoc,
      addRequirement(input) {
        const id = `REQ-${String(state.requirements.length + 1).padStart(3, "0")}`;
        const ts = new Date().toISOString();
        setState((s) => ({
          ...s,
          requirements: [
            ...s.requirements,
            { ...input, id, projectId: s.activeProjectId, createdAt: ts, updatedAt: ts, origin: "REAL" },
          ],
          memoryDocs: [
            {
              id: uid("mem"),
              projectId: s.activeProjectId,
              kind: "requirement",
              title: input.title,
              content: `${input.title}. ${input.description}`,
              component: input.linkedComponents[0],
              file: input.linkedFiles[0],
              updatedAt: ts,
            },
            ...s.memoryDocs,
          ],
          history: [
            {
              id: uid("evt"),
              projectId: s.activeProjectId,
              actor: "you",
              type: "requirement",
              description: `Requirement ${id} added: ${input.title}`,
              components: input.linkedComponents,
              files: input.linkedFiles,
              timestamp: ts,
              origin: "REAL",
            },
            ...s.history,
          ],
        }));
      },
      updateRequirement(id, patch) {
        setState((s) => ({
          ...s,
          requirements: s.requirements.map((r) =>
            r.id === id ? { ...r, ...patch, updatedAt: new Date().toISOString() } : r,
          ),
          history: [
            {
              id: uid("evt"),
              projectId: s.activeProjectId,
              actor: "you",
              type: "requirement",
              description: `Requirement ${id} updated`,
              components: [],
              files: [],
              timestamp: new Date().toISOString(),
              origin: "REAL",
            },
            ...s.history,
          ],
        }));
      },
      deleteRequirement(id) {
        setState((s) => ({
          ...s,
          requirements: s.requirements.filter((r) => r.id !== id),
          history: [
            {
              id: uid("evt"),
              projectId: s.activeProjectId,
              actor: "you",
              type: "requirement",
              description: `Requirement ${id} deleted`,
              components: [],
              files: [],
              timestamp: new Date().toISOString(),
              origin: "REAL",
            },
            ...s.history,
          ],
        }));
      },
      addDecision(input) {
        const id = `ADR-${String(state.decisions.length + 1).padStart(3, "0")}`;
        const ts = new Date().toISOString();
        setState((s) => ({
          ...s,
          decisions: [...s.decisions, { ...input, id, projectId: s.activeProjectId, createdAt: ts, origin: "REAL" }],
          memoryDocs: [
            {
              id: uid("mem"),
              projectId: s.activeProjectId,
              kind: "decision",
              title: input.title,
              content: `${input.title}. ${input.decision} Reason: ${input.reason}`,
              updatedAt: ts,
            },
            ...s.memoryDocs,
          ],
          history: [
            {
              id: uid("evt"),
              projectId: s.activeProjectId,
              actor: "you",
              type: "decision",
              description: `Architecture decision ${id} recorded: ${input.title}`,
              components: [],
              files: [],
              timestamp: ts,
              origin: "REAL",
            },
            ...s.history,
          ],
        }));
      },
      addChange(change) {
        const id = uid("chg").toUpperCase();
        setState((s) => ({
          ...s,
          changes: [
            { ...change, id, projectId: s.activeProjectId, createdAt: new Date().toISOString() },
            ...s.changes,
          ],
        }));
        return id;
      },
      setChangeStatus(id, status) {
        setState((s) => ({
          ...s,
          changes: s.changes.map((c) => (c.id === id ? { ...c, status } : c)),
          history: [
            {
              id: uid("evt"),
              projectId: s.activeProjectId,
              actor: "you",
              type: "code",
              description: `Change ${id} marked ${status}`,
              components: [],
              files: [],
              timestamp: new Date().toISOString(),
              origin: "REAL",
            },
            ...s.history,
          ],
        }));
      },
      upsertAgentRun(run) {
        setState((s) => ({
          ...s,
          agentRuns: s.agentRuns.some((r) => r.id === run.id)
            ? s.agentRuns.map((r) => (r.id === run.id ? run : r))
            : [...s.agentRuns, run],
        }));
      },
      clearAgentRuns() {
        setState((s) => ({ ...s, agentRuns: [] }));
      },
      reindexRepository() {
        const ts = new Date().toISOString();
        setState((s) => ({
          ...s,
          repository: { ...s.repository, lastIndexedAt: ts },
          graph: { ...s.graph, lastUpdated: ts },
          history: [
            {
              id: uid("evt"),
              projectId: s.activeProjectId,
              actor: "Repository Scanner",
              type: "repository",
              description: `Re-indexed ${s.repository.fullName}@${s.repository.branch} — ${s.repository.files.length} files, ${s.graph.nodes.length} graph nodes`,
              components: [],
              files: [],
              timestamp: ts,
              origin: "DEMO",
            },
            ...s.history,
          ],
        }));
      },
      resetDemo() {
        setState(initialState);
      },
    };
  }, [state, addHistory, addMemoryDoc]);

  return <GenesisContext.Provider value={value}>{children}</GenesisContext.Provider>;
}

export function useGenesis() {
  const ctx = useContext(GenesisContext);
  if (!ctx) throw new Error("useGenesis must be used inside GenesisProvider");
  return ctx;
}
