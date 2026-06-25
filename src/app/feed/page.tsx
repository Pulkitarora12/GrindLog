import { getEntries, getTracks, getSeries } from "../actions";
import Link from "next/link";
import Markdown from "@/components/Markdown";
import FeedFilters from "./FeedFilters";

interface FeedPageProps {
  searchParams: Promise<{
    trackId?: string;
    seriesId?: string;
    tag?: string;
  }>;
}

export const revalidate = 0; // Disable static cache to reflect instant database updates

export default async function FeedPage({ searchParams }: FeedPageProps) {
  const params = await searchParams;
  const activeTrackId = params.trackId;
  const activeSeriesId = params.seriesId;
  const activeTag = params.tag;

  const [entries, tracks, series] = await Promise.all([
    getEntries({
      trackId: activeTrackId,
      seriesId: activeSeriesId,
      tag: activeTag,
    }),
    getTracks(),
    getSeries(),
  ]);

  const hasActiveFilters = activeTrackId || activeSeriesId || activeTag;

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="border-b border-gray-200 pb-6">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-gray-900 mb-1">
          Daily Log Feed
        </h1>
        <p className="text-gray-500 font-serif italic text-sm">
          A scrollable list of all daily entries, reflections, and completed checklists.
        </p>
      </div>

      {/* Filter Controls Bar */}
      <FeedFilters
        tracks={tracks.map((t) => ({ id: t.id, name: t.name }))}
        series={series.map((s) => ({ id: s.id, name: s.name }))}
        activeTrackId={activeTrackId}
        activeSeriesId={activeSeriesId}
        activeTag={activeTag}
      />

      {/* Feed List */}
      {entries.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-gray-200 rounded-sm text-gray-400">
          No log entries found.
          {hasActiveFilters ? " Try clearing some filters." : " Write your first entry to get started!"}
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {entries.map((entry) => {
            const entryDate = new Date(entry.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            });

            return (
              <article key={entry.id} className="py-10 first:pt-0">
                <div className="flex items-baseline gap-2 mb-2 text-xs text-gray-400">
                  <time dateTime={new Date(entry.date).toISOString()}>{entryDate}</time>
                  {entry.series && (
                    <>
                      <span>&middot;</span>
                      <Link
                        href={`/series/${entry.series.id}`}
                        className="font-serif italic text-emerald-800 hover:underline font-medium"
                      >
                        Series: {entry.series.name}
                        {entry.seriesDay !== null && ` (Day ${entry.seriesDay})`}
                      </Link>
                    </>
                  )}
                </div>

                <h2 className="font-serif text-2xl font-bold text-gray-900 mb-4 tracking-tight hover:underline">
                  <Link href={`/calendar?date=${new Date(entry.date).toISOString().split("T")[0]}`}>
                    {entry.title || `Log Entry — ${entryDate}`}
                  </Link>
                </h2>

                <div className="mb-6">
                  <Markdown content={entry.content} />
                </div>

                {/* Tags & completed subtopics */}
                <div className="flex flex-wrap gap-2 items-center border-t border-gray-100 pt-4">
                  {entry.subtopics.map((sub) => (
                    <Link
                      key={sub.id}
                      href={`/feed?trackId=${sub.trackId}`}
                      className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-sm border border-emerald-200 bg-emerald-50/50 text-emerald-800 hover:bg-emerald-100 transition-colors"
                    >
                      ✅ {sub.track.name}: {sub.name}
                    </Link>
                  ))}

                  {entry.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/feed?tag=${tag}`}
                      className="inline-flex text-[11px] text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
