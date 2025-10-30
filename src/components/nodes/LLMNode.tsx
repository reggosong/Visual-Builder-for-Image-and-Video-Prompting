import React from "react";
import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";
import type { LLMNodeData } from "../../types/workflow.types";
import { useWorkflowStore } from "../../store/workflowStore";
import { Sparkles, Loader2 } from "lucide-react";

export const LLMNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const nodeData = data as unknown as LLMNodeData;
  const { deleteNode } = useWorkflowStore();

  return (
    <BaseNode
      data={nodeData}
      selected={selected}
      color="bg-indigo-600"
      title="LLM Call"
      hasInput={true}
      hasOutput={true}
      onDelete={() => deleteNode(id)}
    >
      <div className="space-y-3">
        {/* Model Badge */}
        <div className="flex items-center gap-2">
          <Sparkles
            size={14}
            className="text-indigo-600 dark:text-indigo-400"
          />
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Model:{" "}
            {nodeData.model === "claude" ? "Claude Sonnet 4" : "Llama 3.3"}
          </span>
        </div>

        {/* Prompt Template Preview */}
        {nodeData.template && (
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
              Prompt:
            </label>
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-700 dark:text-gray-300 line-clamp-3 font-mono">
              {nodeData.template}
            </div>
          </div>
        )}

        {/* Loading State */}
        {nodeData.isLoading && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
            <Loader2 size={16} className="animate-spin text-blue-600" />
            <span className="text-xs text-blue-600 dark:text-blue-400">
              Calling LLM...
            </span>
          </div>
        )}

        {/* Response Preview */}
        {nodeData.response && !nodeData.isLoading && (
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
              Response:
            </label>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded text-xs text-gray-700 dark:text-gray-300 line-clamp-4">
              {nodeData.response}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!nodeData.template && (
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center p-2">
            Configure prompt in properties panel
          </div>
        )}
      </div>
    </BaseNode>
  );
};
