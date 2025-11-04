import React from "react";
import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";
import type { EndFrameNodeData } from "../../types/workflow.types";
import { useWorkflowStore } from "../../store/workflowStore";
import { Image, Loader2, Palette } from "lucide-react";

export const EndFrameNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const nodeData = data as unknown as EndFrameNodeData;
  const { deleteNode } = useWorkflowStore();

  return (
    <BaseNode
      data={nodeData}
      selected={selected}
      color="bg-green-600"
      title="End Frame Generator"
      hasInput={true}
      hasOutput={true}
      onDelete={() => deleteNode(id)}
    >
      <div className="space-y-3">
        {/* Loading State */}
        {nodeData.isLoading && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
            <Loader2 size={16} className="animate-spin text-blue-600" />
            <span className="text-xs text-blue-600 dark:text-blue-400">
              {nodeData.generationStage || "Generating end frame..."}
            </span>
          </div>
        )}

        {/* Variant Images */}
        {nodeData.variantImages &&
          nodeData.variantImages.length > 0 &&
          !nodeData.isLoading && (
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Palette
                  size={14}
                  className="text-purple-600 dark:text-purple-400"
                />
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Variants ({nodeData.variantImages.length})
                </label>
              </div>
              <div className="flex gap-2 flex-wrap">
                {nodeData.variantImages.map((variant, idx) => (
                  <div key={idx} className="flex flex-col items-center">
                    <img
                      src={variant.url}
                      alt={variant.name}
                      className="w-16 h-16 object-cover rounded border border-gray-300 dark:border-gray-600"
                      title={variant.name}
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate max-w-[64px]">
                      {variant.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Generated End Frame Image */}
        {nodeData.generatedImage && !nodeData.isLoading && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block">
              End Frame:
            </label>
            <div className="relative rounded overflow-hidden border border-gray-300 dark:border-gray-600">
              <img
                src={nodeData.generatedImage}
                alt="End Frame"
                className="w-full h-auto"
                style={{ maxHeight: "150px", objectFit: "cover" }}
              />
            </div>
          </div>
        )}

        {/* Generated Prompt Preview */}
        {nodeData.generatedPrompt && !nodeData.isLoading && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block">
              Prompt:
            </label>
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-700 dark:text-gray-300 line-clamp-3">
              {nodeData.generatedPrompt}
            </div>
          </div>
        )}

        {/* Accumulated Results - All Images from All Shots */}
        {nodeData.allImages &&
          nodeData.allImages.length > 0 &&
          !nodeData.isLoading && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-green-600 dark:text-green-400 px-2">
                All End Frames ({nodeData.allImages.length} shots):
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {nodeData.allImages.map((img, idx) => (
                  <div
                    key={idx}
                    className="rounded border border-green-500/20 bg-green-50 dark:bg-green-900/20 p-2 space-y-2"
                  >
                    <div className="text-xs font-semibold text-green-700 dark:text-green-300">
                      Shot {img.shotIndex + 1}
                    </div>
                    <img
                      src={img.url}
                      alt={`Shot ${img.shotIndex + 1} End Frame`}
                      className="w-full h-auto rounded border border-gray-300 dark:border-gray-600"
                    />
                    {nodeData.allPrompts && nodeData.allPrompts[idx] && (
                      <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3 p-2 bg-white/50 dark:bg-gray-800/50 rounded">
                        {nodeData.allPrompts[idx].prompt}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Accumulated Variant Images */}
        {nodeData.allVariantImages &&
          nodeData.allVariantImages.length > 0 &&
          !nodeData.isLoading && (
            <div className="space-y-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded border border-purple-500/20">
              <div className="text-xs font-medium text-purple-600 dark:text-purple-400">
                All Variant Images ({nodeData.allVariantImages.length}):
              </div>
              <div className="flex gap-2 flex-wrap">
                {nodeData.allVariantImages.map((variant, idx) => (
                  <div key={idx} className="flex flex-col items-center">
                    <div className="text-xs text-purple-600 dark:text-purple-400 mb-1">
                      Shot {variant.shotIndex + 1}
                    </div>
                    <img
                      src={variant.url}
                      alt={variant.name}
                      className="w-16 h-16 object-cover rounded border border-gray-300 dark:border-gray-600"
                      title={variant.name}
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate max-w-[64px]">
                      {variant.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Empty State */}
        {!nodeData.generatedImage &&
          !nodeData.generatedPrompt &&
          !nodeData.isLoading &&
          (!nodeData.allPrompts || nodeData.allPrompts.length === 0) && (
            <div className="flex flex-col items-center justify-center p-4 text-center">
              <Image size={32} className="text-gray-400 mb-2" />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Connect input and run workflow to generate end frame
              </p>
            </div>
          )}
      </div>
    </BaseNode>
  );
};
