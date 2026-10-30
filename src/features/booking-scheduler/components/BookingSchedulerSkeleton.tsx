import React from 'react';

/**
 * Standardized Loading Skeleton for Appointment Scheduler & Multi-Timezone Booking.
 * Strictly adheres to design tokens: bg-slate-200 rounded-lg animate-pulse
 * and mirrors the exact section layout of the booking scheduler view.
 */
export function BookingSchedulerSkeleton() {
  return (
    <div className="w-full space-y-6" aria-label="Loading booking scheduler" aria-busy="true">
      {/* 1. Practitioner Profile Card Skeleton */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-lg bg-slate-200 animate-pulse shrink-0" />
            <div className="space-y-2">
              <div className="h-6 w-48 rounded-lg bg-slate-200 animate-pulse" />
              <div className="h-4 w-64 rounded-lg bg-slate-200 animate-pulse" />
            </div>
          </div>
          <div className="h-8 w-28 rounded-lg bg-slate-200 animate-pulse" />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="h-9 w-36 rounded-lg bg-slate-200 animate-pulse" />
          ))}
        </div>
      </div>

      {/* 2. Timezone Selector Skeleton */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="h-4 w-32 rounded-lg bg-slate-200 animate-pulse" />
            <div className="h-10 w-full max-w-md rounded-lg bg-slate-200 animate-pulse" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-9 w-40 rounded-lg bg-slate-200 animate-pulse" />
            <div className="h-9 w-40 rounded-lg bg-slate-200 animate-pulse" />
          </div>
        </div>
      </div>

      {/* 3. Group Size Selector Skeleton */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="h-5 w-40 rounded-lg bg-slate-200 animate-pulse" />
            <div className="h-3.5 w-60 rounded-lg bg-slate-200 animate-pulse" />
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((g) => (
              <div key={g} className="h-10 w-16 rounded-lg bg-slate-200 animate-pulse" />
            ))}
          </div>
        </div>
      </div>

      {/* 4. Date Picker Carousel Skeleton */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 w-40 rounded-lg bg-slate-200 animate-pulse" />
          <div className="h-8 w-24 rounded-lg bg-slate-200 animate-pulse" />
        </div>
        <div className="grid grid-cols-7 gap-2.5">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-24 rounded-lg bg-slate-200 animate-pulse" />
          ))}
        </div>
      </div>

      {/* 5. Slot Grid Skeleton */}
      <div className="space-y-4">
        {[1, 2, 3].map((g) => (
          <div key={g} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="h-5 w-36 rounded-lg bg-slate-200 animate-pulse mb-4" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {[1, 2, 3, 4, 5].map((s) => (
                <div key={s} className="h-20 rounded-lg bg-slate-200 animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

