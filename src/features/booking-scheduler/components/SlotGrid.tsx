"use client";

import React, { useMemo } from "react";
import { ScheduledSlot, DayAvailability } from "../types";
import {
  Sun,
  Sunset,
  Moon,
  Clock,
  CheckCircle2,
  Calendar,
  ArrowRight
} from "lucide-react";

interface SlotGridProps {
  slots: ScheduledSlot[];
  selectedSlot: ScheduledSlot | null;
  onSelectSlot: (slot: ScheduledSlot) => void;
  isLoading?: boolean;
  providerCity: string;
  patientCity: string;
  dayAvailability?: DayAvailability;
  onJumpToNextAvailableDate?: () => void;
  nextAvailableDay?: DayAvailability | null;
  groupSize?: number;
}

export function SlotGrid({
  slots,
  selectedSlot,
  onSelectSlot,
  isLoading = false,
  providerCity,
  patientCity,
  dayAvailability,
  onJumpToNextAvailableDate,
  nextAvailableDay,
  groupSize = 1
}: SlotGridProps) {
  // Group slots by period
  const groupedSlots = useMemo(() => {
    const morning: ScheduledSlot[] = [];
    const afternoon: ScheduledSlot[] = [];
    const evening: ScheduledSlot[] = [];

    slots.forEach((slot) => {
      if (slot.period === "morning") morning.push(slot);
      else if (slot.period === "afternoon") afternoon.push(slot);
      else evening.push(slot);
    });

    return { morning, afternoon, evening };
  }, [slots]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((g) => (
          <div key={g} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="h-5 w-32 bg-slate-200 rounded animate-pulse mb-3" />
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {[1, 2, 3, 4, 5].map((s) => (
                <div key={s} className="h-20 rounded-xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state handling
  const availableCount = slots.filter((s) => s.isAvailable && s.isEligibleForGroupSize).length;
  if (slots.length === 0 || availableCount === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200">
          <Calendar className="h-7 w-7" />
        </div>
        <h3 className="mt-3.5 text-base font-bold text-slate-900">
          No Available Slots for this Date
        </h3>
        <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
          {dayAvailability?.closureReason ||
            (groupSize > 1
              ? `There are no ${groupSize} consecutive free slots available with this specialist on this date.`
              : "All appointments for this date have been booked or the clinic has concluded consultations for today.")}
        </p>

        {nextAvailableDay && onJumpToNextAvailableDate && (
          <div className="mt-5">
            <button
              type="button"
              onClick={onJumpToNextAvailableDate}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 transition-colors"
            >
              <span>Next Available Date: {nextAvailableDay.formattedDate}</span>
              <span className="rounded bg-teal-700/60 px-1.5 py-0.5 text-xs">
                {nextAvailableDay.availableSlotsCount} free slots
              </span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    );
  }

  const renderSlotGroup = (
    title: string,
    periodSlots: ScheduledSlot[],
    icon: React.ReactNode,
    timeRange: string
  ) => {
    if (periodSlots.length === 0) return null;

    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm mb-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
          <div className="flex items-center gap-2 text-slate-800">
            {icon}
            <h4 className="text-sm font-bold tracking-tight">{title}</h4>
            <span className="text-xs text-slate-400 font-mono">({timeRange})</span>
          </div>
          <span className="text-xs font-medium text-slate-500">
            {periodSlots.filter((s) => s.isAvailable && s.isEligibleForGroupSize).length} of {periodSlots.length} available
          </span>
        </div>

        <div
          role="grid"
          aria-label={`${title} appointment slots`}
          className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
        >
          {periodSlots.map((slot) => {
            const isSelected = selectedSlot?.id === slot.id;
            const isSelectable = slot.isAvailable && slot.isEligibleForGroupSize;

            return (
              <button
                key={slot.id}
                type="button"
                role="gridcell"
                disabled={!isSelectable}
                aria-disabled={!isSelectable}
                aria-selected={isSelected}
                aria-label={`Hospital time: ${slot.startTime} in ${providerCity}. Your time: ${slot.patientTime.startTime} in ${patientCity}. Status: ${slot.status}`}
                onClick={() => isSelectable && onSelectSlot(slot)}
                className={`group relative flex flex-col justify-between rounded-xl p-3 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  isSelected
                    ? "border-2 border-teal-600 bg-teal-50/70 shadow-md ring-1 ring-teal-500"
                    : isSelectable
                    ? "border border-slate-200 bg-white hover:border-teal-400 hover:shadow-sm"
                    : slot.isBooked
                    ? "border border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed"
                    : slot.isPast
                    ? "border border-slate-100 bg-slate-50/70 opacity-40 cursor-not-allowed"
                    : "border border-amber-100 bg-amber-50/30 opacity-60 cursor-not-allowed"
                }`}
              >
                {/* Primary: Provider Time (Hospital arrival clock) */}
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1">
                      <Clock className="h-3 w-3 text-teal-600" />
                      {providerCity}
                    </span>
                    {isSelected && <CheckCircle2 className="h-4 w-4 text-teal-600" />}
                  </div>
                  <p className="mt-0.5 text-base font-bold font-mono text-slate-900">
                    {slot.startTime}
                    <span className="text-xs font-normal text-slate-400 ml-1">
                      – {slot.endTime}
                    </span>
                  </p>
                </div>

                {/* Secondary: Patient Local Time */}
                <div className="mt-2.5 border-t border-slate-100/80 pt-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium text-slate-400">
                      Your Time ({patientCity})
                    </span>
                    {slot.patientTime.dateOffsetDays !== 0 && (
                      <span className={`text-[9px] font-bold px-1 rounded ${
                        slot.patientTime.dateOffsetDays > 0 ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                      }`}>
                        {slot.patientTime.dateOffsetDays > 0 ? "+1 Day" : "-1 Day"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold font-mono text-slate-600">
                    {slot.patientTime.startTime} – {slot.patientTime.endTime}
                  </p>
                </div>

                {/* Status Badges for unavailable states */}
                {!isSelectable && (
                  <div className="mt-2 text-center">
                    {slot.isBooked ? (
                      <span className="inline-block w-full rounded bg-rose-50 px-1 py-0.5 text-[10px] font-medium text-rose-700 border border-rose-100">
                        Booked
                      </span>
                    ) : slot.isPast ? (
                      <span className="inline-block w-full rounded bg-slate-100 px-1 py-0.5 text-[10px] font-medium text-slate-500">
                        Passed
                      </span>
                    ) : (
                      <span className="inline-block w-full rounded bg-amber-50 px-1 py-0.5 text-[10px] font-medium text-amber-700 border border-amber-100">
                        Needs {groupSize} slots
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div>
      {renderSlotGroup(
        "Morning Slots",
        groupedSlots.morning,
        <Sun className="h-4 w-4 text-amber-500" />,
        "Before 12:00"
      )}
      {renderSlotGroup(
        "Afternoon Slots",
        groupedSlots.afternoon,
        <Sunset className="h-4 w-4 text-orange-500" />,
        "12:00 – 17:00"
      )}
      {renderSlotGroup(
        "Evening Slots",
        groupedSlots.evening,
        <Moon className="h-4 w-4 text-indigo-500" />,
        "17:00 and onwards"
      )}
    </div>
  );
}
