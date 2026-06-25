import { getEntryByDate } from "../actions";
import prisma from "@/lib/prisma";
import MonthlyCalendar from "@/components/MonthlyCalendar";
import Markdown from "@/components/Markdown";
import Link from "next/link";
import DeleteEntryForm from "@/components/DeleteEntryForm";
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

  // Default to today's local date YYYY-MM-DD
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(today.getDate()).padStart(2, "0")}`;

  const selectedDateStr = params.date || todayStr;

  // Fetch the entry for the selected date
  const entry = await getEntryByDate(selectedDateStr);

  // Fetch all unique entry dates in YYYY-MM-DD format for highlighting on the calendar
  const allEntries = await prisma.entry.findMany({
    select: { date: true },
  });

  const entryDates = Array.from(
    new Set(
      allEntries.map((e) => {
        const d = new Date(e.date);
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



  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="border-b border-gray-200 pb-6">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-gray-900 mb-1">
          Calendar Log
        </h1>
        <p className="text-gray-500 font-serif italic text-sm">
          Browse daily entries chronologically and review what you completed each day.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Left Column: Monthly Calendar Navigator */}
        <div className="w-full md:w-auto shrink-0">
          <MonthlyCalendar
            selectedDateStr={selectedDateStr}
            entryDates={entryDates}
          />
        </div>

        {/* Right Column: Entry Details / Write prompt */}
        <div className="flex-1 border border-gray-200 bg-white p-6 rounded-sm w-full min-h-[300px]">
          <div className="border-b border-gray-100 pb-4 mb-6 flex justify-between items-start gap-4">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 block mb-1">
                Log Date
              </span>
              <h2 className="font-serif text-xl font-bold text-gray-900">
                {formattedSelectedDate}
              </h2>
            </div>

            {/* Quick Actions (if entry exists) */}
            {entry && isAdmin && (
              <div className="flex items-center gap-3">
                <Link
                  href={`/new?edit=${entry.id}`}
                  className="text-xs border border-gray-300 rounded-sm px-2.5 py-1 text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Edit Log
                </Link>
                <DeleteEntryForm
                  entryId={entry.id}
                  selectedDateStr={selectedDateStr}
                />
              </div>
            )}
          </div>

          {entry ? (
            <div className="space-y-6">
              {/* Optional Title & Series Info */}
              {(entry.title || entry.series) && (
                <div className="space-y-1">
                  {entry.title && (
                    <h3 className="font-serif text-2xl font-bold text-gray-900">
                      {entry.title}
                    </h3>
                  )}
                  {entry.series && (
                    <p className="text-sm font-serif italic text-emerald-800">
                      Series: {entry.series.name}
                      {entry.seriesDay !== null && ` (Day ${entry.seriesDay})`}
                    </p>
                  )}
                </div>
              )}

              {/* Render Content Markdown */}
              <div className="prose">
                <Markdown content={entry.content} />
              </div>

              {/* Checklist completion summary */}
              {entry.subtopics.length > 0 && (
                <div className="border-t border-gray-100 pt-6 space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Completed Checklists
                  </h4>
                  <div className="space-y-2">
                    {entry.subtopics.map((sub) => (
                      <div
                        key={sub.id}
                        className="text-sm flex items-center gap-2 text-gray-800"
                      >
                        <span className="text-emerald-700 font-bold">✓</span>
                        <span>
                          Completed{" "}
                          <span className="font-semibold text-black">
                            {sub.name}
                          </span>{" "}
                          under track{" "}
                          <span className="font-semibold text-black">
                            {sub.track.name}
                          </span>
                          {entry.series && (
                            <>
                              {" "}
                              &mdash; via{" "}
                              <span className="italic font-serif text-emerald-800">
                                {entry.series.name}
                                {entry.seriesDay !== null &&
                                  `, Day ${entry.seriesDay}`}
                              </span>
                            </>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags list */}
              {entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                  {entry.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs text-gray-400 font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400 space-y-4">
              <p className="text-sm">No log entry found for this day.</p>
              {isAdmin && (
                <Link
                  href={`/new?date=${selectedDateStr}`}
                  className="rounded-sm border border-gray-900 bg-gray-900 px-4 py-2 text-xs text-white hover:bg-gray-800 transition-colors font-medium"
                >
                  + Write Log for {formattedSelectedDate}
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
