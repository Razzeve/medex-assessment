"use client";

import React from "react";
import {
  Provider,
  Specialist,
  DayOfWeek
} from "../types";
import {
  Clock,
  MapPin,
  Calendar,
  AlertTriangle,
  Stethoscope,
  Info,
  DollarSign
} from "lucide-react";
import { formatDayAbbreviation } from "../utils/slots";

interface PractitionerCardProps {
  provider: Provider;
  specialist: Specialist;
  onSelectSpecialist: (specialistId: string) => void;
  selectedDate: string;
  overlapWarning?: string;
}

export function PractitionerCard({
  provider,
  specialist,
  onSelectSpecialist,
  selectedDate,
  overlapWarning
}: PractitionerCardProps) {
  const [year, month, day] = selectedDate.split("-").map((v) => parseInt(v, 10));
  const dateObj = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const days: DayOfWeek[] = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday"
  ];
  const currentDayOfWeek = days[dateObj.getUTCDay()];
  const todaySchedule = provider.daySchedules[currentDayOfWeek];

  const countryFlags: Record<string, string> = {
    TH: "🇹🇭 Thailand",
    NP: "🇳🇵 Nepal",
    IN: "🇮🇳 India",
    SG: "🇸🇬 Singapore"
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200">
      {/* Top Header: Provider Info & Specialist Selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3.5">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-200 shadow-sm font-bold text-lg">
            {specialist.name.replace("Dr. ", "").charAt(0)}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold tracking-tight text-slate-900">
                {specialist.name}
              </h2>
              <span className="inline-flex items-center rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-700 border border-teal-200">
                {specialist.speciality}
              </span>
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1 font-semibold text-slate-700">
                <MapPin className="h-3.5 w-3.5 text-teal-600" />
                {provider.name}
              </span>
              <span>•</span>
              <span>{countryFlags[provider.country] || provider.country}</span>
              <span>•</span>
              <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-700">
                {provider.resolvedTimezone}
              </span>
            </div>
          </div>
        </div>

        {/* Specialist Selector Dropdown if multiple specialists */}
        {provider.specialists.length > 1 && (
          <div className="relative">
            <label htmlFor="specialist-select" className="sr-only">
              Select Specialist
            </label>
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-100 focus-within:ring-2 focus-within:ring-teal-500">
              <Stethoscope className="h-3.5 w-3.5 text-teal-600" />
              <select
                id="specialist-select"
                value={specialist.id}
                onChange={(e) => onSelectSpecialist(e.target.value)}
                className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer"
                aria-label="Switch specialist"
              >
                {provider.specialists.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.speciality})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Specialist & Hospital Consultation Specs */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 border-t border-slate-100 pt-3">
        <div className="rounded-lg bg-slate-50 p-2.5">
          <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
            <Clock className="h-3 w-3 text-slate-400" />
            Session Duration
          </span>
          <p className="mt-0.5 text-sm font-semibold text-slate-800">
            {specialist.consultation.durationInMinutes} mins
            {specialist.consultation.bufferInMinutes > 0 && (
              <span className="text-xs font-normal text-slate-500 ml-1">
                (+{specialist.consultation.bufferInMinutes}m buffer)
              </span>
            )}
          </p>
        </div>

        <div className="rounded-lg bg-slate-50 p-2.5">
          <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
            <Calendar className="h-3 w-3 text-slate-400" />
            Specialist Hours
          </span>
          <p className="mt-0.5 text-sm font-semibold text-slate-800 font-mono">
            {specialist.consultation.startTime} – {specialist.consultation.endTime}
          </p>
        </div>

        <div className="rounded-lg bg-slate-50 p-2.5">
          <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
            <Info className="h-3 w-3 text-slate-400" />
            Facility Hours ({formatDayAbbreviation(selectedDate)})
          </span>
          <p className="mt-0.5 text-sm font-semibold text-slate-800 font-mono">
            {todaySchedule ? (
              `${todaySchedule.startTime} – ${todaySchedule.endTime}`
            ) : (
              <span className="text-rose-600 font-medium">Facility Closed</span>
            )}
          </p>
        </div>

        <div className="rounded-lg bg-slate-50 p-2.5">
          <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
            <DollarSign className="h-3 w-3 text-emerald-600" />
            Consultation Fee
          </span>
          <p className="mt-0.5 text-sm font-bold text-slate-900">
            {specialist.fee.currency} {specialist.fee.amount.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Overlap Explanation Alert */}
      {overlapWarning && (
        <div
          role="alert"
          className="mt-3 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"
        >
          <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-600 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold text-amber-950">Operating Hours Adjustment: </span>
            <span>{overlapWarning} Only overlapping slots are bookable.</span>
          </div>
        </div>
      )}

      {/* Free-text Timezone Normalization Audit Note */}
      {provider.timezoneResolutionNote && (
        <div className="mt-2.5 flex items-center gap-2 text-[11px] text-slate-500 bg-slate-100/70 rounded-md px-2.5 py-1.5">
          <Info className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
          <span>
            <strong className="font-medium text-slate-700">Timezone Normalization: </strong>
            Provider configured <code className="bg-white px-1 py-0.5 rounded border border-slate-200 text-slate-800">{provider.rawTimezone || "empty"}</code> → Resolved to <strong className="text-teal-700">{provider.resolvedTimezone}</strong>.
          </span>
        </div>
      )}
    </div>
  );
}
