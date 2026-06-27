import {
  getDashboardStats,
  getHeatmapData,
  getDaySummaryWithTargets,
  getSeries,
  getTracks,
} from "./actions";
import {
  isDateAllowedForLogging,
  getTodayDateString,
  getYesterdayDateString,
} from "@/lib/dateUtils";
import Heatmap from "@/components/Heatmap";
import Link from "next/link";
import { isAuthorized } from "@/lib/auth";
import DashboardTargetList from "./DashboardTargetList";

export const revalidate = 0; // Disable static caching so data updates instantly

interface DashboardPageProps {
  searchParams: Promise<{
    date?: string;
  }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const resolvedParams = await searchParams;
  const todayStr = getTodayDateString();
  const isAdmin = await isAuthorized();

  // Validate the requested date, default to today if not within allowed logging range
  let activeDateStr = todayStr;
  if (resolvedParams.date && isDateAllowedForLogging(resolvedParams.date)) {
    activeDateStr = resolvedParams.date;
  }

  const [stats, heatmapData, activeDayData] = await Promise.all([
    getDashboardStats(),
    getHeatmapData(),
    getDaySummaryWithTargets(activeDateStr),
  ]);

  const activeDaySummary = activeDayData?.summary || null;
  const activeDayTargets = activeDayData?.targets || [];
  const isActiveDayClosed = activeDaySummary?.isClosed || false;

  // Fetch options for the checklist form only if needed
  let seriesList: { id: string; name: string }[] = [];
  let subtopicsList: { id: string; name: string; trackName: string }[] = [];

  if (isAdmin && !isActiveDayClosed) {
    const [series, tracks] = await Promise.all([getSeries(), getTracks()]);
    seriesList = series.map((s) => ({ id: s.id, name: s.name }));
    subtopicsList = tracks.flatMap((t) =>
      t.subtopics
        .filter((s) => s.status !== "DONE")
        .map((s) => ({
          id: s.id,
          name: s.name,
          trackName: t.name,
        }))
    );
  }

  // Safe formatting to avoid Server Components RangeError: Invalid time value
  let formattedActiveDay = "";
  try {
    formattedActiveDay = new Date(activeDateStr).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch (err) {
    formattedActiveDay = activeDateStr;
  }

  return (
    <div className="space-y-12">
      {/* Editorial Header & Stats Grid */}
      <section className="border-b border-gray-200 pb-8">
        <h1 className="font-serif text-4xl font-bold tracking-tight text-gray-900 mb-2">
          Welcome to Pulkit's GrindLog
        </h1>
        <p className="text-gray-500 font-serif italic text-sm mb-8">
          Tracking the road to placement, one day at a time.
        </p>

        {/* Highlight cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border border-gray-200 bg-white p-6 rounded-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">
              Current Streak
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold tracking-tight font-serif text-emerald-800">
                {stats.streak}
              </span>
              <span className="text-sm text-gray-500 font-medium">days in a row</span>
            </div>
          </div>

          <div className="border border-gray-200 bg-white p-6 rounded-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">
              Total Closed Days
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold tracking-tight font-serif text-gray-900">
                {stats.totalClosedDays}
              </span>
              <span className="text-sm text-gray-500 font-medium">days tracked</span>
            </div>
          </div>

          <div className="border border-gray-200 bg-white p-6 rounded-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">
              Skill Completion
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold tracking-tight font-serif text-gray-900">
                {stats.overallProgress.percentage}%
              </span>
              <span className="text-sm text-gray-500 font-medium">
                ({stats.overallProgress.completed}/{stats.overallProgress.total} subtopics)
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Heatmap Section */}
      <section className="space-y-4">
        <h2 className="font-serif text-xl font-bold text-gray-900">
          Consistency Heatmap
        </h2>
        <Heatmap data={heatmapData} />
      </section>

      {/* Two column split */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* Tracks progress (Left column - width 1/3) */}
        <section className="md:col-span-1 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-200 pb-2">
            <h2 className="font-serif text-xl font-bold text-gray-900">
              Tracks Progress
            </h2>
            <Link href="/tracks" className="text-xs font-semibold text-emerald-800 hover:underline">
              Manage Tracks
            </Link>
          </div>

          {stats.trackSummaries.length === 0 ? (
            <div className="text-sm text-gray-500 py-6 border border-dashed border-gray-200 p-4 rounded-sm text-center">
              No tracks created yet.{" "}
              <Link href="/tracks" className="text-emerald-800 underline">
                Create one now
              </Link>
              .
            </div>
          ) : (
            <div className="space-y-4">
              {stats.trackSummaries.map((track) => (
                <div key={track.id} className="border border-gray-200 bg-white p-4 rounded-sm">
                  <div className="flex justify-between items-baseline mb-2">
                    <h3 className="font-semibold text-gray-900 text-sm">{track.name}</h3>
                    <span className="text-xs text-gray-500">
                      {track.completed}/{track.total}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 h-1 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-800 h-full transition-all duration-300"
                      style={{ width: `${track.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Right column: Target Management & Activity Feed */}
        <section className="md:col-span-2 space-y-8">
          {/* Target Panel */}
          <div className="space-y-4">
            <div className="border-b border-gray-200 pb-2">
              <h2 className="font-serif text-xl font-bold text-gray-900 flex justify-between items-center">
                <span>{activeDateStr === todayStr ? "Today's" : "Yesterday's"} Grind Targets</span>
                <div className="flex gap-2 text-xs font-sans">
                  {activeDateStr === todayStr ? (
                    <Link
                      href={`/?date=${getYesterdayDateString()}`}
                      className="text-emerald-800 hover:underline"
                    >
                      &larr; Switch to Yesterday
                    </Link>
                  ) : (
                    <Link
                      href="/"
                      className="text-emerald-800 hover:underline"
                    >
                      Switch to Today &rarr;
                    </Link>
                  )}
                </div>
              </h2>
            </div>

            {isActiveDayClosed ? (
              /* Active day is closed: Render summary view directly */
              <div className="border border-emerald-800/10 bg-emerald-50/20 p-6 rounded-sm space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-2xl font-bold text-emerald-950">
                      Summary for {formattedActiveDay}
                    </h3>
                    <span className="px-2 py-0.5 rounded-sm bg-emerald-800 text-white text-[10px] font-bold uppercase tracking-wider">
                      Day Completed
                    </span>
                  </div>
                  {activeDaySummary!.series && (
                    <p className="text-xs text-emerald-850 italic font-serif mt-1">
                      Series: {activeDaySummary!.series.name}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="border border-emerald-800/10 bg-white p-4 rounded-sm">
                    <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-wider">
                      Efficiency
                    </span>
                    <span className="text-3xl font-serif font-bold text-emerald-800 mt-1 block">
                      {Math.round(activeDaySummary!.efficiency)}%
                    </span>
                  </div>
                  <div className="border border-emerald-800/10 bg-white p-4 rounded-sm">
                    <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-wider">
                      Achieved
                    </span>
                    <span className="text-3xl font-serif font-bold text-emerald-800 mt-1 block">
                      {activeDaySummary!.targetsAchievedCount} / {activeDaySummary!.targetsSetCount}
                    </span>
                  </div>
                  <div className="border border-emerald-800/10 bg-white p-4 rounded-sm">
                    <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-wider">
                      Date Closed
                    </span>
                    <span className="text-sm font-semibold text-gray-800 mt-2 block">
                      {new Date(activeDaySummary!.createdAt).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block">
                    Target List (Locked)
                  </span>
                  <div className="bg-white border border-gray-200 rounded-sm divide-y divide-gray-100">
                    {activeDayTargets.map((t) => (
                      <div key={t.id} className="p-3 flex items-center gap-3">
                        <span className={t.done ? "text-emerald-700 font-bold" : "text-gray-300 font-bold"}>
                          {t.done ? "✓" : "✗"}
                        </span>
                        <span className={`text-sm ${t.done ? "line-through text-gray-400" : "text-gray-700 font-medium"}`}>
                          {t.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-center pt-2">
                  <Link
                    href={`/calendar?date=${activeDateStr}`}
                    className="text-xs font-semibold text-emerald-800 hover:underline inline-flex items-center gap-1.5"
                  >
                    View detailed calendar summary &rarr;
                  </Link>
                </div>
              </div>
            ) : (
              /* Active day is active: Render checklist control */
              <div className="space-y-4">
                <DashboardTargetList
                  initialTargets={activeDayTargets.map((t) => ({
                    id: t.id,
                    text: t.text,
                    done: t.done,
                    subtopic: t.subtopic,
                  }))}
                  subtopicsList={subtopicsList}
                  seriesList={seriesList}
                  isAdmin={isAdmin}
                  activeDateStr={activeDateStr}
                  todayStr={todayStr}
                  isClosed={isActiveDayClosed}
                />
              </div>
            )}
          </div>

          {/* Recent Summaries List */}
          <div className="space-y-4 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl font-bold text-gray-900">
                Recent Closed Days
              </h2>
              <Link href="/feed" className="text-xs font-semibold text-emerald-800 hover:underline">
                View All Summaries
              </Link>
            </div>

            {stats.recentSummaries.length === 0 ? (
              <div className="text-sm text-gray-500 py-12 border border-dashed border-gray-200 p-6 rounded-sm text-center">
                No closed day summaries yet. Set targets and end your first day to start tracking!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {stats.recentSummaries.map((summary) => {
                  const summaryDate = new Date(summary.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  });

                  return (
                    <div
                      key={summary.id}
                      className="border border-gray-200 bg-white p-5 rounded-sm flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-baseline gap-2 mb-1.5 text-[10px] text-gray-400">
                          <time dateTime={new Date(summary.date).toISOString()}>{summaryDate}</time>
                          {summary.series && (
                            <>
                              <span>&middot;</span>
                              <span className="font-serif italic text-emerald-850 font-medium">
                                {summary.series.name}
                              </span>
                            </>
                          )}
                        </div>

                        <h3 className="font-serif text-base font-bold text-gray-900 hover:underline">
                          <Link href={`/calendar?date=${new Date(summary.date).toISOString().split("T")[0]}`}>
                            Summary of {summaryDate}
                          </Link>
                        </h3>

                        <div className="grid grid-cols-2 gap-2 mt-4">
                          <div className="bg-gray-50 p-2 rounded-sm border border-gray-100">
                            <span className="text-[9px] uppercase tracking-wider text-gray-400 block font-semibold">
                              Efficiency
                            </span>
                            <span className="text-lg font-serif font-bold text-emerald-800">
                              {Math.round(summary.efficiency)}%
                            </span>
                          </div>

                          <div className="bg-gray-50 p-2 rounded-sm border border-gray-100">
                            <span className="text-[9px] uppercase tracking-wider text-gray-400 block font-semibold">
                              Targets Set
                            </span>
                            <span className="text-lg font-serif font-bold text-gray-800">
                              {summary.targetsAchievedCount} / {summary.targetsSetCount}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center text-xs">
                        <Link
                          href={`/calendar?date=${new Date(summary.date).toISOString().split("T")[0]}`}
                          className="font-semibold text-emerald-800 hover:underline"
                        >
                          View Details &rarr;
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
