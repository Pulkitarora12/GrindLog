"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { isAuthorized } from "@/lib/auth";
import {
  getTodayDateString,
  isDateAllowedForLogging,
} from "@/lib/dateUtils";
import { createUploadSignature, destroyImages } from "@/lib/cloudinary";
import type { HeatmapData, NewEntryInput } from "@/lib/types";

// ==========================================
// SERIES ACTIONS
// ==========================================

export async function getSeries() {
  try {
    const rows = await prisma.series.findMany({
      include: {
        entries: { select: { date: true } },
      },
      orderBy: [
        { isEnded: "asc" },
        { createdAt: "desc" },
      ],
    });
    return rows.map(({ entries, ...rest }) => ({
      ...rest,
      daysLogged: new Set(entries.map((e) => e.date.getTime())).size,
    }));
  } catch (error) {
    console.error("Failed to fetch series:", error);
    return [];
  }
}

export async function getSeriesWithEntries(id: string) {
  try {
    return await prisma.series.findUnique({
      where: { id },
      include: {
        entries: {
          orderBy: [{ date: "asc" }, { createdAt: "asc" }],
          include: { images: { orderBy: { createdAt: "asc" } } },
        },
      },
    });
  } catch (error) {
    console.error("Failed to fetch series details:", error);
    return null;
  }
}

export async function createSeries(name: string, description?: string) {
  if (!await isAuthorized()) {
    throw new Error("Unauthorized");
  }

  if (!name || name.trim() === "") {
    throw new Error("Series name is required");
  }

  try {
    const series = await prisma.series.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
      },
    });
    revalidatePath("/series");
    return series;
  } catch (error: any) {
    if (error.code === "P2002") {
      throw new Error("A series with this name already exists");
    }
    throw new Error("Failed to create series");
  }
}

export async function deleteSeries(id: string) {
  if (!await isAuthorized()) {
    throw new Error("Unauthorized");
  }

  try {
    await prisma.series.delete({
      where: { id },
    });
    revalidatePath("/series");
    revalidatePath("/");
  } catch (error) {
    console.error("Failed to delete series:", error);
    throw new Error("Failed to delete series");
  }
}

export async function endSeries(id: string, endingReason: string) {
  if (!await isAuthorized()) {
    throw new Error("Unauthorized");
  }

  if (!endingReason || endingReason.trim() === "") {
    throw new Error("Verdict or reason is required to end the series");
  }

  try {
    const series = await prisma.series.update({
      where: { id },
      data: {
        isEnded: true,
        endedAt: new Date(),
        endingReason: endingReason.trim(),
      },
    });
    revalidatePath("/series");
    revalidatePath(`/series/${id}`);
    revalidatePath("/");
    return series;
  } catch (error: any) {
    console.error("Failed to end series:", error);
    throw new Error(error.message || "Failed to end series");
  }
}

export async function reopenSeries(id: string) {
  if (!await isAuthorized()) {
    throw new Error("Unauthorized");
  }

  try {
    const series = await prisma.series.update({
      where: { id },
      data: {
        isEnded: false,
        endedAt: null,
        endingReason: null,
      },
    });
    revalidatePath("/series");
    revalidatePath(`/series/${id}`);
    revalidatePath("/");
    return series;
  } catch (error) {
    console.error("Failed to reopen series:", error);
    throw new Error("Failed to reopen series");
  }
}

export async function updateSeries(id: string, name: string, description?: string) {
  if (!await isAuthorized()) {
    throw new Error("Unauthorized");
  }

  if (!name || name.trim() === "") {
    throw new Error("Series name is required");
  }

  try {
    const series = await prisma.series.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
      },
    });
    revalidatePath("/series");
    revalidatePath(`/series/${id}`);
    revalidatePath("/");
    return series;
  } catch (error: any) {
    if (error.code === "P2002") {
      throw new Error("A series with this name already exists");
    }
    throw new Error(error.message || "Failed to update series");
  }
}

// ==========================================
// DAY ENTRIES ACTIONS
// ==========================================

export async function getUploadSignature() {
  if (!await isAuthorized()) {
    throw new Error("Unauthorized");
  }
  return createUploadSignature();
}

export async function createDayEntries(dateString: string, entries: NewEntryInput[]) {
  if (!await isAuthorized()) {
    throw new Error("Unauthorized");
  }

  if (!isDateAllowedForLogging(dateString)) {
    throw new Error("You can only log entries for today or yesterday.");
  }

  const cleaned = entries
    .map((e) => ({ ...e, text: e.text.trim() }))
    .filter((e) => e.text !== "");

  if (cleaned.length === 0) {
    throw new Error("Add at least one entry describing what you did.");
  }

  const seriesIds = Array.from(
    new Set(cleaned.map((e) => e.seriesId).filter((id): id is string => !!id))
  );
  if (seriesIds.length > 0) {
    const valid = await prisma.series.findMany({
      where: { id: { in: seriesIds }, isEnded: false },
      select: { id: true },
    });
    if (valid.length !== seriesIds.length) {
      throw new Error("One of the selected series is no longer active.");
    }
  }

  const date = new Date(dateString);
  const base = Date.now();

  try {
    await prisma.$transaction(
      cleaned.map((e, i) =>
        prisma.dayEntry.create({
          data: {
            date,
            text: e.text,
            seriesId: e.seriesId || null,
            // Explicit timestamps keep the entries in the order they were written
            createdAt: new Date(base + i),
            images: {
              create: e.images.map((img) => ({ url: img.url, publicId: img.publicId })),
            },
          },
        })
      )
    );

    revalidatePath("/");
    revalidatePath("/series");
    seriesIds.forEach((id) => revalidatePath(`/series/${id}`));
  } catch (error) {
    console.error("Failed to create day entries:", error);
    throw new Error("Failed to save your entries");
  }
}

export async function deleteDayEntry(id: string) {
  if (!await isAuthorized()) {
    throw new Error("Unauthorized");
  }

  try {
    const entry = await prisma.dayEntry.findUnique({
      where: { id },
      include: { images: true },
    });
    if (!entry) return;

    await prisma.dayEntry.delete({ where: { id } });
    await destroyImages(entry.images.map((i) => i.publicId));

    revalidatePath("/");
    revalidatePath("/series");
    if (entry.seriesId) {
      revalidatePath(`/series/${entry.seriesId}`);
    }
  } catch (error) {
    console.error("Failed to delete entry:", error);
    throw new Error("Failed to delete entry");
  }
}

// ==========================================
// ANALYTICS & STATS ACTIONS
// ==========================================

const toDateKey = (d: Date) => d.toISOString().slice(0, 10);

export async function getDashboardStats() {
  try {
    const rows = await prisma.dayEntry.findMany({ select: { date: true } });
    const dateKeys = Array.from(new Set(rows.map((r) => toDateKey(r.date))));

    return {
      streak: calculateStreak(dateKeys),
      totalDays: dateKeys.length,
      totalEntries: rows.length,
    };
  } catch (error) {
    console.error("Failed to calculate dashboard stats:", error);
    return { streak: 0, totalDays: 0, totalEntries: 0 };
  }
}

export async function getHeatmapData(): Promise<HeatmapData> {
  try {
    const entries = await prisma.dayEntry.findMany({
      include: {
        series: { select: { name: true } },
        images: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { createdAt: "asc" },
    });

    const heatmap: HeatmapData = {};
    for (const e of entries) {
      const key = toDateKey(e.date);
      if (!heatmap[key]) heatmap[key] = { count: 0, entries: [] };
      heatmap[key].entries.push({
        id: e.id,
        text: e.text,
        seriesName: e.series?.name ?? null,
        images: e.images.map((i) => ({ id: i.id, url: i.url })),
      });
    }
    // Heat level 1-4 based on how many entries were logged that day
    for (const day of Object.values(heatmap)) {
      day.count = Math.min(day.entries.length, 4);
    }

    return heatmap;
  } catch (error) {
    console.error("Failed to fetch heatmap data:", error);
    return {};
  }
}

// ==========================================
// HELPERS
// ==========================================

/** Consecutive days (ending today or yesterday) that have at least one entry. */
function calculateStreak(dateKeys: string[]): number {
  if (dateKeys.length === 0) return 0;

  const days = new Set(dateKeys);
  const [y, m, d] = getTodayDateString().split("-").map(Number);
  const cursor = new Date(Date.UTC(y, m - 1, d));

  // Today without an entry yet doesn't break the streak
  if (!days.has(toDateKey(cursor))) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  let streak = 0;
  while (days.has(toDateKey(cursor))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}
