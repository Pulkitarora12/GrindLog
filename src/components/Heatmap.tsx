"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import EntryList from "./EntryList";
import { deleteDayEntry } from "@/app/actions";
import type { HeatmapData } from "@/lib/types";

interface HeatmapProps {
  data: HeatmapData;
  isAdmin?: boolean;
}

const DAY_LABELS = ["Mon", "", "Wed", "", "Fri", "", "Sun"];
const POPUP_WIDTH = 340;
const START_YEAR = 2026; // the year GrindLog started

const formatDateStr = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getIntensityClass = (count: number) => {
  if (!count) return "bg-gray-100 dark:bg-slate-800/70 hover:bg-gray-200 dark:hover:bg-slate-700 border-gray-200/70 dark:border-slate-700/40";
  if (count === 1) return "bg-emerald-200 dark:bg-emerald-900/60 hover:bg-emerald-300 dark:hover:bg-emerald-800 border-emerald-300/60 dark:border-emerald-800/60";
  if (count === 2) return "bg-emerald-400 dark:bg-emerald-700 hover:bg-emerald-500 dark:hover:bg-emerald-600 border-emerald-500/40 dark:border-emerald-600/60";
  if (count === 3) return "bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-400 border-emerald-700/30 dark:border-emerald-400/60 shadow-[0_0_6px_rgba(5,150,105,0.35)]";
  return "bg-emerald-800 dark:bg-emerald-300 hover:bg-emerald-900 dark:hover:bg-emerald-200 border-emerald-900/30 dark:border-emerald-200/70 shadow-[0_0_10px_rgba(5,150,105,0.5)]";
};

interface ActiveCell {
  dateStr: string;
  rect: { left: number; right: number; top: number; bottom: number; width: number };
}

export default function Heatmap({ data, isAdmin = false }: HeatmapProps) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [view, setView] = useState<string>(String(new Date().getFullYear()));
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState<ActiveCell | null>(null);
  const [pinned, setPinned] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const todayStr = formatDateStr(today);
  const currentYear = today.getFullYear();

  // Years that can be browsed: from the year we started up to the current year
  const years = useMemo(() => {
    const dataYears = Object.keys(data).map((k) => Number(k.slice(0, 4)));
    const first = Math.min(START_YEAR, currentYear, ...dataYears);
    const list: number[] = [];
    for (let y = currentYear; y >= first; y--) list.push(y);
    return list;
  }, [data, currentYear]);

  // Static calendar-year grid. Weeks run Monday -> Sunday, January to December.
  const { gridWeeks, rangeStart, rangeEnd } = useMemo(() => {
    const year = Number(view);
    const rStart = new Date(year, 0, 1);
    const rEnd = new Date(year, 11, 31);
    const start = new Date(rStart);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    const end = new Date(rEnd);
    end.setDate(end.getDate() + (6 - ((end.getDay() + 6) % 7)));

    const weeks: Date[][] = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      const week: Date[] = [];
      for (let d = 0; d < 7; d++) {
        week.push(new Date(cursor));
        cursor.setDate(cursor.getDate() + 1);
      }
      weeks.push(week);
    }
    return { gridWeeks: weeks, rangeStart: formatDateStr(rStart), rangeEnd: formatDateStr(rEnd) };
  }, [view]);

  const totalEntries = useMemo(
    () =>
      Object.entries(data).reduce(
        (n, [key, day]) => (key >= rangeStart && key <= rangeEnd ? n + day.entries.length : n),
        0
      ),
    [data, rangeStart, rangeEnd]
  );

  // Month label sits above the column that contains the 1st of the month
  const monthLabels = useMemo(() => {
    const labels: { text: string; colIndex: number }[] = [];
    gridWeeks.forEach((week, colIndex) => {
      const first = week.find((d) => d.getDate() === 1);
      if (first && formatDateStr(first) >= rangeStart && formatDateStr(first) <= rangeEnd) {
        labels.push({
          text: first.toLocaleString("en-US", { month: "short" }),
          colIndex,
        });
      }
    });
    return labels;
  }, [gridWeeks, rangeStart, rangeEnd]);

  // On narrow screens the grid scrolls; bring the current week into view
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (view !== String(currentYear)) {
      el.scrollLeft = 0;
      return;
    }
    const col = gridWeeks.findIndex((w) => w.some((d) => formatDateStr(d) === todayStr));
    el.scrollLeft = (el.scrollWidth * col) / gridWeeks.length - el.clientWidth / 2;
  }, [view, gridWeeks, currentYear, todayStr]);

  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimer.current = setTimeout(() => setActive(null), 180);
  }, []);

  const close = useCallback(() => {
    cancelClose();
    setPinned(false);
    setActive(null);
  }, []);

  // Close a pinned popup on outside click / Escape
  useEffect(() => {
    if (!active) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (popupRef.current?.contains(target)) return;
      if ((target as HTMLElement).closest?.("[data-heat-cell]")) return;
      close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const onScroll = (e: Event) => {
      if (popupRef.current?.contains(e.target as Node)) return;
      if (!pinned) close();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [active, pinned, close]);

  // Close the year menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [menuOpen]);

  const openCell = (dateStr: string, el: HTMLElement) => {
    cancelClose();
    const r = el.getBoundingClientRect();
    setActive({
      dateStr,
      rect: { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width },
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this entry and its photos?")) return;
    setDeletingId(id);
    try {
      await deleteDayEntry(id);
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Failed to delete entry");
    } finally {
      setDeletingId(null);
    }
  };

  // Place the popup beside the cell, flipped/clamped to stay on screen
  const popupStyle = (): React.CSSProperties => {
    if (!active) return {};
    const vw = typeof window !== "undefined" ? window.innerWidth : 1024;
    const vh = typeof window !== "undefined" ? window.innerHeight : 768;
    const width = Math.min(POPUP_WIDTH, vw - 16);
    let left = active.rect.left + active.rect.width / 2 - width / 2;
    left = Math.max(8, Math.min(left, vw - width - 8));

    const spaceBelow = vh - active.rect.bottom;
    const placeBelow = spaceBelow >= 260 || spaceBelow >= active.rect.top;
    const maxHeight = Math.max(160, (placeBelow ? spaceBelow : active.rect.top) - 20);

    return placeBelow
      ? { left, width, top: active.rect.bottom + 8, maxHeight }
      : { left, width, bottom: vh - active.rect.top + 8, maxHeight };
  };

  const activeDay = active ? data[active.dateStr] : undefined;
  const activeLabel = active
    ? (() => {
        const [y, m, d] = active.dateStr.split("-").map(Number);
        return new Date(y, m - 1, d).toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      })()
    : "";

  const viewLabel = view;

  return (
    <div className="w-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 p-6 rounded-sm shadow-sm transition-colors duration-300">
      {/* Header: total + year picker */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <p className="font-serif text-sm text-gray-600 dark:text-gray-300">
          <span className="text-2xl font-bold text-emerald-800 dark:text-emerald-450 mr-1.5">
            {totalEntries}
          </span>
          {totalEntries === 1 ? "entry" : "entries"} in {view}
        </p>

        <div className="flex items-center gap-4">
          <span className="hidden md:inline text-[11px] italic font-serif text-gray-400 dark:text-gray-500">
            Hover or tap a day to see what was logged
          </span>

          {years.length > 0 && (
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="inline-flex items-center gap-2 rounded-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:border-emerald-700 dark:hover:border-emerald-500 transition-colors cursor-pointer"
                aria-haspopup="listbox"
                aria-expanded={menuOpen}
              >
                {viewLabel}
                <span className={`text-[9px] transition-transform ${menuOpen ? "rotate-180" : ""}`}>▼</span>
              </button>

              {menuOpen && (
                <ul
                  role="listbox"
                  className="absolute right-0 top-full mt-1 z-40 min-w-[8rem] rounded-sm border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 shadow-xl py-1 animate-fadeIn"
                >
                  {years.map(String).map((opt) => (
                    <li key={opt}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={view === opt}
                        onClick={() => {
                          setView(opt);
                          setMenuOpen(false);
                          close();
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors ${
                          view === opt
                            ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-450"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                        }`}
                      >
                        {opt}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Fluid grid: fills the card; only scrolls (silently) on very narrow screens */}
      <div
        ref={scrollRef}
        className="overflow-x-auto p-1.5 -m-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div
          className="grid gap-[4px] min-w-[680px]"
          style={{
            gridTemplateColumns: `2rem repeat(${gridWeeks.length}, minmax(0, 1fr))`,
          }}
        >
          {/* Month labels */}
          {monthLabels.map((label) => (
            <span
              key={`m-${label.colIndex}`}
              className="text-[11px] font-semibold tracking-wide text-gray-500 dark:text-gray-400 whitespace-nowrap pb-1"
              style={{ gridRow: 1, gridColumn: label.colIndex + 2 }}
            >
              {label.text}
            </span>
          ))}

          {/* Day of week labels */}
          {DAY_LABELS.map((label, i) => (
            <span
              key={`d-${i}`}
              className="text-[9px] text-gray-400 dark:text-gray-500 flex items-center"
              style={{ gridRow: i + 2, gridColumn: 1 }}
            >
              {label}
            </span>
          ))}

          {/* Day cells */}
          {gridWeeks.map((week, colIndex) =>
            week.map((day, rowIndex) => {
              const dateStr = formatDateStr(day);
              const placement = { gridRow: rowIndex + 2, gridColumn: colIndex + 2 };

              if (dateStr < rangeStart || dateStr > rangeEnd) {
                return <div key={dateStr} style={placement} className="aspect-square" />;
              }

              if (dateStr > todayStr) {
                return (
                  <div
                    key={dateStr}
                    style={placement}
                    className={`aspect-square w-full rounded-[4px] border opacity-50 ${getIntensityClass(0).replace(/hover:\S+/g, "")}`}
                  />
                );
              }

              const count = data[dateStr]?.count || 0;
              const isToday = dateStr === todayStr;

              return (
                <button
                  key={dateStr}
                  type="button"
                  data-heat-cell
                  aria-label={`${dateStr}: ${data[dateStr]?.entries.length || 0} entries`}
                  onMouseEnter={(e) => {
                    if (!pinned) openCell(dateStr, e.currentTarget);
                  }}
                  onMouseLeave={() => {
                    if (!pinned) scheduleClose();
                  }}
                  onClick={(e) => {
                    if (active?.dateStr === dateStr && pinned) {
                      close();
                    } else {
                      openCell(dateStr, e.currentTarget);
                      setPinned(true);
                    }
                  }}
                  style={placement}
                  className={`aspect-square w-full rounded-[4px] border transition-all duration-150 hover:scale-125 hover:z-10 cursor-pointer ${getIntensityClass(count)} ${
                    isToday
                      ? "ring-1 ring-offset-1 ring-gray-900 dark:ring-gray-100 ring-offset-white dark:ring-offset-slate-900"
                      : ""
                  } ${active?.dateStr === dateStr ? "ring-2 ring-emerald-600 dark:ring-emerald-400" : ""}`}
                />
              );
            })
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-end items-center gap-1.5 mt-4 text-[10px] text-gray-500 dark:text-gray-400">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`w-3 h-3 rounded-[4px] border ${getIntensityClass(level).replace(/hover:\S+/g, "")}`}
          />
        ))}
        <span>More</span>
      </div>

      {/* Day popup */}
      {active && (
        <div
          ref={popupRef}
          onMouseEnter={cancelClose}
          onMouseLeave={() => {
            if (!pinned) scheduleClose();
          }}
          style={{ position: "fixed", zIndex: 60, ...popupStyle() }}
          className="overflow-y-auto bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-md shadow-2xl ring-1 ring-black/5 p-4 space-y-3 animate-fadeIn"
        >
          <div className="flex items-start justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-2">
            <div>
              <h3 className="font-serif text-sm font-bold text-gray-900 dark:text-gray-100">
                {activeLabel}
              </h3>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 dark:text-gray-500 mt-0.5">
                {activeDay
                  ? `${activeDay.entries.length} entr${activeDay.entries.length === 1 ? "y" : "ies"}`
                  : "Nothing logged"}
              </p>
            </div>
            {pinned && (
              <button
                type="button"
                onClick={close}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg leading-none cursor-pointer"
                aria-label="Close"
              >
                &times;
              </button>
            )}
          </div>

          {activeDay ? (
            <EntryList
              entries={activeDay.entries}
              onDelete={isAdmin ? handleDelete : undefined}
              deletingId={deletingId}
            />
          ) : (
            <p className="text-xs text-gray-400 dark:text-gray-500 italic font-serif">
              No entries for this day.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
