"use client";

import React, { useState } from "react";

interface EndSeriesModalProps {
  isOpen: boolean;
  seriesName: string;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
  isPending?: boolean;
}

export default function EndSeriesModal({
  isOpen,
  seriesName,
  onClose,
  onSubmit,
  isPending = false,
}: EndSeriesModalProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError("Please provide a verdict or reason for closing this series.");
      return;
    }

    setError(null);
    try {
      await onSubmit(reason);
      setReason("");
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to end series");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-sm shadow-xl max-w-md w-full p-6 space-y-4">
        <div className="flex justify-between items-start border-b border-gray-100 dark:border-gray-800 pb-3">
          <div>
            <h3 className="font-serif text-lg font-bold text-gray-900 dark:text-gray-100">
              End Series
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-serif italic">
              Marking &quot;{seriesName}&quot; as completed or closed.
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
              htmlFor="endingReason"
              className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1"
            >
              Verdict / Reason for Closing <span className="text-red-500">*</span>
            </label>
            <textarea
              id="endingReason"
              placeholder="e.g. Successfully completed 30 days of placement prep, target achieved!"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isPending}
              rows={4}
              required
              className="w-full rounded-sm border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 focus:border-gray-900 dark:focus:border-gray-100 focus:outline-none resize-none"
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
              className="px-4 py-2 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 dark:bg-red-800 dark:hover:bg-red-700 rounded-sm disabled:opacity-50 transition-colors cursor-pointer"
            >
              {isPending ? "Ending Series..." : "Confirm & End Series"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
