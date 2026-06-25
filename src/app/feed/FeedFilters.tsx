"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface Track {
  id: string;
  name: string;
}

interface Series {
  id: string;
  name: string;
}

interface FeedFiltersProps {
  tracks: Track[];
  series: Series[];
  activeTrackId?: string;
  activeSeriesId?: string;
  activeTag?: string;
}

export default function FeedFilters({
  tracks,
  series,
  activeTrackId = "",
  activeSeriesId = "",
  activeTag = "",
}: FeedFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/feed?${params.toString()}`);
  };

  const removeTag = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("tag");
    router.push(`/feed?${params.toString()}`);
  };

  const hasActiveFilters = activeTrackId || activeSeriesId || activeTag;

  return (
    <div className="border border-gray-200 bg-white p-4 rounded-sm flex flex-wrap gap-4 items-center justify-between">
      <div className="flex flex-wrap gap-4 items-center text-sm">
        {/* Track Filter */}
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Track:</span>
          <select
            value={activeTrackId}
            onChange={(e) => handleFilterChange("trackId", e.target.value)}
            className="border border-gray-300 rounded-sm px-2 py-1 text-xs bg-white focus:outline-none cursor-pointer"
          >
            <option value="">All Tracks</option>
            {tracks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Series Filter */}
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Series:</span>
          <select
            value={activeSeriesId}
            onChange={(e) => handleFilterChange("seriesId", e.target.value)}
            className="border border-gray-300 rounded-sm px-2 py-1 text-xs bg-white focus:outline-none cursor-pointer"
          >
            <option value="">All Series</option>
            {series.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tag Filter Display */}
        {activeTag && (
          <div className="flex items-center gap-1.5 bg-gray-100 text-gray-800 px-2 py-0.5 rounded-sm text-xs">
            <span>Tag: #{activeTag}</span>
            <button
              onClick={removeTag}
              className="text-gray-400 hover:text-gray-600 font-bold cursor-pointer"
            >
              &times;
            </button>
          </div>
        )}
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={() => router.push("/feed")}
          className="text-xs text-red-600 hover:underline font-semibold cursor-pointer"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}
