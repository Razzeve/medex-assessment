"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  getFullTimezoneOptions,
  getRelativeTimezoneExplanation,
  getCurrentTimeInTimezone,
  getTimezoneOffsetMinutes,
  formatOffsetMinutes
} from "../utils/timezone";
import { Globe, Search, Clock, Check, ChevronDown, Compass } from "lucide-react";

interface TimezoneSelectorProps {
  patientTimezone: string;
  onSelectTimezone: (timezone: string) => void;
  providerTimezone: string;
  providerName: string;
}

export function TimezoneSelector({
  patientTimezone,
  onSelectTimezone,
  providerTimezone,
  providerName
}: TimezoneSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Live clocks that tick every 10 seconds
  const [now, setNow] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const allTimezones = useMemo(() => getFullTimezoneOptions(), []);

  const filteredTimezones = useMemo(() => {
    if (!searchQuery.trim()) return allTimezones;
    const q = searchQuery.toLowerCase();
    return allTimezones.filter(
      (tz) =>
        tz.label.toLowerCase().includes(q) ||
        tz.city.toLowerCase().includes(q) ||
        tz.country.toLowerCase().includes(q) ||
        tz.iana.toLowerCase().includes(q) ||
        tz.formattedOffset.toLowerCase().includes(q)
    );
  }, [allTimezones, searchQuery]);

  const selectedOption = useMemo(
    () =>
      allTimezones.find((tz) => tz.iana === patientTimezone) || {
        iana: patientTimezone,
        label: patientTimezone,
        city: patientTimezone.split("/").pop() || patientTimezone,
        country: "Regional",
        flag: "🌐",
        formattedOffset: formatOffsetMinutes(getTimezoneOffsetMinutes(patientTimezone, now)),
        offsetMinutes: getTimezoneOffsetMinutes(patientTimezone, now)
      },
    [allTimezones, patientTimezone, now]
  );

  const providerTime = getCurrentTimeInTimezone(providerTimezone, now);
  const patientTime = getCurrentTimeInTimezone(patientTimezone, now);
  const providerCity = providerTimezone.split("/").pop()?.replace(/_/g, " ") || providerTimezone;
  const patientCity = patientTimezone.split("/").pop()?.replace(/_/g, " ") || patientTimezone;

  const comparisonExplanation = getRelativeTimezoneExplanation(
    providerTimezone,
    patientTimezone,
    providerCity,
    patientCity
  );

  const handleAutoDetect = () => {
    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (detected) {
        onSelectTimezone(detected);
      }
    } catch {
      // Fallback
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Dual Clock Comparison Display */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Patient Viewing Timezone
              </span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900">{selectedOption.flag} {selectedOption.city}</span>
                <span className="font-mono text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                  {selectedOption.formattedOffset}
                </span>
              </div>
            </div>
          </div>

          {/* Dual Clock Ticker */}
          <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-medium text-slate-600" title={`Operating at ${providerName}`}>
                Hospital Clock ({providerCity}):
              </span>
              <strong className="font-mono text-slate-900 text-sm">{providerTime}</strong>
            </div>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-slate-600">Your Clock ({patientCity}):</span>
              <strong className="font-mono text-slate-900 text-sm">{patientTime}</strong>
            </div>
          </div>
        </div>

        {/* Right: Dropdown Trigger & Auto Detect */}
        <div className="relative flex items-center gap-2" ref={dropdownRef}>
          <button
            type="button"
            onClick={handleAutoDetect}
            title="Auto-detect my device timezone"
            className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <Compass className="h-3.5 w-3.5 text-teal-600" />
            <span className="hidden sm:inline">Auto-detect</span>
          </button>

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-800 shadow-sm hover:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
          >
            <Clock className="h-3.5 w-3.5 text-teal-600" />
            <span>Change Timezone</span>
            <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Timezone Selector Dropdown */}
          {isOpen && (
            <div
              className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-xl"
              role="listbox"
            >
              {/* Search Bar */}
              <div className="relative mb-2.5">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search city, country, or UTC..."
                  className="w-full rounded-md border border-slate-300 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                  autoFocus
                />
              </div>

              {/* Quick Picks */}
              <div className="mb-2 border-b border-slate-100 pb-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Quick Select
                </span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {[
                    { label: "Kathmandu", iana: "Asia/Kathmandu" },
                    { label: "Bangkok", iana: "Asia/Bangkok" },
                    { label: "New Delhi", iana: "Asia/Kolkata" },
                    { label: "Singapore", iana: "Asia/Singapore" },
                    { label: "London", iana: "Europe/London" },
                    { label: "New York", iana: "America/New_York" }
                  ].map((quick) => (
                    <button
                      key={quick.iana}
                      type="button"
                      onClick={() => {
                        onSelectTimezone(quick.iana);
                        setIsOpen(false);
                      }}
                      className={`rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${
                        patientTimezone === quick.iana
                          ? "bg-teal-600 text-white"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {quick.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scrollable List */}
              <div className="max-h-56 overflow-y-auto space-y-1">
                {filteredTimezones.map((tz) => {
                  const isSelected = tz.iana === patientTimezone;
                  return (
                    <button
                      key={tz.iana}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        onSelectTimezone(tz.iana);
                        setIsOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors ${
                        isSelected
                          ? "bg-teal-50 text-teal-800 font-semibold"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{tz.flag}</span>
                        <div>
                          <p className="font-medium">{tz.city}, {tz.country}</p>
                          <p className="text-[10px] text-slate-400">{tz.iana}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-slate-500">{tz.formattedOffset}</span>
                        {isSelected && <Check className="h-4 w-4 text-teal-600" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Relative Time Differential Banner */}
      <div className="mt-3 flex items-center gap-2 rounded-lg bg-teal-50/70 border border-teal-100 px-3 py-1.5 text-xs text-teal-900">
        <Clock className="h-3.5 w-3.5 text-teal-600 flex-shrink-0" />
        <span className="font-medium">{comparisonExplanation}</span>
        <span className="hidden md:inline text-teal-700 text-[11px]">
          Times are displayed in both timezones simultaneously across all appointment cards.
        </span>
      </div>
    </div>
  );
}
