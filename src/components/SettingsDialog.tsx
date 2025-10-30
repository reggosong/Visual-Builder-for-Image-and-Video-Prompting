import React from "react";
import { X, Zap, CheckCircle } from "lucide-react";
import { useWorkflowStore } from "../store/workflowStore";

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({
  open,
  onClose,
}) => {
  const { settings, updateSettings } = useWorkflowStore();

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-300 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            Settings
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* API Status Section */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle size={20} className="text-green-600" />
              <h3 className="text-lg font-semibold text-green-900 dark:text-green-300">
                AI Services Ready
              </h3>
            </div>
            <div className="space-y-2 text-sm text-green-800 dark:text-green-400">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-600" />
                <span>✓ Anthropic Claude configured (text extraction)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-600" />
                <span>✓ FAL AI configured (image/video generation)</span>
              </div>
            </div>
          </div>

          {/* AI Features Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Zap size={20} className="text-purple-500" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                AI Features
              </h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded">
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">
                    Use AI for Extraction & Generation
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Enable Claude for text extraction and FAL for image
                    generation
                  </p>
                </div>
                <button
                  onClick={() => updateSettings({ useAI: !settings.useAI })}
                  className={`
                    relative inline-flex h-6 w-11 items-center rounded-full
                    ${settings.useAI ? "bg-blue-600" : "bg-gray-300"}
                    transition-colors
                  `}
                >
                  <span
                    className={`
                      inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                      ${settings.useAI ? "translate-x-6" : "translate-x-1"}
                    `}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded">
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">
                    Auto-run on Connect
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Automatically run workflow when nodes are connected
                  </p>
                </div>
                <button
                  onClick={() => updateSettings({ autoRun: !settings.autoRun })}
                  className={`
                    relative inline-flex h-6 w-11 items-center rounded-full
                    ${settings.autoRun ? "bg-blue-600" : "bg-gray-300"}
                    transition-colors
                  `}
                >
                  <span
                    className={`
                      inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                      ${settings.autoRun ? "translate-x-6" : "translate-x-1"}
                    `}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-4">
            <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
              About AI Integration
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
              <li>
                • <strong>Claude (Anthropic):</strong> Powers intelligent text
                extraction (characters, shot info, etc.)
              </li>
              <li>
                • <strong>FAL:</strong> Powers fast image/video generation with
                Flux Schnell
              </li>
              <li>• API keys are securely integrated into the application</li>
              <li>• Fallback to regex extraction if Claude is unavailable</li>
              <li>• Only active when "Use AI" toggle is enabled</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-300 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 text-white rounded 
                     hover:bg-blue-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
