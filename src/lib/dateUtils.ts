export function getTodayDateString(): string {
  // Format current date to YYYY-MM-DD in Asia/Kolkata timezone
  const options = { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" } as const;
  const formatter = new Intl.DateTimeFormat("en-CA", options); // en-CA gives YYYY-MM-DD
  return formatter.format(new Date());
}

export function getYesterdayDateString(): string {
  const options = { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" } as const;
  const formatter = new Intl.DateTimeFormat("en-CA", options);
  const yesterdayObj = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);
  return formatter.format(yesterdayObj);
}

export function isDateAllowedForLogging(dateString: string): boolean {
  if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return false;
  }
  const todayStr = getTodayDateString();
  const yesterdayStr = getYesterdayDateString();
  return dateString === todayStr || dateString === yesterdayStr;
}

export function getSeriesTimingInfo(createdAt: Date | string, endedAt?: Date | string | null) {
  const start = new Date(createdAt);
  const startDateStr = start.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const now = new Date();
  const startMidnight = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffMs = nowMidnight.getTime() - startMidnight.getTime();
  const daysSinceStart = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  let daysAgoText = "Started today";
  if (daysSinceStart === 1) {
    daysAgoText = "Started 1 day ago";
  } else if (daysSinceStart > 1) {
    daysAgoText = `Started ${daysSinceStart} days ago`;
  }

  let lastedDays: number | null = null;
  let lastedDaysText: string | null = null;

  if (endedAt) {
    const end = new Date(endedAt);
    const endMidnight = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    const endDiffMs = endMidnight.getTime() - startMidnight.getTime();
    const diffDays = Math.floor(endDiffMs / (1000 * 60 * 60 * 24));
    const calculatedLasted = Math.max(1, diffDays === 0 ? 1 : diffDays);
    lastedDays = calculatedLasted;
    lastedDaysText = `This series lasted ${calculatedLasted} day${calculatedLasted !== 1 ? "s" : ""}`;
  }

  return {
    startDateStr,
    daysSinceStart,
    daysAgoText,
    lastedDays,
    lastedDaysText,
  };
}

