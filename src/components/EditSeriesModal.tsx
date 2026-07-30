"use client";

import React, { useState, useEffect } from "react";

interface EditSeriesModalProps {
  isOpen: boolean;
  initialName: string;
  initialDescription: string | null;
  onClose: () => void;
  onSubmit: (name: string, description?: string) => Promise<void>;
  isPending?: boolean;
}

export default function EditSeriesModal({
  isOpen,
  initialName,
  initialDescription,
  onClose,
  onSubmit,
  isPending = false,
}: EditSeriesModalProps) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription || "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(initialName);
    setDescription(initialDescription || "");
  }, [initialName, initialDescription]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Series name is required.");
      return;
    }

    setError(null);
    try {
      await onSubmit(name, description);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update series");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-sm shadow-xl max-w-md w-full p-6 space-y-4">
        <div className="flex justify-between items-start border-b border-gray-100 dark:border-gray-800 pb-3">
          <div>
            <h3 className="font-serif text-lg font-bold text-gray-900 dark:text-gray-100">
              Modify Series
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-serif italic">
              Update the name and description of your series.
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="edit-name"
              className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1"
            >
              Series Name <span className="text-red-500">*</span>
            </label>
            <input
              id="edit-name"
              type="text"
              placeholder="e.g. Placement Prep"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isPending}
              required
              className="w-full rounded-sm border border-gray-300 dark:border-gray-700 px-3 py-1.5 text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 focus:border-gray-900 dark:focus:border-gray-100 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="edit-description"
              className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1"
            >
              Description (Optional)
            </label>
            <textarea
              id="edit-description"
              placeholder="e.g. 100 days of consistency in placement DSA..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isPending}
              rows={3}
              className="w-full rounded-sm border border-gray-300 dark:border-gray-700 px-3 py-1.5 text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 focus:border-gray-900 dark:focus:border-gray-100 focus:outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-700 dark:hover:bg-emerald-600 rounded-sm disabled:opacity-50 transition-colors cursor-pointer"
            >
              {isPending ? "Saving Changes..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
