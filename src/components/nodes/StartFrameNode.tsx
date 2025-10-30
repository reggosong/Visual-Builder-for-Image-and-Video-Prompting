import React from "react";
import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";
import type { StartFrameNodeData } from "../../types/workflow.types";
import { useWorkflowStore } from "../../store/workflowStore";
import { Image, Loader2, Users } from "lucide-react";

export const StartFrameNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const nodeData = data as unknown as StartFrameNodeData;
  const { deleteNode, updateNode } = useWorkflowStore();

  const toggleCharacterSelection = (characterName: string) => {
    const currentSelected = nodeData.selectedCharacters || [];
    const newSelected = currentSelected.includes(characterName)
      ? currentSelected.filter((name) => name !== characterName)
      : [...currentSelected, characterName];
    updateNode(id, { selectedCharacters: newSelected });
  };

  const toggleStartFrameOutput = () => {
    updateNode(id, { outputStartFrame: !nodeData.outputStartFrame });
  };

  return (
    <BaseNode
      data={nodeData}
      selected={selected}
      color="bg-green-600"
      title="Start Frame Generator"
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
              {nodeData.generationStage || "Generating start frame..."}
            </span>
          </div>
        )}

        {/* Character Images with Selection */}
        {nodeData.characterImages &&
          nodeData.characterImages.length > 0 &&
          !nodeData.isLoading && (
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Users
                  size={14}
                  className="text-purple-600 dark:text-purple-400"
                />
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Characters ({nodeData.characterImages.length})
                </label>
              </div>
              <div className="flex gap-2 flex-wrap">
                {nodeData.characterImages.map((char, idx) => {
                  const isSelected = (
                    nodeData.selectedCharacters || []
                  ).includes(char.name);
                  return (
                    <div
                      key={idx}
                      className="flex flex-col items-center relative group cursor-pointer"
                      onClick={() => toggleCharacterSelection(char.name)}
                    >
                      <div
                        className={`relative rounded overflow-hidden border-2 ${
                          isSelected
                            ? "border-blue-500 dark:border-blue-400"
                            : "border-gray-300 dark:border-gray-600"
                        } transition-colors`}
                      >
                        <img
                          src={char.url}
                          alt={char.name}
                          className="w-12 h-16 object-cover"
                          title={char.name}
                        />
                        {/* Selection Indicator */}
                        <div
                          className={`absolute top-0 right-0 w-4 h-4 flex items-center justify-center ${
                            isSelected
                              ? "bg-blue-500"
                              : "bg-gray-400 opacity-50 group-hover:opacity-100"
                          } transition-opacity`}
                        >
                          {isSelected && (
                            <svg
                              className="w-3 h-3 text-white"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate max-w-[48px]">
                        {char.name}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                Click to select characters for output
              </p>
            </div>
          )}

        {/* Generated Image Preview with Output Toggle */}
        {nodeData.generatedImage && !nodeData.isLoading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block">
                Start Frame:
              </label>
              <button
                onClick={toggleStartFrameOutput}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  nodeData.outputStartFrame
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-400 dark:hover:bg-gray-500"
                }`}
              >
                {nodeData.outputStartFrame ? "✓ Output" : "No Output"}
              </button>
            </div>
            <div
              className={`relative rounded overflow-hidden border-2 ${
                nodeData.outputStartFrame
                  ? "border-blue-500 dark:border-blue-400"
                  : "border-gray-300 dark:border-gray-600"
              } transition-colors`}
            >
              <img
                src={nodeData.generatedImage}
                alt="Start Frame"
                className="w-full h-auto"
                style={{ maxHeight: "150px", objectFit: "cover" }}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 italic">
              Toggle to include in output
            </p>
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

        {/* Empty State */}
        {!nodeData.generatedImage &&
          !nodeData.generatedPrompt &&
          !nodeData.isLoading && (
            <div className="flex flex-col items-center justify-center p-4 text-center">
              <Image size={32} className="text-gray-400 mb-2" />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Connect input and run workflow to generate start frame
              </p>
            </div>
          )}
      </div>
    </BaseNode>
  );
};
