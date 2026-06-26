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
          select: { daySummaries: true },
        },
      },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    console.error("Failed to fetch series:", error);
    return [];
  }
}

export async function getSeriesWithSummaries(id: string) {
  try {
    return await prisma.series.findUnique({
      where: { id },
      include: {
        daySummaries: {
          orderBy: { date: "asc" },
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
    revalidatePath("/feed");
    revalidatePath("/calendar");
  } catch (error) {
    console.error("Failed to delete series:", error);
    throw new Error("Failed to delete series");
  }
}

// ==========================================
// HELPER FOR TIMEZONE-SPECIFIC TODAY
// ==========================================

function getTodayDateString(): string {
  // Format current date to YYYY-MM-DD in Asia/Kolkata timezone
  const options = { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" } as const;
  const formatter = new Intl.DateTimeFormat("en-CA", options); // en-CA gives YYYY-MM-DD
  return formatter.format(new Date());
}

// ==========================================
// DAILY TARGETS ACTIONS
// ==========================================

export async function getDailyTargets(dateString: string) {
  try {
    const date = new Date(dateString);
    return await prisma.dailyTarget.findMany({
      where: { date },
      include: {
        subtopic: {
          include: { track: true }
        }
      },
      orderBy: { createdAt: "asc" }
    });
  } catch (error) {
    console.error("Failed to fetch daily targets:", error);
    return [];
  }
}

export async function createDailyTarget(text: string, subtopicId?: string | null) {
  if (!await isAuthorized()) {
    throw new Error("Unauthorized");
  }

  const todayStr = getTodayDateString();
  const todayDate = new Date(todayStr);

  // Check if today is closed
  const summary = await prisma.daySummary.findUnique({
    where: { date: todayDate }
  });

  if (summary?.isClosed) {
    throw new Error("Cannot add targets to a closed day.");
  }

  try {
    const target = await prisma.dailyTarget.create({
      data: {
        text: text.trim(),
        date: todayDate,
        subtopicId: subtopicId || null,
      },
      include: {
        subtopic: {
          include: { track: true }
        }
      }
    });

    revalidatePath("/");
    revalidatePath("/calendar");
    return target;
  } catch (error) {
    console.error("Failed to create daily target:", error);
    throw new Error("Failed to create daily target");
  }
}

export async function toggleDailyTarget(id: string, done: boolean) {
  if (!await isAuthorized()) {
    throw new Error("Unauthorized");
  }

  try {
    const target = await prisma.dailyTarget.findUnique({
      where: { id }
    });

    if (!target) {
      throw new Error("Target not found");
    }

    // Check if date is closed
    const summary = await prisma.daySummary.findUnique({
      where: { date: target.date }
    });

    if (summary?.isClosed) {
      throw new Error("Cannot edit targets on a closed day.");
    }

    const updated = await prisma.dailyTarget.update({
      where: { id },
      data: { done },
    });

    revalidatePath("/");
    revalidatePath("/calendar");
    return updated;
  } catch (error: any) {
    console.error("Failed to toggle daily target:", error);
    throw new Error(error.message || "Failed to toggle daily target");
  }
}

export async function deleteDailyTarget(id: string) {
  if (!await isAuthorized()) {
    throw new Error("Unauthorized");
  }

  try {
    const target = await prisma.dailyTarget.findUnique({
      where: { id }
    });

    if (!target) {
      throw new Error("Target not found");
    }

    // Check if date is closed
    const summary = await prisma.daySummary.findUnique({
      where: { date: target.date }
    });

    if (summary?.isClosed) {
      throw new Error("Cannot delete targets on a closed day.");
    }

    await prisma.dailyTarget.delete({
      where: { id }
    });

    revalidatePath("/");
    revalidatePath("/calendar");
  } catch (error: any) {
    console.error("Failed to delete daily target:", error);
    throw new Error(error.message || "Failed to delete daily target");
  }
}

// ==========================================
// DAY SUMMARY ACTIONS
// ==========================================

export async function endDay(dateString: string, seriesId?: string | null) {
  if (!await isAuthorized()) {
    throw new Error("Unauthorized");
  }

  const todayStr = getTodayDateString();
  if (dateString !== todayStr) {
    throw new Error("You can only close the current day.");
  }

  const todayDate = new Date(todayStr);

  // Check if already closed
  const existingSummary = await prisma.daySummary.findUnique({
    where: { date: todayDate }
  });

  if (existingSummary?.isClosed) {
    throw new Error("Day is already closed.");
  }

  try {
    // Fetch targets for today
    const targets = await prisma.dailyTarget.findMany({
      where: { date: todayDate }
    });

    if (targets.length === 0) {
      throw new Error("Cannot close a day with no targets. Please set at least one target.");
    }

    const targetsSetCount = targets.length;
    const targetsAchievedCount = targets.filter(t => t.done).length;
    const efficiency = (targetsAchievedCount / targetsSetCount) * 100;

    // Create or update DaySummary to isClosed = true
    const summary = await prisma.daySummary.upsert({
      where: { date: todayDate },
      update: {
        seriesId: seriesId || null,
        targetsSetCount,
        targetsAchievedCount,
        efficiency,
        isClosed: true,
      },
      create: {
        date: todayDate,
        seriesId: seriesId || null,
        targetsSetCount,
        targetsAchievedCount,
        efficiency,
        isClosed: true,
      }
    });

    revalidatePath("/");
    revalidatePath("/calendar");
    revalidatePath("/feed");
    revalidatePath("/series");
    if (seriesId) {
      revalidatePath(`/series/${seriesId}`);
    }

    return summary;
  } catch (error: any) {
    console.error("Failed to end day:", error);
    throw new Error(error.message || "Failed to end day");
  }
}

export async function getDaySummaryWithTargets(dateString: string) {
  try {
    const date = new Date(dateString);
    const summary = await prisma.daySummary.findUnique({
      where: { date },
      include: { series: true }
    });

    const targets = await prisma.dailyTarget.findMany({
      where: { date },
      include: {
        subtopic: {
          include: { track: true }
        }
      },
      orderBy: { createdAt: "asc" }
    });

    return { summary, targets };
  } catch (error) {
    console.error("Failed to fetch day summary with targets:", error);
    return null;
  }
}

export async function getClosedDaySummaries(filters?: { seriesId?: string; trackId?: string }) {
  try {
    const where: any = { isClosed: true };
    if (filters?.seriesId) {
      where.seriesId = filters.seriesId;
    }
    if (filters?.trackId) {
      const targets = await prisma.dailyTarget.findMany({
        where: {
          subtopic: {
            trackId: filters.trackId,
          },
        },
        select: { date: true },
      });
      const dates = targets.map((t) => t.date);
      where.date = { in: dates };
    }
    return await prisma.daySummary.findMany({
      where,
      include: {
        series: true,
      },
      orderBy: { date: "desc" },
    });
  } catch (error) {
    console.error("Failed to fetch closed day summaries:", error);
    return [];
  }
}

// ==========================================
// ANALYTICS & STATS ACTIONS
// ==========================================

export async function getDashboardStats() {
  try {
    // Fetch all closed summaries for streak calculation
    const summaries = await prisma.daySummary.findMany({
      where: { isClosed: true },
      select: { date: true },
      orderBy: { date: "desc" },
    });

    const dates = summaries.map((s) => s.date);
    const streak = calculateStreak(dates);

    // Tracks statistics (remain unchanged)
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

    // Recent closed summaries
    const recentSummaries = await prisma.daySummary.findMany({
      take: 5,
      where: { isClosed: true },
      include: {
        series: true,
      },
      orderBy: { date: "desc" },
    });

    return {
      streak,
      totalClosedDays: summaries.length,
      overallProgress: {
        total: totalSubtopics,
        completed: completedSubtopics,
        percentage:
          totalSubtopics > 0
            ? Math.round((completedSubtopics / totalSubtopics) * 100)
            : 0,
      },
      trackSummaries,
      recentSummaries,
    };
  } catch (error) {
    console.error("Failed to calculate dashboard stats:", error);
    return {
      streak: 0,
      totalClosedDays: 0,
      overallProgress: { total: 0, completed: 0, percentage: 0 },
      trackSummaries: [],
      recentSummaries: [],
    };
  }
}

export async function getHeatmapData() {
  try {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    oneYearAgo.setHours(0, 0, 0, 0);

    const summaries = await prisma.daySummary.findMany({
      where: {
        date: {
          gte: oneYearAgo,
        },
        isClosed: true,
      },
      select: { date: true, efficiency: true },
    });

    // Format as { [dateString]: { count: number, efficiency: number } }
    const heatmap: Record<string, { count: number; efficiency: number }> = {};

    summaries.forEach((s) => {
      const dateObj = new Date(s.date);
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const day = String(dateObj.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;

      // Map efficiency to a count of 1-4 for intensity
      let count = 0;
      if (s.efficiency === 0) count = 0;
      else if (s.efficiency <= 25) count = 1;
      else if (s.efficiency <= 50) count = 2;
      else if (s.efficiency <= 75) count = 3;
      else count = 4;

      heatmap[dateStr] = {
        count,
        efficiency: Math.round(s.efficiency),
      };
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

  // Check against client's timezone today (IST)
  const todayStr = getTodayDateString();
  const yesterday = new Date();
  // Simple subtraction in IST context:
  const yesterdayObj = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);
  const options = { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" } as const;
  const formatter = new Intl.DateTimeFormat("en-CA", options);
  const yesterdayStr = formatter.format(yesterdayObj);

  const latestDateStr = uniqueDateStrings[0];

  // If the latest entry is neither today nor yesterday, streak is broken
  if (latestDateStr !== todayStr && latestDateStr !== yesterdayStr) {
    return 0;
  }

  let streak = 0;
  // Starting date is the latest date in the database
  let currentDate = new Date(latestDateStr);

  for (let i = 0; i < uniqueDateStrings.length; i++) {
    const expectedStr = formatter.format(currentDate);
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
