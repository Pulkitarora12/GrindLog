"use client";

import React, { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { createSeries, deleteSeries, endSeries, reopenSeries, updateSeries } from "../actions";
import EndSeriesModal from "@/components/EndSeriesModal";
import EditSeriesModal from "@/components/EditSeriesModal";
import { getSeriesTimingInfo } from "@/lib/dateUtils";

export interface SeriesItem {
  id: string;
  name: string;
  description: string | null;
  isEnded: boolean;
  endedAt: Date | string | null;
  endingReason: string | null;
  createdAt: Date | string;
  _count: {
    daySummaries: number;
  };
}

interface SeriesClientProps {
  initialSeries: SeriesItem[];
  isAdmin?: boolean;
}

export default function SeriesClient({ initialSeries, isAdmin = false }: SeriesClientProps) {
  const [series, setSeries] = useState<SeriesItem[]>(initialSeries);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // State for End Series Modal & Edit Series Modal
  const [seriesToEnd, setSeriesToEnd] = useState<SeriesItem | null>(null);
  const [seriesToEdit, setSeriesToEdit] = useState<SeriesItem | null>(null);

  React.useEffect(() => {
    setSeries(initialSeries);
  }, [initialSeries]);

  const sortedSeries = useMemo(() => {
    return [...series].sort((a, b) => {
      // Active series (isEnded = false) come before ended series (isEnded = true)
      if (a.isEnded !== b.isEnded) {
        return a.isEnded ? 1 : -1;
      }
      // Order by created date descending (latest created first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [series]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setError(null);
    startTransition(async () => {
      try {
        await createSeries(name, description);
        setName("");
        setDescription("");
      } catch (err: any) {
        setError(err.message || "Failed to create series");
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this series? The logged entries will not be deleted, but they will no longer belong to this series."
      )
    )
      return;

    setError(null);
    startTransition(async () => {
      try {
        await deleteSeries(id);
      } catch (err: any) {
        setError(err.message || "Failed to delete series");
      }
    });
  };

  const handleEndSeriesSubmit = async (reason: string) => {
    if (!seriesToEnd) return;
    const targetId = seriesToEnd.id;
    await endSeries(targetId, reason);
  };

  const handleEditSeriesSubmit = async (newName: string, newDescription?: string) => {
    if (!seriesToEdit) return;
    await updateSeries(seriesToEdit.id, newName, newDescription);
  };

  const handleReopen = async (id: string) => {
    if (!confirm("Are you sure you want to reopen this series?")) return;

    setError(null);
    startTransition(async () => {
      try {
        await reopenSeries(id);
      } catch (err: any) {
        setError(err.message || "Failed to reopen series");
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* End Series Modal */}
      {seriesToEnd && (
        <EndSeriesModal
          isOpen={!!seriesToEnd}
          seriesName={seriesToEnd.name}
          onClose={() => setSeriesToEnd(null)}
          onSubmit={handleEndSeriesSubmit}
          isPending={isPending}
        />
      )}

      {/* Edit Series Modal */}
      {seriesToEdit && (
        <EditSeriesModal
          isOpen={!!seriesToEdit}
          initialName={seriesToEdit.name}
          initialDescription={seriesToEdit.description}
          onClose={() => setSeriesToEdit(null)}
          onSubmit={handleEditSeriesSubmit}
          isPending={isPending}
        />
      )}

      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mb-1">
            Log Series
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-serif italic text-sm">
            Group your logs into themed, numbered daily series.
          </p>
        </div>
      </div>

      {/* Grid: Form and Series List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left: Create Series Form */}
        {isAdmin && (
          <div className="md:col-span-1 border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 p-6 rounded-sm h-fit transition-colors duration-300">
            <h2 className="font-serif text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
              Create New Series
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-400 p-2.5 rounded-sm text-xs">
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="name"
                  className="block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1"
                >
                  Series Name
                </label>
                <input
                  id="name"
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
                  htmlFor="description"
                  className="block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1"
                >
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  placeholder="e.g. 100 days of consistency in placement DSA..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isPending}
                  rows={3}
                  className="w-full rounded-sm border border-gray-300 dark:border-gray-700 px-3 py-1.5 text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 focus:border-gray-900 dark:focus:border-gray-100 focus:outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full rounded-sm border border-gray-900 dark:border-slate-700 bg-gray-900 dark:bg-slate-800 py-2 text-sm text-white hover:bg-gray-800 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors font-medium cursor-pointer"
              >
                Create Series
              </button>
            </form>
          </div>
        )}

        {/* Right: Series List */}
        <div className={isAdmin ? "md:col-span-2 space-y-4" : "md:col-span-3 space-y-4"}>
          <h2 className="font-serif text-lg font-bold text-gray-900 dark:text-gray-100">
            Series Collections
          </h2>

          {sortedSeries.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-gray-200 dark:border-gray-800 rounded-sm text-gray-400 dark:text-gray-500">
              No series created yet. Start a themed collection using the form on the left.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {sortedSeries.map((item) => {
                const { startDateStr, daysAgoText, lastedDaysText } = getSeriesTimingInfo(
                  item.createdAt,
                  item.endedAt
                );
                const completionDateStr = item.endedAt
                  ? new Date(item.endedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : null;

                return (
                  <div
                    key={item.id}
                    className={`border ${
                      item.isEnded
                        ? "border-amber-200 dark:border-amber-900/40 bg-amber-50/20 dark:bg-amber-950/10"
                        : "border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900"
                    } p-5 rounded-sm flex flex-col justify-between transition-colors duration-300`}
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <h3 className="font-serif text-base font-bold text-gray-900 dark:text-gray-100 hover:underline">
                          <Link href={`/series/${item.id}`}>{item.name}</Link>
                        </h3>
                        {item.isEnded ? (
                          <span className="px-2 py-0.5 rounded-xs bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-300 text-[10px] font-bold uppercase tracking-wider shrink-0">
                            Closed
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-xs bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold uppercase tracking-wider shrink-0">
                            Active
                          </span>
                        )}
                      </div>

                      <div className="space-y-1 mt-2 text-xs">
                        <div className="flex flex-wrap items-center gap-1.5 text-gray-600 dark:text-gray-400 font-medium">
                          <span>🗓️ Started: {startDateStr}</span>
                          <span>&middot;</span>
                          <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{daysAgoText}</span>
                        </div>

                        <p className="text-gray-400 dark:text-gray-500 font-medium">
                          📊 {item._count.daySummaries} day{item._count.daySummaries !== 1 ? "s" : ""} logged
                        </p>
                      </div>

                      {item.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-3 line-clamp-2 leading-relaxed italic">
                          {item.description}
                        </p>
                      )}

                      {/* Display Completion Info if Ended */}
                      {item.isEnded && (
                        <div className="mt-4 p-3 border border-amber-200/70 dark:border-amber-900/30 bg-amber-100/40 dark:bg-amber-950/20 rounded-xs space-y-1">
                          {lastedDaysText && (
                            <div className="text-[11px] font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                              <span>⏱️ {lastedDaysText}</span>
                            </div>
                          )}
                          {completionDateStr && (
                            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-800 dark:text-amber-350">
                              <span>📅 Date of Completion:</span>
                              <span>{completionDateStr}</span>
                            </div>
                          )}
                          {item.endingReason && (
                            <div className="text-[11px] text-amber-950 dark:text-amber-200">
                              <span className="font-semibold">💬 Verdict / Reason:</span>{" "}
                              <span className="italic">&quot;{item.endingReason}&quot;</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="mt-6 flex justify-between items-center border-t border-gray-100 dark:border-gray-800 pt-3">
                      <Link
                        href={`/series/${item.id}`}
                        className="text-xs font-semibold text-emerald-800 dark:text-emerald-450 hover:underline"
                      >
                        View Entries &rarr;
                      </Link>

                      <div className="flex items-center gap-2">
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => setSeriesToEdit(item)}
                              disabled={isPending}
                              className="text-xs font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100 transition-colors cursor-pointer border border-gray-300 dark:border-gray-700 px-2 py-0.5 rounded-xs"
                              title="Modify Name & Description"
                            >
                              Edit
                            </button>

                            {!item.isEnded ? (
                              <button
                                onClick={() => setSeriesToEnd(item)}
                                disabled={isPending}
                                className="text-xs font-medium text-amber-700 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-300 transition-colors cursor-pointer border border-amber-300 dark:border-amber-800 px-2 py-0.5 rounded-xs"
                              >
                                End Series
                              </button>
                            ) : (
                              <button
                                onClick={() => handleReopen(item.id)}
                                disabled={isPending}
                                className="text-xs text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors cursor-pointer"
                              >
                                Reopen
                              </button>
                            )}

                            <button
                              onClick={() => handleDelete(item.id)}
                              disabled={isPending}
                              className="text-xs text-gray-400 dark:text-gray-500 hover:text-red-700 dark:hover:text-red-400 transition-colors cursor-pointer"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
