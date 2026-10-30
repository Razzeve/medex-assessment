import { Suspense } from "react";
import { Metadata } from "next";
import { BookingSchedulerView } from "@/features/booking-scheduler/components/BookingSchedulerView";

export const metadata: Metadata = {
  title: "Multi-Timezone Appointment Booking | MedEx",
  description:
    "Cross-border healthcare scheduling across Thailand, Nepal, and India. Accurately converts practitioner working hours and slots across patient time zones with conflict resolution.",
};

export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-12 space-y-6">
          <div className="h-28 rounded-2xl bg-slate-200 animate-pulse" />
          <div className="h-20 rounded-xl bg-slate-200 animate-pulse" />
          <div className="h-32 rounded-xl bg-slate-200 animate-pulse" />
          <div className="h-64 rounded-xl bg-slate-200 animate-pulse" />
        </div>
      }
    >
      <BookingSchedulerView />
    </Suspense>
  );
}

