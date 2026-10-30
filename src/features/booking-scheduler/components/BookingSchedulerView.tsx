"use client";

import React, { useState, useMemo } from "react";
import {
  useBookingProviders,
  useCalendarAvailability,
  useDaySlots,
  useBookAppointmentMutation,
  useRescheduleAppointmentMutation
} from "../hooks/use-booking-scheduler";
import {
  ScheduledSlot,
  BookingResponse,
  RescheduleResponse
} from "../types";
import { PractitionerCard } from "./PractitionerCard";
import { TimezoneSelector } from "./TimezoneSelector";
import { DatePickerCarousel } from "./DatePickerCarousel";
import { SlotGrid } from "./SlotGrid";
import { GroupSizeSelector } from "./GroupSizeSelector";
import { ConflictResolutionBanner } from "./ConflictResolutionBanner";
import { BookingConfirmationModal } from "./BookingConfirmationModal";
import { DevPanel } from "./DevPanel";
import { getCurrentDateInTimezone } from "../utils/timezone";
import { findNextAvailableDate, formatFullDisplayDate } from "../utils/slots";
import {
  AlertCircle,
  CheckCircle2,
  WifiOff,
  RefreshCw
} from "lucide-react";

export function BookingSchedulerView() {
  // Developer simulation controls
  const [simulate409, setSimulate409] = useState(false);
  const [simulate500, setSimulate500] = useState(false);
  const [simulateOffline, setSimulateOffline] = useState(false);
  const [latencyMs, setLatencyMs] = useState(150);
  const [isRescheduleMode, setIsRescheduleMode] = useState(false);

  const devOptions = useMemo(
    () => ({
      latency: latencyMs,
      simulateError: simulate500,
      simulate409
    }),
    [latencyMs, simulate500, simulate409]
  );

  // Load all providers & existing booking
  const {
    data: providerData,
    isLoading: isLoadingProviders,
    isError: isProviderError,
    error: providerError,
    refetch: refetchProviders
  } = useBookingProviders(devOptions);

  const providers = useMemo(() => providerData?.providers || [], [providerData?.providers]);
  const existingBooking = useMemo(() => providerData?.existingBooking || null, [providerData?.existingBooking]);

  // Selected states
  const [userSelectedProviderId, setUserSelectedProviderId] = useState<number | null>(null);
  const [userSelectedSpecialistId, setUserSelectedSpecialistId] = useState<string | null>(null);
  const [userSelectedDate, setUserSelectedDate] = useState<string | null>(null);

  // Default patient timezone to Asia/Kathmandu per the assessment story
  const [patientTimezone, setPatientTimezone] = useState<string>("Asia/Kathmandu");
  const [groupSize, setGroupSize] = useState<number>(1);
  const [selectedSlot, setSelectedSlot] = useState<ScheduledSlot | null>(null);

  // Conflict & modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [conflictError, setConflictError] = useState<{
    time: string;
    closestSlots: ScheduledSlot[];
  } | null>(null);
  const [bookingSuccessData, setBookingSuccessData] = useState<BookingResponse | null>(null);
  const [rescheduleSuccessData, setRescheduleSuccessData] = useState<RescheduleResponse | null>(null);

  // Derived Active Provider
  const selectedProviderId =
    userSelectedProviderId ?? (isRescheduleMode && existingBooking ? existingBooking.providerId : 48);

  const activeProvider = useMemo(() => {
    return providers.find((p) => p.id === selectedProviderId) || providers[0] || null;
  }, [providers, selectedProviderId]);

  // Derived Active Specialist
  const selectedSpecialistId =
    userSelectedSpecialistId ??
    (isRescheduleMode && existingBooking ? existingBooking.specialistId : activeProvider?.specialists[0]?.id || "");

  const activeSpecialist = useMemo(() => {
    if (!activeProvider) return null;
    return (
      activeProvider.specialists.find((s) => s.id === selectedSpecialistId) ||
      activeProvider.specialists[0] ||
      null
    );
  }, [activeProvider, selectedSpecialistId]);

  // Derived Active Date
  const selectedDate = useMemo(() => {
    if (userSelectedDate) return userSelectedDate;
    return activeProvider ? getCurrentDateInTimezone(activeProvider.resolvedTimezone) : "";
  }, [userSelectedDate, activeProvider]);

  const handleToggleRescheduleMode = (val: boolean) => {
    setIsRescheduleMode(val);
    setUserSelectedSpecialistId(null);
    setUserSelectedProviderId(null);
    setUserSelectedDate(null);
    setSelectedSlot(null);
    setConflictError(null);
    if (val && existingBooking) {
      setGroupSize(existingBooking.numberOfPeople || 1);
    }
  };

  // Calendar 90-Day availability query
  const {
    data: calendarDays = [],
    isLoading: isLoadingCalendar,
    refetch: refetchCalendar
  } = useCalendarAvailability(
    activeProvider?.id,
    activeSpecialist?.id,
    groupSize,
    devOptions
  );

  // Day slots query
  const {
    data: slotResult,
    isLoading: isLoadingSlots,
    isError: isSlotsError,
    error: slotsError,
    refetch: refetchSlots
  } = useDaySlots(
    activeProvider?.id,
    activeSpecialist?.id,
    selectedDate,
    patientTimezone,
    groupSize,
    devOptions
  );

  const slots = slotResult?.slots || [];
  const overlapWarning = slotResult?.overlapWarning;

  // Next available date helper
  const nextAvailableDay = useMemo(() => {
    return findNextAvailableDate(calendarDays, selectedDate);
  }, [calendarDays, selectedDate]);

  const activeDayAvailability = useMemo(() => {
    return calendarDays.find((d) => d.date === selectedDate);
  }, [calendarDays, selectedDate]);

  // Mutations
  const bookMutation = useBookAppointmentMutation();
  const rescheduleMutation = useRescheduleAppointmentMutation();

  const handleSelectSlot = (slot: ScheduledSlot) => {
    setSelectedSlot(slot);
    setConflictError(null);
    setIsModalOpen(true);
  };

  const handleConfirmBooking = async (patientData: {
    name: string;
    email: string;
    phone: string;
    notes?: string;
  }) => {
    if (!selectedSlot || !activeProvider || !activeSpecialist) return;

    if (simulateOffline) {
      alert("Cannot execute booking: System is currently in offline mode. Please reconnect.");
      return;
    }

    try {
      if (isRescheduleMode && existingBooking) {
        const response = await rescheduleMutation.mutateAsync({
          bookingId: existingBooking.bookingId,
          request: {
            date: selectedSlot.date,
            startTime: selectedSlot.startTime
          },
          options: devOptions
        });
        setRescheduleSuccessData(response);
        setIsModalOpen(false);
      } else {
        const response = await bookMutation.mutateAsync({
          request: {
            providerId: activeProvider.id,
            specialistId: activeSpecialist.id,
            date: selectedSlot.date,
            startTime: selectedSlot.startTime,
            numberOfPeople: groupSize,
            patientName: patientData.name,
            patientEmail: patientData.email,
            patientPhone: patientData.phone,
            patientTimezone,
            notes: patientData.notes
          },
          options: devOptions
        });
        setBookingSuccessData(response);
        setIsModalOpen(false);
      }
    } catch (err: unknown) {
      const apiErr = err as { status?: number; message?: string; closestAvailableSlots?: ScheduledSlot[] };
      if (apiErr.status === 409 || apiErr.message?.includes("Someone else")) {
        // Someone else got there first!
        setConflictError({
          time: selectedSlot.startTime,
          closestSlots: apiErr.closestAvailableSlots || []
        });
        setIsModalOpen(false);
      } else {
        alert(apiErr.message || "Failed to process booking.");
      }
    }
  };

  const handleJumpToNextAvailable = () => {
    if (nextAvailableDay) {
      setUserSelectedDate(nextAvailableDay.date);
    }
  };

  const handleResetDatabase = async () => {
    await fetch("/api/booking/providers?reset=true");
    refetchProviders();
    refetchCalendar();
    refetchSlots();
    setBookingSuccessData(null);
    setRescheduleSuccessData(null);
    setConflictError(null);
  };

  const providerCity =
    activeProvider?.resolvedTimezone.split("/").pop()?.replace(/_/g, " ") || "Bangkok";
  const patientCity =
    patientTimezone.split("/").pop()?.replace(/_/g, " ") || "Kathmandu";

  if (isLoadingProviders) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 space-y-6">
        <div className="h-28 rounded-2xl bg-slate-200 animate-pulse" />
        <div className="h-16 rounded-xl bg-slate-200 animate-pulse" />
        <div className="h-32 rounded-xl bg-slate-200 animate-pulse" />
        <div className="h-64 rounded-xl bg-slate-200 animate-pulse" />
      </div>
    );
  }

  if (isProviderError || !activeProvider || !activeSpecialist) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-200">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-lg font-bold text-slate-900">
          Failed to Load Booking Scheduler
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {providerError?.message || "Unable to connect to the healthcare provider API."}
        </p>
        <button
          type="button"
          onClick={() => refetchProviders()}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-700"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Retry Connection</span>
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Offline Alert Banner */}
      {simulateOffline && (
        <div className="sticky top-16 z-30 bg-slate-900 text-amber-300 px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 border-b border-amber-500/30">
          <WifiOff className="h-4 w-4 text-amber-400" />
          <span>Offline Simulation Active: You are disconnected from the network. Booking confirmations are paused.</span>
        </div>
      )}

      {/* Main Container */}
      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Story Scenario Hero Banner */}
        <section className="relative overflow-hidden rounded-2xl border border-teal-200/80 bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900 p-6 sm:p-8 text-white shadow-md">
          <div className="relative z-10 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="rounded-full bg-teal-500/20 px-3 py-1 text-xs font-semibold text-teal-200 border border-teal-400/30">
                Task 3: Cross-Timezone Booking Scheduler
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-300">
                Cross-Border Healthcare Marketplace
              </span>
            </div>

            <blockquote className="border-l-4 border-teal-400 pl-4 my-3 text-base sm:text-lg italic font-medium text-teal-50 leading-snug">
              &ldquo;I live in Kathmandu. I&apos;m booking a check-up at a hospital in Bangkok for when I travel there next month. Which time is the appointment, mine or theirs?&rdquo;
            </blockquote>

            <p className="text-xs sm:text-sm text-teal-100/90 leading-relaxed">
              <strong>Both times are displayed simultaneously.</strong> Hospital arrival slots are pinned to the facility&apos;s wall-clock time in <strong>{activeProvider.resolvedTimezone}</strong> alongside your local time in <strong>{patientTimezone}</strong>, with UTC offset differentials and cross-midnight date boundary transitions clearly visualised.
            </p>
          </div>
        </section>

        {/* Reschedule Active Flow Notification */}
        {isRescheduleMode && existingBooking && (
          <aside
            role="status"
            className="rounded-xl border-2 border-indigo-300 bg-indigo-50 p-4 shadow-sm"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold">
                  <RefreshCw className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                    Active Reschedule Flow
                  </span>
                  <h4 className="text-sm font-extrabold text-slate-900">
                    Modifying Booking #{existingBooking.bookingId} ({existingBooking.patientName})
                  </h4>
                  <p className="text-xs text-indigo-950">
                    Original appointment: <strong>{formatFullDisplayDate(existingBooking.date)} at {existingBooking.startTime}</strong> ({providerCity} time). Pick a new date and time below to reschedule.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsRescheduleMode(false)}
                className="self-start sm:self-center rounded-lg border border-indigo-300 bg-white px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors"
              >
                Exit Reschedule Mode
              </button>
            </div>
          </aside>
        )}

        {/* Success Confirmation Toast after booking */}
        {bookingSuccessData && (
          <aside
            role="status"
            className="rounded-2xl border-2 border-emerald-400 bg-emerald-50 p-6 shadow-md"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div className="flex-1">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  Appointment Confirmed!
                </span>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Reference: <span className="font-mono text-teal-800">{bookingSuccessData.bookingId}</span>
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-slate-700 leading-relaxed">
                  Patient <strong>{bookingSuccessData.patientName}</strong> is confirmed for <strong>{activeSpecialist.name}</strong> ({activeSpecialist.speciality}) at {activeProvider.name}.
                </p>

                <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg bg-white p-3 border border-emerald-200">
                    <span className="text-[10px] font-bold uppercase text-teal-700">Hospital Arrival Time</span>
                    <p className="text-base font-bold font-mono text-slate-900">
                      {bookingSuccessData.providerTime.startTime} – {bookingSuccessData.providerTime.endTime} ({providerCity})
                    </p>
                    <p className="text-slate-500">{formatFullDisplayDate(bookingSuccessData.providerTime.date)}</p>
                  </div>
                  <div className="rounded-lg bg-white p-3 border border-emerald-200">
                    <span className="text-[10px] font-bold uppercase text-slate-500">Your Local Time</span>
                    <p className="text-base font-bold font-mono text-slate-800">
                      {bookingSuccessData.patientTime.startTime} – {bookingSuccessData.patientTime.endTime} ({patientCity})
                    </p>
                    <p className="text-slate-500">{formatFullDisplayDate(bookingSuccessData.patientTime.date)}</p>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setBookingSuccessData(null)}
                    className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800 transition-colors"
                  >
                    Book Another Appointment
                  </button>
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Success Confirmation Toast after Reschedule */}
        {rescheduleSuccessData && (
          <aside
            role="status"
            className="rounded-2xl border-2 border-indigo-400 bg-indigo-50 p-6 shadow-md"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div className="flex-1">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-800">
                  Appointment Rescheduled!
                </span>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Booking #{rescheduleSuccessData.bookingId} Successfully Updated
                </h3>
                <p className="mt-1 text-xs text-slate-700">
                  Your appointment has been moved from {rescheduleSuccessData.oldBooking.date} ({rescheduleSuccessData.oldBooking.startTime}) to:
                </p>
                <p className="mt-1 font-mono font-bold text-indigo-900 text-sm">
                  {formatFullDisplayDate(rescheduleSuccessData.newBooking.date)} at {rescheduleSuccessData.newBooking.startTime} ({providerCity} time)
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setRescheduleSuccessData(null);
                    setIsRescheduleMode(false);
                  }}
                  className="mt-3 rounded-lg bg-indigo-700 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-800"
                >
                  Done
                </button>
              </div>
            </div>
          </aside>
        )}

        {/* 409 Conflict Resolution Banner */}
        {conflictError && (
          <ConflictResolutionBanner
            conflictingSlotTime={conflictError.time}
            closestSlots={conflictError.closestSlots}
            onSelectAlternative={(altSlot) => {
              setSelectedSlot(altSlot);
              setConflictError(null);
              setIsModalOpen(true);
            }}
            onDismiss={() => setConflictError(null)}
            providerCity={providerCity}
            patientCity={patientCity}
          />
        )}

        {/* Section 1: Practitioner Profile Card */}
        <section aria-labelledby="practitioner-details">
          <h2 id="practitioner-details" className="sr-only">
            Healthcare Practitioner & Facility Profile
          </h2>
          <PractitionerCard
            provider={activeProvider}
            specialist={activeSpecialist}
            onSelectSpecialist={(id) => {
              setUserSelectedSpecialistId(id);
              setSelectedSlot(null);
            }}
            selectedDate={selectedDate}
            overlapWarning={overlapWarning}
          />
        </section>

        {/* Section 2: Timezone Selector & Live Clocks */}
        <section aria-labelledby="timezone-selection">
          <h2 id="timezone-selection" className="sr-only">
            Timezone Selector
          </h2>
          <TimezoneSelector
            patientTimezone={patientTimezone}
            onSelectTimezone={setPatientTimezone}
            providerTimezone={activeProvider.resolvedTimezone}
            providerName={activeProvider.name}
          />
        </section>

        {/* Section 3: Group Size Selector & Rules */}
        <section aria-labelledby="group-size">
          <h2 id="group-size" className="sr-only">
            Group Size Configuration
          </h2>
          <GroupSizeSelector
            groupSize={groupSize}
            onSelectGroupSize={(size) => {
              setGroupSize(size);
              setSelectedSlot(null);
            }}
            durationMinutes={activeSpecialist.consultation.durationInMinutes}
            bufferMinutes={activeSpecialist.consultation.bufferInMinutes}
          />
        </section>

        {/* Section 4: 90-Day Date Picker Carousel */}
        <section aria-labelledby="date-picker">
          <h2 id="date-picker" className="sr-only">
            Calendar Date Selection
          </h2>
          <DatePickerCarousel
            days={calendarDays}
            selectedDate={selectedDate}
            onSelectDate={(d) => {
              setUserSelectedDate(d);
              setSelectedSlot(null);
              setConflictError(null);
            }}
            isLoading={isLoadingCalendar}
          />
        </section>

        {/* Section 5: Interactive Slot Grid grouped by Morning / Afternoon / Evening */}
        <section aria-labelledby="slot-grid">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 id="slot-grid" className="text-base font-bold text-slate-900">
                Available Appointment Times ({formatFullDisplayDate(selectedDate)})
              </h3>
              <p className="text-xs text-slate-500">
                Select a slot to proceed. Both hospital time and your local time are shown.
              </p>
            </div>
          </div>

          {/* Slot Generation Error State with Retry CTA */}
          {isSlotsError && (
            <div
              role="alert"
              className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
                <span>
                  <strong>Failed to load appointment slots:</strong> {slotsError?.message || "Server Error (500)"}. Your current selections have been preserved.
                </span>
              </div>
              <button
                type="button"
                onClick={() => refetchSlots()}
                className="self-start sm:self-auto rounded-lg bg-rose-600 px-3 py-1.5 font-semibold text-white hover:bg-rose-700 transition-colors shadow-sm"
              >
                Retry Request
              </button>
            </div>
          )}

          <SlotGrid
            slots={slots}
            selectedSlot={selectedSlot}
            onSelectSlot={handleSelectSlot}
            isLoading={isLoadingSlots}
            providerCity={providerCity}
            patientCity={patientCity}
            dayAvailability={activeDayAvailability}
            nextAvailableDay={nextAvailableDay}
            onJumpToNextAvailableDate={handleJumpToNextAvailable}
            groupSize={groupSize}
          />
        </section>
      </main>

      {/* Booking Confirmation Dialog Modal */}
      {selectedSlot && (
        <BookingConfirmationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          slot={selectedSlot}
          provider={activeProvider}
          specialist={activeSpecialist}
          groupSize={groupSize}
          isReschedule={isRescheduleMode}
          existingBooking={existingBooking}
          onConfirmBooking={handleConfirmBooking}
          isSubmitting={bookMutation.isPending || rescheduleMutation.isPending}
        />
      )}

      {/* Floating Developer Simulation Panel */}
      <DevPanel
        providers={providers}
        selectedProviderId={selectedProviderId}
        onSelectProvider={(id) => {
          setUserSelectedProviderId(id);
          setUserSelectedSpecialistId(null);
          setUserSelectedDate(null);
          setSelectedSlot(null);
          setConflictError(null);
        }}
        simulate409={simulate409}
        onToggle409={setSimulate409}
        simulate500={simulate500}
        onToggle500={setSimulate500}
        simulateOffline={simulateOffline}
        onToggleOffline={setSimulateOffline}
        latencyMs={latencyMs}
        onChangeLatency={setLatencyMs}
        isRescheduleMode={isRescheduleMode}
        onToggleRescheduleMode={handleToggleRescheduleMode}
        existingBooking={existingBooking}
        onResetDatabase={handleResetDatabase}
      />
    </div>
  );
}
