"use client";

import React, { useState, useTransition } from "react";
import {
  createTrack,
  deleteTrack,
  createSubtopic,
  deleteSubtopic,
  toggleSubtopicStatus,
} from "../actions";
import { SubtopicStatus } from "@/lib/types";

interface Subtopic {
  id: string;
  name: string;
  status: SubtopicStatus;
  completedAt: Date | null;
}

interface Track {
  id: string;
  name: string;
  subtopics: Subtopic[];
}

interface TracksClientProps {
  initialTracks: Track[];
  isAdmin?: boolean;
}

export default function TracksClient({ initialTracks, isAdmin = false }: TracksClientProps) {
  const [tracks, setTracks] = useState<Track[]>(initialTracks);
  const [newTrackName, setNewTrackName] = useState("");
  const [newSubtopicNames, setNewSubtopicNames] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Sync state if initialTracks updates from server
  React.useEffect(() => {
    setTracks(initialTracks);
  }, [initialTracks]);

  const handleCreateTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrackName.trim()) return;

    setError(null);
    startTransition(async () => {
      try {
        await createTrack(newTrackName);
        setNewTrackName("");
      } catch (err: any) {
        setError(err.message || "Failed to create track");
      }
    });
  };

  const handleDeleteTrack = async (id: string) => {
    if (!confirm("Are you sure you want to delete this track? This will delete all its subtopics.")) return;

    setError(null);
    startTransition(async () => {
      try {
        await deleteTrack(id);
      } catch (err: any) {
        setError(err.message || "Failed to delete track");
      }
    });
  };

  const handleCreateSubtopic = async (e: React.FormEvent, trackId: string) => {
    e.preventDefault();
    const name = newSubtopicNames[trackId] || "";
    if (!name.trim()) return;

    setError(null);
    startTransition(async () => {
      try {
        await createSubtopic(trackId, name);
        setNewSubtopicNames((prev) => ({ ...prev, [trackId]: "" }));
      } catch (err: any) {
        setError(err.message || "Failed to create subtopic");
      }
    });
  };

  const handleDeleteSubtopic = async (id: string) => {
    if (!confirm("Are you sure you want to delete this subtopic?")) return;

    setError(null);
    startTransition(async () => {
      try {
        await deleteSubtopic(id);
      } catch (err: any) {
        setError(err.message || "Failed to delete subtopic");
      }
    });
  };

  const handleStatusChange = async (subtopicId: string, status: SubtopicStatus) => {
    setError(null);
    startTransition(async () => {
      try {
        await toggleSubtopicStatus(subtopicId, status);
      } catch (err: any) {
        setError(err.message || "Failed to update subtopic status");
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mb-1">
            Topic Checklists
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-serif italic text-sm">
            Manage your study guides, roadmaps, and checklist items.
          </p>
        </div>

        {/* Add Track Form */}
        {isAdmin && (
          <form onSubmit={handleCreateTrack} className="flex gap-2 max-w-sm w-full">
            <input
              type="text"
              placeholder="Track Name (e.g. DSA)"
              value={newTrackName}
              onChange={(e) => setNewTrackName(e.target.value)}
              disabled={isPending}
              className="flex-1 rounded-sm border border-gray-300 dark:border-gray-700 px-3 py-1.5 text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 focus:border-gray-900 dark:focus:border-gray-100 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isPending}
              className="rounded-sm border border-gray-900 dark:border-slate-700 bg-gray-900 dark:bg-slate-800 px-4 py-1.5 text-sm text-white hover:bg-gray-800 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors font-medium cursor-pointer"
            >
              Add Track
            </button>
          </form>
        )}
      </div>

      {error && (
        <div className="border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-400 px-4 py-3 rounded-sm text-sm">
          {error}
        </div>
      )}

      {/* Tracks Layout */}
      {tracks.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-200 dark:border-gray-800 rounded-sm text-gray-400 dark:text-gray-500">
          No tracks created yet. Use the form above to add a track like "DSA", "Dev", or "DevOps".
        </div>
      ) : (
        <div className="space-y-6">
          {/* Mobile Track Quick Links */}
          <div className="lg:hidden flex flex-wrap gap-2 pb-2">
            {tracks.map((track) => (
              <a
                key={track.id}
                href={`#track-${track.id}`}
                className="px-3 py-1.5 bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-gray-850 hover:border-emerald-800/30 dark:hover:border-emerald-500/30 text-xs font-medium rounded-sm text-gray-700 dark:text-gray-300 hover:text-emerald-800 dark:hover:text-emerald-450 transition-colors"
              >
                {track.name}
              </a>
            ))}
          </div>

          <div className="flex flex-col lg:flex-row gap-10">
            {/* Left Sticky Navbar */}
            <aside className="lg:w-56 shrink-0 lg:sticky lg:top-6 lg:h-fit hidden lg:block">
              <div className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 p-4 rounded-sm space-y-4">
                <h2 className="font-serif text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider border-b border-gray-200 dark:border-gray-800 pb-2">
                  Tracks
                </h2>
                <nav className="flex flex-col gap-1.5">
                  {tracks.map((track) => {
                    const completedCount = track.subtopics.filter((s) => s.status === SubtopicStatus.DONE).length;
                    const totalCount = track.subtopics.length;
                    const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
                    return (
                      <a
                        key={track.id}
                        href={`#track-${track.id}`}
                        className="flex justify-between items-center px-3 py-2 text-sm font-medium rounded-sm text-gray-600 dark:text-gray-400 hover:text-emerald-800 dark:hover:text-emerald-450 hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <span className="truncate">{track.name}</span>
                        <span className="text-[10px] bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full text-gray-500 dark:text-gray-400 font-mono">
                          {percentage}%
                        </span>
                      </a>
                    );
                  })}
                </nav>
              </div>
            </aside>

            {/* Tracks Grid */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8">
              {tracks.map((track) => {
                const completedCount = track.subtopics.filter((s) => s.status === SubtopicStatus.DONE).length;
                const totalCount = track.subtopics.length;
                const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

                return (
                  <div
                    key={track.id}
                    id={`track-${track.id}`}
                    className="scroll-mt-6 border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 p-6 rounded-sm flex flex-col justify-between transition-colors duration-300"
                  >
                    <div>
                      {/* Track Header */}
                      <div className="flex justify-between items-baseline mb-4">
                        <div>
                          <h2 className="text-xl font-serif font-bold text-gray-900 dark:text-gray-100">{track.name}</h2>
                          <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                            {completedCount}/{totalCount} Completed ({percentage}%)
                          </span>
                        </div>
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteTrack(track.id)}
                            disabled={isPending}
                            className="text-xs text-gray-400 dark:text-gray-500 hover:text-red-700 dark:hover:text-red-400 transition-colors cursor-pointer"
                          >
                            Delete Track
                          </button>
                        )}
                      </div>

                      {/* Subtopics Checklist */}
                      <div className="space-y-2 mb-6">
                        {track.subtopics.length === 0 ? (
                          <div className="text-xs text-gray-400 dark:text-gray-500 italic py-3">
                            No subtopics yet. Add one below.
                          </div>
                        ) : (
                          track.subtopics.map((subtopic) => (
                            <div
                              key={subtopic.id}
                              className="flex items-center justify-between py-1.5 px-2 hover:bg-gray-50 dark:hover:bg-slate-800/40 border-b border-gray-100 dark:border-gray-800 last:border-0 rounded-sm"
                            >
                              <span
                                className={`text-sm ${
                                  subtopic.status === SubtopicStatus.DONE
                                    ? "line-through text-gray-400 dark:text-gray-500"
                                    : subtopic.status === SubtopicStatus.IN_PROGRESS
                                    ? "text-gray-900 dark:text-gray-100 font-medium"
                                    : "text-gray-700 dark:text-gray-300"
                                }`}
                              >
                                {subtopic.name}
                              </span>

                              <div className="flex items-center gap-2">
                                {/* Status Selector */}
                                <select
                                  value={subtopic.status}
                                  onChange={(e) =>
                                    handleStatusChange(
                                      subtopic.id,
                                      e.target.value as SubtopicStatus
                                    )
                                  }
                                  disabled={!isAdmin || isPending}
                                  className={`text-xs border rounded-sm px-1.5 py-0.5 bg-white dark:bg-slate-900 cursor-pointer ${
                                    subtopic.status === SubtopicStatus.DONE
                                      ? "border-emerald-200 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-450"
                                      : subtopic.status === SubtopicStatus.IN_PROGRESS
                                      ? "border-amber-200 dark:border-amber-900/30 text-amber-800 dark:text-amber-450"
                                      : "border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-450"
                                  }`}
                                >
                                  <option value={SubtopicStatus.NOT_STARTED}>Not Started</option>
                                  <option value={SubtopicStatus.IN_PROGRESS}>In Progress</option>
                                  <option value={SubtopicStatus.DONE}>Completed</option>
                                </select>

                                {/* Delete Button */}
                                {isAdmin && (
                                  <button
                                    onClick={() => handleDeleteSubtopic(subtopic.id)}
                                    disabled={isPending}
                                    className="text-gray-400 dark:text-gray-500 hover:text-red-700 dark:hover:text-red-400 text-xs px-1 cursor-pointer"
                                    title="Delete subtopic"
                                  >
                                    &times;
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Add Subtopic Form */}
                    {isAdmin && (
                      <form
                        onSubmit={(e) => handleCreateSubtopic(e, track.id)}
                        className="flex gap-2 border-t border-gray-100 dark:border-gray-800 pt-4"
                      >
                        <input
                          type="text"
                          placeholder="Add subtopic (e.g. Arrays)"
                          value={newSubtopicNames[track.id] || ""}
                          onChange={(e) =>
                            setNewSubtopicNames((prev) => ({
                              ...prev,
                              [track.id]: e.target.value,
                            }))
                          }
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
                      </form>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
