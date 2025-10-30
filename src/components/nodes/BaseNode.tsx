import React from "react";
import { Handle, Position, NodeResizer } from "@xyflow/react";
import { X, ChevronDown, ChevronUp } from "lucide-react";

interface BaseNodeProps<T = Record<string, unknown>> {
  data: T & { hasValidInput?: boolean };
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

export const BaseNode = <T,>({
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
}: BaseNodeProps<T>) => {
  return (
    <div
      className={`
        relative rounded-xl border shadow-xl transition-all duration-200
        ${
          selected
            ? "border-blue-500 shadow-[0_0_0_2px_rgba(59,130,246,0.35)]"
            : "border-slate-700/70 shadow-[0_20px_40px_rgba(15,23,42,0.35)]"
        }
        bg-slate-900/90 text-white overflow-visible
        backdrop-blur-sm
        min-w-[250px]
      `}
    >
      {/* Node Resizer - only show when selected */}
      <NodeResizer
        color={selected ? "#3b82f6" : "#9ca3af"}
        isVisible={selected}
        minWidth={250}
        minHeight={100}
        handleClassName="node-resizer-handle"
        lineClassName="node-resizer-line"
        handleStyle={{ borderColor: "rgba(15, 23, 42, 0.1)" }}
        lineStyle={{ borderColor: "transparent", background: "transparent" }}
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
