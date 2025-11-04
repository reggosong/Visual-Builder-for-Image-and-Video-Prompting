import React, { useState } from "react";
import {
  FileText,
  Film,
  Users,
  Palette,
  Camera,
  GitMerge,
  FileOutput,
  Search,
  Clock,
  ListChecks,
  Clapperboard,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type {
  ModuleDefinition,
  NodeType,
  CustomModuleDefinition,
} from "../types/workflow.types";
import { useWorkflowStore } from "../store/workflowStore";

type SidebarModule = ModuleDefinition & {
  customConfig?: CustomModuleDefinition;
};

const moduleDefinitions: SidebarModule[] = [
  {
    id: "input",
    type: "input",
    label: "Text Prompt Input",
    description: "Starting point for your workflow",
    category: "input",
    color: "bg-blue-600",
    icon: "FileText",
  },
  {
    id: "shotCollection",
    type: "shotCollection",
    label: "Shot Collection",
    description: "Capture and organize multiple shot prompts",
    category: "input",
    color: "bg-amber-600",
    icon: "ListChecks",
  },
  {
    id: "sceneShotPlanner",
    type: "sceneShotPlanner",
    label: "Scene Shot Planner",
    description: "Break a scene into structured shots with AI prompts",
    category: "processing",
    color: "bg-emerald-600",
    icon: "Clapperboard",
  },
  {
    id: "startFrame",
    type: "startFrame",
    label: "Start Frame",
    description: "Generate start frame with character extraction",
    category: "extractors",
    color: "bg-green-600",
    icon: "Film",
  },
  {
    id: "endFrame",
    type: "endFrame",
    label: "End Frame",
    description: "Generate end frame with style variants",
    category: "extractors",
    color: "bg-green-600",
    icon: "Film",
  },
  {
    id: "continuityPlanner",
    type: "continuityPlanner",
    label: "Continuity Planner",
    description: "Plan characters, shots, variants & objects for continuity",
    category: "extractors",
    color: "bg-teal-600",
    icon: "Camera",
  },
  {
    id: "contextPrompt",
    type: "contextPrompt",
    label: "Context Prompt",
    description: "Build prompts from multiple inputs",
    category: "processing",
    color: "bg-purple-600",
    icon: "GitMerge",
  },
  {
    id: "imageGen",
    type: "imageGen",
    label: "Image Generation",
    description: "Generate images from prompts using Gemini",
    category: "processing",
    color: "bg-pink-600",
    icon: "Camera",
  },
  {
    id: "llm",
    type: "llm",
    label: "LLM Call",
    description: "Make AI calls with custom prompts",
    category: "processing",
    color: "bg-indigo-600",
    icon: "Camera",
  },
  {
    id: "output",
    type: "output",
    label: "Final Output",
    description: "Display and export final prompt",
    category: "output",
    color: "bg-orange-600",
    icon: "FileOutput",
  },
];

const getIcon = (iconName: string): LucideIcon => {
  const icons: Record<string, LucideIcon> = {
    FileText,
    Film,
    Users,
    Palette,
    Camera,
    GitMerge,
    FileOutput,
    Clock,
    ListChecks,
    Clapperboard,
  };
  return icons[iconName] || FileText;
};

export const Sidebar: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const { customModules, deleteCustomModule } = useWorkflowStore();

  const categories = [
    { id: "all", label: "All" },
    { id: "input", label: "Input" },
    { id: "extractors", label: "Extractors" },
    { id: "processing", label: "Processing" },
    { id: "output", label: "Output" },
    { id: "custom", label: "Custom" },
  ];

  // Convert custom modules to module definitions
  const customModuleDefs: SidebarModule[] = customModules.map((custom) => ({
    id: custom.id,
    type: custom.baseType,
    label: custom.name,
    description: custom.description,
    category: "custom" as const,
    color: custom.color,
    icon: custom.icon,
    customConfig: custom,
  }));

  // Combine built-in and custom modules
  const allModules: SidebarModule[] = [
    ...moduleDefinitions,
    ...customModuleDefs,
  ];

  const filteredModules = allModules.filter((module) => {
    const matchesSearch =
      module.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      module.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || module.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDragStart = (
    event: React.DragEvent,
    nodeType: NodeType,
    customConfig?: CustomModuleDefinition
  ) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    if (customConfig) {
      event.dataTransfer.setData("customConfig", JSON.stringify(customConfig));
    }
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="w-80 h-full bg-white dark:bg-gray-800 border-r border-gray-300 dark:border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-300 dark:border-gray-700">
        <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
          Modules
        </h2>

        {/* Search */}
        <div className="relative mb-3">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Search modules..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded 
                       bg-white dark:bg-gray-700 text-sm
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`
                px-3 py-1 rounded text-xs font-medium transition-colors
                ${
                  selectedCategory === category.id
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                }
              `}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Module List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredModules.map((module: SidebarModule) => {
          const Icon = getIcon(module.icon);
          const isCustom = module.category === "custom";
          return (
            <div
              key={module.id}
              draggable
              onDragStart={(e) =>
                handleDragStart(e, module.type, module.customConfig)
              }
              className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border-2 border-gray-200 dark:border-gray-600 
                         cursor-grab active:cursor-grabbing hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md
                         transition-all duration-200 relative"
            >
              <div className="flex items-start gap-3">
                <div className={`${module.color} p-2 rounded text-white`}>
                  <Icon size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-200">
                    {module.label}
                    {isCustom && (
                      <span className="ml-2 text-xs px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded">
                        Custom
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {module.description}
                  </p>
                </div>
                {isCustom && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete custom module "${module.label}"?`)) {
                        deleteCustomModule(module.id);
                      }
                    }}
                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1 text-xs"
                    title="Delete custom module"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filteredModules.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 text-sm py-8">
            No modules found
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-300 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400">
        <p>💡 Drag modules to canvas to add them</p>
      </div>
    </div>
  );
};
