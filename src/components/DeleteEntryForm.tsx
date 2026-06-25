"use client";

import React, { useTransition } from "react";
import { deleteEntry } from "@/app/actions";

interface DeleteEntryFormProps {
  entryId: string;
  selectedDateStr: string;
}

export default function DeleteEntryForm({
  entryId,
  selectedDateStr,
}: DeleteEntryFormProps) {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm("Are you sure you want to delete this log?")) {
      return;
    }

    startTransition(async () => {
      try {
        await deleteEntry(entryId);
        // Force refresh the page with the updated state
        window.location.href = `/calendar?date=${selectedDateStr}`;
      } catch (error) {
        console.error("Failed to delete entry:", error);
        alert("Failed to delete entry");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <button
        type="submit"
        disabled={isPending}
        className="text-xs border border-red-200 rounded-sm px-2.5 py-1 text-red-700 hover:bg-red-50 disabled:opacity-50 transition-colors font-medium cursor-pointer"
      >
        {isPending ? "Deleting..." : "Delete"}
      </button>
    </form>
  );
}
