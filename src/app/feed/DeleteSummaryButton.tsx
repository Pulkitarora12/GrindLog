"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { reopenDay } from "../actions";

interface DeleteSummaryButtonProps {
  dateString: string;
}

export default function DeleteSummaryButton({ dateString }: DeleteSummaryButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    if (
      !confirm(
        "Are you sure you want to delete this day summary? The summary will be deleted from the feed, and the day will be reopened (targets will be unlocked for editing on the dashboard)."
      )
    ) {
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        await reopenDay(dateString);
        router.refresh();
      } catch (err: any) {
        setError(err.message || "Failed to delete summary");
      }
    });
  };

  return (
    <div className="inline-flex items-center gap-2">
      {error && <span className="text-red-750 text-[11px] font-medium">{error}</span>}
      <button
        onClick={handleDelete}
        disabled={isPending}
        className="font-semibold text-red-700 hover:text-red-900 transition-colors disabled:opacity-50 cursor-pointer text-xs"
      >
        {isPending ? "Deleting..." : "Delete Summary"}
      </button>
    </div>
  );
}
