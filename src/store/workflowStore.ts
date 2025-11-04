import { create } from "zustand";
import { addEdge, applyNodeChanges, applyEdgeChanges } from "@xyflow/react";
import type { Connection, NodeChange, EdgeChange } from "@xyflow/react";
import type {
  WorkflowNode,
  WorkflowEdge,
  WorkflowNodeData,
  AppSettings,
  MediaItem,
  CustomModuleDefinition,
  ShotCollectionNodeData,
  SceneShotPlannerNodeData,
  ShotPlan,
} from "../types/workflow.types";
import {
  executeWorkflow,
  executeWorkflowIteratively,
} from "../utils/dataFlowEngine";
import { initializeFal } from "../services/fal";
import { initializeAnthropic } from "../services/anthropic";

interface WorkflowStore {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  selectedNode: WorkflowNode | null;
  selectedEdge: WorkflowEdge | null;
  workflowData: Map<string, unknown>;
  history: {
    past: Array<{ nodes: WorkflowNode[]; edges: WorkflowEdge[] }>;
    future: Array<{ nodes: WorkflowNode[]; edges: WorkflowEdge[] }>;
  };
  isDarkMode: boolean;
  settings: AppSettings;
  isRunning: boolean;
  mediaGallery: MediaItem[];
  customModules: CustomModuleDefinition[];

  // Actions
  setNodes: (nodes: WorkflowNode[]) => void;
  setEdges: (edges: WorkflowEdge[]) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (node: WorkflowNode) => void;
  updateNode: (nodeId: string, data: Partial<WorkflowNodeData>) => void;
  deleteNode: (nodeId: string) => void;
  deleteEdge: (edgeId: string) => void;
  setSelectedNode: (node: WorkflowNode | null) => void;
  setSelectedEdge: (edge: WorkflowEdge | null) => void;
  runWorkflow: () => Promise<void>;
  clearCanvas: () => void;
  undo: () => void;
  redo: () => void;
  saveHistory: () => void;
  toggleDarkMode: () => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  exportWorkflow: () => string;
  importWorkflow: (data: string) => void;
  loadExampleWorkflow: () => void;
  addMediaItem: (item: MediaItem) => void;
  clearMediaGallery: () => void;
  saveCustomModule: (module: CustomModuleDefinition) => void;
  deleteCustomModule: (id: string) => void;
  loadCustomModules: () => void;
}

const EXAMPLE_WORKFLOW = {
  nodes: [
    {
      id: "1",
      type: "input",
      position: { x: 100, y: 100 },
      data: {
        label: "Initial Prompt",
        type: "input" as const,
        prompt:
          "A cinematic shot of a hero character running through golden hour lighting with tense mood. Frame 0 to 120. Low angle shot with 35mm lens.",
      },
    },
    {
      id: "2",
      type: "character",
      position: { x: 100, y: 250 },
      data: {
        label: "Character Extractor",
        type: "character" as const,
        extractedValue: [],
        isManual: false,
      },
    },
    {
      id: "3",
      type: "shotInfo",
      position: { x: 100, y: 400 },
      data: {
        label: "Shot Info Extractor",
        type: "shotInfo" as const,
        extractedValue: {},
        isManual: false,
        manualOverrides: [],
        manualValues: {},
      },
    },
    {
      id: "4",
      type: "contextPrompt",
      position: { x: 450, y: 300 },
      data: {
        label: "Context Builder",
        type: "contextPrompt" as const,
        template:
          "Character: {{characters}}\nLighting: {{lighting}}\nMood: {{mood}}\nShot Angle: {{shotAngle}}",
        preview: "",
        inputs: {},
        availableVariables: [],
      },
    },
    {
      id: "5",
      type: "output",
      position: { x: 800, y: 300 },
      data: {
        label: "Final Output",
        type: "output" as const,
        finalPrompt: "",
      },
    },
  ] as WorkflowNode[],
  edges: [
    {
      id: "e1-2",
      source: "1",
      target: "2",
      type: "smoothstep",
      markerEnd: { type: "arrowclosed" },
    },
    {
      id: "e1-3",
      source: "1",
      target: "3",
      type: "smoothstep",
      markerEnd: { type: "arrowclosed" },
    },
    {
      id: "e2-4",
      source: "2",
      target: "4",
      type: "smoothstep",
      markerEnd: { type: "arrowclosed" },
    },
    {
      id: "e3-4",
      source: "3",
      target: "4",
      type: "smoothstep",
      markerEnd: { type: "arrowclosed" },
    },
    {
      id: "e4-5",
      source: "4",
      target: "5",
      type: "smoothstep",
      markerEnd: { type: "arrowclosed" },
    },
  ] as WorkflowEdge[],
};

// Load settings from localStorage
// Hard-coded API keys
const ANTHROPIC_API_KEY =
  "REMOVED-LEAKED-KEY";
const FAL_API_KEY =
  "REMOVED-LEAKED-KEY";

const loadSettings = (): AppSettings => {
  // Initialize services with hard-coded API keys
  initializeAnthropic(ANTHROPIC_API_KEY);
  initializeFal(FAL_API_KEY);

  try {
    const saved = localStorage.getItem("app-settings");
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...parsed,
        anthropicApiKey: ANTHROPIC_API_KEY,
        falApiKey: FAL_API_KEY,
        useAI: true, // Force AI to always be enabled with hard-coded keys
      };
    }
  } catch (error) {
    console.error("Failed to load settings:", error);
  }
  return {
    anthropicApiKey: ANTHROPIC_API_KEY,
    falApiKey: FAL_API_KEY,
    useAI: true, // Default to enabled
    autoRun: false,
  };
};

// Load initial workflow state (persists across hot reloads during development)
const loadInitialWorkflow = () => {
  try {
    // First try to load from sessionStorage (preserves state during hot reload)
    const sessionState = sessionStorage.getItem("workflow-current-session");
    if (sessionState) {
      const data = JSON.parse(sessionState);
      return {
        nodes: data.nodes || EXAMPLE_WORKFLOW.nodes,
        edges: data.edges || EXAMPLE_WORKFLOW.edges,
      };
    }
  } catch (error) {
    console.error("Failed to load session state:", error);
  }
  // Fall back to example workflow
  return {
    nodes: EXAMPLE_WORKFLOW.nodes,
    edges: EXAMPLE_WORKFLOW.edges,
  };
};

// Helper to save current state to sessionStorage (persists across hot reloads)
const saveToSession = (nodes: WorkflowNode[], edges: WorkflowEdge[]) => {
  try {
    sessionStorage.setItem(
      "workflow-current-session",
      JSON.stringify({ nodes, edges })
    );
  } catch (error) {
    console.error("Failed to save session state:", error);
  }
};

const initialWorkflow = loadInitialWorkflow();

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  nodes: initialWorkflow.nodes,
  edges: initialWorkflow.edges,
  selectedNode: null,
  selectedEdge: null,
  workflowData: new Map<string, unknown>(),
  history: {
    past: [],
    future: [],
  },
  isDarkMode: false,
  settings: loadSettings(),
  isRunning: false,
  mediaGallery: [],
  customModules: [],

  setNodes: (nodes) => {
    set({ nodes });
    saveToSession(nodes, get().edges);
  },

  setEdges: (edges) => {
    set({ edges });
    saveToSession(get().nodes, edges);
  },

  onNodesChange: (changes) => {
    const newNodes = applyNodeChanges(
      changes,
      get().nodes as WorkflowNode[]
    ) as WorkflowNode[];
    set({ nodes: newNodes });
    saveToSession(newNodes, get().edges);
  },

  onEdgesChange: (changes) => {
    const newEdges = applyEdgeChanges(changes, get().edges);
    set({ edges: newEdges });
    saveToSession(get().nodes, newEdges);
  },

  onConnect: (connection) => {
    const newEdges = addEdge(
      {
        ...connection,
        type: "smoothstep",
        markerEnd: { type: "arrowclosed" },
      },
      get().edges
    );
    set({ edges: newEdges });
    saveToSession(get().nodes, newEdges);
    get().saveHistory();
  },

  addNode: (node) => {
    get().saveHistory();
    const newNodes = [...get().nodes, node];
    set({ nodes: newNodes });
    saveToSession(newNodes, get().edges);
  },

  updateNode: (nodeId, data) => {
    const newNodes = get().nodes.map((node) =>
      node.id === nodeId
        ? {
            ...node,
            data: { ...node.data, ...data } as WorkflowNodeData &
              Record<string, unknown>,
          }
        : node
    ) as WorkflowNode[];
    set({ nodes: newNodes });
    saveToSession(newNodes, get().edges);
  },

  deleteNode: (nodeId) => {
    get().saveHistory();
    const newNodes = get().nodes.filter((node) => node.id !== nodeId);
    const newEdges = get().edges.filter(
      (edge) => edge.source !== nodeId && edge.target !== nodeId
    );
    set({
      nodes: newNodes,
      edges: newEdges,
      selectedNode:
        get().selectedNode?.id === nodeId ? null : get().selectedNode,
    });
    saveToSession(newNodes, newEdges);
  },

  setSelectedNode: (node) => {
    set({ selectedNode: node, selectedEdge: null }); // Clear edge selection when selecting node
  },

  deleteEdge: (edgeId) => {
    get().saveHistory();
    const newEdges = get().edges.filter((edge) => edge.id !== edgeId);
    set({
      edges: newEdges,
      selectedEdge:
        get().selectedEdge?.id === edgeId ? null : get().selectedEdge,
    });
    saveToSession(get().nodes, newEdges);
  },

  setSelectedEdge: (edge) => {
    set({ selectedEdge: edge, selectedNode: null }); // Clear node selection when selecting edge
  },

  runWorkflow: async () => {
    const { nodes, edges, settings } = get();
    set({ isRunning: true });

    // Check if sequential mode is enabled
    const shotCollectionNode = nodes.find(
      (node) => node.data.type === "shotCollection"
    );
    const isSequentialMode =
      shotCollectionNode &&
      (shotCollectionNode.data as ShotCollectionNodeData).sequentialMode !==
        false &&
      ((shotCollectionNode.data as ShotCollectionNodeData).shots || []).length >
        0;

    console.log("🚀 Running workflow with AI enabled:", settings.useAI);
    console.log("📊 Processing", nodes.length, "nodes");
    if (isSequentialMode) {
      const shotCount = (
        (shotCollectionNode!.data as ShotCollectionNodeData).shots || []
      ).length;
      console.log(
        `🔄 Sequential mode enabled: Processing ${shotCount} shots iteratively`
      );
    }

    // Services are already initialized with hard-coded API keys on app load

    // Set all extractor nodes to loading state
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (
          [
            "startFrame",
            "endFrame",
            "continuityPlanner",
            "imageGen",
            "llm",
            "sceneShotPlanner",
          ].includes(node.data.type)
        ) {
          return {
            ...node,
            data: { ...node.data, isLoading: true, error: undefined },
          };
        }
        return node;
      }) as WorkflowNode[],
    }));

    try {
      let results: Map<string, unknown>;

      if (isSequentialMode) {
        // Use iterative execution with callback to update nodes in real-time
        results = await executeWorkflowIteratively(
          nodes,
          edges,
          settings.useAI,
          (nodeId, data) => {
            // Update node data in real-time during iteration
            get().updateNode(nodeId, data);
          }
        );
      } else {
        // Use standard execution
        results = await executeWorkflow(nodes, edges, settings.useAI);
      }

      set({ workflowData: results, isRunning: false });

      // Update nodes with computed values
      set((state) => ({
        nodes: state.nodes.map((node) => {
          const result = results.get(node.id);
          if (result !== undefined) {
            switch (node.data.type) {
              case "shotCollection": {
                const existingData = node.data as ShotCollectionNodeData &
                  Record<string, unknown>;
                // IMPORTANT: Don't overwrite shots array during iterative execution
                // The result only contains the current shot, but we need to keep all shots
                // So always preserve the existing shots array from node data
                return {
                  ...node,
                  data: {
                    ...existingData,
                    // Keep the original shots array - don't overwrite from workflow result
                    shots: existingData.shots,
                    isLoading: false,
                  },
                };
              }
              case "sceneShotPlanner": {
                const plannerResult = (result || {}) as {
                  shotPlan?: ShotPlan[];
                  summary?: string;
                  totalDurationSeconds?: number;
                  lastSceneTitle?: string;
                  lastSceneId?: string;
                  lastScenePrompt?: string;
                };
                const existingData = node.data as SceneShotPlannerNodeData &
                  Record<string, unknown>;
                return {
                  ...node,
                  data: {
                    ...existingData,
                    shotPlan: plannerResult.shotPlan || [],
                    summary: plannerResult.summary || "",
                    totalDurationSeconds: plannerResult.totalDurationSeconds,
                    lastSceneTitle: plannerResult.lastSceneTitle,
                    lastSceneId: plannerResult.lastSceneId,
                    lastScenePrompt: plannerResult.lastScenePrompt,
                    lastRunAt: Date.now(),
                    isLoading: false,
                  },
                };
              }
              case "startFrame": {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const sfResult = result as any;
                return {
                  ...node,
                  data: {
                    ...node.data,
                    generatedPrompt: sfResult?.prompt || "",
                    generatedImage: sfResult?.image || null,
                    characterImages: sfResult?.characterImages || [],
                    extractedValue: sfResult?.prompt || "", // Keep for compatibility
                    allPrompts: sfResult?.allPrompts || [],
                    allImages: sfResult?.allImages || [],
                    allCharacterImages: sfResult?.allCharacterImages || [],
                    isLoading: false,
                  },
                };
              }
              case "endFrame": {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const efResult = result as any;
                return {
                  ...node,
                  data: {
                    ...node.data,
                    generatedPrompt: efResult?.prompt || "",
                    generatedImage: efResult?.image || null,
                    variantImages: efResult?.variantImages || [],
                    extractedValue: efResult?.prompt || "", // Keep for compatibility
                    allPrompts: efResult?.allPrompts || [],
                    allImages: efResult?.allImages || [],
                    allVariantImages: efResult?.allVariantImages || [],
                    isLoading: false,
                  },
                };
              }
              case "continuityPlanner": {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const cpResult = result as any;
                return {
                  ...node,
                  data: {
                    ...node.data,
                    characters: cpResult?.characters || [],
                    shotInfo: cpResult?.shotInfo || [],
                    variants: cpResult?.variants || [],
                    objects: cpResult?.objects || [],
                    accumulatedContext: cpResult?.accumulatedContext || {
                      characters: [],
                      shotInfo: [],
                      variants: [],
                      objects: [],
                    },
                    isLoading: false,
                  },
                };
              }
              case "contextPrompt":
                return {
                  ...node,
                  data: { ...node.data, preview: result, isLoading: false },
                };
              case "imageGen":
                return {
                  ...node,
                  data: {
                    ...node.data,
                    generatedImages: result,
                    isLoading: false,
                  },
                };
              case "llm":
                return {
                  ...node,
                  data: {
                    ...node.data,
                    response: result,
                    isLoading: false,
                  },
                };
              case "output":
                return {
                  ...node,
                  data: { ...node.data, finalPrompt: result, isLoading: false },
                };
              default:
                return node;
            }
          }
          return { ...node, data: { ...node.data, isLoading: false } };
        }) as WorkflowNode[],
      }));
    } catch (error) {
      console.error("Workflow execution failed:", error);
      set({ isRunning: false });

      // Set error state on nodes
      set((state) => ({
        nodes: state.nodes.map((node) => ({
          ...node,
          data: {
            ...node.data,
            isLoading: false,
            error:
              error instanceof Error
                ? error.message
                : "Workflow execution failed",
          },
        })) as WorkflowNode[],
      }));
    }
  },

  clearCanvas: () => {
    get().saveHistory();
    set({
      nodes: [],
      edges: [],
      selectedNode: null,
      selectedEdge: null,
      workflowData: new Map(),
    });
    saveToSession([], []);
  },

  saveHistory: () => {
    const { nodes, edges, history } = get();
    set({
      history: {
        past: [...history.past, { nodes, edges }],
        future: [],
      },
    });
  },

  undo: () => {
    const { history, nodes, edges } = get();
    if (history.past.length === 0) return;

    const previous = history.past[history.past.length - 1];
    const newPast = history.past.slice(0, -1);

    set({
      nodes: previous.nodes,
      edges: previous.edges,
      history: {
        past: newPast,
        future: [{ nodes, edges }, ...history.future],
      },
    });
    saveToSession(previous.nodes, previous.edges);
  },

  redo: () => {
    const { history, nodes, edges } = get();
    if (history.future.length === 0) return;

    const next = history.future[0];
    const newFuture = history.future.slice(1);

    set({
      nodes: next.nodes,
      edges: next.edges,
      history: {
        past: [...history.past, { nodes, edges }],
        future: newFuture,
      },
    });
    saveToSession(next.nodes, next.edges);
  },

  toggleDarkMode: () => {
    set((state) => ({ isDarkMode: !state.isDarkMode }));
  },

  updateSettings: (newSettings) => {
    set((state) => {
      const updatedSettings = {
        ...state.settings,
        ...newSettings,
        // Always keep hard-coded API keys
        anthropicApiKey: ANTHROPIC_API_KEY,
        falApiKey: FAL_API_KEY,
      };

      // Save to localStorage
      localStorage.setItem("app-settings", JSON.stringify(updatedSettings));

      return { settings: updatedSettings };
    });
  },

  exportWorkflow: () => {
    const { nodes, edges } = get();
    const exportData = {
      version: "1.0.0",
      name: "Video Prompt Workflow",
      description: "Exported workflow",
      nodes,
      edges,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return JSON.stringify(exportData, null, 2);
  },

  importWorkflow: (data) => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.nodes && parsed.edges) {
        get().saveHistory();
        set({
          nodes: parsed.nodes,
          edges: parsed.edges,
        });
        saveToSession(parsed.nodes, parsed.edges);
      }
    } catch (error) {
      console.error("Failed to import workflow:", error);
    }
  },

  loadExampleWorkflow: () => {
    get().saveHistory();
    set({
      nodes: EXAMPLE_WORKFLOW.nodes,
      edges: EXAMPLE_WORKFLOW.edges,
      selectedNode: null,
    });
    saveToSession(EXAMPLE_WORKFLOW.nodes, EXAMPLE_WORKFLOW.edges);
  },

  addMediaItem: (item) => {
    set((state) => ({
      mediaGallery: [item, ...state.mediaGallery], // Add to beginning
    }));
  },

  clearMediaGallery: () => {
    set({ mediaGallery: [] });
  },

  saveCustomModule: (module: CustomModuleDefinition) => {
    const modules = [...get().customModules];
    // Check if module with same ID exists and update, otherwise add new
    const existingIndex = modules.findIndex((m) => m.id === module.id);
    if (existingIndex >= 0) {
      modules[existingIndex] = module;
    } else {
      modules.push(module);
    }
    set({ customModules: modules });
    // Persist to localStorage
    try {
      localStorage.setItem("customModules", JSON.stringify(modules));
    } catch (error) {
      console.error("Failed to save custom modules:", error);
    }
  },

  deleteCustomModule: (id: string) => {
    const modules = get().customModules.filter((m) => m.id !== id);
    set({ customModules: modules });
    // Persist to localStorage
    try {
      localStorage.setItem("customModules", JSON.stringify(modules));
    } catch (error) {
      console.error("Failed to save custom modules:", error);
    }
  },

  loadCustomModules: () => {
    try {
      const stored = localStorage.getItem("customModules");
      if (stored) {
        const modules = JSON.parse(stored) as CustomModuleDefinition[];
        set({ customModules: modules });
      }
    } catch (error) {
      console.error("Failed to load custom modules:", error);
    }
  },
}));
