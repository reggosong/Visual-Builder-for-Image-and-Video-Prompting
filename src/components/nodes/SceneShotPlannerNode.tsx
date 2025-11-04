import React, { useState } from "react";
import type { NodeProps } from "@xyflow/react";
import {
  Loader2,
  Play,
  ScrollText,
  Video,
  ArrowRightCircle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { BaseNode } from "./BaseNode";
import type {
  SceneShotPlannerNodeData,
  ShotPlan,
} from "../../types/workflow.types";
import { useWorkflowStore } from "../../store/workflowStore";

const formatDuration = (seconds?: number) => {
  if (!seconds || Number.isNaN(seconds)) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  if (mins <= 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
};

const PromptDisplay: React.FC<{
  label: string;
  prompt: string;
  icon: React.ReactNode;
}> = ({ label, prompt, icon }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLong = prompt.length > 200;
  const displayPrompt =
    !isExpanded && isLong ? prompt.slice(0, 200) + "..." : prompt;

  return (
    <div className="rounded bg-slate-900/80 border border-white/5 p-2">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1 text-emerald-200">
          {icon} {label}
        </div>
        {isLong && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-emerald-300 hover:text-emerald-100 transition-colors text-[10px]"
          >
            {isExpanded ? (
              <>
                <ChevronDown size={12} /> Collapse
              </>
            ) : (
              <>
                <ChevronRight size={12} /> Expand
              </>
            )}
          </button>
        )}
      </div>
      <p className="text-white/70 whitespace-pre-wrap break-words">
        {displayPrompt}
      </p>
      {isLong && !isExpanded && (
        <div className="text-[10px] text-emerald-200/60 mt-1">
          {prompt.length} characters total
        </div>
      )}
    </div>
  );
};

export const SceneShotPlannerNode: React.FC<NodeProps> = ({
  id,
  data,
  selected,
}) => {
  const nodeData = data as unknown as SceneShotPlannerNodeData;
  const { updateNode, deleteNode } = useWorkflowStore();

  const shotPlan: ShotPlan[] = nodeData.shotPlan || [];
  const isLoading = Boolean(nodeData.isLoading);
  const planStrategy = nodeData.planStrategy || "balanced";
  const includeTransitions =
    typeof nodeData.includeTransitions === "boolean"
      ? nodeData.includeTransitions
      : true;

  const sceneTitle = nodeData.sceneOverride
    ? "Custom Override"
    : nodeData.lastSceneTitle || "Scene";

  const scenePromptPreview =
    nodeData.sceneOverride ||
    nodeData.lastScenePrompt ||
    "Waiting for scene input...";

  return (
    <BaseNode
      data={nodeData}
      selected={selected}
      color="bg-emerald-600"
      title="Scene Shot Planner"
      hasInput={true}
      hasOutput={true}
      onDelete={() => deleteNode(id)}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-2 text-emerald-200">
              <ScrollText size={14} />
              Shots Planned
            </div>
            <div className="mt-1 text-lg font-semibold text-white">
              {isLoading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                shotPlan.length
              )}
            </div>
          </div>
          <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-2 text-emerald-200">
              <Video size={14} />
              Total Duration
            </div>
            <div className="mt-1 text-lg font-semibold text-white">
              {formatDuration(nodeData.totalDurationSeconds)}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wide text-emerald-100">
            Scene Prompt Override (optional)
          </label>
          <textarea
            value={nodeData.sceneOverride || ""}
            onChange={(e) =>
              updateNode(id, {
                sceneOverride: e.target.value,
              })
            }
            rows={4}
            className="w-full rounded border border-white/10 bg-slate-800/80 p-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-0 resize-none"
            placeholder="Provide a custom scene description or leave blank to use connected scene input"
          />
          <div className="text-[11px] text-emerald-100/70 leading-snug">
            Current scene: <span className="font-semibold">{sceneTitle}</span>
            <br />
            <span className="text-white/70 line-clamp-3">
              {scenePromptPreview}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="space-y-1">
            <label className="text-emerald-100">Planning Style</label>
            <select
              value={planStrategy}
              onChange={(e) => updateNode(id, { planStrategy: e.target.value })}
              className="w-full rounded border border-white/10 bg-slate-800/80 p-2 focus:border-emerald-400 focus:outline-none text-sm"
            >
              <option value="balanced">Balanced coverage</option>
              <option value="cinematic">Cinematic emphasis</option>
              <option value="character">Character focused</option>
              <option value="action">Action heavy</option>
            </select>
          </div>
          <label className="flex items-center gap-2 rounded border border-white/10 bg-slate-800/60 px-3">
            <input
              type="checkbox"
              checked={includeTransitions}
              onChange={(e) =>
                updateNode(id, { includeTransitions: e.target.checked })
              }
              className="rounded border-white/30"
            />
            Include transitions between shots
          </label>
        </div>

        {nodeData.summary && (
          <div className="rounded border border-emerald-400/30 bg-emerald-500/10 p-3 text-xs text-emerald-100">
            {nodeData.summary}
          </div>
        )}

        {isLoading && (
          <div className="flex items-center gap-2 rounded border border-emerald-400/20 bg-emerald-500/10 p-3 text-emerald-100">
            <Loader2 className="animate-spin" size={16} />
            Planning shots with Claude...
          </div>
        )}

        {!isLoading &&
          shotPlan.length > 0 &&
          (() => {
            // Group shots by scene
            const shotsByScene = new Map<number, ShotPlan[]>();
            shotPlan.forEach((shot) => {
              const sceneNum = shot.sceneNumber || 1;
              if (!shotsByScene.has(sceneNum)) {
                shotsByScene.set(sceneNum, []);
              }
              shotsByScene.get(sceneNum)?.push(shot);
            });

            const sortedScenes = Array.from(shotsByScene.entries()).sort(
              ([a], [b]) => a - b
            );

            return (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {sortedScenes.map(([sceneNum, shots]) => (
                  <div key={sceneNum} className="space-y-2">
                    {sortedScenes.length > 1 && (
                      <div className="flex items-center gap-2 sticky top-0 bg-emerald-600/20 backdrop-blur-sm rounded px-2 py-1 border border-emerald-400/30">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-emerald-500 text-xs font-bold">
                          {sceneNum}
                        </span>
                        <span className="text-xs font-semibold text-emerald-100">
                          {shots[0]?.sceneTitle || `Scene ${sceneNum}`} -{" "}
                          {shots.length} shot{shots.length === 1 ? "" : "s"}
                        </span>
                      </div>
                    )}
                    {shots.map((shot) => (
                      <div
                        key={shot.id}
                        className="rounded-lg border border-white/10 bg-slate-800/70 p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-semibold text-white">
                            {shot.title}
                          </div>
                          <div className="text-[11px] text-emerald-200">
                            {formatDuration(shot.durationSeconds)}
                          </div>
                        </div>
                        {shot.description && (
                          <p className="text-xs text-white/70 leading-snug">
                            {shot.description}
                          </p>
                        )}
                        <div className="grid gap-2 text-[11px]">
                          <PromptDisplay
                            label="Start Frame"
                            prompt={shot.startFramePrompt}
                            icon={<ArrowRightCircle size={12} />}
                          />
                          <PromptDisplay
                            label="End Frame"
                            prompt={shot.endFramePrompt}
                            icon={<ArrowRightCircle size={12} />}
                          />
                          <PromptDisplay
                            label="Video Generation Prompt"
                            prompt={shot.videoPrompt}
                            icon={<Play size={12} />}
                          />
                        </div>
                        {shot.cameraNotes && (
                          <div className="rounded bg-slate-900/70 border border-white/5 p-2 text-[11px] text-emerald-100/80">
                            Camera notes: {shot.cameraNotes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            );
          })()}

        {!isLoading && shotPlan.length === 0 && (
          <div className="rounded border border-dashed border-emerald-400/40 bg-emerald-500/10 p-4 text-xs text-emerald-100 text-center">
            Connect a scene and run the workflow to generate shot prompts.
          </div>
        )}

        <div className="text-[11px] text-emerald-100/70 leading-snug">
          Downstream nodes receive structured shot data including start frame,
          end frame, and video prompts for each planned shot.
        </div>
      </div>
    </BaseNode>
  );
};
