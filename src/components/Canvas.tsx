import React, { useCallback, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  MarkerType,
  ConnectionMode,
  useReactFlow,
  SelectionMode,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useWorkflowStore } from "../store/workflowStore";
import type { NodeType } from "../types/workflow.types";
import {
  InputNode,
  StartFrameNode,
  EndFrameNode,
  ContinuityPlannerNode,
  ContextPromptNode,
  ImageGenNode,
  LLMNode,
  OutputNode,
} from "./nodes";

const nodeTypes = {
  input: InputNode,
  startFrame: StartFrameNode,
  endFrame: EndFrameNode,
  continuityPlanner: ContinuityPlannerNode,
  contextPrompt: ContextPromptNode,
  imageGen: ImageGenNode,
  llm: LLMNode,
  output: OutputNode,
};

// Helper function to create node data based on type
const createNodeData = (type: NodeType, label: string) => {
  const baseData: any = {
    label,
    type,
  };

  switch (type) {
    case "input":
      return { ...baseData, prompt: "" };
    case "startFrame":
      return {
        ...baseData,
        extractedValue: "",
        isManual: false,
        selectedCharacters: [],
        outputStartFrame: true,
      };
    case "endFrame":
      return {
        ...baseData,
        extractedValue: "",
        isManual: false,
      };
    case "continuityPlanner":
      return {
        ...baseData,
        extractCharacters: true,
        extractShotInfo: true,
        extractVariants: true,
        extractObjects: true,
        characters: [],
        shotInfo: [],
        variants: [],
        objects: [],
        isManual: false,
      };
    case "contextPrompt":
      return {
        ...baseData,
        template: "",
        preview: "",
        inputs: {},
        availableVariables: [],
      };
    case "imageGen":
      return {
        ...baseData,
        generatedImages: [],
        width: 1024,
        height: 1024,
        numberOfImages: 1,
      };
    case "llm":
      return {
        ...baseData,
        template: "",
        response: "",
        inputs: {},
        availableVariables: [],
        model: "claude",
        maxTokens: 1024,
      };
    case "output":
      return {
        ...baseData,
        finalPrompt: "",
      };
    default:
      return baseData;
  }
};

const CanvasInner: React.FC = () => {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setSelectedNode,
    setSelectedEdge,
    selectedEdge,
    isDarkMode,
    addNode,
  } = useWorkflowStore();

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: any) => {
      setSelectedNode(node);
    },
    [setSelectedNode]
  );

  const handleEdgeClick = useCallback(
    (_: React.MouseEvent, edge: any) => {
      setSelectedEdge(edge);
    },
    [setSelectedEdge]
  );

  const handlePaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
  }, [setSelectedNode, setSelectedEdge]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData(
        "application/reactflow"
      ) as NodeType;

      if (!type) {
        return;
      }

      // Check if this is a custom module
      const customConfigStr = event.dataTransfer.getData("customConfig");
      const customConfig = customConfigStr ? JSON.parse(customConfigStr) : null;

      // Get the position where the node was dropped
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Get the label for this node type
      const moduleLabels: Record<NodeType, string> = {
        input: "Text Prompt Input",
        startFrame: "Start Frame",
        endFrame: "End Frame",
        continuityPlanner: "Continuity Planner",
        contextPrompt: "Context Prompt",
        imageGen: "Image Generation",
        llm: "LLM Call",
        output: "Final Output",
      };

      // Create base node data
      let nodeData = createNodeData(
        type,
        customConfig ? customConfig.name : moduleLabels[type]
      );

      // Apply custom configuration if available
      if (customConfig) {
        if (type === "llm" && customConfig.llmConfig) {
          nodeData = {
            ...nodeData,
            ...customConfig.llmConfig,
            customName: customConfig.name,
          };
        } else if (type === "imageGen" && customConfig.imageGenConfig) {
          nodeData = {
            ...nodeData,
            ...customConfig.imageGenConfig,
            customName: customConfig.name,
          };
        }
      }

      const newNode: any = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: nodeData,
      };

      addNode(newNode);
    },
    [screenToFlowPosition, addNode]
  );

  // Modify edges to show selection state
  const edgesWithSelection = edges.map((edge) => ({
    ...edge,
    selected: selectedEdge?.id === edge.id,
    style: {
      ...edge.style,
      stroke:
        selectedEdge?.id === edge.id
          ? isDarkMode
            ? "#fbbf24"
            : "#f59e0b" // Yellow for selected
          : isDarkMode
          ? "#60a5fa"
          : "#3b82f6", // Blue for normal
      strokeWidth: selectedEdge?.id === edge.id ? 3.5 : 2.5,
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 20,
      height: 20,
      color:
        selectedEdge?.id === edge.id
          ? isDarkMode
            ? "#fbbf24"
            : "#f59e0b"
          : isDarkMode
          ? "#60a5fa"
          : "#3b82f6",
    },
  }));

  return (
    <div ref={reactFlowWrapper} className="w-full h-full">
      <ReactFlow
        nodes={nodes as any}
        edges={edgesWithSelection}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        onPaneClick={handlePaneClick}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes as any}
        connectionMode={ConnectionMode.Loose}
        fitView
        className={isDarkMode ? "dark" : ""}
        minZoom={0.01}
        maxZoom={4}
        // Multi-select with box selection (only when holding Cmd/Ctrl)
        selectionOnDrag={false}
        panOnDrag={true} // Default behavior: pan by dragging
        selectionMode={SelectionMode.Partial}
        multiSelectionKeyCode="Meta" // Cmd on Mac, Ctrl on Windows
        deleteKeyCode="Backspace" // Delete selected nodes with Backspace
        selectionKeyCode="Meta" // Hold Cmd/Ctrl + drag to draw selection box
        defaultEdgeOptions={{
          type: "smoothstep",
          animated: true,
          style: {
            stroke: isDarkMode ? "#60a5fa" : "#3b82f6",
            strokeWidth: 2.5,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
            color: isDarkMode ? "#60a5fa" : "#3b82f6",
          },
        }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={16}
          size={1}
          className="bg-gray-50 dark:bg-gray-900"
        />
        <Controls className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600" />
        <MiniMap
          className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600"
          pannable={true}
          zoomable={true}
          nodeColor={(node) => {
            switch (node.data.type) {
              case "input":
                return "#2563eb";
              case "startFrame":
              case "endFrame":
                return "#16a34a";
              case "continuityPlanner":
                return "#14b8a6";
              case "contextPrompt":
                return "#9333ea";
              case "imageGen":
                return "#ec4899";
              case "llm":
                return "#4f46e5";
              case "output":
                return "#ea580c";
              default:
                return "#6b7280";
            }
          }}
        />
      </ReactFlow>
    </div>
  );
};

export const Canvas: React.FC = () => {
  return <CanvasInner />;
};
