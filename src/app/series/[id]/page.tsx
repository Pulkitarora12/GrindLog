import { getSeriesWithEntries } from "../../actions";
import { notFound } from "next/navigation";
import Link from "next/link";
import Markdown from "@/components/Markdown";

interface SeriesDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const revalidate = 0; // Disable static cache to reflect instant database updates

export default async function SeriesDetailPage({ params }: SeriesDetailPageProps) {
  const { id } = await params;
  const series = await getSeriesWithEntries(id);

  if (!series) {
    notFound();
  }

  return (
    <div className="space-y-10 max-w-3xl mx-auto">
      {/* Series Metadata Header */}
      <div className="border-b border-gray-200 pb-6">
        <Link
          href="/series"
          className="text-xs font-semibold text-emerald-800 hover:underline inline-flex items-center gap-1.5 mb-4"
        >
          &larr; All Collections
        </Link>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-gray-900 mb-2">
          {series.name}
        </h1>
        {series.description ? (
          <p className="text-gray-600 font-serif italic text-sm leading-relaxed">
            {series.description}
          </p>
        ) : (
          <p className="text-gray-400 font-serif italic text-sm">
            No description provided.
          </p>
        )}
      </div>

      {/* Sequential Entries Timeline */}
      {series.entries.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-200 rounded-sm text-gray-400">
          No entries have been logged in this series yet.{" "}
          <Link href={`/new?seriesId=${series.id}`} className="text-emerald-800 underline font-semibold">
            Log the first entry
          </Link>
          .
        </div>
      ) : (
        <div className="space-y-16">
          {series.entries.map((entry, index) => {
            const entryDate = new Date(entry.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            });

            return (
              <article key={entry.id} className="group relative">
                {/* Timeline Marker */}
                <div className="flex items-baseline gap-3 mb-2 text-xs text-gray-400">
                  <span className="font-serif italic font-semibold text-emerald-800 text-sm">
                    {entry.seriesDay !== null ? `Day ${entry.seriesDay}` : `Step ${index + 1}`}
                  </span>
                  <span>&middot;</span>
                  <time dateTime={new Date(entry.date).toISOString()}>{entryDate}</time>
                </div>

                {/* Entry Title */}
                <h2 className="font-serif text-2xl font-bold text-gray-900 mb-4 tracking-tight hover:text-emerald-800 transition-colors">
                  <Link href={`/calendar?date=${new Date(entry.date).toISOString().split("T")[0]}`}>
                    {entry.title || `Entry for ${entryDate}`}
                  </Link>
                </h2>

                {/* Entry Markdown Content */}
                <div className="mb-6">
                  <Markdown content={entry.content} />
                </div>

                {/* Tags & Subtopics */}
                <div className="flex flex-wrap gap-2 items-center border-t border-gray-100 pt-4">
                  {entry.subtopics.map((sub) => (
                    <span
                      key={sub.id}
                      className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-sm border border-emerald-200 bg-emerald-50/50 text-emerald-800"
                    >
                      ✅ {sub.track.name}: {sub.name}
                    </span>
                  ))}

                  {entry.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex text-[11px] text-gray-400"
                    >
                      #{tag}
                    </span>
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
