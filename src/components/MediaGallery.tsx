import React, { useState, useEffect } from "react";
import { useWorkflowStore } from "../store/workflowStore";
import {
  Image as ImageIcon,
  X,
  Download,
  Trash2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import type { MediaItem } from "../types/workflow.types";

export const MediaGallery: React.FC = () => {
  const { mediaGallery, clearMediaGallery } = useWorkflowStore();
  const [isExpanded, setIsExpanded] = useState(false); // Default to collapsed
  const [selectedImage, setSelectedImage] = useState<MediaItem | null>(null);

  // Debug log
  useEffect(() => {
    if (mediaGallery.length > 0) {
      console.log("📸 Media Gallery updated:", mediaGallery.length, "items");
      mediaGallery.forEach((item, idx) => {
        console.log(
          `  ${idx + 1}. ${item.name} (${item.type}):`,
          item.url.substring(0, 80)
        );
      });
    }
  }, [mediaGallery]);

  const groupedMedia = mediaGallery.reduce((acc, item) => {
    if (!acc[item.type]) {
      acc[item.type] = [];
    }
    acc[item.type].push(item);
    return acc;
  }, {} as Record<string, MediaItem[]>);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "character":
        return "Characters";
      case "startFrame":
        return "Start Frames";
      case "endFrame":
        return "End Frames";
      case "generated":
        return "Generated";
      default:
        return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "character":
        return "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300";
      case "startFrame":
        return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300";
      case "endFrame":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300";
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300";
    }
  };

  const handleDownload = async (item: MediaItem) => {
    try {
      const response = await fetch(item.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${item.name}-${item.id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download image:", error);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700">
      {/* Header */}
      <div
        className="px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <ImageIcon size={18} />
          <h3 className="font-semibold text-sm">Media Gallery</h3>
          <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
            {mediaGallery.length}
          </span>
          {!isExpanded && mediaGallery.length > 0 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Click to expand
            </span>
          )}
        </div>
        {mediaGallery.length > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm("Clear all media? This cannot be undone.")) {
                clearMediaGallery();
              }
            }}
            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-600 dark:text-red-400"
            title="Clear all media"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Content - Horizontal Scrollable */}
      {isExpanded && (
        <div className="px-4 pb-3 overflow-x-auto">
          {mediaGallery.length === 0 ? (
            <div className="py-4 text-center text-gray-500 dark:text-gray-400">
              <ImageIcon size={32} className="inline-block mb-2 opacity-30" />
              <p className="text-xs">
                No media generated yet - Run a workflow to generate images
              </p>
            </div>
          ) : (
            <div className="flex gap-6">
              {Object.entries(groupedMedia).map(([type, items]) => (
                <div key={type} className="flex-shrink-0">
                  <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    {getTypeLabel(type)} ({items.length})
                  </h4>
                  <div className="flex gap-2">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="group relative w-32 h-32 rounded overflow-hidden border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer flex-shrink-0 bg-gray-100 dark:bg-gray-800"
                        onClick={() => setSelectedImage(item)}
                      >
                        <img
                          src={item.url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          loading="eager"
                          referrerPolicy="no-referrer"
                          onLoad={() => {
                            console.log(
                              "✅ Image loaded successfully:",
                              item.name
                            );
                          }}
                          onError={(e) => {
                            console.error(
                              "❌ Image failed to load:",
                              item.name,
                              "URL:",
                              item.url
                            );
                            // Fallback for broken images
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            const parent = target.parentElement;
                            if (parent) {
                              const placeholder = document.createElement("div");
                              placeholder.className =
                                "w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-500";
                              placeholder.innerHTML = `<div class="text-center"><svg class="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg><p class="text-xs mt-2">Loading...</p></div>`;
                              parent.insertBefore(placeholder, target);
                            }
                          }}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-opacity flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(item);
                              }}
                              className="p-2 bg-white dark:bg-gray-800 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                              title="Download"
                            >
                              <Download size={16} />
                            </button>
                          </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-1.5">
                          <p className="text-white text-xs truncate">
                            {item.name}
                          </p>
                          <span
                            className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-xs ${getTypeColor(
                              item.type
                            )}`}
                          >
                            {type}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-300 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{selectedImage.name}</h3>
                <span
                  className={`inline-block mt-1 px-2 py-1 rounded text-xs ${getTypeColor(
                    selectedImage.type
                  )}`}
                >
                  {getTypeLabel(selectedImage.type)}
                </span>
              </div>
              <button
                onClick={() => setSelectedImage(null)}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              <img
                src={selectedImage.url}
                alt={selectedImage.name}
                className="w-full h-auto rounded"
                loading="eager"
                referrerPolicy="no-referrer"
                onLoad={() => {
                  console.log("✅ Modal image loaded:", selectedImage.name);
                }}
                onError={(e) => {
                  console.error(
                    "❌ Modal image failed:",
                    selectedImage.name,
                    selectedImage.url
                  );
                  const target = e.target as HTMLImageElement;
                  target.src =
                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'%3E%3C/path%3E%3C/svg%3E";
                }}
              />
              {selectedImage.prompt && (
                <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded">
                  <h4 className="text-xs font-semibold mb-2">
                    Generation Prompt:
                  </h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {selectedImage.prompt}
                  </p>
                </div>
              )}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => handleDownload(selectedImage)}
                  className="flex-1 py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center justify-center gap-2"
                >
                  <Download size={16} />
                  Download
                </button>
                <a
                  href={selectedImage.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center gap-2"
                >
                  Open in new tab
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
