import { Suspense } from "react";
import { Metadata } from "next";
import { BookingSchedulerView } from "@/features/booking-scheduler/components/BookingSchedulerView";
import { BookingSchedulerSkeleton } from "@/features/booking-scheduler/components/BookingSchedulerSkeleton";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "Multi-Timezone Appointment Booking | MedEx",
  description:
    "Cross-border healthcare scheduling across Thailand, Nepal, and India. Accurately converts practitioner working hours and slots across patient time zones with conflict resolution.",
};

export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 pb-20">
          <PageHeader
            title="Appointment Scheduler & Multi-Timezone Booking"
            description="Book clinical consultations across international practitioner time zones with automatic offset conversion and conflict prevention."
            actions={
              <div className="h-8 w-36 rounded-lg bg-slate-200 animate-pulse" />
            }
          />
          <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
            <BookingSchedulerSkeleton />
          </main>
        </div>
      }
    >
      <BookingSchedulerView />
    </Suspense>
  );
}
