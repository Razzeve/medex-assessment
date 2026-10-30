import {
  DayOfWeek,
  ScheduledSlot,
  SlotPeriod,
  Specialist,
  Provider,
  BookedSlot,
  ProviderClosure,
  DayAvailability,
  SlotAvailabilityStatus
} from "../types";
import {
  parseZonedInstant,
  formatInstantInTimezone,
  getCurrentDateInTimezone,
  getCurrentTimeInTimezone
} from "./timezone";

/**
 * Converts a "HH:mm" time string into total minutes from midnight.
 */
export function timeStringToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map((v) => parseInt(v, 10));
  return h * 60 + m;
}

/**
 * Converts minutes from midnight into a "HH:mm" 24-hour string.
 */
export function minutesToTimeString(minutes: number): string {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60).toString().padStart(2, "0");
  const m = (normalized % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

/**
 * Maps a Date or day index to MedEx DayOfWeek string.
 */
export function getDayOfWeekFromDate(dateStr: string): DayOfWeek {
  const [year, month, day] = dateStr.split("-").map((v) => parseInt(v, 10));
  const d = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const days: DayOfWeek[] = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday"
  ];
  return days[d.getUTCDay()];
}

/**
 * Formats day string for UI display.
 */
export function formatDayAbbreviation(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map((v) => parseInt(v, 10));
  const d = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  return d.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
}

export function formatMonthAbbreviation(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map((v) => parseInt(v, 10));
  const d = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  return d.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
}

export function formatFullDisplayDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map((v) => parseInt(v, 10));
  const d = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  });
}

/**
 * Determines the time period for a given 24h start time.
 */
export function getSlotPeriod(startTime: string): SlotPeriod {
  const mins = timeStringToMinutes(startTime);
  if (mins < 720) return "morning";    // Before 12:00
  if (mins < 1020) return "afternoon"; // 12:00 - 16:59
  return "evening";                    // 17:00 and onwards
}

/**
 * Generates all consultation slots according to the MedEx Slot Rule:
 *
 * "A specialist's slots start at consultation.startTime and repeat every
 * durationInMinutes + bufferInMinutes. The last slot is one that still ends by
 * consultation.endTime. A slot is offered only if it lies entirely within the
 * provider's opening hours that day."
 */
export function generateDaySlots({
  provider,
  specialist,
  date,
  patientTimezone,
  bookedSlots = [],
  groupSize = 1,
  mockCurrentDateTime
}: {
  provider: Provider;
  specialist: Specialist;
  date: string; // YYYY-MM-DD in provider timezone
  patientTimezone: string;
  bookedSlots: BookedSlot[];
  groupSize?: number;
  mockCurrentDateTime?: { date: string; time: string }; // Optional override for deterministic tests
}): {
  slots: ScheduledSlot[];
  overlapWarning?: string;
  providerOpeningHours?: { startTime: string; endTime: string };
} {
  const dayOfWeek = getDayOfWeekFromDate(date);
  const providerSchedule = provider.daySchedules[dayOfWeek];

  // If provider is closed today, no slots offered
  if (!providerSchedule) {
    return { slots: [], overlapWarning: `Provider is closed on ${dayOfWeek}s.` };
  }

  const providerOpenMins = timeStringToMinutes(providerSchedule.startTime);
  const providerCloseMins = timeStringToMinutes(providerSchedule.endTime);

  const { startTime, endTime, durationInMinutes, bufferInMinutes } = specialist.consultation;
  const slotInterval = durationInMinutes + bufferInMinutes;

  const specialistStartMins = timeStringToMinutes(startTime);
  const specialistEndMins = timeStringToMinutes(endTime);

  // Check if specialist consultation hours fall partly outside provider hours
  let overlapWarning: string | undefined;
  if (specialistStartMins < providerOpenMins || specialistEndMins > providerCloseMins) {
    overlapWarning = `Dr. ${specialist.name}'s advertised hours (${startTime}–${endTime}) are adjusted to hospital operating hours on ${dayOfWeek}s (${providerSchedule.startTime}–${providerSchedule.endTime}).`;
  }

  // Today provider wall-clock check for past slots
  const todayInProviderTz = mockCurrentDateTime?.date ?? getCurrentDateInTimezone(provider.resolvedTimezone);
  const currentTimeInProviderTz = mockCurrentDateTime?.time ?? getCurrentTimeInTimezone(provider.resolvedTimezone);
  const isToday = date === todayInProviderTz;

  const rawSlots: ScheduledSlot[] = [];

  // Iterate from specialist.startTime repeating every (duration + buffer)
  let currentStartMins = specialistStartMins;

  while (currentStartMins + durationInMinutes <= specialistEndMins) {
    const currentEndMins = currentStartMins + durationInMinutes;
    const currentBufferEndMins = currentStartMins + slotInterval;

    const startStr = minutesToTimeString(currentStartMins);
    const endStr = minutesToTimeString(currentEndMins);
    const bufferEndStr = minutesToTimeString(currentBufferEndMins);

    // Rule: "A slot is offered only if it lies entirely within the provider's opening hours that day."
    const liesWithinProviderHours =
      currentStartMins >= providerOpenMins && currentEndMins <= providerCloseMins;

    // Check if booked in mock DB
    const isBooked = bookedSlots.some(
      (b) =>
        b.providerId === provider.id &&
        b.specialistId === specialist.id &&
        b.date === date &&
        b.startTime === startStr
    );

    // Check if slot has already started today measured by the clock at the provider
    const isPast = isToday && startStr <= currentTimeInProviderTz;

    const isAvailable = liesWithinProviderHours && !isBooked && !isPast;

    let status: SlotAvailabilityStatus = "available";
    let statusReason: string | undefined;

    if (!liesWithinProviderHours) {
      status = "outside_provider_hours";
      statusReason = `Hospital closes at ${providerSchedule.endTime}`;
    } else if (isPast) {
      status = "past";
      statusReason = "Time has already passed at the hospital";
    } else if (isBooked) {
      status = "booked";
      statusReason = "Reserved by another patient";
    }

    // Convert to patient time zone
    const instant = parseZonedInstant(date, startStr, provider.resolvedTimezone);
    const endInstant = parseZonedInstant(date, endStr, provider.resolvedTimezone);

    const formattedPatientStart = formatInstantInTimezone(instant, patientTimezone, date);
    const formattedPatientEnd = formatInstantInTimezone(endInstant, patientTimezone, date);

    const slotId = `slot_${provider.id}_${specialist.id}_${date}_${startStr}`;

    rawSlots.push({
      id: slotId,
      providerId: provider.id,
      specialistId: specialist.id,
      date,
      startTime: startStr,
      endTime: endStr,
      slotEndWithBuffer: bufferEndStr,
      durationInMinutes,
      bufferInMinutes,
      period: getSlotPeriod(startStr),
      isBooked,
      isPast,
      isOutsideProviderHours: !liesWithinProviderHours,
      isAvailable,
      status,
      statusReason,
      patientTime: {
        startTime: formattedPatientStart.startTime,
        endTime: formattedPatientEnd.startTime,
        date: formattedPatientStart.date,
        dateOffsetDays: formattedPatientStart.dateOffsetDays,
        formattedDate: formattedPatientStart.formattedDate,
        timeZoneLabel: formattedPatientStart.timeZoneLabel
      },
      consecutiveAvailableCount: 0, // Populated in next step
      isEligibleForGroupSize: false  // Populated in next step
    });

    currentStartMins += slotInterval;
  }

  // Filter out slots outside provider hours from the offered list per brief:
  // "only the overlap is bookable"
  const offeredSlots = rawSlots.filter((s) => !s.isOutsideProviderHours);

  // Group booking consecutive slots calculation:
  // "Booking for N people needs N consecutive free slots with the same specialist. Only offer start times where that is possible."
  for (let i = 0; i < offeredSlots.length; i++) {
    let consecutive = 0;
    for (let j = i; j < offeredSlots.length; j++) {
      if (offeredSlots[j].isAvailable) {
        consecutive++;
      } else {
        break;
      }
    }
    offeredSlots[i].consecutiveAvailableCount = consecutive;
    offeredSlots[i].isEligibleForGroupSize = consecutive >= groupSize;

    if (offeredSlots[i].isAvailable && !offeredSlots[i].isEligibleForGroupSize) {
      offeredSlots[i].status = "insufficient_consecutive_slots";
      offeredSlots[i].statusReason = `Requires ${groupSize} consecutive free slots (${consecutive} available)`;
    }
  }

  return {
    slots: offeredSlots,
    overlapWarning,
    providerOpeningHours: providerSchedule
  };
}

/**
 * Builds the 90-day calendar availability summary for a provider and specialist.
 */
export function build90DayCalendarAvailability({
  provider,
  specialist,
  closures = [],
  bookedSlots = [],
  groupSize = 1,
  startDateStr, // Default today in provider timezone
  mockCurrentDateTime
}: {
  provider: Provider;
  specialist: Specialist;
  closures: ProviderClosure[];
  bookedSlots: BookedSlot[];
  groupSize?: number;
  startDateStr?: string;
  mockCurrentDateTime?: { date: string; time: string };
}): DayAvailability[] {
  const todayInProviderTz =
    mockCurrentDateTime?.date ?? startDateStr ?? getCurrentDateInTimezone(provider.resolvedTimezone);

  const [tYear, tMonth, tDay] = todayInProviderTz.split("-").map((v) => parseInt(v, 10));
  const baseUtcDate = new Date(Date.UTC(tYear, tMonth - 1, tDay, 12, 0, 0));

  const days: DayAvailability[] = [];

  for (let offset = 0; offset < 90; offset++) {
    const d = new Date(baseUtcDate);
    d.setUTCDate(d.getUTCDate() + offset);

    const year = d.getUTCFullYear();
    const month = (d.getUTCMonth() + 1).toString().padStart(2, "0");
    const day = d.getUTCDate().toString().padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;

    const dayOfWeek = getDayOfWeekFromDate(dateStr);
    const daySchedule = provider.daySchedules[dayOfWeek];

    // Check closures
    const closure = closures.find(
      (c) => c.providerId === provider.id && (c.dayOffset === offset || c.date === dateStr)
    );

    const isClosedBySchedule = !daySchedule;
    const isClosedByClosure = Boolean(closure);
    const isOpen = !isClosedBySchedule && !isClosedByClosure;
    const isToday = offset === 0;

    let availableSlotsCount = 0;
    let totalSlotsCount = 0;

    if (isOpen) {
      const { slots } = generateDaySlots({
        provider,
        specialist,
        date: dateStr,
        patientTimezone: provider.resolvedTimezone, // Internal availability check
        bookedSlots,
        groupSize,
        mockCurrentDateTime
      });

      totalSlotsCount = slots.length;
      availableSlotsCount = slots.filter((s) => s.isEligibleForGroupSize && s.isAvailable).length;
    }

    let statusLabel = "Available";
    let closureReason: string | undefined;

    if (isClosedByClosure) {
      statusLabel = closure?.reason || "Closed";
      closureReason = closure?.reason || "Hospital closed for scheduled holiday / maintenance";
    } else if (isClosedBySchedule) {
      statusLabel = `Closed on ${dayOfWeek.slice(0, 3)}s`;
      closureReason = `Provider is not open on ${dayOfWeek}s`;
    } else if (availableSlotsCount === 0) {
      statusLabel = "Fully Booked";
      closureReason = totalSlotsCount === 0 ? "No consulting hours on this day" : "All slots booked or passed";
    }

    days.push({
      date: dateStr,
      dayOffset: offset,
      dayOfWeek,
      formattedDate: `${formatDayAbbreviation(dateStr)}, ${formatMonthAbbreviation(dateStr)} ${d.getUTCDate()}`,
      formattedDay: formatDayAbbreviation(dateStr),
      dayNumber: d.getUTCDate(),
      monthName: formatMonthAbbreviation(dateStr),
      isToday,
      isPast: offset < 0,
      isOpen,
      isClosedByClosure,
      isClosedBySchedule,
      closureReason,
      availableSlotsCount,
      totalSlotsCount,
      hasAvailableSlots: availableSlotsCount > 0,
      statusLabel
    });
  }

  return days;
}

/**
 * Finds the next available date with free slots starting from a given date offset.
 */
export function findNextAvailableDate(
  calendar: DayAvailability[],
  currentDateStr: string
): DayAvailability | null {
  const currentIndex = calendar.findIndex((d) => d.date === currentDateStr);
  const searchStart = currentIndex >= 0 ? currentIndex + 1 : 0;

  for (let i = searchStart; i < calendar.length; i++) {
    if (calendar[i].hasAvailableSlots) {
      return calendar[i];
    }
  }
  return null;
}

/**
 * Finds the closest alternative slots on the same date (or nearby dates) when a 409 conflict occurs.
 */
export function findClosestAlternativeSlots(
  targetStartTime: string,
  allSlots: ScheduledSlot[],
  limit: number = 3
): ScheduledSlot[] {
  const targetMins = timeStringToMinutes(targetStartTime);

  const availableSlots = allSlots.filter((s) => s.isAvailable && s.isEligibleForGroupSize);
  if (availableSlots.length === 0) return [];

  // Sort by closest distance in minutes from targetStartTime
  return availableSlots
    .slice()
    .sort((a, b) => {
      const distA = Math.abs(timeStringToMinutes(a.startTime) - targetMins);
      const distB = Math.abs(timeStringToMinutes(b.startTime) - targetMins);
      return distA - distB;
    })
    .slice(0, limit);
}

