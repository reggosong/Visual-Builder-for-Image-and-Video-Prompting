import React from "react";
import { Handle, Position, NodeResizer } from "@xyflow/react";
import { X, ChevronDown, ChevronUp } from "lucide-react";

interface BaseNodeProps {
  data: any;
  selected?: boolean;
  color: string;
  title: string;
  hasInput?: boolean;
  hasOutput?: boolean;
  children: React.ReactNode;
  onDelete?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const BaseNode: React.FC<BaseNodeProps> = ({
  data,
  selected,
  color,
  title,
  hasInput = true,
  hasOutput = true,
  children,
  onDelete,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  return (
    <div
      className={`
        bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 
        ${selected ? "border-blue-500" : "border-gray-300 dark:border-gray-600"}
        min-w-[250px]
        transition-all duration-200
        h-full
      `}
    >
      {/* Node Resizer - only show when selected */}
      <NodeResizer
        color={selected ? "#3b82f6" : "#9ca3af"}
        isVisible={selected}
        minWidth={250}
        minHeight={100}
      />
      {/* Title Bar */}
      <div
        className={`
          ${color} text-white px-4 py-2 rounded-t-md
          flex items-center justify-between
        `}
      >
        <div className="flex items-center gap-2 flex-1">
          <span className="font-semibold text-sm">{title}</span>
        </div>
        <div className="flex items-center gap-1">
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              {isCollapsed ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronUp size={16} />
              )}
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-1 hover:bg-red-500 rounded transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {!isCollapsed && <div className="p-4">{children}</div>}

      {/* Handles - Multiple connection points on all sides */}
      {hasInput && (
        <>
          <Handle
            type="target"
            position={Position.Top}
            id="target-top"
            className="!bg-gray-400 !border-2 !border-white"
          />
          <Handle
            type="target"
            position={Position.Left}
            id="target-left"
            className="!bg-gray-400 !border-2 !border-white"
          />
          <Handle
            type="target"
            position={Position.Bottom}
            id="target-bottom"
            className="!bg-gray-400 !border-2 !border-white"
          />
          <Handle
            type="target"
            position={Position.Right}
            id="target-right"
            className="!bg-gray-400 !border-2 !border-white"
          />
        </>
      )}
      {hasOutput && (
        <>
          <Handle
            type="source"
            position={Position.Top}
            id="source-top"
            className="!bg-blue-500 !border-2 !border-white"
          />
          <Handle
            type="source"
            position={Position.Right}
            id="source-right"
            className="!bg-blue-500 !border-2 !border-white"
          />
          <Handle
            type="source"
            position={Position.Bottom}
            id="source-bottom"
            className="!bg-blue-500 !border-2 !border-white"
          />
          <Handle
            type="source"
            position={Position.Left}
            id="source-left"
            className="!bg-blue-500 !border-2 !border-white"
          />
        </>
      )}

      {/* Connection indicator */}
      {data.hasValidInput && (
        <div className="absolute -left-1 top-1/2 transform -translate-y-1/2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        </div>
      )}
    </div>
  );
};
