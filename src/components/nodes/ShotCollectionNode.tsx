import React, { useMemo } from "react";
import type { NodeProps } from "@xyflow/react";
import { Plus, Trash2 } from "lucide-react";
import { BaseNode } from "./BaseNode";
import type {
  ShotCollectionNodeData,
  ShotDefinition,
} from "../../types/workflow.types";
import { useWorkflowStore } from "../../store/workflowStore";

const createShotId = () =>
  `shot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const ensureShots = (shots?: ShotDefinition[]): ShotDefinition[] => {
  if (shots && shots.length > 0) {
    return shots;
  }
  return [
    {
      id: createShotId(),
      title: "Shot 1",
      prompt: "",
    },
  ];
};

export const ShotCollectionNode: React.FC<NodeProps> = ({
  id,
  data,
  selected,
}) => {
  const nodeData = data as unknown as ShotCollectionNodeData;
  const { updateNode, deleteNode } = useWorkflowStore();

  const shots = useMemo(() => ensureShots(nodeData.shots), [nodeData.shots]);

  const updateShots = (updated: ShotDefinition[]) => {
    updateNode(id, {
      shots: updated,
    });
  };

  const handleShotFieldChange = (
    shotId: string,
    field: "title" | "prompt",
    value: string
  ) => {
    const updatedShots = shots.map((shot) =>
      shot.id === shotId ? { ...shot, [field]: value } : shot
    );
    updateShots(updatedShots);
  };

  const handleAddShot = () => {
    const newShot: ShotDefinition = {
      id: createShotId(),
      title: `Shot ${shots.length + 1}`,
      prompt: "",
    };
    updateShots([...shots, newShot]);
  };

  const handleDeleteShot = (shotId: string) => {
    if (shots.length === 1) {
      updateShots([
        {
          id: createShotId(),
          title: "Shot 1",
          prompt: "",
        },
      ]);
      return;
    }

    const filtered = shots.filter((shot) => shot.id !== shotId);
    updateShots(filtered);
  };

  return (
    <BaseNode
      data={nodeData}
      selected={selected}
      color="bg-amber-600"
      title="Shot Collection"
      hasInput={false}
      hasOutput={true}
      onDelete={() => deleteNode(id)}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-xs text-amber-100 uppercase tracking-wide">
            {shots.length} shot{shots.length === 1 ? "" : "s"}
          </div>
          <button
            onClick={handleAddShot}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded bg-white/10 hover:bg-white/20 transition-colors"
          >
            <Plus size={14} /> Add Shot
          </button>
        </div>

        <div className="flex items-center gap-2 p-2 rounded bg-amber-500/10 border border-amber-500/20">
          <input
            type="checkbox"
            id={`sequential-${id}`}
            checked={nodeData.sequentialMode !== false}
            onChange={(e) =>
              updateNode(id, { sequentialMode: e.target.checked })
            }
            className="rounded border-white/30"
          />
          <label
            htmlFor={`sequential-${id}`}
            className="text-xs text-amber-100 cursor-pointer select-none"
          >
            Sequential Mode: Run workflow once per shot
          </label>
        </div>

        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
          {shots.map((shot, index) => {
            return (
              <div
                key={shot.id}
                className="rounded-lg border border-slate-700/70 px-3 py-3 bg-slate-900/80 backdrop-blur-sm space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-amber-500 text-xs">
                      {index + 1}
                    </span>
                    <input
                      value={shot.title}
                      onChange={(e) =>
                        handleShotFieldChange(shot.id, "title", e.target.value)
                      }
                      className="bg-transparent border-b border-white/20 focus:border-amber-300 focus:outline-none text-sm w-36"
                      placeholder={`Shot ${index + 1}`}
                    />
                  </div>
                  <button
                    onClick={() => handleDeleteShot(shot.id)}
                    className="p-1 text-red-200 hover:text-red-400"
                    title="Remove shot"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <textarea
                  value={shot.prompt}
                  onChange={(e) =>
                    handleShotFieldChange(shot.id, "prompt", e.target.value)
                  }
                  className="w-full min-h-[90px] rounded bg-slate-800/80 border border-white/10 focus:border-amber-300 focus:ring-0 text-sm p-2 resize-none"
                  placeholder="Describe what happens in this shot..."
                />
              </div>
            );
          })}
        </div>

        <div className="text-xs text-slate-200/70 leading-snug">
          {nodeData.sequentialMode !== false ? (
            <>
              Sequential mode: Workflow runs once for each shot. Continuity
              planner accumulates context across shots. Start/end frame modules
              collect all outputs.
            </>
          ) : (
            <>
              All shots are output at once with "Shot #:" labels for downstream
              processing.
            </>
          )}
        </div>
      </div>
    </BaseNode>
  );
};
