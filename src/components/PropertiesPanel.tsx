import React from "react";
import { useWorkflowStore } from "../store/workflowStore";
import { X } from "lucide-react";
import type {
  ShotCollectionNodeData,
  SceneShotPlannerNodeData,
  ShotPlan,
} from "../types/workflow.types";

export const PropertiesPanel: React.FC = () => {
  const { selectedNode, updateNode, edges, saveCustomModule } =
    useWorkflowStore();

  if (!selectedNode) {
    return null; // Don't render panel when no node is selected
  }

  const nodeData = selectedNode.data;
  const incomingEdges = edges.filter((e) => e.target === selectedNode.id);
  const outgoingEdges = edges.filter((e) => e.source === selectedNode.id);

  const handleNameChange = (newName: string) => {
    updateNode(selectedNode.id, { label: newName });
  };

  return (
    <div className="w-80 h-full bg-white dark:bg-gray-800 border-l border-gray-300 dark:border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-300 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Properties
          </h2>
          <button
            onClick={() => useWorkflowStore.getState().setSelectedNode(null)}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Node Name */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Node Name
          </label>
          <input
            type="text"
            value={nodeData.label}
            onChange={(e) => handleNameChange(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded 
                       bg-white dark:bg-gray-700 text-sm
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Node Type */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Type
          </label>
          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded text-sm capitalize">
            {nodeData.type}
          </div>
        </div>

        {/* Node ID */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Node ID
          </label>
          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono text-xs break-all">
            {selectedNode.id}
          </div>
        </div>

        {/* Connections */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
            Connections
          </label>
          <div className="space-y-2">
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded text-sm">
              <div className="font-medium text-xs text-gray-600 dark:text-gray-400 mb-1">
                Incoming: {incomingEdges.length}
              </div>
              {incomingEdges.length === 0 && (
                <div className="text-xs text-gray-500">
                  No incoming connections
                </div>
              )}
            </div>
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded text-sm">
              <div className="font-medium text-xs text-gray-600 dark:text-gray-400 mb-1">
                Outgoing: {outgoingEdges.length}
              </div>
              {outgoingEdges.length === 0 && (
                <div className="text-xs text-gray-500">
                  No outgoing connections
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Input Node Content */}
        {nodeData.type === "input" && (
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
              Video Prompt
            </label>
            <textarea
              value={nodeData.prompt || ""}
              onChange={(e) =>
                updateNode(selectedNode.id, { prompt: e.target.value })
              }
              rows={6}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded 
                         bg-white dark:bg-gray-700 text-sm
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Enter your video prompt..."
            />
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {(nodeData.prompt || "").length} characters
            </div>
          </div>
        )}

        {nodeData.type === "shotCollection" &&
          (() => {
            const collectionData = nodeData as ShotCollectionNodeData;
            const shots = collectionData.shots || [];
            return (
              <div className="space-y-3">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  All shots are output with "Shot #:" labels for downstream
                  processing. Edit shots directly in the node.
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {shots.length > 0 ? (
                    shots.map((shot, index) => {
                      return (
                        <div
                          key={shot.id || index}
                          className="p-2 rounded border border-gray-300 dark:border-gray-600 text-xs space-y-2"
                        >
                          <div className="flex items-center gap-2">
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-amber-500 text-white text-[10px] font-bold">
                              {index + 1}
                            </span>
                            <div className="font-semibold text-gray-700 dark:text-gray-200">
                              {shot.title || `Shot ${index + 1}`}
                            </div>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 line-clamp-3">
                            {shot.prompt || "No prompt provided."}
                          </p>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-3 rounded border border-dashed text-center text-xs text-gray-500 dark:text-gray-400">
                      No shots defined yet. Use the node UI to add shots.
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

        {/* Context Prompt Template */}
        {nodeData.type === "contextPrompt" && (
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
              Template
            </label>
            <textarea
              value={nodeData.template || ""}
              onChange={(e) =>
                updateNode(selectedNode.id, { template: e.target.value })
              }
              rows={8}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded 
                         bg-white dark:bg-gray-700 text-sm font-mono
                         focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              placeholder="Character: {{characters}}\nLighting: {{lighting}}"
            />
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Use {`{{variableName}}`} for substitution
            </div>
          </div>
        )}

        {/* LLM Node Configuration */}
        {nodeData.type === "llm" && (
          <div className="space-y-4">
            {/* Model Selection */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                AI Model
              </label>
              <select
                value={nodeData.model || "claude"}
                onChange={(e) =>
                  updateNode(selectedNode.id, {
                    model: e.target.value as "claude" | "llama",
                  })
                }
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded 
                           bg-white dark:bg-gray-700 text-sm
                           focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="claude">Claude Sonnet 4</option>
                <option value="llama">Llama 3.3 70B</option>
              </select>
            </div>

            {/* Max Tokens */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                Max Tokens
              </label>
              <input
                type="number"
                value={nodeData.maxTokens || 1024}
                onChange={(e) =>
                  updateNode(selectedNode.id, {
                    maxTokens: parseInt(e.target.value) || 1024,
                  })
                }
                min={100}
                max={4096}
                step={100}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded 
                           bg-white dark:bg-gray-700 text-sm
                           focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Prompt Template */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                Prompt Template
              </label>
              <textarea
                value={nodeData.template || ""}
                onChange={(e) =>
                  updateNode(selectedNode.id, { template: e.target.value })
                }
                rows={10}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded 
                           bg-white dark:bg-gray-700 text-sm font-mono
                           focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                placeholder="Enter your prompt here...\n\nYou can use variables like:\n{{input}}\n{{characters}}\n{{lighting}}"
              />
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Use {`{{variableName}}`} to insert data from connected nodes
              </div>
            </div>

            {/* Response Display */}
            {nodeData.response && (
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                  LLM Response
                </label>
                <textarea
                  value={nodeData.response}
                  readOnly
                  rows={8}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded 
                             bg-indigo-50 dark:bg-indigo-900/20 text-sm resize-none"
                />
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {nodeData.response.length} characters (AI-generated)
                </div>
              </div>
            )}

            {/* Empty State */}
            {!nodeData.response && !nodeData.isLoading && (
              <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Configure prompt and run workflow to get LLM response
                </p>
              </div>
            )}

            {/* Save as Custom Module */}
            <div className="pt-4 border-t border-gray-300 dark:border-gray-600">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                Save as Custom Module
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nodeData.customName || ""}
                  onChange={(e) =>
                    updateNode(selectedNode.id, { customName: e.target.value })
                  }
                  placeholder="My Custom LLM Module"
                  className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded 
                           bg-white dark:bg-gray-700 text-sm
                           focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <button
                  onClick={() => {
                    if (!nodeData.customName?.trim()) {
                      alert("Please enter a name for your custom module");
                      return;
                    }
                    const customModule = {
                      id: `custom-llm-${Date.now()}`,
                      name: nodeData.customName,
                      description: `Custom LLM: ${nodeData.model}`,
                      baseType: "llm" as const,
                      icon: "Sparkles",
                      color: "bg-indigo-600",
                      llmConfig: {
                        template: nodeData.template,
                        model: nodeData.model || "claude",
                        maxTokens: nodeData.maxTokens || 1024,
                      },
                      createdAt: Date.now(),
                    };
                    saveCustomModule(customModule);
                    updateNode(selectedNode.id, { isSavedAsCustom: true });
                    alert(`Custom module "${nodeData.customName}" saved!`);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded
                           transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!nodeData.customName?.trim()}
                >
                  Save
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Save this configuration to reuse it in future workflows
              </p>
            </div>
          </div>
        )}

        {/* Image Gen Node Configuration */}
        {nodeData.type === "imageGen" && (
          <div className="space-y-4">
            {/* Image Settings */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Width
                </label>
                <input
                  type="number"
                  value={nodeData.width}
                  onChange={(e) =>
                    updateNode(selectedNode.id, {
                      width: parseInt(e.target.value) || 1024,
                    })
                  }
                  min={256}
                  max={2048}
                  step={256}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded 
                           bg-white dark:bg-gray-700 text-sm
                           focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Height
                </label>
                <input
                  type="number"
                  value={nodeData.height}
                  onChange={(e) =>
                    updateNode(selectedNode.id, {
                      height: parseInt(e.target.value) || 1024,
                    })
                  }
                  min={256}
                  max={2048}
                  step={256}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded 
                           bg-white dark:bg-gray-700 text-sm
                           focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                Number of Images
              </label>
              <input
                type="number"
                value={nodeData.numberOfImages}
                onChange={(e) =>
                  updateNode(selectedNode.id, {
                    numberOfImages: parseInt(e.target.value) || 1,
                  })
                }
                min={1}
                max={4}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded 
                           bg-white dark:bg-gray-700 text-sm
                           focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>

            {/* Prompt Template */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                Prompt Template (Optional)
              </label>
              <textarea
                value={nodeData.inputPrompt || ""}
                onChange={(e) =>
                  updateNode(selectedNode.id, { inputPrompt: e.target.value })
                }
                rows={6}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded 
                           bg-white dark:bg-gray-700 text-sm font-mono
                           focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
                placeholder="Optional: Add a prompt template...\n\nYou can use variables like:\n{{input}}\n{{characters}}\n{{mood}}"
              />
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Leave empty to use connected input directly, or add template
                with {`{{variables}}`}
              </div>
            </div>

            {/* Generated Images Display */}
            {nodeData.generatedImages &&
              nodeData.generatedImages.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Generated Images ({nodeData.generatedImages.length})
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {nodeData.generatedImages.map((url, index) => (
                      <div
                        key={index}
                        className="relative group rounded overflow-hidden border-2 border-gray-300 dark:border-gray-600"
                      >
                        <img
                          src={url}
                          alt={`Generated ${index + 1}`}
                          className="w-full h-auto"
                        />
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute top-2 right-2 p-1 bg-black/60 hover:bg-black/80 rounded text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          View
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Save as Custom Module */}
            <div className="pt-4 border-t border-gray-300 dark:border-gray-600">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                Save as Custom Module
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nodeData.customName || ""}
                  onChange={(e) =>
                    updateNode(selectedNode.id, { customName: e.target.value })
                  }
                  placeholder="My Custom Image Gen"
                  className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded 
                           bg-white dark:bg-gray-700 text-sm
                           focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
                <button
                  onClick={() => {
                    if (!nodeData.customName?.trim()) {
                      alert("Please enter a name for your custom module");
                      return;
                    }
                    const customModule = {
                      id: `custom-imagegen-${Date.now()}`,
                      name: nodeData.customName,
                      description: `${nodeData.width}x${nodeData.height}, ${nodeData.numberOfImages} image(s)`,
                      baseType: "imageGen" as const,
                      icon: "Image",
                      color: "bg-pink-600",
                      imageGenConfig: {
                        inputPrompt: nodeData.inputPrompt || "",
                        width: nodeData.width,
                        height: nodeData.height,
                        numberOfImages: nodeData.numberOfImages,
                      },
                      createdAt: Date.now(),
                    };
                    saveCustomModule(customModule);
                    updateNode(selectedNode.id, { isSavedAsCustom: true });
                    alert(`Custom module "${nodeData.customName}" saved!`);
                  }}
                  className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white text-sm rounded
                           transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!nodeData.customName?.trim()}
                >
                  Save
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Save this configuration to reuse it in future workflows
              </p>
            </div>
          </div>
        )}

        {nodeData.type === "sceneShotPlanner" &&
          (() => {
            const plannerData = nodeData as SceneShotPlannerNodeData;
            const shots: ShotPlan[] = plannerData.shotPlan || [];
            return (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Planning Style
                    </label>
                    <select
                      value={plannerData.planStrategy || "balanced"}
                      onChange={(e) =>
                        updateNode(selectedNode.id, {
                          planStrategy: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    >
                      <option value="balanced">Balanced coverage</option>
                      <option value="cinematic">Cinematic emphasis</option>
                      <option value="character">Character focused</option>
                      <option value="action">Action heavy</option>
                    </select>
                  </div>
                  <label className="flex items-center gap-2 text-xs p-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-700">
                    <input
                      type="checkbox"
                      checked={plannerData.includeTransitions !== false}
                      onChange={(e) =>
                        updateNode(selectedNode.id, {
                          includeTransitions: e.target.checked,
                        })
                      }
                      className="rounded"
                    />
                    Include transition shots
                  </label>
                </div>
                {plannerData.summary && (
                  <div className="p-3 rounded border border-emerald-400/40 bg-emerald-500/10 text-xs text-gray-700 dark:text-gray-200">
                    {plannerData.summary}
                  </div>
                )}
                <div>
                  <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                    <span>Shots ({shots.length})</span>
                    {typeof plannerData.totalDurationSeconds !==
                      "undefined" && (
                      <span>
                        Total Duration: {plannerData.totalDurationSeconds || 0}s
                      </span>
                    )}
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {shots.length > 0 ? (
                      shots.map((shot, index) => (
                        <div
                          key={shot.id || index}
                          className="p-3 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs space-y-1"
                        >
                          <div className="font-semibold text-gray-700 dark:text-gray-200">
                            {shot.title || `Shot ${index + 1}`}
                          </div>
                          <div className="text-gray-500 dark:text-gray-400">
                            {shot.description || "No description."}
                          </div>
                          <div className="text-gray-400 dark:text-gray-500">
                            Start: {shot.startFramePrompt?.slice(0, 120) || "—"}
                          </div>
                          <div className="text-gray-400 dark:text-gray-500">
                            End: {shot.endFramePrompt?.slice(0, 120) || "—"}
                          </div>
                          <div className="text-gray-400 dark:text-gray-500">
                            Video: {shot.videoPrompt?.slice(0, 120) || "—"}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 rounded border border-dashed border-gray-300 dark:border-gray-600 text-center text-xs text-gray-500 dark:text-gray-400">
                        No shot plan yet. Run the workflow to generate one.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

        {/* Type-specific settings */}
        {nodeData.type === "endFrame" && (
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
              Extraction Mode
            </label>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={nodeData.isManual}
                  onChange={(e) =>
                    updateNode(selectedNode.id, { isManual: e.target.checked })
                  }
                  className="rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Manual Mode
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {nodeData.isManual
                  ? "Values are manually edited and won't be auto-extracted"
                  : "Values will be automatically extracted from input"}
              </p>
            </div>
          </div>
        )}

        {/* Start Frame Content */}
        {nodeData.type === "startFrame" && (
          <div className="space-y-4">
            {/* Character Images with Selection */}
            {nodeData.characterImages &&
              nodeData.characterImages.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Generated Characters ({nodeData.characterImages.length})
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {nodeData.characterImages.map((char, idx) => {
                      const isSelected = (
                        nodeData.selectedCharacters || []
                      ).includes(char.name);
                      return (
                        <div
                          key={idx}
                          className="space-y-1 cursor-pointer"
                          onClick={() => {
                            const currentSelected =
                              nodeData.selectedCharacters || [];
                            const newSelected = currentSelected.includes(
                              char.name
                            )
                              ? currentSelected.filter(
                                  (name) => name !== char.name
                                )
                              : [...currentSelected, char.name];
                            updateNode(selectedNode!.id, {
                              selectedCharacters: newSelected,
                            });
                          }}
                        >
                          <div
                            className={`relative rounded overflow-hidden border-2 ${
                              isSelected
                                ? "border-blue-500 dark:border-blue-400"
                                : "border-gray-300 dark:border-gray-600"
                            } aspect-[3/4] transition-colors`}
                          >
                            <img
                              src={char.url}
                              alt={char.name}
                              className="w-full h-full object-cover"
                            />
                            {/* Selection Indicator */}
                            <div
                              className={`absolute top-1 right-1 w-5 h-5 flex items-center justify-center rounded ${
                                isSelected
                                  ? "bg-blue-500"
                                  : "bg-gray-400 opacity-50"
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
                          <p className="text-xs text-center text-gray-600 dark:text-gray-400 truncate">
                            {char.name}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">
                    Click characters to select for output to downstream nodes
                  </p>
                </div>
              )}

            {/* Generated Prompt */}
            {nodeData.generatedPrompt && (
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Generated Prompt
                </label>
                <textarea
                  value={nodeData.generatedPrompt}
                  readOnly
                  rows={6}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded 
                             bg-gray-100 dark:bg-gray-700 text-sm resize-none"
                />
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {nodeData.generatedPrompt.length} characters (AI-generated)
                </div>
              </div>
            )}

            {/* Generated Image with Output Toggle */}
            {nodeData.generatedImage && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                    Generated Start Frame
                  </label>
                  <button
                    onClick={() => {
                      updateNode(selectedNode!.id, {
                        outputStartFrame: !nodeData.outputStartFrame,
                      });
                    }}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      nodeData.outputStartFrame
                        ? "bg-blue-500 text-white hover:bg-blue-600"
                        : "bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-400 dark:hover:bg-gray-500"
                    }`}
                  >
                    {nodeData.outputStartFrame
                      ? "✓ Include in Output"
                      : "Exclude from Output"}
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
                  />
                </div>
                <a
                  href={nodeData.generatedImage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:text-blue-600 mt-2 inline-block"
                >
                  Open in new tab →
                </a>
              </div>
            )}

            {/* Empty State */}
            {!nodeData.generatedPrompt &&
              !nodeData.generatedImage &&
              !nodeData.isLoading && (
                <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Connect an input and run the workflow to generate the start
                    frame
                  </p>
                </div>
              )}

            {/* Loading State */}
            {nodeData.isLoading && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded">
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Generating start frame...
                </p>
              </div>
            )}
          </div>
        )}

        {/* End Frame Content */}
        {nodeData.type === "endFrame" && (
          <div className="space-y-4">
            {/* Variant Images */}
            {nodeData.variantImages && nodeData.variantImages.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Generated Variants ({nodeData.variantImages.length})
                </label>
                <div className="space-y-3">
                  {nodeData.variantImages.map((variant, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="relative rounded overflow-hidden border-2 border-gray-300 dark:border-gray-600">
                        <img
                          src={variant.url}
                          alt={variant.name}
                          className="w-full h-auto"
                        />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                          {variant.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                          {variant.prompt}
                        </p>
                      </div>
                      <a
                        href={variant.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:text-blue-600 inline-block"
                      >
                        Open in new tab →
                      </a>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">
                  AI-generated style variants for the end frame
                </p>
              </div>
            )}

            {/* Generated Prompt */}
            {nodeData.generatedPrompt && (
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Generated Prompt
                </label>
                <textarea
                  value={nodeData.generatedPrompt}
                  readOnly
                  rows={6}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded 
                             bg-gray-100 dark:bg-gray-700 text-sm resize-none"
                />
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {nodeData.generatedPrompt.length} characters (AI-generated)
                </div>
              </div>
            )}

            {/* Generated End Frame Image */}
            {nodeData.generatedImage && (
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Generated End Frame
                </label>
                <div className="relative rounded overflow-hidden border-2 border-blue-500 dark:border-blue-400 transition-colors">
                  <img
                    src={nodeData.generatedImage}
                    alt="End Frame"
                    className="w-full h-auto"
                  />
                </div>
                <a
                  href={nodeData.generatedImage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:text-blue-600 mt-2 inline-block"
                >
                  Open in new tab →
                </a>
              </div>
            )}

            {/* Empty State */}
            {!nodeData.generatedPrompt &&
              !nodeData.generatedImage &&
              !nodeData.isLoading && (
                <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Connect an input and run the workflow to generate the end
                    frame
                  </p>
                </div>
              )}

            {/* Loading State */}
            {nodeData.isLoading && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded">
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  {nodeData.generationStage || "Generating end frame..."}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Continuity Planner Content */}
        {nodeData.type === "continuityPlanner" && (
          <div className="space-y-4">
            {/* Extraction Settings */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                Categories to Extract
              </label>
              <div className="space-y-2 p-3 bg-gray-100 dark:bg-gray-700 rounded">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={nodeData.extractCharacters}
                    onChange={(e) =>
                      updateNode(selectedNode.id, {
                        extractCharacters: e.target.checked,
                      })
                    }
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Characters
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={nodeData.extractShotInfo}
                    onChange={(e) =>
                      updateNode(selectedNode.id, {
                        extractShotInfo: e.target.checked,
                      })
                    }
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Shot Information
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={nodeData.extractVariants}
                    onChange={(e) =>
                      updateNode(selectedNode.id, {
                        extractVariants: e.target.checked,
                      })
                    }
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Style Variants
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={nodeData.extractObjects}
                    onChange={(e) =>
                      updateNode(selectedNode.id, {
                        extractObjects: e.target.checked,
                      })
                    }
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Objects
                  </span>
                </div>
              </div>
            </div>

            {/* Characters List */}
            {nodeData.characters && nodeData.characters.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Characters (
                  {nodeData.characters.filter((c) => c.selected).length}/
                  {nodeData.characters.length})
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {nodeData.characters.map((char, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={char.selected}
                        onChange={(e) => {
                          const newChars = [...nodeData.characters];
                          newChars[index] = {
                            ...newChars[index],
                            selected: e.target.checked,
                          };
                          updateNode(selectedNode.id, { characters: newChars });
                        }}
                        className="mt-1 rounded"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {char.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {char.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Shot Info List */}
            {nodeData.shotInfo && nodeData.shotInfo.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Shot Information (
                  {nodeData.shotInfo.filter((s) => s.selected).length}/
                  {nodeData.shotInfo.length})
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {nodeData.shotInfo.map((info, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={info.selected}
                        onChange={(e) => {
                          const newInfo = [...nodeData.shotInfo];
                          newInfo[index] = {
                            ...newInfo[index],
                            selected: e.target.checked,
                          };
                          updateNode(selectedNode.id, { shotInfo: newInfo });
                        }}
                        className="mt-1 rounded"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {info.key}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {info.value}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Variants List */}
            {nodeData.variants && nodeData.variants.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Variants ({nodeData.variants.filter((v) => v.selected).length}
                  /{nodeData.variants.length})
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {nodeData.variants.map((variant, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 p-2 bg-pink-50 dark:bg-pink-900/20 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={variant.selected}
                        onChange={(e) => {
                          const newVariants = [...nodeData.variants];
                          newVariants[index] = {
                            ...newVariants[index],
                            selected: e.target.checked,
                          };
                          updateNode(selectedNode.id, {
                            variants: newVariants,
                          });
                        }}
                        className="mt-1 rounded"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {variant.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {variant.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Objects List */}
            {nodeData.objects && nodeData.objects.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Objects ({nodeData.objects.filter((o) => o.selected).length}/
                  {nodeData.objects.length})
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {nodeData.objects.map((object, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={object.selected}
                        onChange={(e) => {
                          const newObjects = [...nodeData.objects];
                          newObjects[index] = {
                            ...newObjects[index],
                            selected: e.target.checked,
                          };
                          updateNode(selectedNode.id, { objects: newObjects });
                        }}
                        className="mt-1 rounded"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {object.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {object.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!nodeData.characters?.length &&
              !nodeData.shotInfo?.length &&
              !nodeData.variants?.length &&
              !nodeData.objects?.length &&
              !nodeData.isLoading && (
                <div className="p-4 bg-teal-50 dark:bg-teal-900/20 rounded text-center border border-teal-200 dark:border-teal-800">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Select categories above, connect an input, and run workflow
                    to extract continuity elements
                  </p>
                </div>
              )}
          </div>
        )}

        {/* Output Content */}
        {nodeData.type === "output" && nodeData.finalPrompt && (
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
              Generated Output
            </label>
            <textarea
              value={nodeData.finalPrompt || ""}
              readOnly
              rows={8}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded 
                         bg-gray-100 dark:bg-gray-700 text-sm
                         resize-none"
            />
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {(nodeData.finalPrompt || "").length} characters (read-only)
            </div>
          </div>
        )}

        {(nodeData.type === "contextPrompt" || nodeData.type === "llm") && (
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
              Template Variables
            </label>
            <div
              className={`p-3 ${
                nodeData.type === "llm"
                  ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800"
                  : "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800"
              } rounded border`}
            >
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                Available variables from connected nodes:
              </p>
              <div className="flex flex-wrap gap-1">
                {incomingEdges.length > 0 ? (
                  incomingEdges.map((edge, i) => (
                    <span
                      key={i}
                      className={`px-2 py-1 ${
                        nodeData.type === "llm"
                          ? "bg-indigo-200 dark:bg-indigo-800"
                          : "bg-purple-200 dark:bg-purple-800"
                      } rounded text-xs font-mono`}
                    >
                      {edge.source}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-500">No connections</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Position */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
            Position
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400">
                X
              </label>
              <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded text-sm">
                {Math.round(selectedNode.position.x)}
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400">
                Y
              </label>
              <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded text-sm">
                {Math.round(selectedNode.position.y)}
              </div>
            </div>
          </div>
        </div>

        {/* Help text based on node type */}
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
          <div className="text-xs font-medium text-yellow-800 dark:text-yellow-300 mb-1">
            💡 Tip
          </div>
          <p className="text-xs text-yellow-700 dark:text-yellow-400">
            {getHelpText(nodeData.type)}
          </p>
        </div>
      </div>
    </div>
  );
};

function getHelpText(type: string): string {
  switch (type) {
    case "input":
      return "This is the starting point of your workflow. Enter your base video prompt here.";
    case "shotCollection":
      return "Organize multiple shot prompts for downstream processing into planning nodes.";
    case "sceneShotPlanner":
      return "Automatically breaks a scene into cinematic shots and generates prompts for start, end, and video diffusion.";
    case "startFrame":
      return "Generates an optimal start frame image for your video. First extracts and generates each character on a green screen for consistency, then creates the start frame using AI.";
    case "endFrame":
      return "Generates an optimal end frame image for your video. First creates style variants, then generates the final end frame using AI with the best variant style.";
    case "continuityPlanner":
      return "Analyzes your prompt and generates lists of characters, shot details, variants, and objects. Select which items to pass to downstream nodes using checkboxes.";
    case "contextPrompt":
      return "Use {{variable}} syntax to combine inputs. Available variables come from connected nodes.";
    case "llm":
      return "Make custom AI calls with your own prompts. Use {{variable}} syntax to insert data from connected nodes. Choose between Claude or Llama models.";
    case "output":
      return "Displays the final generated prompt. You can copy it or export it in various formats.";
    default:
      return "Select different nodes to see specific tips and information.";
  }
}
