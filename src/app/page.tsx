import { getDashboardStats, getHeatmapData } from "./actions";
import Heatmap from "@/components/Heatmap";
import Link from "next/link";

export const revalidate = 0; // Disable static caching so data updates instantly

export default async function DashboardPage() {
  const [stats, heatmapData] = await Promise.all([
    getDashboardStats(),
    getHeatmapData(),
  ]);

  return (
    <div className="space-y-12">
      {/* Editorial Header & Stats Grid */}
      <section className="border-b border-gray-200 pb-8">
        <h1 className="font-serif text-4xl font-bold tracking-tight text-gray-900 mb-2">
          DevLog Dashboard
        </h1>
        <p className="text-gray-500 font-serif italic text-sm mb-8">
          A written record of progress, habits, and skill building.
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
              Total Entries
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold tracking-tight font-serif text-gray-900">
                {stats.totalEntries}
              </span>
              <span className="text-sm text-gray-500 font-medium">logs written</span>
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

        {/* Recent entries (Right column - width 2/3) */}
        <section className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-200 pb-2">
            <h2 className="font-serif text-xl font-bold text-gray-900">
              Recent Log Entries
            </h2>
            <Link href="/feed" className="text-xs font-semibold text-emerald-800 hover:underline">
              View Feed
            </Link>
          </div>

          {stats.recentEntries.length === 0 ? (
            <div className="text-sm text-gray-500 py-12 border border-dashed border-gray-200 p-6 rounded-sm text-center">
              Your log is empty. Write your first entry to kick off your streak!{" "}
              <Link href="/new" className="text-emerald-800 underline font-semibold">
                Create Entry
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {stats.recentEntries.map((entry) => {
                const entryDate = new Date(entry.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                });

                return (
                  <article key={entry.id} className="py-6 first:pt-0">
                    <div className="flex items-baseline gap-2 mb-1.5 text-xs text-gray-400">
                      <time dateTime={new Date(entry.date).toISOString()}>{entryDate}</time>
                      {entry.series && (
                        <>
                          <span>&middot;</span>
                          <span className="font-serif italic text-emerald-800 font-medium">
                            Series: {entry.series.name}
                            {entry.seriesDay !== null && ` (Day ${entry.seriesDay})`}
                          </span>
                        </>
                      )}
                    </div>

                    <h3 className="font-serif text-lg font-bold text-gray-900 mb-2 hover:underline">
                      <Link href={`/calendar?date=${new Date(entry.date).toISOString().split("T")[0]}`}>
                        {entry.title || `Daily Entry — ${entryDate}`}
                      </Link>
                    </h3>

                    <p className="text-sm text-gray-600 line-clamp-3 mb-3 leading-relaxed">
                      {entry.content.replace(/[#*`_]/g, "")}
                    </p>

                    {/* Tags & completed subtopics */}
                    <div className="flex flex-wrap gap-2 items-center">
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
        </section>
      </div>
    </div>
  );
}
