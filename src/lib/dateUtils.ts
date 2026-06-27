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
