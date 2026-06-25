"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { createSeries, deleteSeries } from "../actions";

interface SeriesItem {
  id: string;
  name: string;
  description: string | null;
  _count: {
    entries: number;
  };
}

interface SeriesClientProps {
  initialSeries: SeriesItem[];
}

export default function SeriesClient({ initialSeries }: SeriesClientProps) {
  const [series, setSeries] = useState<SeriesItem[]>(initialSeries);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  React.useEffect(() => {
    setSeries(initialSeries);
  }, [initialSeries]);

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
    if (!confirm("Are you sure you want to delete this series? The logged entries will not be deleted, but they will no longer belong to this series.")) return;

    setError(null);
    startTransition(async () => {
      try {
        await deleteSeries(id);
      } catch (err: any) {
        setError(err.message || "Failed to delete series");
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-gray-200 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-gray-900 mb-1">
            Log Series
          </h1>
          <p className="text-gray-500 font-serif italic text-sm">
            Group your logs into themed, numbered daily series.
          </p>
        </div>
      </div>

      {/* Grid: Form and Series List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left: Create Series Form */}
        <div className="md:col-span-1 border border-gray-200 bg-white p-6 rounded-sm h-fit">
          <h2 className="font-serif text-lg font-bold text-gray-900 mb-4">
            Create New Series
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="border border-red-200 bg-red-50 text-red-800 p-2.5 rounded-sm text-xs">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
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
                className="w-full rounded-sm border border-gray-300 px-3 py-1.5 text-sm bg-white focus:border-gray-900 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                Description (Optional)
              </label>
              <textarea
                id="description"
                placeholder="e.g. 100 days of consistency in placement DSA..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isPending}
                rows={3}
                className="w-full rounded-sm border border-gray-300 px-3 py-1.5 text-sm bg-white focus:border-gray-900 focus:outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-sm border border-gray-900 bg-gray-900 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50 transition-colors font-medium cursor-pointer"
            >
              Create Series
            </button>
          </form>
        </div>

        {/* Right: Series List */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="font-serif text-lg font-bold text-gray-900">
            Active Collections
          </h2>

          {series.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-gray-200 rounded-sm text-gray-400">
              No series created yet. Start a themed collection using the form on the left.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {series.map((item) => (
                <div
                  key={item.id}
                  className="border border-gray-200 bg-white p-5 rounded-sm flex flex-col justify-between"
                >
                  <div>
                    <h3 className="font-serif text-base font-bold text-gray-900 hover:underline">
                      <Link href={`/series/${item.id}`}>{item.name}</Link>
                    </h3>
                    <p className="text-xs text-gray-400 mt-1 font-medium">
                      {item._count.entries} entry{item._count.entries !== 1 ? "ies" : ""} logged
                    </p>
                    {item.description && (
                      <p className="text-xs text-gray-600 mt-3 line-clamp-2 leading-relaxed italic">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-6 flex justify-between items-center border-t border-gray-100 pt-3">
                    <Link
                      href={`/series/${item.id}`}
                      className="text-xs font-semibold text-emerald-800 hover:underline"
                    >
                      View Entries &rarr;
                    </Link>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={isPending}
                      className="text-xs text-gray-400 hover:text-red-700 transition-colors cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
