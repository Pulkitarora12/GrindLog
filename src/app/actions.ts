"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { SubtopicStatus } from "@prisma/client";
import { isAuthorized } from "@/lib/auth";

// ==========================================
// TRACKS & SUBTOPICS ACTIONS
// ==========================================

export async function getTracks() {
  try {
    return await prisma.track.findMany({
      include: {
        subtopics: {
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    console.error("Failed to fetch tracks:", error);
    return [];
  }
}

export async function createTrack(name: string) {
  if (!await isAuthorized()) {
    throw new Error("Unauthorized");
  }

  if (!name || name.trim() === "") {
    throw new Error("Track name is required");
  }

  try {
    const track = await prisma.track.create({
      data: { name: name.trim() },
    });
    revalidatePath("/tracks");
    revalidatePath("/");
    return track;
  } catch (error: any) {
    if (error.code === "P2002") {
      throw new Error("A track with this name already exists");
    }
    throw new Error("Failed to create track");
  }
}

export async function deleteTrack(id: string) {
  if (!await isAuthorized()) {
    throw new Error("Unauthorized");
  }

  try {
    await prisma.track.delete({
      where: { id },
    });
    revalidatePath("/tracks");
    revalidatePath("/");
    revalidatePath("/feed");
    revalidatePath("/calendar");
  } catch (error) {
    console.error("Failed to delete track:", error);
    throw new Error("Failed to delete track");
  }
}

export async function createSubtopic(trackId: string, name: string) {
  if (!await isAuthorized()) {
    throw new Error("Unauthorized");
  }

  if (!name || name.trim() === "") {
    throw new Error("Subtopic name is required");
  }

  try {
    const subtopic = await prisma.subtopic.create({
      data: {
        name: name.trim(),
        trackId,
        status: SubtopicStatus.NOT_STARTED,
      },
    });
    revalidatePath("/tracks");
    revalidatePath("/");
    return subtopic;
  } catch (error: any) {
    if (error.code === "P2002") {
      throw new Error("This subtopic already exists in this track");
    }
    throw new Error("Failed to create subtopic");
  }
}

export async function deleteSubtopic(id: string) {
  if (!await isAuthorized()) {
    throw new Error("Unauthorized");
  }

  try {
    await prisma.subtopic.delete({
      where: { id },
    });
    revalidatePath("/tracks");
    revalidatePath("/");
    revalidatePath("/feed");
    revalidatePath("/calendar");
  } catch (error) {
    console.error("Failed to delete subtopic:", error);
    throw new Error("Failed to delete subtopic");
  }
}

export async function toggleSubtopicStatus(
  id: string,
  status: SubtopicStatus,
  completedAtDate: Date | null = null
) {
  if (!await isAuthorized()) {
    throw new Error("Unauthorized");
  }

  try {
    const completedAt = status === SubtopicStatus.DONE ? (completedAtDate || new Date()) : null;

    const subtopic = await prisma.subtopic.update({
      where: { id },
      data: {
        status,
        completedAt,
      },
    });

    revalidatePath("/tracks");
    revalidatePath("/");
    revalidatePath("/feed");
    revalidatePath("/calendar");
    return subtopic;
  } catch (error) {
    console.error("Failed to update subtopic status:", error);
    throw new Error("Failed to update subtopic status");
  }
}

// ==========================================
// SERIES ACTIONS
// ==========================================

export async function getSeries() {
  try {
    return await prisma.series.findMany({
      include: {
        _count: {
          select: { entries: true },
        },
      },
      orderBy: { name: "asc" },
    });
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
          orderBy: [
            { seriesDay: "asc" },
            { date: "asc" },
          ],
          include: {
            subtopics: {
              include: {
                track: true,
              },
            },
          },
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
    revalidatePath("/new");
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
    revalidatePath("/new");
    revalidatePath("/feed");
    revalidatePath("/calendar");
  } catch (error) {
    console.error("Failed to delete series:", error);
    throw new Error("Failed to delete series");
  }
}

// ==========================================
// DAILY ENTRIES ACTIONS
// ==========================================

export async function getEntries(filters?: {
  trackId?: string;
  seriesId?: string;
  tag?: string;
}) {
  try {
    const whereClause: any = {};

    if (filters?.seriesId) {
      whereClause.seriesId = filters.seriesId;
    }

    if (filters?.trackId) {
      whereClause.subtopics = {
        some: {
          trackId: filters.trackId,
        },
      };
    }

    if (filters?.tag) {
      whereClause.tags = {
        has: filters.tag,
      };
    }

    return await prisma.entry.findMany({
      where: whereClause,
      include: {
        series: true,
        subtopics: {
          include: {
            track: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });
  } catch (error) {
    console.error("Failed to fetch entries:", error);
    return [];
  }
}

export async function getEntryById(id: string) {
  try {
    return await prisma.entry.findUnique({
      where: { id },
      include: {
        series: true,
        subtopics: {
          include: {
            track: true,
          },
        },
      },
    });
  } catch (error) {
    console.error("Failed to fetch entry by ID:", error);
    return null;
  }
}

export async function getEntryByDate(dateString: string) {
  try {
    const startDate = new Date(dateString);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(dateString);
    endDate.setHours(23, 59, 59, 999);

    return await prisma.entry.findFirst({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        series: true,
        subtopics: {
          include: {
            track: true,
          },
        },
      },
    });
  } catch (error) {
    console.error("Failed to fetch entry by date:", error);
    return null;
  }
}

export async function createEntry(data: {
  date: Date;
  title?: string;
  content: string;
  seriesId?: string | null;
  seriesDay?: number | null;
  subtopicIds?: string[];
  tags?: string[];
}) {
  if (!await isAuthorized()) {
    throw new Error("Unauthorized");
  }

  if (!data.content || data.content.trim() === "") {
    throw new Error("Entry content is required");
  }

  try {
    const subtopicIds = data.subtopicIds || [];
    const entryDate = new Date(data.date);

    // Create entry
    const entry = await prisma.entry.create({
      data: {
        date: entryDate,
        title: data.title?.trim() || null,
        content: data.content,
        seriesId: data.seriesId || null,
        seriesDay: data.seriesDay || null,
        tags: data.tags || [],
        subtopics: {
          connect: subtopicIds.map((id) => ({ id })),
        },
      },
    });

    // Side effect: Mark all linked subtopics as DONE with the entry's date
    if (subtopicIds.length > 0) {
      await prisma.subtopic.updateMany({
        where: {
          id: { in: subtopicIds },
        },
        data: {
          status: SubtopicStatus.DONE,
          completedAt: entryDate,
        },
      });
    }

    revalidatePath("/");
    revalidatePath("/feed");
    revalidatePath("/calendar");
    revalidatePath("/tracks");
    if (data.seriesId) {
      revalidatePath(`/series/${data.seriesId}`);
    }

    return entry;
  } catch (error) {
    console.error("Failed to create entry:", error);
    throw new Error("Failed to create entry");
  }
}

export async function updateEntry(
  id: string,
  data: {
    date: Date;
    title?: string;
    content: string;
    seriesId?: string | null;
    seriesDay?: number | null;
    subtopicIds?: string[];
    tags?: string[];
  }
) {
  if (!await isAuthorized()) {
    throw new Error("Unauthorized");
  }

  if (!data.content || data.content.trim() === "") {
    throw new Error("Entry content is required");
  }

  try {
    const subtopicIds = data.subtopicIds || [];
    const entryDate = new Date(data.date);

    // Get current entry to see previous connections and series
    const currentEntry = await prisma.entry.findUnique({
      where: { id },
      include: { subtopics: true },
    });

    if (!currentEntry) {
      throw new Error("Entry not found");
    }

    // Update entry and set many-to-many connections
    const entry = await prisma.entry.update({
      where: { id },
      data: {
        date: entryDate,
        title: data.title?.trim() || null,
        content: data.content,
        seriesId: data.seriesId || null,
        seriesDay: data.seriesDay || null,
        tags: data.tags || [],
        subtopics: {
          set: subtopicIds.map((sid) => ({ id: sid })),
        },
      },
    });

    // Side effect: Mark newly linked subtopics as DONE
    if (subtopicIds.length > 0) {
      await prisma.subtopic.updateMany({
        where: {
          id: { in: subtopicIds },
        },
        data: {
          status: SubtopicStatus.DONE,
          completedAt: entryDate,
        },
      });
    }

    revalidatePath("/");
    revalidatePath("/feed");
    revalidatePath("/calendar");
    revalidatePath("/tracks");
    revalidatePath(`/calendar`);
    if (currentEntry.seriesId) {
      revalidatePath(`/series/${currentEntry.seriesId}`);
    }
    if (data.seriesId && data.seriesId !== currentEntry.seriesId) {
      revalidatePath(`/series/${data.seriesId}`);
    }

    return entry;
  } catch (error) {
    console.error("Failed to update entry:", error);
    throw new Error("Failed to update entry");
  }
}

export async function deleteEntry(id: string) {
  if (!await isAuthorized()) {
    throw new Error("Unauthorized");
  }

  try {
    const entry = await prisma.entry.findUnique({
      where: { id },
      include: { subtopics: true },
    });

    if (!entry) {
      throw new Error("Entry not found");
    }

    // Delete entry
    await prisma.entry.delete({
      where: { id },
    });

    revalidatePath("/");
    revalidatePath("/feed");
    revalidatePath("/calendar");
    revalidatePath("/tracks");
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

export async function getDashboardStats() {
  try {
    const entries = await prisma.entry.findMany({
      select: { date: true },
      orderBy: { date: "desc" },
    });

    const dates = entries.map((e) => e.date);
    const streak = calculateStreak(dates);

    // Tracks statistics
    const tracks = await prisma.track.findMany({
      include: {
        subtopics: true,
      },
    });

    let totalSubtopics = 0;
    let completedSubtopics = 0;

    const trackSummaries = tracks.map((t) => {
      const total = t.subtopics.length;
      const completed = t.subtopics.filter(
        (s) => s.status === SubtopicStatus.DONE
      ).length;

      totalSubtopics += total;
      completedSubtopics += completed;

      return {
        id: t.id,
        name: t.name,
        total,
        completed,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    });

    // Recent entries
    const recentEntries = await prisma.entry.findMany({
      take: 5,
      include: {
        series: true,
        subtopics: {
          include: { track: true },
        },
      },
      orderBy: { date: "desc" },
    });

    return {
      streak,
      totalEntries: entries.length,
      overallProgress: {
        total: totalSubtopics,
        completed: completedSubtopics,
        percentage:
          totalSubtopics > 0
            ? Math.round((completedSubtopics / totalSubtopics) * 100)
            : 0,
      },
      trackSummaries,
      recentEntries,
    };
  } catch (error) {
    console.error("Failed to calculate dashboard stats:", error);
    return {
      streak: 0,
      totalEntries: 0,
      overallProgress: { total: 0, completed: 0, percentage: 0 },
      trackSummaries: [],
      recentEntries: [],
    };
  }
}

export async function getHeatmapData() {
  try {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    oneYearAgo.setHours(0, 0, 0, 0);

    const entries = await prisma.entry.findMany({
      where: {
        date: {
          gte: oneYearAgo,
        },
      },
      select: { date: true },
    });

    // Format as { [dateString]: count }
    const heatmap: Record<string, number> = {};

    entries.forEach((e) => {
      const dateObj = new Date(e.date);
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const day = String(dateObj.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;
      heatmap[dateStr] = (heatmap[dateStr] || 0) + 1;
    });

    return heatmap;
  } catch (error) {
    console.error("Failed to fetch heatmap data:", error);
    return {};
  }
}

// ==========================================
// HELPERS
// ==========================================

function calculateStreak(dates: Date[]): number {
  if (dates.length === 0) return 0;

  // Normalize to YYYY-MM-DD local date strings and get unique dates
  const uniqueDateStrings = Array.from(
    new Set(
      dates.map((d) => {
        const dateObj = new Date(d);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, "0");
        const day = String(dateObj.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      })
    )
  ).sort((a, b) => b.localeCompare(a)); // Sort descending (latest first)

  if (uniqueDateStrings.length === 0) return 0;

  // Helper to get local date string
  const getLocalDateString = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const todayStr = getLocalDateString(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterday);

  const latestDateStr = uniqueDateStrings[0];

  // If the latest entry is neither today nor yesterday, streak is broken
  if (latestDateStr !== todayStr && latestDateStr !== yesterdayStr) {
    return 0;
  }

  let streak = 0;
  let currentDate = new Date(latestDateStr);

  for (let i = 0; i < uniqueDateStrings.length; i++) {
    const expectedStr = getLocalDateString(currentDate);
    if (uniqueDateStrings[i] === expectedStr) {
      streak++;
      // Decrement by 1 day for the next check
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break; // Streak is broken
    }
  }

  return streak;
}
