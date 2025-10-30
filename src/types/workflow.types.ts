import type { Node, Edge } from "@xyflow/react";

// Node Types
export type NodeType =
  | "input"
  | "sceneCollection"
  | "sceneShotPlanner"
  | "startFrame"
  | "endFrame"
  | "continuityPlanner"
  | "contextPrompt"
  | "imageGen"
  | "llm"
  | "output";

// Module Categories
export type ModuleCategory =
  | "input"
  | "extractors"
  | "processing"
  | "output"
  | "custom";

// Custom Module Definition
export interface CustomModuleDefinition {
  id: string;
  name: string;
  description: string;
  baseType: "llm" | "imageGen";
  icon: string;
  color: string;
  // Configuration for LLM modules
  llmConfig?: {
    template: string;
    model: "claude" | "llama";
    maxTokens: number;
  };
  // Configuration for ImageGen modules
  imageGenConfig?: {
    inputPrompt: string;
    width: number;
    height: number;
    numberOfImages: number;
  };
  createdAt: number;
}

// Shot Information Structure
export interface ShotInfo {
  lighting?: string;
  mood?: string;
  actions?: string;
  shotAngle?: string;
  cameraLens?: string;
  cameraMovement?: string;
}

export interface SceneDefinition {
  id: string;
  title: string;
  prompt: string;
}

export interface ShotPlan {
  id: string;
  title: string;
  description: string;
  startFramePrompt: string;
  endFramePrompt: string;
  videoPrompt: string;
  durationSeconds?: number;
  cameraNotes?: string;
  inspirationReferences?: string[];
}

// Base Node Data
export interface BaseNodeData {
  label: string;
  type: NodeType;
  isCollapsed?: boolean;
  hasValidInput?: boolean;
  isLoading?: boolean;
  error?: string;
}

// Specific Node Data Types
export interface InputNodeData extends BaseNodeData {
  type: "input";
  prompt: string;
}

export interface SceneCollectionNodeData extends BaseNodeData {
  type: "sceneCollection";
  scenes: SceneDefinition[];
  activeSceneId?: string | null;
  autoSplit?: boolean;
}

export interface StartFrameNodeData extends BaseNodeData {
  type: "startFrame";
  inputValue?: string;
  extractedValue: string; // Keep for compatibility
  generatedPrompt?: string; // AI-generated prompt for the start frame
  generatedImage?: string; // URL of the generated image
  characterImages?: Array<{ name: string; url: string; description: string }>; // Generated character images with descriptions
  selectedCharacters?: string[]; // Array of selected character names to output
  outputStartFrame?: boolean; // Whether to output the start frame image
  isManual: boolean;
  isLoading?: boolean;
  generationStage?: string; // Current stage of generation
}

export interface EndFrameNodeData extends BaseNodeData {
  type: "endFrame";
  inputValue?: string;
  extractedValue: string; // Keep for compatibility
  generatedPrompt?: string; // AI-generated prompt for the end frame
  generatedImage?: string; // URL of the generated end frame image
  variantImages?: Array<{ name: string; url: string; prompt: string }>; // Generated variant images
  isManual: boolean;
  isLoading?: boolean;
  generationStage?: string; // Current stage of generation
}

export interface ContinuityPlannerNodeData extends BaseNodeData {
  type: "continuityPlanner";
  inputValue?: string;
  // Flags for which categories to extract
  extractCharacters: boolean;
  extractShotInfo: boolean;
  extractVariants: boolean;
  extractObjects: boolean;
  // Extracted data for each category
  characters: Array<{ name: string; description: string; selected: boolean }>;
  shotInfo: Array<{ key: string; value: string; selected: boolean }>;
  variants: Array<{ name: string; description: string; selected: boolean }>;
  objects: Array<{ name: string; description: string; selected: boolean }>;
  isManual: boolean;
}

export interface ContextPromptNodeData extends BaseNodeData {
  type: "contextPrompt";
  template: string;
  preview: string;
  inputs: Record<string, unknown>;
  availableVariables: string[];
}

export interface SceneShotPlannerNodeData extends BaseNodeData {
  type: "sceneShotPlanner";
  sceneOverride?: string;
  planStrategy?: string;
  includeTransitions?: boolean;
  shotPlan: ShotPlan[];
  summary?: string;
  totalDurationSeconds?: number;
  lastSceneTitle?: string;
  lastSceneId?: string;
  lastScenePrompt?: string;
  lastRunAt?: number;
}

export interface ImageGenNodeData extends BaseNodeData {
  type: "imageGen";
  inputPrompt?: string;
  generatedImages: string[];
  width: number;
  height: number;
  numberOfImages: number;
  customName?: string;
  isSavedAsCustom?: boolean;
}

export interface LLMNodeData extends BaseNodeData {
  type: "llm";
  template: string;
  response: string;
  inputs: Record<string, unknown>;
  availableVariables: string[];
  model: "claude" | "llama";
  maxTokens: number;
  customName?: string;
  isSavedAsCustom?: boolean;
}

export interface OutputNodeData extends BaseNodeData {
  type: "output";
  finalPrompt: string;
  inputValue?: string;
}

export type WorkflowNodeData =
  | InputNodeData
  | SceneCollectionNodeData
  | StartFrameNodeData
  | EndFrameNodeData
  | ContinuityPlannerNodeData
  | ContextPromptNodeData
  | SceneShotPlannerNodeData
  | ImageGenNodeData
  | LLMNodeData
  | OutputNodeData;

export type WorkflowNode = Node<
  WorkflowNodeData & Record<string, unknown>,
  string
>;
export type WorkflowEdge = Edge;

// Module Definition for Sidebar
export interface ModuleDefinition {
  id: string;
  type: NodeType;
  label: string;
  description: string;
  category: ModuleCategory;
  color: string;
  icon: string;
}

// Workflow State
export interface WorkflowState {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  selectedNode: WorkflowNode | null;
  workflowData: Map<string, unknown>;
  history: {
    past: Array<{ nodes: WorkflowNode[]; edges: WorkflowEdge[] }>;
    future: Array<{ nodes: WorkflowNode[]; edges: WorkflowEdge[] }>;
  };
}

// Export/Import Format
export interface WorkflowExport {
  version: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: string;
  updatedAt: string;
}

// Extraction Result
export interface ExtractionResult {
  success: boolean;
  value: unknown;
  confidence?: number;
  error?: string;
}

// Settings
export interface AppSettings {
  anthropicApiKey: string;
  falApiKey: string;
  useAI: boolean;
  autoRun: boolean;
}

// Media Gallery
export interface MediaItem {
  id: string;
  type: "character" | "startFrame" | "endFrame" | "generated";
  url: string;
  name: string;
  prompt?: string;
  timestamp: number;
}
