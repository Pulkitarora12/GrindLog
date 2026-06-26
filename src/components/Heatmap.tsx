"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";

interface HeatmapProps {
  data: Record<string, { count: number; efficiency: number }>;
}

export default function Heatmap({ data }: HeatmapProps) {
  const router = useRouter();

  // Generate grid dates (past 365 days, aligned to start on Sunday)
  const gridWeeks = useMemo(() => {
    const weeks: Date[][] = [];
    const today = new Date();
    
    // Find the start date: 365 days ago
    const startDate = new Date();
    startDate.setDate(today.getDate() - 365);
    
    // Adjust to the nearest previous Sunday
    const startDay = startDate.getDay();
    startDate.setDate(startDate.getDate() - startDay);
    
    const currentDate = new Date(startDate);
    
    // Stop generating when we go past today
    while (currentDate <= today) {
      const week: Date[] = [];
      for (let i = 0; i < 7; i++) {
        week.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
      weeks.push(week);
    }
    
    return weeks;
  }, []);

  // Format date to YYYY-MM-DD local format
  const formatDateStr = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getIntensityClass = (count: number) => {
    if (!count || count === 0) return "bg-gray-100 hover:bg-gray-200 border-gray-200/50";
    if (count === 1) return "bg-emerald-100 hover:bg-emerald-200 border-emerald-200";
    if (count === 2) return "bg-emerald-300 hover:bg-emerald-400 border-emerald-300";
    if (count === 3) return "bg-emerald-500 hover:bg-emerald-600 border-emerald-400";
    return "bg-emerald-700 hover:bg-emerald-800 border-emerald-600";
  };

  const monthLabels = useMemo(() => {
    const labels: { text: string; colIndex: number }[] = [];
    let prevMonth = -1;

    gridWeeks.forEach((week, colIndex) => {
      const firstDayOfWeek = week[0];
      const month = firstDayOfWeek.getMonth();
      if (month !== prevMonth && colIndex % 4 === 0) {
        const monthName = firstDayOfWeek.toLocaleString("en-US", { month: "short" });
        labels.push({ text: monthName, colIndex });
        prevMonth = month;
      }
    });

    return labels;
  }, [gridWeeks]);

  return (
    <div className="w-full overflow-x-auto border border-gray-200 bg-white p-6 rounded-sm">
      <div className="min-w-[760px] flex flex-col">
        {/* Month labels header */}
        <div className="flex text-[10px] text-gray-400 h-5 relative ml-6">
          {monthLabels.map((label, i) => (
            <div
              key={i}
              className="absolute"
              style={{ left: `${(label.colIndex * 13.5)}px` }}
            >
              {label.text}
            </div>
          ))}
        </div>

        <div className="flex">
          {/* Day of week labels */}
          <div className="flex flex-col justify-between text-[9px] text-gray-400 w-6 h-[86px] pr-2">
            <span>Su</span>
            <span>Tu</span>
            <span>Th</span>
            <span>Sa</span>
          </div>

          {/* Grid column of weeks */}
          <div className="flex gap-[3.5px] flex-1">
            {gridWeeks.map((week, colIndex) => (
              <div key={colIndex} className="flex flex-col gap-[3.5px]">
                {week.map((day, rowIndex) => {
                  const dateStr = formatDateStr(day);
                  const dayData = data[dateStr];
                  const count = dayData?.count || 0;
                  const efficiency = dayData?.efficiency || 0;
                  const isFuture = day > new Date();

                  return (
                    <button
                      key={rowIndex}
                      onClick={() => !isFuture && router.push(`/calendar?date=${dateStr}`)}
                      disabled={isFuture}
                      className={`w-[10px] h-[10px] rounded-[1px] border-[0.5px] transition-all cursor-pointer ${
                        isFuture ? "bg-transparent border-transparent cursor-default" : getIntensityClass(count)
                      }`}
                      title={isFuture ? "" : `${dateStr}: ${efficiency}% efficiency`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex justify-end items-center gap-1.5 mt-4 text-[10px] text-gray-500 mr-2">
          <span>Less</span>
          <div className="w-[10px] h-[10px] bg-gray-100 border-[0.5px] border-gray-200/50 rounded-[1px]" />
          <div className="w-[10px] h-[10px] bg-emerald-100 border-[0.5px] border-emerald-200 rounded-[1px]" />
          <div className="w-[10px] h-[10px] bg-emerald-300 border-[0.5px] border-emerald-300 rounded-[1px]" />
          <div className="w-[10px] h-[10px] bg-emerald-500 border-[0.5px] border-emerald-400 rounded-[1px]" />
          <div className="w-[10px] h-[10px] bg-emerald-700 border-[0.5px] border-emerald-600 rounded-[1px]" />
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
