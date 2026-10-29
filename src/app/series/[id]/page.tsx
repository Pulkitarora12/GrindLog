import { getSeriesWithEntries } from "../../actions";
import { notFound } from "next/navigation";
import { isAuthorized } from "@/lib/auth";
import SeriesDetailHeader from "./SeriesDetailHeader";
import EntryList from "@/components/EntryList";
import type { DayEntryView } from "@/lib/types";

interface SeriesDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const revalidate = 0; // Disable static cache to reflect instant database updates

export default async function SeriesDetailPage({ params }: SeriesDetailPageProps) {
  const { id } = await params;
  const [series, isAdmin] = await Promise.all([
    getSeriesWithEntries(id),
    isAuthorized(),
  ]);

  if (!series) {
    notFound();
  }

  // Group entries by day (already ordered oldest first)
  const days: { dateKey: string; label: string; entries: DayEntryView[] }[] = [];
  for (const entry of series.entries) {
    const dateKey = entry.date.toISOString().slice(0, 10);
    let day = days[days.length - 1];
    if (!day || day.dateKey !== dateKey) {
      day = {
        dateKey,
        label: entry.date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
          timeZone: "UTC",
        }),
        entries: [],
      };
      days.push(day);
    }
    day.entries.push({
      id: entry.id,
      text: entry.text,
      seriesName: null,
      images: entry.images.map((i) => ({ id: i.id, url: i.url })),
    });
  }

  return (
    <div className="space-y-10 max-w-3xl mx-auto">
      {/* Series Metadata Header & Controls */}
      <SeriesDetailHeader series={series} isAdmin={isAdmin} />

      {/* Sequential Day Entries Timeline */}
      {days.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-200 dark:border-gray-800 rounded-sm text-gray-400 dark:text-gray-500">
          No days have been logged in this series yet. Use &quot;Log your day&quot; on the dashboard to add to this series!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {days.map((day, index) => (
            <div
              key={day.dateKey}
              className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 p-5 rounded-sm hover:border-emerald-700 dark:hover:border-emerald-500 transition-all duration-300"
            >
              <div className="flex justify-between items-baseline mb-3 pb-2 border-b border-gray-100 dark:border-gray-800">
                <span className="font-serif italic font-bold text-emerald-800 dark:text-emerald-450 text-sm">
                  Day {index + 1}
                </span>
                <span className="text-[10px] text-gray-400 dark:text-gray-500">
                  {day.label}
                </span>
              </div>
              <EntryList entries={day.entries} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
