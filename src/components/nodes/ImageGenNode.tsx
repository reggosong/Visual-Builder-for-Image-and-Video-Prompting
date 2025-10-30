import React from "react";
import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";
import type { ImageGenNodeData } from "../../types/workflow.types";
import { useWorkflowStore } from "../../store/workflowStore";
import { Image as ImageIcon, Download, Loader2 } from "lucide-react";

export const ImageGenNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const nodeData = data as unknown as ImageGenNodeData;
  const { updateNode, deleteNode } = useWorkflowStore();

  const handleDownloadImage = (imageUrl: string, index: number) => {
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `generated-image-${index + 1}.png`;
    a.click();
  };

  return (
    <BaseNode
      data={nodeData}
      selected={selected}
      color="bg-pink-600"
      title="Image Generation"
      hasInput={true}
      hasOutput={true}
      onDelete={() => deleteNode(id)}
    >
      <div className="space-y-3">
        {/* Settings */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
              Width:
            </label>
            <input
              type="number"
              value={nodeData.width}
              onChange={(e) =>
                updateNode(id, { width: parseInt(e.target.value) })
              }
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded 
                         bg-white dark:bg-gray-700 text-sm
                         focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              min="256"
              max="2048"
              step="256"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
              Height:
            </label>
            <input
              type="number"
              value={nodeData.height}
              onChange={(e) =>
                updateNode(id, { height: parseInt(e.target.value) })
              }
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded 
                         bg-white dark:bg-gray-700 text-sm
                         focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              min="256"
              max="2048"
              step="256"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
            Number of Images:
          </label>
          <input
            type="number"
            value={nodeData.numberOfImages}
            onChange={(e) =>
              updateNode(id, { numberOfImages: parseInt(e.target.value) })
            }
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded 
                       bg-white dark:bg-gray-700 text-sm
                       focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            min="1"
            max="4"
          />
        </div>

        {/* Loading State */}
        {nodeData.isLoading && (
          <div className="flex items-center justify-center gap-2 p-4 bg-pink-50 dark:bg-pink-900/20 rounded">
            <Loader2 className="animate-spin" size={20} />
            <span className="text-sm">Generating images...</span>
          </div>
        )}

        {/* Error State */}
        {nodeData.error && (
          <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
            <p className="text-xs text-red-600 dark:text-red-400">
              {nodeData.error}
            </p>
          </div>
        )}

        {/* Generated Images */}
        {nodeData.generatedImages.length > 0 && !nodeData.isLoading && (
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-2">
              Generated Images:
            </label>
            <div className="space-y-2">
              {nodeData.generatedImages.map((imageUrl, index) => (
                <div
                  key={index}
                  className="relative group border border-gray-300 dark:border-gray-600 rounded overflow-hidden"
                >
                  <img
                    src={imageUrl}
                    alt={`Generated ${index + 1}`}
                    className="w-full h-auto"
                  />
                  <button
                    onClick={() => handleDownloadImage(imageUrl, index)}
                    className="absolute top-2 right-2 p-2 bg-white dark:bg-gray-800 
                               rounded-full shadow-lg opacity-0 group-hover:opacity-100 
                               transition-opacity"
                    title="Download"
                  >
                    <Download size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {nodeData.generatedImages.length === 0 && !nodeData.isLoading && (
          <div className="flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-700/50 rounded border-2 border-dashed border-gray-300 dark:border-gray-600">
            <ImageIcon size={32} className="text-gray-400 mb-2" />
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Connect a prompt and run workflow to generate images
            </p>
          </div>
        )}
      </div>
    </BaseNode>
  );
};
