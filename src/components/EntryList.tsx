"use client";

import React, { useEffect, useState } from "react";
import type { DayEntryView } from "@/lib/types";
import { fullUrl, thumbUrl } from "@/lib/images";

interface EntryListProps {
  entries: DayEntryView[];
  onDelete?: (id: string) => void;
  deletingId?: string | null;
}

export default function EntryList({ entries, onDelete, deletingId }: EntryListProps) {
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setLightbox(null);
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [lightbox]);

  return (
    <>
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {entries.map((entry) => (
          <div key={entry.id} className="py-3 first:pt-0 last:pb-0 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-1.5">
                {entry.seriesName && (
                  <span className="inline-block text-[9px] font-semibold px-1.5 py-0.5 rounded-sm border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-850 dark:text-emerald-400">
                    {entry.seriesName}
                  </span>
                )}
                <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
                  {entry.text}
                </p>
              </div>
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(entry.id)}
                  disabled={deletingId === entry.id}
                  className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 hover:text-red-700 dark:hover:text-red-400 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                >
                  {deletingId === entry.id ? "Deleting…" : "Delete"}
                </button>
              )}
            </div>

            {entry.images.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {entry.images.map((img) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setLightbox(img.url)}
                    className="block rounded-sm overflow-hidden border border-gray-200 dark:border-gray-800 hover:border-emerald-700 dark:hover:border-emerald-500 transition-colors cursor-zoom-in"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={thumbUrl(img.url)}
                      alt="Proof of work"
                      loading="lazy"
                      className="w-20 h-16 object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs cursor-zoom-out"
          onClick={() => setLightbox(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fullUrl(lightbox)}
            alt="Proof of work"
            className="max-w-full max-h-full rounded-sm shadow-xl"
          />
        </div>
      )}
    </>
  );
}
