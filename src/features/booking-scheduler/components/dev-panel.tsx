"use client";

import React, { useState } from "react";
import {
  Wrench,
  X,
  RotateCcw,
  Sliders,
  Hospital
} from "lucide-react";
import { Provider, ExistingBooking } from "../types";

interface DevPanelProps {
  providers: Provider[];
  selectedProviderId: number;
  onSelectProvider: (id: number) => void;
  simulate409: boolean;
  onToggle409: (val: boolean) => void;
  simulate500: boolean;
  onToggle500: (val: boolean) => void;
  simulateOffline: boolean;
  onToggleOffline: (val: boolean) => void;
  latencyMs: number;
  onChangeLatency: (val: number) => void;
  isRescheduleMode: boolean;
  onToggleRescheduleMode: (val: boolean) => void;
  existingBooking?: ExistingBooking | null;
  onResetDatabase: () => void;
}

export function DevPanel({
  providers,
  selectedProviderId,
  onSelectProvider,
  simulate409,
  onToggle409,
  simulate500,
  onToggle500,
  simulateOffline,
  onToggleOffline,
  latencyMs,
  onChangeLatency,
  isRescheduleMode,
  onToggleRescheduleMode,
  existingBooking,
  onResetDatabase
}: DevPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const activeOverridesCount =
    (simulate409 ? 1 : 0) +
    (simulate500 ? 1 : 0) +
    (simulateOffline ? 1 : 0) +
    (latencyMs > 0 ? 1 : 0) +
    (isRescheduleMode ? 1 : 0);

  return (
    <>
      {/* Floating Trigger Pill */}
      <div className="fixed bottom-4 right-4 z-40">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Open Task 3 Dev Simulation Panel"
          className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-bold text-white shadow-xl hover:bg-slate-800 transition-all focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <Wrench className="h-4 w-4 text-teal-400" />
          <span>Task 3 Dev Panel</span>
          {activeOverridesCount > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-teal-500 px-1 text-[10px] font-bold text-slate-950">
              {activeOverridesCount}
            </span>
          )}
        </button>
      </div>

      {/* Slide-out Drawer */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Developer Simulation Controls"
          className="fixed bottom-16 right-4 z-50 w-88 rounded-2xl border border-slate-700 bg-slate-900/95 p-4 text-slate-100 shadow-2xl backdrop-blur-md max-h-[85vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-teal-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Evaluation & Edge-Case Dev Panel
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded p-1 text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3.5 text-xs">
            {/* Quick Provider Switcher */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                <Hospital className="h-3.5 w-3.5 text-teal-400" />
                Active Healthcare Provider:
              </label>
              <select
                value={selectedProviderId}
                onChange={(e) => onSelectProvider(parseInt(e.target.value, 10))}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs text-white focus:border-teal-500 focus:outline-none"
              >
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.country}] {p.name} ({p.resolvedTimezone})
                  </option>
                ))}
              </select>
            </div>

            {/* Reschedule Flow Switcher */}
            <div className="rounded-xl border border-indigo-900 bg-indigo-950/60 p-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-indigo-300">Reschedule Flow</span>
                  <p className="text-[10px] text-indigo-200/70">
                    Existing booking: <code className="text-white">{existingBooking?.bookingId || "BK-..."}</code>
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={isRescheduleMode}
                  onChange={(e) => onToggleRescheduleMode(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 text-indigo-500 focus:ring-indigo-400"
                />
              </div>
            </div>

            {/* 409 Conflict Simulation */}
            <div className="rounded-xl border border-amber-900/60 bg-amber-950/40 p-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-amber-300">Simulate 409 Conflict</span>
                  <p className="text-[10px] text-amber-200/70">
                    Simulates another patient snatching the slot first
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={simulate409}
                  onChange={(e) => onToggle409(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 text-amber-500 focus:ring-amber-400"
                />
              </div>
            </div>

            {/* 500 Failure Simulation */}
            <div className="rounded-xl border border-rose-900/60 bg-rose-950/40 p-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-rose-300">Simulate 500 Server Error</span>
                  <p className="text-[10px] text-rose-200/70">
                    Tests API error retry banner without losing form state
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={simulate500}
                  onChange={(e) => onToggle500(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 text-rose-500 focus:ring-rose-400"
                />
              </div>
            </div>

            {/* Offline Simulation */}
            <div className="rounded-xl border border-slate-800 bg-slate-800/60 p-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-300">Simulate Offline Mode</span>
                  <p className="text-[10px] text-slate-400">
                    Prevents actions whose result is unknown
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={simulateOffline}
                  onChange={(e) => onToggleOffline(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 text-slate-400 focus:ring-slate-400"
                />
              </div>
            </div>

            {/* Artificial Latency Slider */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-slate-400">
                  Artificial Latency:
                </span>
                <span className="font-mono font-bold text-teal-400">
                  {latencyMs}ms
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="2000"
                step="100"
                value={latencyMs}
                onChange={(e) => onChangeLatency(parseInt(e.target.value, 10))}
                className="w-full accent-teal-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>0ms (Instant)</span>
                <span>800ms</span>
                <span>2000ms (Slow 3G)</span>
              </div>
            </div>

            {/* Reset Database Button */}
            <div className="pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onResetDatabase}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5 text-teal-400" />
                Reset Mock State & Clear Bookings
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
