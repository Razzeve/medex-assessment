"use client";

import React from "react";
import { ScheduledSlot } from "../types";
import { AlertCircle, Clock, ArrowRight, X } from "lucide-react";

interface ConflictResolutionBannerProps {
  conflictingSlotTime: string;
  closestSlots?: ScheduledSlot[];
  onSelectAlternative: (slot: ScheduledSlot) => void;
  onDismiss: () => void;
  providerCity: string;
  patientCity: string;
}

export function ConflictResolutionBanner({
  conflictingSlotTime,
  closestSlots = [],
  onSelectAlternative,
  onDismiss,
  providerCity,
  patientCity
}: ConflictResolutionBannerProps) {
  return (
    <div
      role="alert"
      className="relative rounded-xl border-2 border-amber-300 bg-amber-50/90 p-4 shadow-md transition-all"
    >
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss alert"
        className="absolute right-3 top-3 rounded p-1 text-amber-700 hover:bg-amber-100"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
          <AlertCircle className="h-5 w-5" />
        </div>
        <div className="flex-1 pr-6">
          <h4 className="text-sm font-bold text-amber-950">
            Someone else got there first! (409 Conflict)
          </h4>
          <p className="mt-1 text-xs text-amber-900 leading-relaxed">
            The <strong>{conflictingSlotTime}</strong> slot was just reserved by another patient right before your confirmation.
            <strong> Don&apos;t worry — all your information and patient details have been preserved.</strong> Please pick one of the closest available alternatives below:
          </p>

          {/* Quick Select Alternative Slot Buttons */}
          {closestSlots.length > 0 && (
            <div className="mt-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                Recommended Closest Slots:
              </span>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {closestSlots.map((slot) => (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => onSelectAlternative(slot)}
                    className="flex items-center gap-2 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm hover:border-teal-500 hover:bg-teal-50 hover:text-teal-900 transition-all"
                  >
                    <Clock className="h-3.5 w-3.5 text-teal-600" />
                    <span>{slot.startTime} ({providerCity})</span>
                    <span className="text-[10px] text-slate-400">/</span>
                    <span className="text-[11px] font-normal text-slate-600">
                      {slot.patientTime.startTime} ({patientCity})
                    </span>
                    <ArrowRight className="h-3 w-3 text-teal-600 ml-1" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

