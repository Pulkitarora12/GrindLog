import { getDashboardStats, getHeatmapData, getSeries } from "./actions";
import { getTodayDateString, getYesterdayDateString } from "@/lib/dateUtils";
import Heatmap from "@/components/Heatmap";
import LogDayModal from "@/components/LogDayModal";
import { isAuthorized } from "@/lib/auth";

export const revalidate = 0; // Disable static caching so data updates instantly

export default async function DashboardPage() {
  const isAdmin = await isAuthorized();

  const [stats, heatmapData, series] = await Promise.all([
    getDashboardStats(),
    getHeatmapData(),
    isAdmin ? getSeries() : Promise.resolve([]),
  ]);

  const seriesList = series
    .filter((s) => !s.isEnded)
    .map((s) => ({ id: s.id, name: s.name }));

  return (
    <div className="space-y-6">
      {/* Editorial Header & Stats Grid */}
      <section className="border-b border-gray-200 dark:border-gray-800 pb-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
          <div>
            <h1 className="font-serif text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mb-2">
              Welcome to Pulkit's GrindLog
            </h1>
            <p className="text-gray-500 dark:text-gray-400 font-serif italic text-sm">
              Documenting my growth journey, one day at a time.
            </p>
          </div>

          {isAdmin && (
            <LogDayModal
              seriesList={seriesList}
              todayStr={getTodayDateString()}
              yesterdayStr={getYesterdayDateString()}
            />
          )}
        </div>

        {/* Highlight cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border border-gray-200 dark:border-gray-800 border-t-2 border-t-emerald-700 dark:border-t-emerald-500 bg-white dark:bg-slate-900 p-5 rounded-sm shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 block mb-1">
              Current Streak
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold tracking-tight font-serif text-emerald-800 dark:text-emerald-450">
                {stats.streak}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">days in a row</span>
            </div>
          </div>

          <div className="border border-gray-200 dark:border-gray-800 border-t-2 border-t-emerald-700 dark:border-t-emerald-500 bg-white dark:bg-slate-900 p-5 rounded-sm shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 block mb-1">
              Total Days Logged
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold tracking-tight font-serif text-gray-900 dark:text-gray-100">
                {stats.totalDays}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">days tracked</span>
            </div>
          </div>

          <div className="border border-gray-200 dark:border-gray-800 border-t-2 border-t-emerald-700 dark:border-t-emerald-500 bg-white dark:bg-slate-900 p-5 rounded-sm shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 block mb-1">
              Total Entries
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold tracking-tight font-serif text-gray-900 dark:text-gray-100">
                {stats.totalEntries}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">things done</span>
            </div>
          </div>
        </div>
      </section>

      {/* Heatmap Section */}
      <section className="space-y-3">
        <h2 className="font-serif text-xl font-bold text-gray-900 dark:text-gray-100">
          Consistency Heatmap
        </h2>
        <Heatmap data={heatmapData} isAdmin={isAdmin} />
      </section>
    </div>
  );
}
