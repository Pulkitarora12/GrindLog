"use client";

import React, { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  createDailyTarget,
  toggleDailyTarget,
  deleteDailyTarget,
  endDay,
} from "./actions";

interface Target {
  id: string;
  text: string;
  done: boolean;
  subtopic?: {
    id: string;
    name: string;
    track: {
      name: string;
    };
  } | null;
}

interface SubtopicOption {
  id: string;
  name: string;
  trackName: string;
}

interface SeriesOption {
  id: string;
  name: string;
}

interface DashboardTargetListProps {
  initialTargets: Target[];
  subtopicsList: SubtopicOption[];
  seriesList: SeriesOption[];
  isAdmin: boolean;
  activeDateStr: string;
  todayStr: string;
  yesterdayStr: string;
  isClosed: boolean;
}

export default function DashboardTargetList({
  initialTargets,
  subtopicsList,
  seriesList,
  isAdmin,
  activeDateStr,
  todayStr,
  yesterdayStr,
  isClosed,
}: DashboardTargetListProps) {
  const router = useRouter();
  const [targets, setTargets] = useState<Target[]>(initialTargets);
  const [newTargetText, setNewTargetText] = useState("");
  const [selectedSubtopicId, setSelectedSubtopicId] = useState("");
  const [selectedSeriesId, setSelectedSeriesId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Sync targets and clear errors when the active date changes
  useEffect(() => {
    setTargets(initialTargets);
    setError(null);
    setNewTargetText("");
    setSelectedSubtopicId("");
  }, [initialTargets, activeDateStr]);

  // Sort subtopics list by track name, then subtopic name
  const sortedSubtopics = [...subtopicsList].sort((a, b) => {
    const trackCompare = a.trackName.localeCompare(b.trackName);
    if (trackCompare !== 0) return trackCompare;
    return a.name.localeCompare(b.name);
  });

  const handleAddTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTargetText.trim()) return;

    setError(null);
    startTransition(async () => {
      try {
        const addedTarget = await createDailyTarget(
          newTargetText,
          selectedSubtopicId || null,
          activeDateStr
        );

        setTargets((prev) => [...prev, addedTarget]);
        setNewTargetText("");
        setSelectedSubtopicId("");
        router.refresh();
      } catch (err: any) {
        setError(err.message || "Failed to create target");
      }
    });
  };

  const handleToggleDone = async (id: string, currentDone: boolean) => {
    if (!isAdmin || isClosed) return;

    setError(null);
    // Optimistic UI update
    setTargets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !currentDone } : t))
    );

    try {
      await toggleDailyTarget(id, !currentDone);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to update target status");
      // Revert on error
      setTargets((prev) =>
        prev.map((t) => (t.id === id ? { ...t, done: currentDone } : t))
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin || isClosed) return;
    if (!confirm("Are you sure you want to delete this target?")) return;

    setError(null);
    const originalTargets = [...targets];
    setTargets((prev) => prev.filter((t) => t.id !== id));

    try {
      await deleteDailyTarget(id);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to delete target");
      setTargets(originalTargets);
    }
  };

  const handleEndDay = async () => {
    if (!isAdmin || isClosed) return;
    if (targets.length === 0) {
      setError("Please set at least one target before closing the day.");
      return;
    }

    const dateLabel =
      activeDateStr === todayStr
        ? "today"
        : `${activeDateStr} (yesterday)`;

    if (
      !confirm(
        `Are you sure you want to end the day for ${dateLabel}? This will calculate efficiency, create your Day Summary, and lock these targets from editing.`
      )
    ) {
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        await endDay(activeDateStr, selectedSeriesId || null);
        router.push(`/calendar?date=${activeDateStr}`);
        router.refresh();
      } catch (err: any) {
        setError(err.message || "Failed to close the day.");
      }
    });
  };

  const completedCount = targets.filter((t) => t.done).length;
  const totalCount = targets.length;
  const progressPercentage =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {error && (
        <div className="border border-red-200 bg-red-50 text-red-800 px-4 py-3 rounded-sm text-sm">
          {error}
        </div>
      )}

      {/* Progress Header */}
      {totalCount > 0 && (
        <div className="border border-gray-200 bg-white p-5 rounded-sm space-y-3">
          <div className="flex justify-between items-baseline">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              {activeDateStr === todayStr ? "Today's" : "Yesterday's"} Targets Progress
            </span>
            <span className="text-sm font-bold text-gray-900">
              {completedCount} / {totalCount} Completed ({progressPercentage}%)
            </span>
          </div>
          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-800 h-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Target Checklist */}
      <div className="border border-gray-200 bg-white rounded-sm divide-y divide-gray-100">
        <div className="p-4 bg-gray-50 flex items-center justify-between">
          <h3 className="font-serif font-bold text-gray-900 text-sm">
            Checklist for {new Date(activeDateStr).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </h3>
          {isClosed && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-gray-200 text-gray-700 text-[10px] font-bold uppercase tracking-wide">
              🔒 Closed
            </span>
          )}
        </div>

        {targets.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">
            No targets set for this date yet. Use the form below to plan your day.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {targets.map((t) => (
              <div
                key={t.id}
                className={`p-4 flex items-center justify-between gap-4 transition-colors ${
                  t.done ? "bg-emerald-50/10" : ""
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <input
                    type="checkbox"
                    checked={t.done}
                    onChange={() => handleToggleDone(t.id, t.done)}
                    disabled={!isAdmin || isClosed}
                    className="w-4 h-4 rounded-sm border-gray-300 text-emerald-800 focus:ring-emerald-800 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <div className="min-w-0">
                    <span
                      className={`text-sm text-gray-900 block ${
                        t.done ? "line-through text-gray-400" : ""
                      }`}
                    >
                      {t.text}
                    </span>
                    {t.subtopic && (
                      <span className="inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-sm border border-emerald-200 bg-emerald-50 text-emerald-800">
                        {t.subtopic.track.name}: {t.subtopic.name}
                      </span>
                    )}
                  </div>
                </div>

                {isAdmin && !isClosed && (
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="text-xs text-gray-400 hover:text-red-700 transition-colors p-1"
                    title="Delete target"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                      />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add New Target Form */}
      {isAdmin && !isClosed && (
        <form
          onSubmit={handleAddTarget}
          className="border border-gray-200 bg-white p-5 rounded-sm space-y-4"
        >
          <h4 className="font-serif font-bold text-gray-900 text-sm border-b border-gray-100 pb-2">
            Add Target for {activeDateStr === todayStr ? "Today" : "Yesterday"}
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label
                htmlFor="target-text"
                className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1"
              >
                Target Description
              </label>
              <input
                id="target-text"
                type="text"
                required
                placeholder="e.g. Solve 3 Trees problems"
                value={newTargetText}
                onChange={(e) => setNewTargetText(e.target.value)}
                disabled={isPending}
                className="w-full rounded-sm border border-gray-300 px-3 py-2 text-sm bg-white focus:border-gray-900 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="subtopic-select"
                className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1"
              >
                Link Subtopic (Optional)
              </label>
              <select
                id="subtopic-select"
                value={selectedSubtopicId}
                onChange={(e) => setSelectedSubtopicId(e.target.value)}
                disabled={isPending}
                className="w-full rounded-sm border border-gray-300 px-3 py-2 text-sm bg-white focus:border-gray-900 focus:outline-none"
              >
                <option value="">None</option>
                {sortedSubtopics.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.trackName}: {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending || !newTargetText.trim()}
            className="w-full sm:w-auto rounded-sm border border-gray-900 bg-gray-900 px-5 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50 transition-colors font-medium cursor-pointer"
          >
            Add Target
          </button>
        </form>
      )}

      {/* End Day Form Section */}
      {isAdmin && !isClosed && targets.length > 0 && (
        <div className="border border-emerald-800/10 bg-emerald-50/10 p-5 rounded-sm space-y-4">
          <div>
            <h4 className="font-serif font-bold text-emerald-950 text-sm">
              Ready to Close {activeDateStr === todayStr ? "Today" : "Yesterday"}?
            </h4>
            <p className="text-xs text-gray-500 mt-1">
              Ending the day will calculate your target efficiency and freeze these targets from any further modifications.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-end gap-4 flex-wrap">
            {/* Date to Close dropdown/picker */}
            <div className="w-full sm:max-w-xs">
              <label
                htmlFor="close-date-select"
                className="block text-[10px] font-semibold uppercase tracking-wider text-emerald-800 mb-1 font-sans cursor-pointer"
              >
                Date to Close
              </label>
              <select
                id="close-date-select"
                value={activeDateStr}
                onChange={(e) => {
                  const selectedDate = e.target.value;
                  startTransition(() => {
                    if (selectedDate === todayStr) {
                      router.push("/");
                    } else {
                      router.push(`/?date=${selectedDate}`);
                    }
                  });
                }}
                disabled={isPending}
                className="w-full rounded-sm border border-gray-300 px-3 py-2 text-sm bg-white text-gray-800 font-semibold font-sans focus:border-emerald-800 focus:outline-none cursor-pointer"
              >
                <option value={todayStr}>
                  {(() => {
                    const [year, month, day] = todayStr.split("-").map(Number);
                    return new Date(year, month - 1, day).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    });
                  })()}{" "}
                  (Today)
                </option>
                <option value={yesterdayStr}>
                  {(() => {
                    const [year, month, day] = yesterdayStr.split("-").map(Number);
                    return new Date(year, month - 1, day).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    });
                  })()}{" "}
                  (Yesterday)
                </option>
              </select>
            </div>

            {/* Series picker */}
            <div className="w-full sm:max-w-xs">
              <label
                htmlFor="series-select"
                className="block text-[10px] font-semibold uppercase tracking-wider text-emerald-800 mb-1"
              >
                Associate with Series (Optional)
              </label>
              <select
                id="series-select"
                value={selectedSeriesId}
                onChange={(e) => setSelectedSeriesId(e.target.value)}
                disabled={isPending}
                className="w-full rounded-sm border border-gray-300 px-3 py-2 text-sm bg-white focus:border-gray-900 focus:outline-none"
              >
                <option value="">No Series</option>
                {seriesList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleEndDay}
              disabled={isPending}
              className="w-full sm:w-auto rounded-sm border border-emerald-900 bg-emerald-800 px-6 py-2.5 text-sm text-white hover:bg-emerald-900 disabled:opacity-50 transition-colors font-semibold tracking-wide cursor-pointer"
            >
              End Day &amp; Generate Summary
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

