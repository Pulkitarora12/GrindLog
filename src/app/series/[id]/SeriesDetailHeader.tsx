"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { endSeries, reopenSeries, updateSeries } from "../../actions";
import EndSeriesModal from "@/components/EndSeriesModal";
import EditSeriesModal from "@/components/EditSeriesModal";
import { getSeriesTimingInfo } from "@/lib/dateUtils";

interface SeriesDetailHeaderProps {
  series: {
    id: string;
    name: string;
    description: string | null;
    isEnded: boolean;
    endedAt: Date | string | null;
    endingReason: string | null;
    createdAt: Date | string;
  };
  isAdmin?: boolean;
}

export default function SeriesDetailHeader({ series, isAdmin = false }: SeriesDetailHeaderProps) {
  const [isEndModalOpen, setIsEndModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const { startDateStr, daysAgoText, lastedDaysText } = getSeriesTimingInfo(
    series.createdAt,
    series.endedAt
  );

  const completionDateStr = series.endedAt
    ? new Date(series.endedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const handleEndSeriesSubmit = async (reason: string) => {
    await endSeries(series.id, reason);
  };

  const handleEditSeriesSubmit = async (newName: string, newDescription?: string) => {
    await updateSeries(series.id, newName, newDescription);
  };

  const handleReopen = async () => {
    if (!confirm("Are you sure you want to reopen this series?")) return;

    setError(null);
    startTransition(async () => {
      try {
        await reopenSeries(series.id);
      } catch (err: any) {
        setError(err.message || "Failed to reopen series");
      }
    });
  };

  return (
    <div className="border-b border-gray-200 dark:border-gray-800 pb-6 space-y-4">
      {/* End Series Modal */}
      {isEndModalOpen && (
        <EndSeriesModal
          isOpen={isEndModalOpen}
          seriesName={series.name}
          onClose={() => setIsEndModalOpen(false)}
          onSubmit={handleEndSeriesSubmit}
          isPending={isPending}
        />
      )}

      {/* Edit Series Modal */}
      {isEditModalOpen && (
        <EditSeriesModal
          isOpen={isEditModalOpen}
          initialName={series.name}
          initialDescription={series.description}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleEditSeriesSubmit}
          isPending={isPending}
        />
      )}

      {error && (
        <div className="border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-400 p-2.5 rounded-sm text-xs">
          {error}
        </div>
      )}

      <div className="flex justify-between items-start gap-4">
        <div>
          <Link
            href="/series"
            className="text-xs font-semibold text-emerald-800 dark:text-emerald-450 hover:underline inline-flex items-center gap-1.5 mb-3"
          >
            &larr; All Collections
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              {series.name}
            </h1>
            {series.isEnded ? (
              <span className="px-2.5 py-0.5 rounded-xs bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-300 text-xs font-bold uppercase tracking-wider">
                Series Ended
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-xs bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider">
                Active Series
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-gray-600 dark:text-gray-400 font-medium">
            <span>🗓️ Started: {startDateStr}</span>
            <span>&middot;</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{daysAgoText}</span>
          </div>
        </div>

        {isAdmin && (
          <div className="shrink-0 pt-2 flex items-center gap-2">
            <button
              onClick={() => setIsEditModalOpen(true)}
              disabled={isPending}
              className="px-3.5 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-sm transition-colors cursor-pointer"
            >
              Modify Series
            </button>

            {!series.isEnded ? (
              <button
                onClick={() => setIsEndModalOpen(true)}
                disabled={isPending}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 dark:bg-amber-800 dark:hover:bg-amber-700 rounded-sm transition-colors cursor-pointer shadow-xs"
              >
                End Series
              </button>
            ) : (
              <button
                onClick={handleReopen}
                disabled={isPending}
                className="px-3.5 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-sm transition-colors cursor-pointer"
              >
                Reopen Series
              </button>
            )}
          </div>
        )}
      </div>

      {series.description ? (
        <p className="text-gray-600 dark:text-gray-400 font-serif italic text-sm leading-relaxed">
          {series.description}
        </p>
      ) : (
        <p className="text-gray-400 dark:text-gray-500 font-serif italic text-sm">
          No description provided.
        </p>
      )}

      {/* Completion info box if series is ended */}
      {series.isEnded && (
        <div className="p-4 border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 rounded-sm space-y-2">
          {lastedDaysText && (
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-300">
              <span className="text-base">⏱️</span>
              <span>{lastedDaysText}</span>
            </div>
          )}
          {completionDateStr && (
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-900 dark:text-amber-300">
              <span className="text-base">📅</span>
              <span>Date of Completion: {completionDateStr}</span>
            </div>
          )}
          {series.endingReason && (
            <div className="text-xs text-amber-950 dark:text-amber-200 leading-relaxed">
              <span className="font-semibold">💬 Verdict / Reason of Closing:</span>{" "}
              <span className="italic font-serif">&quot;{series.endingReason}&quot;</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
