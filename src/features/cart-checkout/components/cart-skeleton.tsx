import React from 'react';

/**
 * Standardized Loading Skeleton for Healthcare Cart & Split Fulfillment.
 * Strictly adheres to design tokens: bg-slate-200 rounded-lg animate-pulse
 * and matches the 8:4 column layout of the actual cart view.
 */
export function CartSkeleton() {
  return (
    <div className="w-full space-y-6" aria-label="Loading healthcare cart" aria-busy="true">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
        {/* Split Fulfillment Groups Skeleton (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="h-5 w-52 rounded-lg bg-slate-200 animate-pulse" />
            <div className="h-4 w-36 rounded-lg bg-slate-200 animate-pulse" />
          </div>

          {/* 2 Split Fulfillment Package Cards */}
          {[1, 2].map((pkg) => (
            <div
              key={pkg}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs"
            >
              {/* Vendor Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/60 p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-slate-200 animate-pulse shrink-0" />
                  <div className="space-y-1.5">
                    <div className="h-5 w-44 rounded-lg bg-slate-200 animate-pulse" />
                    <div className="h-3.5 w-28 rounded-lg bg-slate-200 animate-pulse" />
                  </div>
                </div>
                <div className="h-7 w-28 rounded-lg bg-slate-200 animate-pulse" />
              </div>

              {/* Items List */}
              <div className="divide-y divide-slate-100 p-4 sm:p-5 space-y-4 sm:space-y-0">
                {[1, 2].map((item) => (
                  <div
                    key={item}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <div className="h-12 w-12 rounded-lg bg-slate-200 animate-pulse shrink-0" />
                      <div className="space-y-2 flex-1">
                        <div className="h-4 w-4/5 rounded-lg bg-slate-200 animate-pulse" />
                        <div className="h-3.5 w-1/2 rounded-lg bg-slate-200 animate-pulse" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-6">
                      <div className="h-8 w-24 rounded-lg bg-slate-200 animate-pulse" />
                      <div className="h-5 w-20 rounded-lg bg-slate-200 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Vendor Subtotal Footer */}
              <div className="border-t border-slate-100 bg-slate-50/40 px-5 py-3.5 flex items-center justify-between">
                <div className="h-4 w-32 rounded-lg bg-slate-200 animate-pulse" />
                <div className="h-5 w-24 rounded-lg bg-slate-200 animate-pulse" />
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary Sticky Column Skeleton (4 Cols) */}
        <div className="lg:col-span-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="h-6 w-36 rounded-lg bg-slate-200 animate-pulse" />
              <div className="h-4 w-12 rounded-lg bg-slate-200 animate-pulse" />
            </div>

            {/* Line items */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <div className="h-4 w-24 rounded-lg bg-slate-200 animate-pulse" />
                <div className="h-4 w-20 rounded-lg bg-slate-200 animate-pulse" />
              </div>
              <div className="flex justify-between">
                <div className="h-4 w-32 rounded-lg bg-slate-200 animate-pulse" />
                <div className="h-4 w-16 rounded-lg bg-slate-200 animate-pulse" />
              </div>
              <div className="flex justify-between">
                <div className="h-4 w-28 rounded-lg bg-slate-200 animate-pulse" />
                <div className="h-4 w-16 rounded-lg bg-slate-200 animate-pulse" />
              </div>
            </div>

            {/* Promo Code Box */}
            <div className="h-10 w-full rounded-lg bg-slate-200 animate-pulse" />

            {/* Total */}
            <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
              <div className="h-6 w-20 rounded-lg bg-slate-200 animate-pulse" />
              <div className="h-7 w-28 rounded-lg bg-slate-200 animate-pulse" />
            </div>

            {/* Checkout CTA Button */}
            <div className="h-11 w-full rounded-lg bg-slate-200 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

