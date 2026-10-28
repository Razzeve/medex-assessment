import React, { useState } from "react";
import { UserCheck, CheckCircle2, ChevronRight, X, ArrowRight } from "lucide-react";
import { useCartStore } from "../store/useCartStore";

export function GuestCartMergeBanner() {
  const guestCart = useCartStore((state) => state.guestCart);
  const lastChanges = useCartStore((state) => state.lastChanges);
  const mergeGuestCart = useCartStore((state) => state.mergeGuestCart);
  const isLoading = useCartStore((state) => state.isLoading);

  const [dismissed, setDismissed] = useState(false);
  const [showChangesModal, setShowChangesModal] = useState(false);

  // If already dismissed, don't show
  if (dismissed) return null;

  // If merge has just happened and we have changes, show a success banner with "View Changes"
  if (lastChanges && lastChanges.length > 0) {
    return (
      <div className="relative mb-6 overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-emerald-950">
                Guest Cart Merged Successfully
              </h4>
              <p className="mt-0.5 text-xs text-emerald-800">
                Processed {lastChanges.length} items from your guest session into your MedEx account.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowChangesModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800 shadow-2xs hover:bg-emerald-50 transition-colors"
            >
              <span>View Audit Log ({lastChanges.length})</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="p-1.5 text-emerald-700 hover:text-emerald-900 transition-colors rounded-lg hover:bg-emerald-100"
              aria-label="Dismiss banner"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Audit Log Modal / Expansion */}
        {showChangesModal && (
          <div className="mt-4 border-t border-emerald-200/80 pt-4">
            <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-900 mb-2">
              Itemized Merge Changes:
            </h5>
            <div className="space-y-2">
              {lastChanges.map((change, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 rounded-lg bg-white/80 p-2.5 text-xs border border-emerald-100"
                >
                  <span className="font-bold text-slate-800 shrink-0">{idx + 1}.</span>
                  <div className="flex-1">
                    <span className="font-semibold text-slate-900">{change.title}: </span>
                    <span className="text-slate-700">{change.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Pre-merge banner
  if (!guestCart || guestCart.length === 0) return null;

  return (
    <div className="relative mb-6 overflow-hidden rounded-2xl border border-teal-200 bg-teal-50/70 p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-teal-950">
                Guest Cart Session Detected
              </h4>
              <span className="rounded-full bg-teal-200/80 px-2 py-0.5 text-[10px] font-bold text-teal-900">
                4 items in cache
              </span>
            </div>
            <p className="mt-0.5 text-xs text-teal-800 leading-relaxed max-w-2xl">
              You saved services prior to signing in (Liver Function Profile, Lipid Profile, Signature Facial with duration, and an archived item). Merge them with your account cart now.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => mergeGuestCart()}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-teal-800 disabled:opacity-50 transition-colors"
          >
            <span>{isLoading ? "Merging..." : "Merge Guest Items"}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="p-1.5 text-teal-700 hover:text-teal-900 transition-colors rounded-lg hover:bg-teal-100"
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
