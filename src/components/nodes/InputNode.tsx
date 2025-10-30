import React, { useState, useEffect, useRef } from "react";
import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";
import type { InputNodeData } from "../../types/workflow.types";
import { useWorkflowStore } from "../../store/workflowStore";

export const InputNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const nodeData = data as unknown as InputNodeData;
  const { updateNode, deleteNode } = useWorkflowStore();

  // Use local state to avoid cursor jumping
  const [localPrompt, setLocalPrompt] = useState(nodeData.prompt);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Update local state when external data changes (e.g., from undo/redo)
  useEffect(() => {
    setLocalPrompt(nodeData.prompt);
  }, [nodeData.prompt]);

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalPrompt(newValue);

    // Debounce the store update to avoid re-renders while typing
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      updateNode(id, { prompt: newValue });
    }, 300);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return (
    <BaseNode
      data={nodeData}
      selected={selected}
      color="bg-blue-600"
      title="Text Prompt Input"
      hasInput={false}
      hasOutput={true}
      onDelete={() => deleteNode(id)}
    >
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
          Enter your video prompt:
        </label>
        <textarea
          value={localPrompt}
          onChange={handlePromptChange}
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded 
                     bg-white dark:bg-gray-700 text-sm
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     resize-none"
          rows={5}
          placeholder="Describe your video scene..."
        />
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {localPrompt.length} characters
        </div>
      </div>
    </BaseNode>
  );
};
