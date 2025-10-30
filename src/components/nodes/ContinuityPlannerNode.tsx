import React from "react";
import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";
import type { ContinuityPlannerNodeData } from "../../types/workflow.types";
import { useWorkflowStore } from "../../store/workflowStore";
import { ListChecks, Loader2, Users, Camera, Palette, Box } from "lucide-react";

export const ContinuityPlannerNode: React.FC<NodeProps> = ({
  id,
  data,
  selected,
}) => {
  const nodeData = data as unknown as ContinuityPlannerNodeData;
  const { deleteNode } = useWorkflowStore();

  const getTotalSelected = () => {
    const charCount =
      nodeData.characters?.filter((c) => c.selected).length || 0;
    const shotCount = nodeData.shotInfo?.filter((s) => s.selected).length || 0;
    const variantCount =
      nodeData.variants?.filter((v) => v.selected).length || 0;
    const objectCount = nodeData.objects?.filter((o) => o.selected).length || 0;
    return charCount + shotCount + variantCount + objectCount;
  };

  return (
    <BaseNode
      data={nodeData}
      selected={selected}
      color="bg-teal-600"
      title="Continuity Planner"
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
              Analyzing continuity...
            </span>
          </div>
        )}

        {/* Extraction Settings - Show before workflow runs */}
        {!nodeData.isLoading &&
          !nodeData.characters?.length &&
          !nodeData.shotInfo?.length &&
          !nodeData.variants?.length &&
          !nodeData.objects?.length && (
            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                Will Extract:
              </div>
              <div className="space-y-1">
                {nodeData.extractCharacters && (
                  <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                    <Users size={12} />
                    <span>Characters</span>
                  </div>
                )}
                {nodeData.extractShotInfo && (
                  <div className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400">
                    <Camera size={12} />
                    <span>Shot Info</span>
                  </div>
                )}
                {nodeData.extractVariants && (
                  <div className="flex items-center gap-1 text-xs text-pink-600 dark:text-pink-400">
                    <Palette size={12} />
                    <span>Variants</span>
                  </div>
                )}
                {nodeData.extractObjects && (
                  <div className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
                    <Box size={12} />
                    <span>Objects</span>
                  </div>
                )}
              </div>
            </div>
          )}

        {/* Summary Badge - Show after workflow runs */}
        {!nodeData.isLoading &&
          (nodeData.characters?.length ||
            nodeData.shotInfo?.length ||
            nodeData.variants?.length ||
            nodeData.objects?.length) && (
            <div className="flex items-center gap-2 p-2 bg-teal-50 dark:bg-teal-900/20 rounded">
              <ListChecks
                size={14}
                className="text-teal-600 dark:text-teal-400"
              />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {getTotalSelected()} items selected
              </span>
            </div>
          )}

        {/* Characters Preview */}
        {nodeData.characters && nodeData.characters.length > 0 && (
          <div>
            <div className="flex items-center gap-1 mb-1">
              <Users size={12} className="text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Characters (
                {nodeData.characters.filter((c) => c.selected).length}/
                {nodeData.characters.length})
              </span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
              {nodeData.characters
                .filter((c) => c.selected)
                .map((c) => c.name)
                .join(", ") || "None selected"}
            </div>
          </div>
        )}

        {/* Shot Info Preview */}
        {nodeData.shotInfo && nodeData.shotInfo.length > 0 && (
          <div>
            <div className="flex items-center gap-1 mb-1">
              <Camera
                size={12}
                className="text-purple-600 dark:text-purple-400"
              />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Shot Info ({nodeData.shotInfo.filter((s) => s.selected).length}/
                {nodeData.shotInfo.length})
              </span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
              {nodeData.shotInfo
                .filter((s) => s.selected)
                .map((s) => s.key)
                .join(", ") || "None selected"}
            </div>
          </div>
        )}

        {/* Variants Preview */}
        {nodeData.variants && nodeData.variants.length > 0 && (
          <div>
            <div className="flex items-center gap-1 mb-1">
              <Palette size={12} className="text-pink-600 dark:text-pink-400" />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Variants ({nodeData.variants.filter((v) => v.selected).length}/
                {nodeData.variants.length})
              </span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
              {nodeData.variants
                .filter((v) => v.selected)
                .map((v) => v.name)
                .join(", ") || "None selected"}
            </div>
          </div>
        )}

        {/* Objects Preview */}
        {nodeData.objects && nodeData.objects.length > 0 && (
          <div>
            <div className="flex items-center gap-1 mb-1">
              <Box size={12} className="text-orange-600 dark:text-orange-400" />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Objects ({nodeData.objects.filter((o) => o.selected).length}/
                {nodeData.objects.length})
              </span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
              {nodeData.objects
                .filter((o) => o.selected)
                .map((o) => o.name)
                .join(", ") || "None selected"}
            </div>
          </div>
        )}
      </div>
    </BaseNode>
  );
};
