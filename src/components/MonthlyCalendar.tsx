"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

interface MonthlyCalendarProps {
  selectedDateStr: string; // "YYYY-MM-DD"
  entryDates: string[];    // Array of "YYYY-MM-DD" strings with entries
}

export default function MonthlyCalendar({
  selectedDateStr,
  entryDates,
}: MonthlyCalendarProps) {
  const router = useRouter();

  // Parse the selected date or default to today
  const selectedDate = useMemo(() => {
    return new Date(selectedDateStr);
  }, [selectedDateStr]);

  const [currentYear, setCurrentYear] = useState(selectedDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(selectedDate.getMonth()); // 0-11

  // Handle month switching
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sunday, 1 = Monday...

    const days: (Date | null)[] = [];

    // Add empty slots for days before the 1st of the month
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }

    // Add dates of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(currentYear, currentMonth, i));
    }

    return days;
  }, [currentYear, currentMonth]);

  const formatDateStr = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleDateClick = (date: Date) => {
    const dateStr = formatDateStr(date);
    router.push(`/calendar?date=${dateStr}`);
  };

  const monthName = new Date(currentYear, currentMonth, 1).toLocaleString("en-US", {
    month: "long",
  });

  const entryDateSet = useMemo(() => new Set(entryDates), [entryDates]);

  return (
    <div className="border border-gray-200 bg-white p-5 rounded-sm max-w-sm w-full mx-auto md:mx-0">
      {/* Month Navigator Header */}
      <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2">
        <button
          onClick={handlePrevMonth}
          className="text-gray-500 hover:text-gray-900 font-bold p-1 text-sm cursor-pointer"
        >
          &larr;
        </button>
        <span className="font-serif font-bold text-gray-900 text-sm">
          {monthName} {currentYear}
        </span>
        <button
          onClick={handleNextMonth}
          className="text-gray-500 hover:text-gray-900 font-bold p-1 text-sm cursor-pointer"
        >
          &rarr;
        </button>
      </div>

      {/* Week Day Labels */}
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
        <span>Su</span>
        <span>Mo</span>
        <span>Tu</span>
        <span>We</span>
        <span>Th</span>
        <span>Fr</span>
        <span>Sa</span>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const dateStr = formatDateStr(day);
          const hasEntry = entryDateSet.has(dateStr);
          const isSelected = dateStr === selectedDateStr;

          return (
            <button
              key={dateStr}
              onClick={() => handleDateClick(day)}
              className={`aspect-square flex flex-col items-center justify-center text-xs relative rounded-sm transition-colors cursor-pointer ${
                isSelected
                  ? "bg-gray-900 text-white font-bold"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
            >
              <span>{day.getDate()}</span>
              {hasEntry && !isSelected && (
                <span className="w-1 h-1 bg-emerald-700 rounded-full absolute bottom-1" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
