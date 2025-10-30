import React, { useState } from "react";
import {
  Save,
  FolderOpen,
  Undo,
  Redo,
  Trash2,
  Play,
  Download,
  Upload,
  Moon,
  Sun,
  Settings,
  Loader2,
} from "lucide-react";
import { useWorkflowStore } from "../store/workflowStore";
import { SettingsDialog } from "./SettingsDialog";

export const Toolbar: React.FC = () => {
  const {
    runWorkflow,
    clearCanvas,
    undo,
    redo,
    exportWorkflow,
    importWorkflow,
    loadExampleWorkflow,
    toggleDarkMode,
    isDarkMode,
    isRunning,
    history,
  } = useWorkflowStore();

  const [showSettings, setShowSettings] = useState(false);

  const handleSave = () => {
    const data = exportWorkflow();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `workflow-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLoad = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          importWorkflow(content);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleExport = () => {
    const data = exportWorkflow();
    navigator.clipboard.writeText(data);
    alert("Workflow copied to clipboard!");
  };

  const handleClearCanvas = () => {
    if (
      confirm(
        "Are you sure you want to clear the canvas? This cannot be undone."
      )
    ) {
      clearCanvas();
    }
  };

  return (
    <div className="h-16 bg-white dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700 px-4 flex items-center justify-between">
      {/* Left section */}
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200 mr-4">
          Video Prompt Builder
        </h1>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded 
                     hover:bg-blue-600 transition-colors text-sm"
          title="Save Workflow"
        >
          <Save size={16} />
          Save
        </button>

        <button
          onClick={handleLoad}
          className="flex items-center gap-2 px-3 py-2 bg-gray-200 dark:bg-gray-700 
                     text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 
                     dark:hover:bg-gray-600 transition-colors text-sm"
          title="Load Workflow"
        >
          <FolderOpen size={16} />
          Load
        </button>

        <div className="w-px h-8 bg-gray-300 dark:bg-gray-600 mx-2" />

        <button
          onClick={undo}
          disabled={history.past.length === 0}
          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 
                     disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Undo"
        >
          <Undo size={18} />
        </button>

        <button
          onClick={redo}
          disabled={history.future.length === 0}
          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 
                     disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Redo"
        >
          <Redo size={18} />
        </button>

        <button
          onClick={handleClearCanvas}
          className="p-2 rounded hover:bg-red-100 dark:hover:bg-red-900 
                     text-red-600 dark:text-red-400 transition-colors"
          title="Clear Canvas"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        <button
          onClick={runWorkflow}
          disabled={isRunning}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded 
                     hover:bg-green-600 transition-colors font-medium text-sm
                     disabled:bg-gray-400 disabled:cursor-not-allowed"
          title="Run Workflow"
        >
          {isRunning ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play size={16} />
              Run Workflow
            </>
          )}
        </button>

        <div className="w-px h-8 bg-gray-300 dark:bg-gray-600 mx-2" />

        <button
          onClick={handleExport}
          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title="Export to Clipboard"
        >
          <Download size={18} />
        </button>

        <button
          onClick={loadExampleWorkflow}
          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title="Load Example"
        >
          <Upload size={18} />
        </button>

        <button
          onClick={toggleDarkMode}
          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title="Toggle Dark Mode"
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button
          onClick={() => setShowSettings(true)}
          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title="Settings"
        >
          <Settings size={18} />
        </button>
      </div>

      {/* Settings Dialog */}
      <SettingsDialog
        open={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
};
