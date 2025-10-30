import React from "react";
import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";
import type { OutputNodeData } from "../../types/workflow.types";
import { useWorkflowStore } from "../../store/workflowStore";
import { Copy, Check, Download } from "lucide-react";

export const OutputNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const nodeData = data as unknown as OutputNodeData;
  const { deleteNode } = useWorkflowStore();
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    if (nodeData.finalPrompt) {
      await navigator.clipboard.writeText(nodeData.finalPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExportJSON = () => {
    const exportData = {
      prompt: nodeData.finalPrompt,
      timestamp: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "video-prompt.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportText = () => {
    const blob = new Blob([nodeData.finalPrompt || ""], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "video-prompt.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <BaseNode
      data={nodeData}
      selected={selected}
      color="bg-orange-600"
      title="Final Output"
      hasInput={true}
      hasOutput={false}
      onDelete={() => deleteNode(id)}
    >
      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
            Generated Prompt:
          </label>
          <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded text-sm border border-gray-300 dark:border-gray-600 min-h-[100px] max-h-[200px] overflow-y-auto">
            {nodeData.finalPrompt || "Waiting for input..."}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            disabled={!nodeData.finalPrompt}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 
                       bg-blue-500 text-white rounded text-sm
                       hover:bg-blue-600 transition-colors
                       disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied!" : "Copy"}
          </button>

          <button
            onClick={handleExportText}
            disabled={!nodeData.finalPrompt}
            className="px-3 py-2 bg-green-500 text-white rounded text-sm
                       hover:bg-green-600 transition-colors
                       disabled:bg-gray-300 disabled:cursor-not-allowed"
            title="Export as Text"
          >
            <Download size={14} />
          </button>

          <button
            onClick={handleExportJSON}
            disabled={!nodeData.finalPrompt}
            className="px-3 py-2 bg-purple-500 text-white rounded text-sm
                       hover:bg-purple-600 transition-colors
                       disabled:bg-gray-300 disabled:cursor-not-allowed"
            title="Export as JSON"
          >
            <Download size={14} />
          </button>
        </div>

        {nodeData.finalPrompt && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {nodeData.finalPrompt.length} characters
          </div>
        )}
      </div>
    </BaseNode>
  );
};
