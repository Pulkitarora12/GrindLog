import { getSeriesWithSummaries } from "../../actions";
import { notFound } from "next/navigation";
import Link from "next/link";

interface SeriesDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const revalidate = 0; // Disable static cache to reflect instant database updates

export default async function SeriesDetailPage({ params }: SeriesDetailPageProps) {
  const { id } = await params;
  const series = await getSeriesWithSummaries(id);

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

      {/* Sequential Day Summaries Timeline */}
      {series.daySummaries.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-200 rounded-sm text-gray-400">
          No days have been logged in this series yet. Close your first day from the dashboard to add to this series!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {series.daySummaries.map((summary, index) => {
            const summaryDateStr = new Date(summary.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            });
            const dateQueryStr = new Date(summary.date).toISOString().split("T")[0];

            return (
              <div
                key={summary.id}
                className="border border-gray-200 bg-white p-5 rounded-sm flex flex-col justify-between hover:border-emerald-700 transition-colors"
              >
                <div>
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="font-serif italic font-bold text-emerald-800 text-sm">
                      Day {index + 1}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {summaryDateStr}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="bg-gray-50 p-2.5 rounded-sm border border-gray-100">
                      <span className="text-[9px] uppercase tracking-wider text-gray-400 block font-semibold">
                        Efficiency
                      </span>
                      <span className="text-xl font-serif font-bold text-emerald-800 block mt-0.5">
                        {Math.round(summary.efficiency)}%
                      </span>
                    </div>

                    <div className="bg-gray-50 p-2.5 rounded-sm border border-gray-100">
                      <span className="text-[9px] uppercase tracking-wider text-gray-400 block font-semibold">
                        Targets Set
                      </span>
                      <span className="text-xl font-serif font-bold text-gray-800 block mt-0.5">
                        {summary.targetsAchievedCount} / {summary.targetsSetCount}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-gray-100 flex justify-between items-center text-xs">
                  <Link
                    href={`/calendar?date=${dateQueryStr}`}
                    className="font-semibold text-emerald-855 hover:underline flex items-center gap-1"
                  >
                    View Targets Details &rarr;
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
