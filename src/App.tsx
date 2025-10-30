import { useEffect } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { Canvas } from "./components/Canvas";
import { Sidebar } from "./components/Sidebar";
import { MediaGallery } from "./components/MediaGallery";
import { Toolbar } from "./components/Toolbar";
import { PropertiesPanel } from "./components/PropertiesPanel";
import { useWorkflowStore } from "./store/workflowStore";

function App() {
  const { isDarkMode, loadCustomModules } = useWorkflowStore();

  // Load custom modules on mount
  useEffect(() => {
    loadCustomModules();
  }, [loadCustomModules]);

  // Apply dark mode class to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const {
        undo,
        redo,
        deleteNode,
        deleteEdge,
        selectedNode,
        selectedEdge,
        runWorkflow,
      } = useWorkflowStore.getState();

      // Check if user is typing in an input field
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      // Undo: Ctrl+Z or Cmd+Z (but not when typing)
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key === "z" &&
        !e.shiftKey &&
        !isTyping
      ) {
        e.preventDefault();
        undo();
      }

      // Redo: Ctrl+Shift+Z or Cmd+Shift+Z (but not when typing)
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key === "z" &&
        e.shiftKey &&
        !isTyping
      ) {
        e.preventDefault();
        redo();
      }

      // Delete: Delete or Backspace (but not when typing in input fields)
      if ((e.key === "Delete" || e.key === "Backspace") && !isTyping) {
        e.preventDefault();

        // Get all currently selected nodes from the store
        const { nodes, edges } = useWorkflowStore.getState();
        const selectedNodes = nodes.filter((node) => node.selected);
        const selectedEdges = edges.filter((edge) => edge.selected);

        // Delete all selected nodes
        if (selectedNodes.length > 0) {
          selectedNodes.forEach((node) => {
            deleteNode(node.id);
          });
        }
        // If no nodes selected, delete selected edges
        else if (selectedEdges.length > 0) {
          selectedEdges.forEach((edge) => {
            deleteEdge(edge.id);
          });
        }
        // Fallback to single selection (backwards compatibility)
        else if (selectedNode) {
          deleteNode(selectedNode.id);
        } else if (selectedEdge) {
          deleteEdge(selectedEdge.id);
        }
      }

      // Run workflow: Ctrl+Enter or Cmd+Enter (works even when typing)
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        runWorkflow();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Auto-save to localStorage
  useEffect(() => {
    const saveInterval = setInterval(() => {
      const currentState = useWorkflowStore.getState();
      localStorage.setItem(
        "workflow-autosave",
        JSON.stringify({
          nodes: currentState.nodes,
          edges: currentState.edges,
          timestamp: new Date().toISOString(),
        })
      );
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(saveInterval);
  }, []);

  // Load autosave on mount (only once per session)
  useEffect(() => {
    // Check if we've already prompted in this browser session
    const hasPromptedThisSession = sessionStorage.getItem("autosave-prompted");
    if (hasPromptedThisSession) {
      return; // Skip if already prompted during this session
    }

    const autosave = localStorage.getItem("workflow-autosave");
    if (autosave) {
      try {
        const data = JSON.parse(autosave);
        // Only auto-load if it's recent (within last 24 hours)
        const timestamp = new Date(data.timestamp);
        const now = new Date();
        const hoursSince =
          (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);

        if (hoursSince < 24 && data.nodes && data.nodes.length > 0) {
          // Mark that we've prompted this session (before the confirm dialog)
          sessionStorage.setItem("autosave-prompted", "true");

          const shouldLoad = confirm(
            `Found an auto-saved workflow from ${timestamp.toLocaleString()}. Would you like to restore it?`
          );
          if (shouldLoad) {
            useWorkflowStore.getState().setNodes(data.nodes);
            useWorkflowStore.getState().setEdges(data.edges);
          }
        } else {
          // Mark as prompted even if we don't show the dialog
          sessionStorage.setItem("autosave-prompted", "true");
        }
      } catch (error) {
        console.error("Failed to load autosave:", error);
        sessionStorage.setItem("autosave-prompted", "true");
      }
    } else {
      // No autosave found, mark as prompted
      sessionStorage.setItem("autosave-prompted", "true");
    }
  }, []);

  return (
    <ReactFlowProvider>
      <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
        {/* Toolbar */}
        <Toolbar />

        {/* Media Gallery - Horizontal at top */}
        <MediaGallery />

        {/* Main content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar */}
          <Sidebar />

          {/* Canvas */}
          <div className="flex-1 relative">
            <Canvas />
          </div>

          {/* Right Properties Panel */}
          <PropertiesPanel />
        </div>

        {/* Keyboard shortcuts help */}
        <div
          className="fixed bottom-4 left-1/2 transform -translate-x-1/2 
                      bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 
                      rounded-lg shadow-lg px-4 py-2 text-xs text-gray-600 dark:text-gray-400
                      opacity-75 hover:opacity-100 transition-opacity pointer-events-none"
        >
          <span className="font-mono">Ctrl+Z</span> Undo •
          <span className="font-mono ml-2">Ctrl+Shift+Z</span> Redo •
          <span className="font-mono ml-2">Del</span> Delete •
          <span className="font-mono ml-2">Ctrl+Enter</span> Run
        </div>
      </div>
    </ReactFlowProvider>
  );
}

export default App;
