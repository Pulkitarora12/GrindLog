"use client";

import React, { useState } from "react";

type ResourceType = "link" | "checklist";

interface Resource {
  id: string;
  label: string;
  url: string;
  type: ResourceType;
}

interface ResourcesModalProps {
  isOpen: boolean;
  subtopicName: string;
  resources: Resource[];
  isAdmin: boolean;
  onClose: () => void;
  onAdd: (label: string, url: string, type: ResourceType) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isPending?: boolean;
}

export default function ResourcesModal({
  isOpen,
  subtopicName,
  resources,
  isAdmin,
  onClose,
  onAdd,
  onDelete,
  isPending = false,
}: ResourcesModalProps) {
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState<ResourceType>("link");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setError("URL is required.");
      return;
    }

    setError(null);
    try {
      await onAdd(label, url, type);
      setLabel("");
      setUrl("");
      setType("link");
    } catch (err: any) {
      setError(err.message || "Failed to add resource");
    }
  };

  const getHostname = (link: string) => {
    try {
      return new URL(link).hostname.replace(/^www\./, "");
    } catch {
      return link;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-sm shadow-xl max-w-md w-full p-6 space-y-4">
        <div className="flex justify-between items-start border-b border-gray-100 dark:border-gray-800 pb-3">
          <div>
            <h3 className="font-serif text-lg font-bold text-gray-900 dark:text-gray-100">
              Resources & Checklists
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-serif italic">
              {subtopicName}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isPending}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg leading-none cursor-pointer"
          >
            &times;
          </button>
        </div>

        {error && (
          <div className="border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-400 p-2.5 rounded-sm text-xs">
            {error}
          </div>
        )}

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {resources.length === 0 ? (
            <div className="text-xs text-gray-400 dark:text-gray-500 italic py-3">
              No resources added yet.
            </div>
          ) : (
            resources.map((resource) => (
              <div
                key={resource.id}
                className="flex items-center justify-between gap-2 py-1.5 px-2 hover:bg-gray-50 dark:hover:bg-slate-800/40 border-b border-gray-100 dark:border-gray-800 last:border-0 rounded-sm"
              >
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-0 flex-1"
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`shrink-0 text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-full ${
                        resource.type === "checklist"
                          ? "bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-450 border border-amber-200 dark:border-amber-900/30"
                          : "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-450 border border-emerald-200 dark:border-emerald-900/30"
                      }`}
                    >
                      {resource.type === "checklist" ? "Checklist" : "Resource"}
                    </span>
                    <span className="text-sm text-gray-900 dark:text-gray-100 hover:text-emerald-800 dark:hover:text-emerald-450 truncate">
                      {resource.label}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-400 dark:text-gray-500 truncate">
                    {getHostname(resource.url)}
                  </div>
                </a>

                {isAdmin && (
                  <button
                    onClick={() => onDelete(resource.id)}
                    disabled={isPending}
                    className="text-gray-400 dark:text-gray-500 hover:text-red-700 dark:hover:text-red-400 text-xs px-1 cursor-pointer shrink-0"
                    title="Delete resource"
                  >
                    &times;
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {isAdmin && (
          <form
            onSubmit={handleAdd}
            className="space-y-2 border-t border-gray-100 dark:border-gray-800 pt-4"
          >
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Label (optional)"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                disabled={isPending}
                className="flex-1 rounded-sm border border-gray-200 dark:border-gray-700 px-2.5 py-1 text-xs bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 focus:border-gray-900 dark:focus:border-gray-100 focus:outline-none"
              />
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ResourceType)}
                disabled={isPending}
                className="rounded-sm border border-gray-200 dark:border-gray-700 px-1.5 py-1 text-xs bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 cursor-pointer"
              >
                <option value="link">Resource</option>
                <option value="checklist">Checklist</option>
              </select>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="https://example.com/resource"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isPending}
                className="flex-1 rounded-sm border border-gray-200 dark:border-gray-700 px-2.5 py-1 text-xs bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 focus:border-gray-900 dark:focus:border-gray-100 focus:outline-none"
              />
              <button
                type="submit"
                disabled={isPending}
                className="rounded-sm border border-gray-200 dark:border-gray-750 px-3 py-1 text-xs bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors cursor-pointer"
              >
                Add
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
