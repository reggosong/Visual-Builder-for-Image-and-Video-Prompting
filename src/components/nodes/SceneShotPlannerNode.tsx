import React from "react";
import type { NodeProps } from "@xyflow/react";
import {
  Loader2,
  Play,
  ScrollText,
  Video,
  ArrowRightCircle,
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

        {!isLoading && shotPlan.length > 0 && (
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {shotPlan.map((shot) => (
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
                  <div className="rounded bg-slate-900/80 border border-white/5 p-2">
                    <div className="flex items-center gap-1 text-emerald-200 mb-1">
                      <ArrowRightCircle size={12} /> Start Frame
                    </div>
                    <p className="text-white/70 whitespace-pre-wrap">
                      {shot.startFramePrompt}
                    </p>
                  </div>
                  <div className="rounded bg-slate-900/80 border border-white/5 p-2">
                    <div className="flex items-center gap-1 text-emerald-200 mb-1">
                      <ArrowRightCircle size={12} /> End Frame
                    </div>
                    <p className="text-white/70 whitespace-pre-wrap">
                      {shot.endFramePrompt}
                    </p>
                  </div>
                  <div className="rounded bg-slate-900/80 border border-white/5 p-2">
                    <div className="flex items-center gap-1 text-emerald-200 mb-1">
                      <Play size={12} /> Video Generation Prompt
                    </div>
                    <p className="text-white/70 whitespace-pre-wrap">
                      {shot.videoPrompt}
                    </p>
                  </div>
                </div>
                {shot.cameraNotes && (
                  <div className="rounded bg-slate-900/70 border border-white/5 p-2 text-[11px] text-emerald-100/80">
                    Camera notes: {shot.cameraNotes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

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
