import { getDaySummaryWithTargets } from "../actions";
import prisma from "@/lib/prisma";
import MonthlyCalendar from "@/components/MonthlyCalendar";
import CalendarDayActions from "@/components/CalendarDayActions";
import Link from "next/link";
import { isAuthorized } from "@/lib/auth";

interface CalendarPageProps {
  searchParams: Promise<{
    date?: string;
  }>;
}

export const revalidate = 0; // Disable static cache to reflect instant database updates

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const [params, isAdmin] = await Promise.all([
    searchParams,
    isAuthorized(),
  ]);

  // Default to today's local date YYYY-MM-DD (Asia/Kolkata timezone context)
  const today = new Date();
  const options = { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" } as const;
  const formatter = new Intl.DateTimeFormat("en-CA", options);
  const todayStr = formatter.format(today);

  const selectedDateStr = params.date || todayStr;

  // Fetch the summary and targets for the selected date
  const data = await getDaySummaryWithTargets(selectedDateStr);
  const summary = data?.summary || null;
  const targets = data?.targets || [];

  // Fetch all unique closed summary dates in YYYY-MM-DD format for highlighting on the calendar
  const allSummaries = await prisma.daySummary.findMany({
    where: { isClosed: true },
    select: { date: true },
  });

  const summaryDates = Array.from(
    new Set(
      allSummaries.map((s) => {
        const d = new Date(s.date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
          2,
          "0"
        )}-${String(d.getDate()).padStart(2, "0")}`;
      })
    )
  );

  const formattedSelectedDate = new Date(selectedDateStr).toLocaleDateString(
    "en-US",
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  // Chronological day index in Series if associated
  let seriesDayNum: number | null = null;
  if (summary && summary.seriesId) {
    const priorDaysCount = await prisma.daySummary.count({
      where: {
        seriesId: summary.seriesId,
        isClosed: true,
        date: {
          lte: summary.date,
        },
      },
    });
    seriesDayNum = priorDaysCount;
  }

  // Filter achieved and missed targets
  const achievedTargets = targets.filter((t) => t.done);
  const missedTargets = targets.filter((t) => !t.done);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 pb-6">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mb-1">
          Calendar Log
        </h1>
        <p className="text-gray-500 dark:text-gray-400 font-serif italic text-sm">
          Browse daily efficiency, targets achieved, and track your consistency.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Left Column: Monthly Calendar Navigator */}
        <div className="w-full md:w-auto shrink-0">
          <MonthlyCalendar
            selectedDateStr={selectedDateStr}
            summaryDates={summaryDates}
          />
        </div>

        {/* Right Column: Day Summary Details */}
        <div className="flex-1 border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 p-6 rounded-sm w-full min-h-[300px] transition-colors duration-300">
          <div className="border-b border-gray-100 dark:border-gray-800 pb-4 mb-6 flex justify-between items-start gap-4">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 block mb-1">
                Log Date
              </span>
              <h2 className="font-serif text-xl font-bold text-gray-900 dark:text-gray-100">
                {formattedSelectedDate}
              </h2>
            </div>
            <div className="flex flex-col items-end gap-2">
              {summary && (
                <span className="px-2.5 py-0.5 rounded-sm bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-450 text-[10px] font-bold uppercase tracking-wider border border-emerald-200 dark:border-emerald-900/40">
                  ✓ Day Closed
                </span>
              )}
              {/* Admin controls — shown when there is a summary or any targets */}
              {isAdmin && (summary || targets.length > 0) && (
                <CalendarDayActions
                  dateString={selectedDateStr}
                  hasSummary={!!summary}
                />
              )}
            </div>
          </div>

          {summary ? (
            <div className="space-y-6">
              {/* Optional Series Info */}
              {summary.series && (
                <div className="space-y-1">
                  <p className="text-sm font-serif italic text-emerald-850 dark:text-emerald-350">
                    Series: {summary.series.name}
                    {seriesDayNum !== null && ` (Day ${seriesDayNum})`}
                  </p>
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-slate-800/40 p-4 rounded-sm">
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 block uppercase tracking-wider">
                    Efficiency
                  </span>
                  <span className="text-3xl font-serif font-bold text-emerald-800 dark:text-emerald-450 mt-1 block">
                    {Math.round(summary.efficiency)}%
                  </span>
                </div>
                <div className="border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-slate-800/40 p-4 rounded-sm">
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 block uppercase tracking-wider">
                    Targets Achieved
                  </span>
                  <span className="text-3xl font-serif font-bold text-emerald-800 dark:text-emerald-450 mt-1 block">
                    {summary.targetsAchievedCount} / {summary.targetsSetCount}
                  </span>
                </div>
                <div className="border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-slate-800/40 p-4 rounded-sm">
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 block uppercase tracking-wider">
                    Closed At
                  </span>
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-3.5 block">
                    {new Date(summary.createdAt).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>

              {/* Targets Breakdown */}
              <div className="space-y-6 border-t border-gray-100 dark:border-gray-800 pt-6">
                {achievedTargets.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-450">
                      Achieved ({achievedTargets.length})
                    </h4>
                    <div className="space-y-2">
                      {achievedTargets.map((t) => (
                        <div key={t.id} className="text-sm flex items-start gap-2.5 text-gray-800 dark:text-gray-200">
                          <span className="text-emerald-700 dark:text-emerald-450 font-bold mt-0.5">✓</span>
                          <div>
                            <span>{t.text}</span>
                            {t.subtopic && (
                              <span className="inline-block ml-2 text-[9px] font-semibold px-1.5 py-0.2 rounded-sm border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-850 dark:text-emerald-400">
                                {t.subtopic.track.name}: {t.subtopic.name}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {missedTargets.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-red-700 dark:text-red-400">
                      Missed / Left ({missedTargets.length})
                    </h4>
                    <div className="space-y-2">
                      {missedTargets.map((t) => (
                        <div key={t.id} className="text-sm flex items-start gap-2.5 text-gray-500 dark:text-gray-400">
                          <span className="text-red-400 dark:text-red-500 font-bold mt-0.5">✗</span>
                          <div>
                            <span className="line-through">{t.text}</span>
                            {t.subtopic && (
                              <span className="inline-block ml-2 text-[9px] font-semibold px-1.5 py-0.2 rounded-sm border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-slate-800 text-gray-400 dark:text-gray-500">
                                {t.subtopic.track.name}: {t.subtopic.name}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : selectedDateStr === todayStr ? (
            /* Selected date is active today but not closed */
            <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400 dark:text-gray-500 space-y-4">
              <p className="text-sm">Today's tracking is still active.</p>
              {isAdmin ? (
                <Link
                  href="/"
                  className="rounded-sm border border-gray-900 dark:border-slate-700 bg-gray-900 dark:bg-slate-800 px-4 py-2 text-xs text-white hover:bg-gray-800 dark:hover:bg-slate-700 transition-colors font-medium"
                >
                  Manage Today's Targets &rarr;
                </Link>
              ) : (
                <p className="text-xs italic text-gray-400 dark:text-gray-500">
                  The admin has not closed today's log yet.
                </p>
              )}
            </div>
          ) : (
            /* Untouched day in the past */
            <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400 dark:text-gray-500">
              <p className="text-sm font-medium text-gray-400 dark:text-gray-500 font-serif italic">
                No tracking data logged for this date.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
