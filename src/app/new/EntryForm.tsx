"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createEntry, updateEntry } from "../actions";
import { SubtopicStatus } from "@/lib/types";

interface Subtopic {
  id: string;
  name: string;
  status: SubtopicStatus;
}

interface Track {
  id: string;
  name: string;
  subtopics: Subtopic[];
}

interface Series {
  id: string;
  name: string;
}

interface Entry {
  id: string;
  date: Date;
  title: string | null;
  content: string;
  seriesId: string | null;
  seriesDay: number | null;
  subtopics: { id: string }[];
  tags: string[];
}

interface EntryFormProps {
  seriesList: Series[];
  tracksList: Track[];
  editingEntry?: Entry | null;
  defaultDate?: string;
  defaultSeriesId?: string;
}

export default function EntryForm({
  seriesList,
  tracksList,
  editingEntry,
  defaultDate,
  defaultSeriesId,
}: EntryFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Initialize form state
  const [date, setDate] = useState(() => {
    if (editingEntry) {
      const d = new Date(editingEntry.date);
      return d.toISOString().split("T")[0];
    }
    return defaultDate || new Date().toISOString().split("T")[0];
  });

  const [title, setTitle] = useState(editingEntry?.title || "");
  const [content, setContent] = useState(editingEntry?.content || "");
  const [seriesId, setSeriesId] = useState(editingEntry?.seriesId || defaultSeriesId || "");
  const [seriesDay, setSeriesDay] = useState(
    editingEntry?.seriesDay !== null && editingEntry?.seriesDay !== undefined
      ? String(editingEntry.seriesDay)
      : ""
  );

  const [selectedSubtopics, setSelectedSubtopics] = useState<string[]>(() => {
    return editingEntry?.subtopics.map((s) => s.id) || [];
  });

  const [tagsInput, setTagsInput] = useState(() => {
    return editingEntry?.tags.join(", ") || "";
  });

  const handleSubtopicToggle = (id: string) => {
    setSelectedSubtopics((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError("Log content is required");
      return;
    }

    setError(null);
    const parsedTags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t !== "");

    const payload = {
      date: new Date(date),
      title: title.trim() || undefined,
      content: content,
      seriesId: seriesId || null,
      seriesDay: seriesDay ? parseInt(seriesDay, 10) : null,
      subtopicIds: selectedSubtopics,
      tags: parsedTags,
    };

    startTransition(async () => {
      try {
        if (editingEntry) {
          await updateEntry(editingEntry.id, payload);
        } else {
          await createEntry(payload);
        }
        // Redirect back to calendar view for the entry date
        router.push(`/calendar?date=${date}`);
        router.refresh();
      } catch (err: any) {
        setError(err.message || "An error occurred while saving the entry");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="border-b border-gray-200 pb-6 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-gray-900 mb-1">
            {editingEntry ? "Edit Log Entry" : "Write Log Entry"}
          </h1>
          <p className="text-gray-500 font-serif italic text-sm">
            {editingEntry ? "Modify your past logs." : "Document what you did and check off completed topics."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
        >
          Cancel
        </button>
      </div>

      {error && (
        <div className="border border-red-200 bg-red-50 text-red-800 px-4 py-3 rounded-sm text-sm">
          {error}
        </div>
      )}

      {/* Main Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Log Details & Content (Width 2/3) */}
        <div className="md:col-span-2 space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
              Title (Optional)
            </label>
            <input
              id="title"
              type="text"
              placeholder="e.g. Completed DP arrays and wrote blog post"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isPending}
              className="w-full rounded-sm border border-gray-300 px-3 py-2 text-sm bg-white focus:border-gray-900 focus:outline-none font-serif text-lg font-semibold"
            />
          </div>

          {/* Content (Markdown Textarea) */}
          <div>
            <label htmlFor="content" className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
              Content (Markdown supported)
            </label>
            <textarea
              id="content"
              placeholder="Write your day reflections, notes, code snippets, or solutions..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isPending}
              rows={12}
              required
              className="w-full rounded-sm border border-gray-300 px-4 py-3 text-sm bg-white focus:border-gray-900 focus:outline-none font-mono resize-y leading-relaxed"
            />
          </div>
        </div>

        {/* Right Column: Metadata & Checklists (Width 1/3) */}
        <div className="md:col-span-1 space-y-6 border border-gray-200 bg-white p-5 rounded-sm h-fit">
          <h2 className="font-serif font-bold text-base text-gray-900 border-b border-gray-100 pb-2 mb-4">
            Metadata & Mapping
          </h2>

          {/* Date Picker */}
          <div>
            <label htmlFor="date" className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
              Date
            </label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={isPending}
              required
              className="w-full rounded-sm border border-gray-300 px-3 py-1.5 text-xs bg-white focus:border-gray-900 focus:outline-none cursor-pointer"
            />
          </div>

          {/* Series Mapping */}
          <div className="space-y-3">
            <div>
              <label htmlFor="series" className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                Link to Series
              </label>
              <select
                id="series"
                value={seriesId}
                onChange={(e) => setSeriesId(e.target.value)}
                disabled={isPending}
                className="w-full rounded-sm border border-gray-300 px-2 py-1.5 text-xs bg-white focus:border-gray-900 focus:outline-none cursor-pointer"
              >
                <option value="">No Series (Standalone Log)</option>
                {seriesList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {seriesId && (
              <div>
                <label htmlFor="seriesDay" className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                  Series Day (e.g. Day 47)
                </label>
                <input
                  id="seriesDay"
                  type="number"
                  placeholder="e.g. 47"
                  value={seriesDay}
                  onChange={(e) => setSeriesDay(e.target.value)}
                  disabled={isPending}
                  min={1}
                  className="w-full rounded-sm border border-gray-300 px-3 py-1.5 text-xs bg-white focus:border-gray-900 focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <label htmlFor="tags" className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
              Tags (comma separated)
            </label>
            <input
              id="tags"
              type="text"
              placeholder="e.g. dsa, rust, recursion"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              disabled={isPending}
              className="w-full rounded-sm border border-gray-300 px-3 py-1.5 text-xs bg-white focus:border-gray-900 focus:outline-none"
            />
          </div>

          {/* Checklist subtopics mapping */}
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
              Completed Checklist Items
            </label>

            {tracksList.length === 0 ? (
              <p className="text-xs text-gray-400 italic">
                No tracks created. Go to Tracks to set up checklists.
              </p>
            ) : (
              <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1">
                {tracksList.map((track) => {
                  if (track.subtopics.length === 0) return null;
                  return (
                    <div key={track.id} className="space-y-1">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                        {track.name}
                      </span>
                      <div className="space-y-1 pl-1">
                        {track.subtopics.map((subtopic) => (
                          <label
                            key={subtopic.id}
                            className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer select-none py-0.5 hover:text-black"
                          >
                            <input
                              type="checkbox"
                              checked={selectedSubtopics.includes(subtopic.id)}
                              onChange={() => handleSubtopicToggle(subtopic.id)}
                              disabled={isPending}
                              className="rounded-sm border-gray-300 text-gray-900 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                            />
                            <span className={subtopic.status === SubtopicStatus.DONE ? "text-gray-400 line-through" : ""}>
                              {subtopic.name}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-sm border border-gray-900 bg-gray-900 py-2.5 text-sm text-white hover:bg-gray-800 disabled:opacity-50 transition-colors font-medium cursor-pointer"
          >
            {isPending ? "Saving..." : editingEntry ? "Save Changes" : "Publish Log"}
          </button>
        </div>
      </div>
    </form>
  );
}
