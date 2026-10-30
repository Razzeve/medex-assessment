"use client";

import React, { useState, useMemo, useRef } from "react";
import { DayAvailability } from "../types";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";

interface DatePickerCarouselProps {
  days: DayAvailability[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  isLoading?: boolean;
}

const DAYS_PER_VIEW = 7;

export function DatePickerCarousel({
  days,
  selectedDate,
  onSelectDate,
  isLoading = false
}: DatePickerCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Find index of selected date
  const selectedIndex = useMemo(
    () => Math.max(0, days.findIndex((d) => d.date === selectedDate)),
    [days, selectedDate]
  );

  // Manual page override if user clicked next/prev
  const [manualPageIndex, setManualPageIndex] = useState<number | null>(null);

  const selectedPageIndex = Math.floor(selectedIndex / DAYS_PER_VIEW);
  const activePageIndex = manualPageIndex !== null ? manualPageIndex : selectedPageIndex;
  const startIndex = Math.min(
    Math.max(0, activePageIndex * DAYS_PER_VIEW),
    Math.max(0, days.length - DAYS_PER_VIEW)
  );

  const visibleDays = useMemo(() => {
    return days.slice(startIndex, startIndex + DAYS_PER_VIEW);
  }, [days, startIndex]);

  const canGoPrev = startIndex > 0;
  const canGoNext = startIndex + DAYS_PER_VIEW < days.length;

  const handlePrev = () => {
    setManualPageIndex(Math.max(0, activePageIndex - 1));
  };

  const handleNext = () => {
    setManualPageIndex(Math.min(Math.floor((days.length - 1) / DAYS_PER_VIEW), activePageIndex + 1));
  };

  const handleJumpToToday = () => {
    setManualPageIndex(0);
    if (days.length > 0) {
      onSelectDate(days[0].date);
    }
  };

  const handleSelectDateAndResetPage = (date: string) => {
    setManualPageIndex(null);
    onSelectDate(date);
  };

  // Keyboard navigation for arrow keys
  const handleKeyDown = (e: React.KeyboardEvent, indexInDays: number) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      const nextIndex = Math.min(days.length - 1, indexInDays + 1);
      onSelectDate(days[nextIndex].date);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prevIndex = Math.max(0, indexInDays - 1);
      onSelectDate(days[prevIndex].date);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 w-40 rounded-lg bg-slate-200 animate-pulse" />
          <div className="h-8 w-24 rounded-lg bg-slate-200 animate-pulse" />
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 md:grid-cols-7">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-24 rounded-lg bg-slate-200 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs" ref={containerRef}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-teal-600" />
          <h3 className="text-sm font-bold text-slate-900">
            Select Appointment Date
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            (Next 90 Days Schedule)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleJumpToToday}
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Today
          </button>
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
            <button
              type="button"
              onClick={handlePrev}
              disabled={!canGoPrev}
              aria-label="Previous 7 days"
              className="rounded p-1 text-slate-600 hover:bg-white hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 text-xs font-semibold text-slate-600">
              Week {Math.floor(startIndex / 7) + 1} of {Math.ceil(days.length / 7)}
            </span>
            <button
              type="button"
              onClick={handleNext}
              disabled={!canGoNext}
              aria-label="Next 7 days"
              className="rounded p-1 text-slate-600 hover:bg-white hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div
        role="grid"
        aria-label="Calendar 7-day view"
        className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-7"
      >
        {visibleDays.map((day) => {
          const isSelected = day.date === selectedDate;
          const globalIndex = days.findIndex((d) => d.date === day.date);

          return (
            <button
              key={day.date}
              type="button"
              role="gridcell"
              aria-selected={isSelected}
              aria-label={`${day.formattedDate}, ${day.statusLabel}`}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => handleSelectDateAndResetPage(day.date)}
              onKeyDown={(e) => handleKeyDown(e, globalIndex)}
              className={`group relative flex flex-col items-center justify-between rounded-xl p-3 text-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                isSelected
                  ? "border-2 border-teal-600 bg-teal-50/50 shadow-md ring-1 ring-teal-500"
                  : day.isOpen
                  ? "border border-slate-200 bg-white hover:border-teal-300 hover:bg-slate-50"
                  : "border border-slate-100 bg-slate-50/80 opacity-60 cursor-pointer"
              }`}
            >
              <span className={`text-[11px] font-semibold uppercase tracking-wider ${
                isSelected ? "text-teal-700" : "text-slate-500"
              }`}>
                {day.formattedDay}
              </span>

              <span className={`my-1 text-xl font-extrabold ${
                isSelected ? "text-teal-900" : day.isOpen ? "text-slate-900" : "text-slate-400"
              }`}>
                {day.dayNumber}
              </span>

              <span className="text-[10px] font-medium text-slate-400 mb-1.5">
                {day.monthName}
              </span>

              <div className="w-full">
                {day.isClosedByClosure ? (
                  <span className="inline-block w-full truncate rounded bg-rose-50 px-1 py-0.5 text-[10px] font-medium text-rose-700 border border-rose-200" title={day.closureReason}>
                    Holiday
                  </span>
                ) : day.isClosedBySchedule ? (
                  <span className="inline-block w-full truncate rounded bg-slate-100 px-1 py-0.5 text-[10px] font-medium text-slate-500">
                    Closed
                  </span>
                ) : day.availableSlotsCount > 0 ? (
                  <span className={`inline-block w-full truncate rounded px-1 py-0.5 text-[10px] font-semibold border ${
                    isSelected
                      ? "bg-teal-600 text-white border-teal-600"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                  }`}>
                    {day.availableSlotsCount} free
                  </span>
                ) : (
                  <span className="inline-block w-full truncate rounded bg-amber-50 px-1 py-0.5 text-[10px] font-medium text-amber-700 border border-amber-200">
                    Full
                  </span>
                )}
              </div>

              {day.isToday && (
                <span className="absolute -top-1.5 right-2 rounded-full bg-teal-600 px-1.5 text-[9px] font-bold text-white uppercase tracking-tighter">
                  Today
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
