import React, { useState, useEffect, useRef } from "react";
import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";
import type { ContextPromptNodeData } from "../../types/workflow.types";
import { useWorkflowStore } from "../../store/workflowStore";
import { Eye } from "lucide-react";

export const ContextPromptNode: React.FC<NodeProps> = ({
  id,
  data,
  selected,
}) => {
  const nodeData = data as unknown as ContextPromptNodeData;
  const { updateNode, deleteNode } = useWorkflowStore();
  const [showPreview, setShowPreview] = useState(true);

  // Use local state to avoid cursor jumping
  const [localTemplate, setLocalTemplate] = useState(nodeData.template);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Update local state when external data changes
  useEffect(() => {
    setLocalTemplate(nodeData.template);
  }, [nodeData.template]);

  const handleTemplateChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalTemplate(newValue);

    // Debounce the store update to avoid re-renders while typing
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      updateNode(id, { template: newValue });
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
      color="bg-purple-600"
      title="Context Prompt Builder"
      hasInput={true}
      hasOutput={true}
      onDelete={() => deleteNode(id)}
    >
      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
            Template:
          </label>
          <textarea
            value={localTemplate}
            onChange={handleTemplateChange}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded 
                       bg-white dark:bg-gray-700 text-sm font-mono
                       focus:ring-2 focus:ring-purple-500 focus:border-transparent
                       resize-none"
            rows={4}
            placeholder="Use {{variable}} syntax to insert values"
          />
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Available: characters, lighting, mood, actions, shotAngle,
            cameraLens, cameraMovement
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Preview:
            </label>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="p-1 hover:bg-purple-100 dark:hover:bg-purple-900 rounded transition-colors"
            >
              <Eye size={14} />
            </button>
          </div>
          {showPreview && (
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded text-sm border border-gray-300 dark:border-gray-600">
              {nodeData.preview || "Connect inputs to see preview..."}
            </div>
          )}
        </div>
      </div>
    </BaseNode>
  );
};
