"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { createDayEntries, getUploadSignature } from "@/app/actions";
import { compressImage } from "@/lib/images";

interface SeriesOption {
  id: string;
  name: string;
}

interface LogDayModalProps {
  seriesList: SeriesOption[];
  todayStr: string;
  yesterdayStr: string;
}

interface PhotoDraft {
  id: string;
  file: File;
  preview: string;
}

interface EntryDraft {
  key: string;
  text: string;
  seriesId: string;
  photos: PhotoDraft[];
}

let draftCounter = 0;
const nextKey = () => `draft-${++draftCounter}`;
const newEntry = (seriesId = ""): EntryDraft => ({
  key: nextKey(),
  text: "",
  seriesId,
  photos: [],
});

const labelClass =
  "block text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1";
const fieldClass =
  "w-full rounded-sm border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 focus:border-gray-900 dark:focus:border-gray-100 focus:outline-none";

function describeDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return {
    weekday: date.toLocaleDateString("en-US", { weekday: "long" }),
    full: date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
  };
}

export default function LogDayModal({ seriesList, todayStr, yesterdayStr }: LogDayModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [dateStr, setDateStr] = useState(todayStr);
  const [entries, setEntries] = useState<EntryDraft[]>([newEntry()]);
  const [bulkSeriesId, setBulkSeriesId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const entriesRef = useRef(entries);
  useEffect(() => {
    entriesRef.current = entries;
  }, [entries]);

  const revokePreviews = (list: EntryDraft[]) =>
    list.forEach((e) => e.photos.forEach((p) => URL.revokeObjectURL(p.preview)));

  const reset = () => {
    revokePreviews(entriesRef.current);
    setEntries([newEntry()]);
    setBulkSeriesId("");
    setDateStr(todayStr);
    setError(null);
    setStatus(null);
  };

  const close = () => {
    if (isSaving) return;
    setOpen(false);
  };

  // Lock page scroll and allow Escape while the popup is open
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSaving) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, isSaving]);

  useEffect(() => () => revokePreviews(entriesRef.current), []);

  const updateEntry = (key: string, patch: Partial<EntryDraft>) =>
    setEntries((prev) => prev.map((e) => (e.key === key ? { ...e, ...patch } : e)));

  const applySeriesToAll = (seriesId: string) => {
    setBulkSeriesId(seriesId);
    setEntries((prev) => prev.map((e) => ({ ...e, seriesId })));
  };

  const addEntry = () => setEntries((prev) => [...prev, newEntry(bulkSeriesId)]);

  const removeEntry = (key: string) =>
    setEntries((prev) => {
      const target = prev.find((e) => e.key === key);
      if (target) revokePreviews([target]);
      const rest = prev.filter((e) => e.key !== key);
      return rest.length > 0 ? rest : [newEntry(bulkSeriesId)];
    });

  const addPhotos = (key: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    const drafts: PhotoDraft[] = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .map((file) => ({ id: nextKey(), file, preview: URL.createObjectURL(file) }));
    setEntries((prev) =>
      prev.map((e) => (e.key === key ? { ...e, photos: [...e.photos, ...drafts] } : e))
    );
  };

  const removePhoto = (entryKey: string, photoId: string) =>
    setEntries((prev) =>
      prev.map((e) => {
        if (e.key !== entryKey) return e;
        const gone = e.photos.find((p) => p.id === photoId);
        if (gone) URL.revokeObjectURL(gone.preview);
        return { ...e, photos: e.photos.filter((p) => p.id !== photoId) };
      })
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const filled = entries.filter((en) => en.text.trim());
    if (filled.length === 0) {
      setError("Describe what you did in at least one entry.");
      return;
    }
    if (entries.some((en) => !en.text.trim() && en.photos.length > 0)) {
      setError("An entry with photos needs a description too.");
      return;
    }

    setError(null);
    setIsSaving(true);
    try {
      const totalPhotos = filled.reduce((n, en) => n + en.photos.length, 0);
      const signature = totalPhotos > 0 ? await getUploadSignature() : null;

      let uploaded = 0;
      const payload = [];
      for (const en of filled) {
        const images: { url: string; publicId: string }[] = [];
        for (const photo of en.photos) {
          setStatus(`Uploading photo ${++uploaded} of ${totalPhotos}…`);
          const blob = await compressImage(photo.file);
          const form = new FormData();
          form.append("file", blob);
          form.append("api_key", signature!.apiKey);
          form.append("timestamp", String(signature!.timestamp));
          form.append("signature", signature!.signature);
          form.append("folder", signature!.folder);

          const res = await fetch(
            `https://api.cloudinary.com/v1_1/${signature!.cloudName}/image/upload`,
            { method: "POST", body: form }
          );
          if (!res.ok) {
            throw new Error("A photo failed to upload. Please try again.");
          }
          const json = await res.json();
          images.push({ url: json.secure_url, publicId: json.public_id });
        }
        payload.push({ text: en.text, seriesId: en.seriesId || null, images });
      }

      setStatus("Saving…");
      await createDayEntries(dateStr, payload);
      reset();
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to save your entries");
    } finally {
      setIsSaving(false);
      setStatus(null);
    }
  };

  const { weekday, full } = describeDate(dateStr);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-sm border border-emerald-900 dark:border-emerald-700 bg-emerald-800 dark:bg-emerald-700 px-5 py-2.5 text-sm text-white hover:bg-emerald-900 dark:hover:bg-emerald-800 transition-colors font-semibold tracking-wide cursor-pointer"
      >
        <span className="text-base leading-none">+</span> Log your day
      </button>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) close();
            }}
          >
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-sm shadow-xl w-full max-w-2xl max-h-[92vh] flex flex-col">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-gray-100 dark:border-gray-800 p-5 pb-4">
                <div>
                  <h3 className="font-serif text-lg font-bold text-gray-900 dark:text-gray-100">
                    Log your day
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-serif italic">
                    {weekday}, {full}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={close}
                  disabled={isSaving}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl leading-none cursor-pointer"
                  aria-label="Close"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col min-h-0">
                <div className="overflow-y-auto p-5 space-y-5 custom-scrollbar">
                  {error && (
                    <div className="border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-400 px-3 py-2.5 rounded-sm text-xs">
                      {error}
                    </div>
                  )}

                  {/* Date + series for all */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className={labelClass}>Date</span>
                      <div className="flex rounded-sm border border-gray-300 dark:border-gray-700 overflow-hidden text-sm">
                        {[
                          { value: todayStr, label: "Today" },
                          { value: yesterdayStr, label: "Yesterday" },
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setDateStr(opt.value)}
                            disabled={isSaving}
                            className={`flex-1 px-3 py-2 font-medium transition-colors cursor-pointer ${
                              dateStr === opt.value
                                ? "bg-gray-900 dark:bg-slate-700 text-white"
                                : "bg-white dark:bg-slate-900 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="bulk-series" className={labelClass}>
                        Select series for all entries
                      </label>
                      <select
                        id="bulk-series"
                        value={bulkSeriesId}
                        onChange={(e) => applySeriesToAll(e.target.value)}
                        disabled={isSaving}
                        className={`${fieldClass} cursor-pointer`}
                      >
                        <option value="">No series</option>
                        {seriesList.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Entries */}
                  <div className="space-y-4">
                    {entries.map((entry, index) => (
                      <div
                        key={entry.key}
                        className="border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-slate-800/30 rounded-sm p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-serif italic font-bold text-emerald-800 dark:text-emerald-450 text-sm">
                            Entry {index + 1}
                          </span>
                          {entries.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeEntry(entry.key)}
                              disabled={isSaving}
                              className="text-xs text-gray-400 dark:text-gray-500 hover:text-red-700 dark:hover:text-red-400 transition-colors cursor-pointer"
                            >
                              Remove
                            </button>
                          )}
                        </div>

                        <div>
                          <label htmlFor={`text-${entry.key}`} className={labelClass}>
                            What did you do?
                          </label>
                          <textarea
                            id={`text-${entry.key}`}
                            rows={3}
                            placeholder="e.g. Solved 3 tree problems and revised BFS vs DFS"
                            value={entry.text}
                            onChange={(e) => updateEntry(entry.key, { text: e.target.value })}
                            disabled={isSaving}
                            className={`${fieldClass} resize-y`}
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                          <div>
                            <label htmlFor={`series-${entry.key}`} className={labelClass}>
                              Series (optional)
                            </label>
                            <select
                              id={`series-${entry.key}`}
                              value={entry.seriesId}
                              onChange={(e) => updateEntry(entry.key, { seriesId: e.target.value })}
                              disabled={isSaving}
                              className={`${fieldClass} cursor-pointer`}
                            >
                              <option value="">No series</option>
                              {seriesList.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <span className={labelClass}>Proof of work (optional)</span>
                            <label
                              className={`flex items-center justify-center gap-2 rounded-sm border border-dashed border-gray-300 dark:border-gray-700 px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 hover:border-emerald-700 dark:hover:border-emerald-500 transition-colors ${
                                isSaving ? "opacity-50" : "cursor-pointer"
                              }`}
                            >
                              📷 Add photos
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                disabled={isSaving}
                                className="sr-only"
                                onChange={(e) => {
                                  addPhotos(entry.key, e.target.files);
                                  e.target.value = "";
                                }}
                              />
                            </label>
                          </div>
                        </div>

                        {entry.photos.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {entry.photos.map((photo) => (
                              <div
                                key={photo.id}
                                className="relative rounded-sm overflow-hidden border border-gray-200 dark:border-gray-800"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={photo.preview} alt="Selected photo" className="w-20 h-16 object-cover" />
                                {!isSaving && (
                                  <button
                                    type="button"
                                    onClick={() => removePhoto(entry.key, photo.id)}
                                    className="absolute top-0.5 right-0.5 w-5 h-5 flex items-center justify-center rounded-full bg-black/70 text-white text-xs leading-none cursor-pointer"
                                    aria-label="Remove photo"
                                  >
                                    &times;
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={addEntry}
                      disabled={isSaving}
                      className="w-full rounded-sm border border-dashed border-gray-300 dark:border-gray-700 py-2.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:border-emerald-700 dark:hover:border-emerald-500 hover:text-emerald-800 dark:hover:text-emerald-450 transition-colors cursor-pointer"
                    >
                      + Add another entry
                    </button>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between gap-3 border-t border-gray-100 dark:border-gray-800 p-4">
                  <span className="text-xs text-gray-500 dark:text-gray-400 italic font-serif">
                    {status}
                  </span>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={close}
                      disabled={isSaving}
                      className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-5 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-700 dark:hover:bg-emerald-800 rounded-sm disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      {isSaving ? "Saving…" : "Save entries"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
