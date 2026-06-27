import { getClosedDaySummaries, getTracks, getSeries } from "../actions";
import Link from "next/link";
import FeedFilters from "./FeedFilters";
import prisma from "@/lib/prisma";
import { isAuthorized } from "@/lib/auth";
import DeleteSummaryButton from "./DeleteSummaryButton";

interface FeedPageProps {
  searchParams: Promise<{
    trackId?: string;
    seriesId?: string;
  }>;
}

export const revalidate = 0; // Disable static cache to reflect instant database updates

export default async function FeedPage({ searchParams }: FeedPageProps) {
  const params = await searchParams;
  const activeTrackId = params.trackId;
  const activeSeriesId = params.seriesId;
  const isAdmin = await isAuthorized();

  const [summaries, tracks, series] = await Promise.all([
    getClosedDaySummaries({
      seriesId: activeSeriesId,
      trackId: activeTrackId,
    }),
    getTracks(),
    getSeries(),
  ]);

  // Fetch all targets for these summaries to group them efficiently in-memory
  const targets = summaries.length > 0
    ? await prisma.dailyTarget.findMany({
        where: {
          date: { in: summaries.map((s) => s.date) },
        },
        include: {
          subtopic: {
            include: { track: true },
          },
        },
        orderBy: { createdAt: "asc" },
      })
    : [];

  const hasActiveFilters = activeTrackId || activeSeriesId;

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="border-b border-gray-200 pb-6">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-gray-900 mb-1">
          Daily Log Feed
        </h1>
        <p className="text-gray-500 font-serif italic text-sm">
          A scrollable list of completed daily summaries, consistency stats, and achievements.
        </p>
      </div>

      {/* Filter Controls Bar */}
      <FeedFilters
        tracks={tracks.map((t) => ({ id: t.id, name: t.name }))}
        series={series.map((s) => ({ id: s.id, name: s.name }))}
        activeTrackId={activeTrackId}
        activeSeriesId={activeSeriesId}
      />

      {/* Feed List */}
      {summaries.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-gray-200 rounded-sm text-gray-400">
          No daily summaries found.
          {hasActiveFilters ? " Try clearing some filters." : " Close your first day from the dashboard to get started!"}
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {summaries.map((summary) => {
            const summaryDateStr = new Date(summary.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            });
            const dateQueryStr = new Date(summary.date).toISOString().split("T")[0];

            // Get targets for this specific day
            const dayTargets = targets.filter(
              (t) => new Date(t.date).getTime() === new Date(summary.date).getTime()
            );
            const achievedTargets = dayTargets.filter((t) => t.done);
            const missedTargets = dayTargets.filter((t) => !t.done);

            return (
              <article key={summary.id} className="py-10 first:pt-0">
                <div className="flex items-baseline gap-2 mb-2 text-xs text-gray-400">
                  <time dateTime={new Date(summary.date).toISOString()}>{summaryDateStr}</time>
                  {summary.series && (
                    <>
                      <span>&middot;</span>
                      <Link
                        href={`/series/${summary.series.id}`}
                        className="font-serif italic text-emerald-800 hover:underline font-medium"
                      >
                        Series: {summary.series.name}
                      </Link>
                    </>
                  )}
                </div>

                <h2 className="font-serif text-2xl font-bold text-gray-900 mb-4 tracking-tight hover:underline">
                  <Link href={`/calendar?date=${dateQueryStr}`}>
                    Summary for {summaryDateStr}
                  </Link>
                </h2>

                {/* Stat Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gray-50 border border-gray-100 p-3 rounded-sm">
                    <span className="text-[9px] uppercase tracking-wider text-gray-400 block font-semibold">
                      Efficiency
                    </span>
                    <span className="text-xl font-serif font-bold text-emerald-800 mt-0.5 block">
                      {Math.round(summary.efficiency)}%
                    </span>
                  </div>

                  <div className="bg-gray-50 border border-gray-100 p-3 rounded-sm">
                    <span className="text-[9px] uppercase tracking-wider text-gray-400 block font-semibold">
                      Targets Completed
                    </span>
                    <span className="text-xl font-serif font-bold text-gray-800 mt-0.5 block">
                      {summary.targetsAchievedCount} / {summary.targetsSetCount}
                    </span>
                  </div>

                  <div className="bg-gray-50 border border-gray-100 p-3 rounded-sm col-span-2">
                    <span className="text-[9px] uppercase tracking-wider text-gray-400 block font-semibold">
                      Mapped Tracks
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Array.from(
                        new Set(
                          dayTargets
                            .map((t) => t.subtopic?.track.name)
                            .filter(Boolean)
                        )
                      ).map((trackName) => (
                        <span
                          key={trackName}
                          className="text-[9px] bg-emerald-50 text-emerald-800 px-1.5 py-0.2 rounded-sm font-semibold border border-emerald-100"
                        >
                          {trackName}
                        </span>
                      ))}
                      {dayTargets.filter((t) => t.subtopic).length === 0 && (
                        <span className="text-[10px] text-gray-400 italic font-medium">None</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Achieved vs Missed List */}
                <div className="space-y-4">
                  {achievedTargets.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                        Achieved
                      </span>
                      <ul className="space-y-1 pl-1">
                        {achievedTargets.map((t) => (
                          <li key={t.id} className="text-xs text-gray-700 flex items-start gap-2">
                            <span className="text-emerald-700 font-bold">✓</span>
                            <span>{t.text}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {missedTargets.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider block mb-1">
                        Missed / Left
                      </span>
                      <ul className="space-y-1 pl-1">
                        {missedTargets.map((t) => (
                          <li key={t.id} className="text-xs text-gray-400 flex items-start gap-2">
                            <span className="text-red-400 font-bold">✗</span>
                            <span className="line-through">{t.text}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-3 border-t border-gray-100 flex justify-between items-center text-xs">
                  <Link
                    href={`/calendar?date=${dateQueryStr}`}
                    className="font-semibold text-emerald-805 hover:underline"
                  >
                    View detailed summary in calendar &rarr;
                  </Link>
                  {isAdmin && (
                    <DeleteSummaryButton dateString={dateQueryStr} />
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
