import React, { useMemo } from "react";
import type { NodeProps } from "@xyflow/react";
import { Plus, Star, Trash2 } from "lucide-react";
import { BaseNode } from "./BaseNode";
import type {
  SceneCollectionNodeData,
  SceneDefinition,
} from "../../types/workflow.types";
import { useWorkflowStore } from "../../store/workflowStore";

const createSceneId = () =>
  `scene-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const ensureScenes = (scenes?: SceneDefinition[]): SceneDefinition[] => {
  if (scenes && scenes.length > 0) {
    return scenes;
  }
  return [
    {
      id: createSceneId(),
      title: "Scene 1",
      prompt: "",
    },
  ];
};

export const SceneCollectionNode: React.FC<NodeProps> = ({
  id,
  data,
  selected,
}) => {
  const nodeData = data as unknown as SceneCollectionNodeData;
  const { updateNode, deleteNode } = useWorkflowStore();

  const scenes = useMemo(
    () => ensureScenes(nodeData.scenes),
    [nodeData.scenes]
  );

  const activeSceneId = nodeData.activeSceneId || scenes[0]?.id || null;

  const updateScenes = (
    updated: SceneDefinition[],
    nextActiveId?: string | null
  ) => {
    updateNode(id, {
      scenes: updated,
      activeSceneId:
        typeof nextActiveId === "undefined" ? activeSceneId : nextActiveId,
    });
  };

  const handleSceneFieldChange = (
    sceneId: string,
    field: "title" | "prompt",
    value: string
  ) => {
    const updatedScenes = scenes.map((scene) =>
      scene.id === sceneId ? { ...scene, [field]: value } : scene
    );
    updateScenes(updatedScenes);
  };

  const handleAddScene = () => {
    const newScene: SceneDefinition = {
      id: createSceneId(),
      title: `Scene ${scenes.length + 1}`,
      prompt: "",
    };
    updateScenes([...scenes, newScene], newScene.id);
  };

  const handleDeleteScene = (sceneId: string) => {
    if (scenes.length === 1) {
      updateScenes([
        {
          id: createSceneId(),
          title: "Scene 1",
          prompt: "",
        },
      ]);
      return;
    }

    const filtered = scenes.filter((scene) => scene.id !== sceneId);
    const nextActive =
      activeSceneId === sceneId
        ? filtered[filtered.length - 1]?.id || filtered[0]?.id || null
        : activeSceneId;
    updateScenes(filtered, nextActive || null);
  };

  const handleSetActive = (sceneId: string) => {
    updateNode(id, {
      activeSceneId: sceneId,
    });
  };

  return (
    <BaseNode
      data={nodeData}
      selected={selected}
      color="bg-amber-600"
      title="Scene Collection"
      hasInput={false}
      hasOutput={true}
      onDelete={() => deleteNode(id)}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-xs text-amber-100 uppercase tracking-wide">
            {scenes.length} scene{scenes.length === 1 ? "" : "s"}
          </div>
          <button
            onClick={handleAddScene}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded bg-white/10 hover:bg-white/20 transition-colors"
          >
            <Plus size={14} /> Add Scene
          </button>
        </div>

        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
          {scenes.map((scene, index) => {
            const isActive = scene.id === activeSceneId;
            return (
              <div
                key={scene.id}
                className={`rounded-lg border px-3 py-3 bg-slate-900/80 backdrop-blur-sm space-y-2 transition-colors ${
                  isActive
                    ? "border-amber-400 shadow-[0_0_0_1px_rgba(251,191,36,0.35)]"
                    : "border-slate-700/70"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-amber-500 text-xs">
                      {index + 1}
                    </span>
                    <input
                      value={scene.title}
                      onChange={(e) =>
                        handleSceneFieldChange(
                          scene.id,
                          "title",
                          e.target.value
                        )
                      }
                      className="bg-transparent border-b border-white/20 focus:border-amber-300 focus:outline-none text-sm w-36"
                      placeholder={`Scene ${index + 1}`}
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleSetActive(scene.id)}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                        isActive
                          ? "bg-amber-400 text-slate-900"
                          : "bg-white/10 hover:bg-white/20"
                      }`}
                    >
                      <Star size={14} />
                      {isActive ? "Active" : "Set Active"}
                    </button>
                    <button
                      onClick={() => handleDeleteScene(scene.id)}
                      className="p-1 text-red-200 hover:text-red-400"
                      title="Remove scene"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <textarea
                  value={scene.prompt}
                  onChange={(e) =>
                    handleSceneFieldChange(scene.id, "prompt", e.target.value)
                  }
                  className="w-full min-h-[90px] rounded bg-slate-800/80 border border-white/10 focus:border-amber-300 focus:ring-0 text-sm p-2 resize-none"
                  placeholder="Describe what happens in this scene..."
                />
              </div>
            );
          })}
        </div>

        <div className="text-xs text-slate-200/70 leading-snug">
          Downstream nodes receive the active scene prompt along with the full
          list of scenes for orchestration.
        </div>
      </div>
    </BaseNode>
  );
};
