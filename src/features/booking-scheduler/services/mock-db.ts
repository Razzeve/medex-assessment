import fs from "fs/promises";
import path from "path";
import {
  Provider,
  Specialist,
  BookedSlot,
  ProviderClosure,
  ExistingBooking,
  RawBookingData,
  DevSettings,
  ScheduledSlot,
  BookingRequest,
  BookingResponse,
  RescheduleResponse
} from "../types";
import {
  normalizeTimezone,
  getCurrentDateInTimezone,
  parseZonedInstant,
  formatInstantInTimezone
} from "../utils/timezone";
import {
  generateDaySlots,
  build90DayCalendarAvailability,
  findClosestAlternativeSlots
} from "../utils/slots";

// Consultation fee defaults per country / speciality
const DEFAULT_FEES: Record<string, { amount: number; currency: "THB" | "NPR" | "INR" }> = {
  Cardiology: { amount: 2500, currency: "THB" },
  "Internal Medicine": { amount: 1800, currency: "THB" },
  Dermatology: { amount: 2200, currency: "THB" },
  "General Practice": { amount: 1200, currency: "NPR" },
  Pathology: { amount: 1000, currency: "NPR" },
  Paediatrics: { amount: 1500, currency: "NPR" },
  Orthopaedics: { amount: 1800, currency: "NPR" },
  ENT: { amount: 1400, currency: "INR" }
};

interface MockDatabaseState {
  providers: Provider[];
  closures: ProviderClosure[];
  bookedSlots: BookedSlot[];
  existingBooking: ExistingBooking;
  createdBookings: Map<string, BookingResponse>;
  devSettings: DevSettings;
}

let dbState: MockDatabaseState | null = null;

/**
 * Calculates a real ISO date (YYYY-MM-DD) for a given dayOffset relative to today at the provider.
 */
function resolveDateFromDayOffset(dayOffset: number, providerTimezone: string): string {
  const todayStr = getCurrentDateInTimezone(providerTimezone);
  const [year, month, day] = todayStr.split("-").map((v) => parseInt(v, 10));
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  date.setUTCDate(date.getUTCDate() + dayOffset);

  const y = date.getUTCFullYear();
  const m = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  const d = date.getUTCDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
}

async function loadAndInitializeDb(): Promise<MockDatabaseState> {
  const filePath = path.join(process.cwd(), "public/data/task3-booking.json");
  const raw = await fs.readFile(filePath, "utf8");
  const data: RawBookingData = JSON.parse(raw);

  // 1. Normalize Providers
  const providers: Provider[] = data.providers.map((rawP) => {
    const { resolvedTimezone, resolutionNote } = normalizeTimezone(rawP.timezone, rawP.country);

    const specialists: Specialist[] = rawP.specialists.map((rawS) => {
      const fee = DEFAULT_FEES[rawS.speciality] || {
        amount: rawP.country === "TH" ? 2000 : rawP.country === "NP" ? 1500 : 1200,
        currency: rawP.country === "TH" ? "THB" : rawP.country === "NP" ? "NPR" : "INR"
      };

      return {
        id: rawS.id,
        name: rawS.name,
        speciality: rawS.speciality,
        consultation: rawS.consultation,
        fee
      };
    });

    return {
      id: rawP.id,
      name: rawP.name,
      country: rawP.country,
      rawTimezone: rawP.timezone,
      resolvedTimezone,
      timezoneResolutionNote: resolutionNote,
      daySchedules: rawP.daySchedules,
      specialists
    };
  });

  // Create provider lookup for timezone resolution
  const providerTzMap = new Map<number, string>(providers.map((p) => [p.id, p.resolvedTimezone]));

  // 2. Resolve Closures with dynamic dates
  const closures: ProviderClosure[] = data.closures.map((c) => {
    const tz = providerTzMap.get(c.providerId) || "Asia/Bangkok";
    return {
      providerId: c.providerId,
      dayOffset: c.dayOffset,
      reason: c.reason,
      date: resolveDateFromDayOffset(c.dayOffset, tz)
    };
  });

  // 3. Resolve Booked Slots with dynamic dates
  const bookedSlots: BookedSlot[] = data.bookedSlots.map((b) => {
    const tz = providerTzMap.get(b.providerId) || "Asia/Bangkok";
    return {
      providerId: b.providerId,
      specialistId: b.specialistId,
      dayOffset: b.dayOffset,
      date: resolveDateFromDayOffset(b.dayOffset, tz),
      startTime: b.startTime
    };
  });

  // 4. Resolve Existing Booking with dynamic date
  const ex = data.existingBooking;
  const exTz = providerTzMap.get(ex.providerId) || "Asia/Bangkok";
  const existingBooking: ExistingBooking = {
    bookingId: ex.bookingId,
    providerId: ex.providerId,
    specialistId: ex.specialistId,
    dayOffset: ex.dayOffset,
    date: resolveDateFromDayOffset(ex.dayOffset, exTz),
    startTime: ex.startTime,
    numberOfPeople: ex.numberOfPeople,
    patientName: "Somchai Prasert"
  };

  return {
    providers,
    closures,
    bookedSlots,
    existingBooking,
    createdBookings: new Map(),
    devSettings: {
      simulate409Conflict: false,
      simulate500Error: false,
      simulateNetworkOffline: false,
      artificialLatencyMs: 150
    }
  };
}

export async function getDb(): Promise<MockDatabaseState> {
  if (!dbState) {
    dbState = await loadAndInitializeDb();
  }
  return dbState;
}

export async function resetDb(): Promise<MockDatabaseState> {
  dbState = await loadAndInitializeDb();
  return dbState;
}

export async function getProviders(): Promise<Provider[]> {
  const db = await getDb();
  return db.providers;
}

export async function getProviderById(id: number): Promise<Provider | null> {
  const db = await getDb();
  return db.providers.find((p) => p.id === id) || null;
}

export async function getCalendarAvailability({
  providerId,
  specialistId,
  groupSize = 1
}: {
  providerId: number;
  specialistId: string;
  groupSize?: number;
}) {
  const db = await getDb();
  const provider = db.providers.find((p) => p.id === providerId);
  if (!provider) throw new Error(`Provider ${providerId} not found`);

  const specialist = provider.specialists.find((s) => s.id === specialistId);
  if (!specialist) throw new Error(`Specialist ${specialistId} not found`);

  return build90DayCalendarAvailability({
    provider,
    specialist,
    closures: db.closures,
    bookedSlots: db.bookedSlots,
    groupSize
  });
}

export async function getSlotsForDate({
  providerId,
  specialistId,
  date,
  patientTimezone,
  groupSize = 1
}: {
  providerId: number;
  specialistId: string;
  date: string;
  patientTimezone: string;
  groupSize?: number;
}): Promise<{
  slots: ScheduledSlot[];
  overlapWarning?: string;
  provider: Provider;
  specialist: Specialist;
}> {
  const db = await getDb();
  const provider = db.providers.find((p) => p.id === providerId);
  if (!provider) throw new Error(`Provider ${providerId} not found`);

  const specialist = provider.specialists.find((s) => s.id === specialistId);
  if (!specialist) throw new Error(`Specialist ${specialistId} not found`);

  const { slots, overlapWarning } = generateDaySlots({
    provider,
    specialist,
    date,
    patientTimezone,
    bookedSlots: db.bookedSlots,
    groupSize
  });

  return { slots, overlapWarning, provider, specialist };
}

export async function createBooking(
  request: BookingRequest,
  simulate409Override?: boolean
): Promise<{ success: boolean; data?: BookingResponse; error?: string; status: number; closestAvailableSlots?: ScheduledSlot[] }> {
  const db = await getDb();

  // Simulated 409 conflict
  if (db.devSettings.simulate409Conflict || simulate409Override) {
    const { slots } = await getSlotsForDate({
      providerId: request.providerId,
      specialistId: request.specialistId,
      date: request.date,
      patientTimezone: request.patientTimezone,
      groupSize: request.numberOfPeople
    });
    const alternatives = findClosestAlternativeSlots(request.startTime, slots, 3);

    return {
      success: false,
      status: 409,
      error: "Someone else got there first! This appointment slot was just reserved by another patient.",
      closestAvailableSlots: alternatives
    };
  }

  const provider = db.providers.find((p) => p.id === request.providerId);
  if (!provider) return { success: false, status: 404, error: "Provider not found" };

  const specialist = provider.specialists.find((s) => s.id === request.specialistId);
  if (!specialist) return { success: false, status: 404, error: "Specialist not found" };

  const { slots } = await getSlotsForDate({
    providerId: request.providerId,
    specialistId: request.specialistId,
    date: request.date,
    patientTimezone: request.patientTimezone,
    groupSize: request.numberOfPeople
  });

  const selectedSlot = slots.find((s) => s.startTime === request.startTime);

  if (!selectedSlot || !selectedSlot.isAvailable || !selectedSlot.isEligibleForGroupSize) {
    const alternatives = findClosestAlternativeSlots(request.startTime, slots, 3);
    return {
      success: false,
      status: 409,
      error: "The requested time slot is no longer available or cannot accommodate your party size.",
      closestAvailableSlots: alternatives
    };
  }

  // Reserve consecutive slots for N people
  const startIndex = slots.findIndex((s) => s.startTime === request.startTime);
  const slotsToBook = slots.slice(startIndex, startIndex + request.numberOfPeople);

  for (const s of slotsToBook) {
    db.bookedSlots.push({
      providerId: request.providerId,
      specialistId: request.specialistId,
      dayOffset: 0,
      date: request.date,
      startTime: s.startTime
    });
  }

  const bookingId = `BK-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 900 + 100)}`;
  const finalSlot = slotsToBook[slotsToBook.length - 1];

  const instant = parseZonedInstant(request.date, request.startTime, provider.resolvedTimezone);
  const endInstant = parseZonedInstant(request.date, finalSlot.endTime, provider.resolvedTimezone);

  const patientStart = formatInstantInTimezone(instant, request.patientTimezone, request.date);
  const patientEnd = formatInstantInTimezone(endInstant, request.patientTimezone, request.date);

  const response: BookingResponse = {
    bookingId,
    status: "confirmed",
    providerId: request.providerId,
    specialistId: request.specialistId,
    date: request.date,
    startTime: request.startTime,
    endTime: finalSlot.endTime,
    numberOfPeople: request.numberOfPeople,
    patientName: request.patientName,
    createdAt: new Date().toISOString(),
    providerTime: {
      timezone: provider.resolvedTimezone,
      date: request.date,
      startTime: request.startTime,
      endTime: finalSlot.endTime
    },
    patientTime: {
      timezone: request.patientTimezone,
      date: patientStart.date,
      startTime: patientStart.startTime,
      endTime: patientEnd.startTime,
      dateOffsetDays: patientStart.dateOffsetDays
    }
  };

  db.createdBookings.set(bookingId, response);
  return { success: true, status: 201, data: response };
}

export async function rescheduleBooking(
  bookingId: string,
  newDate: string,
  newStartTime: string,
  simulate409Override?: boolean
): Promise<{ success: boolean; data?: RescheduleResponse; error?: string; status: number; closestAvailableSlots?: ScheduledSlot[] }> {
  const db = await getDb();

  // Simulated 409 conflict
  if (db.devSettings.simulate409Conflict || simulate409Override) {
    const existing = db.existingBooking;
    const { slots } = await getSlotsForDate({
      providerId: existing.providerId,
      specialistId: existing.specialistId,
      date: newDate,
      patientTimezone: "Asia/Kathmandu",
      groupSize: existing.numberOfPeople
    });
    const alternatives = findClosestAlternativeSlots(newStartTime, slots, 3);

    return {
      success: false,
      status: 409,
      error: "Conflict: The new slot you selected was just reserved by another patient.",
      closestAvailableSlots: alternatives
    };
  }

  const existing = db.existingBooking.bookingId === bookingId ? db.existingBooking : null;
  if (!existing) {
    return { success: false, status: 404, error: `Booking ${bookingId} not found` };
  }

  const provider = db.providers.find((p) => p.id === existing.providerId);
  if (!provider) return { success: false, status: 404, error: "Provider not found" };

  const { slots } = await getSlotsForDate({
    providerId: existing.providerId,
    specialistId: existing.specialistId,
    date: newDate,
    patientTimezone: provider.resolvedTimezone,
    groupSize: existing.numberOfPeople
  });

  const selectedSlot = slots.find((s) => s.startTime === newStartTime);
  if (!selectedSlot || !selectedSlot.isAvailable || !selectedSlot.isEligibleForGroupSize) {
    const alternatives = findClosestAlternativeSlots(newStartTime, slots, 3);
    return {
      success: false,
      status: 409,
      error: "The requested reschedule slot is unavailable.",
      closestAvailableSlots: alternatives
    };
  }

  // Release old slot
  db.bookedSlots = db.bookedSlots.filter(
    (b) =>
      !(
        b.providerId === existing.providerId &&
        b.specialistId === existing.specialistId &&
        b.date === existing.date &&
        b.startTime === existing.startTime
      )
  );

  // Book new slot
  db.bookedSlots.push({
    providerId: existing.providerId,
    specialistId: existing.specialistId,
    dayOffset: 0,
    date: newDate,
    startTime: newStartTime
  });

  const oldDate = existing.date;
  const oldTime = existing.startTime;

  // Update existing booking record
  db.existingBooking.date = newDate;
  db.existingBooking.startTime = newStartTime;

  return {
    success: true,
    status: 200,
    data: {
      bookingId,
      status: "rescheduled",
      oldBooking: { date: oldDate, startTime: oldTime },
      newBooking: { date: newDate, startTime: newStartTime },
      message: "Appointment successfully rescheduled"
    }
  };
}

export async function getExistingBooking(): Promise<ExistingBooking> {
  const db = await getDb();
  return db.existingBooking;
}

export async function updateDevSettings(partial: Partial<DevSettings>): Promise<DevSettings> {
  const db = await getDb();
  db.devSettings = { ...db.devSettings, ...partial };
  return db.devSettings;
}

export async function getDevSettings(): Promise<DevSettings> {
  const db = await getDb();
  return db.devSettings;
}
