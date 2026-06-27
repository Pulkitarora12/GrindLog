"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteDayData, reopenDay } from "@/app/actions";

interface CalendarDayActionsProps {
  dateString: string; // YYYY-MM-DD
  hasSummary: boolean;
}

export default function CalendarDayActions({
  dateString,
  hasSummary,
}: CalendarDayActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleReopen = () => {
    if (
      !confirm(
        "Reopen this day? The summary will be deleted but your targets will remain. You can then edit them and re-close the day from the dashboard."
      )
    )
      return;

    setError(null);
    startTransition(async () => {
      try {
        await reopenDay(dateString);
        router.push("/"); // Go to dashboard to re-manage targets
        router.refresh();
      } catch (err: any) {
        setError(err.message || "Failed to reopen day.");
      }
    });
  };

  const handleDeleteAll = () => {
    if (
      !confirm(
        "⚠ Permanently delete the summary AND all targets for this day? This cannot be undone."
      )
    )
      return;

    setError(null);
    startTransition(async () => {
      try {
        await deleteDayData(dateString);
        router.refresh();
      } catch (err: any) {
        setError(err.message || "Failed to delete day data.");
      }
    });
  };

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-xs text-red-600 border border-red-200 bg-red-50 px-3 py-2 rounded-sm">
          {error}
        </p>
      )}

      {hasSummary ? (
        <div className="flex flex-wrap gap-2 justify-end">
          <button
            onClick={handleReopen}
            disabled={isPending}
            title="Delete summary but keep targets"
            className="inline-flex items-center gap-1.5 rounded-sm border border-emerald-250 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50 transition-colors cursor-pointer"
          >
            Reopen Day
          </button>
          <button
            onClick={handleDeleteAll}
            disabled={isPending}
            title="Permanently delete summary and all targets"
            className="inline-flex items-center gap-1.5 rounded-sm border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors cursor-pointer"
          >
            Delete All Data
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2 justify-end">
          <button
            onClick={handleDeleteAll}
            disabled={isPending}
            title="Permanently delete all targets for this day"
            className="inline-flex items-center gap-1.5 rounded-sm border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
              stroke="currentColor"
              className="w-3.5 h-3.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
              />
            </svg>
            Delete All Targets
          </button>
        </div>
      )}
    </div>
  );
}
