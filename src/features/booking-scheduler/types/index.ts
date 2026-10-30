export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface TimeWindow {
  startTime: string; // "08:00" (HH:mm)
  endTime: string;   // "20:00" (HH:mm)
}

export type ProviderDaySchedules = Partial<Record<DayOfWeek, TimeWindow>>;

export interface ConsultationConfig {
  startTime: string; // "10:00"
  endTime: string;   // "16:00"
  durationInMinutes: number; // e.g. 30
  bufferInMinutes: number;   // e.g. 10
}

export interface ConsultationFee {
  amount: number;
  currency: "THB" | "NPR" | "INR" | "USD";
}

export interface Specialist {
  id: string;
  name: string;
  speciality: string;
  consultation: ConsultationConfig;
  fee: ConsultationFee;
}

export interface RawSpecialist {
  id: string;
  name: string;
  speciality: string;
  consultation: ConsultationConfig;
}

export interface RawProvider {
  id: number;
  name: string;
  country: string;
  timezone: string;
  daySchedules: ProviderDaySchedules;
  specialists: RawSpecialist[];
}

export interface ProviderClosure {
  providerId: number;
  dayOffset: number;
  reason: string;
  date?: string; // Resolved ISO date (YYYY-MM-DD)
}

export interface RawBookedSlot {
  providerId: number;
  specialistId: string;
  dayOffset: number;
  startTime: string;
}

export interface BookedSlot {
  providerId: number;
  specialistId: string;
  dayOffset: number;
  date: string; // Resolved ISO date (YYYY-MM-DD) in provider timezone
  startTime: string;
}

export interface ExistingBooking {
  bookingId: string;
  providerId: number;
  specialistId: string;
  dayOffset: number;
  date: string; // Resolved ISO date (YYYY-MM-DD)
  startTime: string;
  numberOfPeople: number;
  patientName?: string;
}

export interface RawExistingBooking {
  bookingId: string;
  providerId: number;
  specialistId: string;
  dayOffset: number;
  startTime: string;
  numberOfPeople: number;
}

export interface Provider {
  id: number;
  name: string;
  country: string;
  rawTimezone: string;
  resolvedTimezone: string; // Valid IANA timezone e.g. "Asia/Bangkok"
  timezoneResolutionNote?: string;
  daySchedules: ProviderDaySchedules;
  specialists: Specialist[];
}

export interface RawBookingData {
  _readme?: string;
  providers: RawProvider[];
  closures: ProviderClosure[];
  bookedSlots: RawBookedSlot[];
  existingBooking: RawExistingBooking;
}

export interface TimezoneOption {
  iana: string;
  label: string;
  city: string;
  country: string;
  flag: string;
  offsetMinutes: number;
  formattedOffset: string; // e.g. "UTC+05:45", "UTC+07:00"
}

export type SlotPeriod = "morning" | "afternoon" | "evening";

export type SlotAvailabilityStatus =
  | "available"
  | "booked"
  | "past"
  | "outside_provider_hours"
  | "insufficient_consecutive_slots";

export interface PatientTimeSlot {
  startTime: string; // "08:45"
  endTime: string;   // "09:15"
  date: string;      // "2026-10-31"
  dateOffsetDays: number; // 0 = same day, 1 = next day, -1 = previous day
  formattedDate: string;  // e.g. "Sat, Oct 31"
  timeZoneLabel: string;  // e.g. "NPT (Kathmandu)"
}

export interface ScheduledSlot {
  id: string; // e.g. "slot_48_2a2f07eb_2026-10-31_10:00"
  providerId: number;
  specialistId: string;
  date: string; // "YYYY-MM-DD" in provider timezone
  startTime: string; // "10:00" (provider wall-clock)
  endTime: string;   // "10:30" (consultation end, provider wall-clock)
  slotEndWithBuffer: string; // "10:40" (next slot start)
  durationInMinutes: number;
  bufferInMinutes: number;
  period: SlotPeriod;
  isBooked: boolean;
  isPast: boolean;
  isOutsideProviderHours: boolean;
  isAvailable: boolean; // true if !isBooked && !isPast && !isOutsideProviderHours
  status: SlotAvailabilityStatus;
  statusReason?: string;
  patientTime: PatientTimeSlot;
  consecutiveAvailableCount: number; // How many free consecutive slots follow this start time
  isEligibleForGroupSize: boolean;   // Whether this start time accommodates requested group size
}

export interface DayAvailability {
  date: string; // YYYY-MM-DD in provider timezone
  dayOffset: number;
  dayOfWeek: DayOfWeek;
  formattedDate: string; // "Sat, Oct 31"
  formattedDay: string;  // "Sat"
  dayNumber: number;     // 31
  monthName: string;     // "Oct"
  isToday: boolean;
  isPast: boolean;
  isOpen: boolean;
  isClosedByClosure: boolean;
  isClosedBySchedule: boolean;
  closureReason?: string;
  availableSlotsCount: number;
  totalSlotsCount: number;
  hasAvailableSlots: boolean;
  statusLabel: string;
}

export interface BookingRequest {
  providerId: number;
  specialistId: string;
  date: string;      // YYYY-MM-DD in provider timezone
  startTime: string; // HH:mm in provider timezone
  numberOfPeople: number;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  patientTimezone: string;
  notes?: string;
}

export interface BookingResponse {
  bookingId: string;
  status: "confirmed";
  providerId: number;
  specialistId: string;
  date: string;
  startTime: string;
  endTime: string;
  numberOfPeople: number;
  patientName: string;
  createdAt: string;
  providerTime: {
    timezone: string;
    date: string;
    startTime: string;
    endTime: string;
  };
  patientTime: {
    timezone: string;
    date: string;
    startTime: string;
    endTime: string;
    dateOffsetDays: number;
  };
}

export interface RescheduleRequest {
  date: string;      // YYYY-MM-DD
  startTime: string; // HH:mm
}

export interface RescheduleResponse {
  bookingId: string;
  status: "rescheduled";
  oldBooking: {
    date: string;
    startTime: string;
  };
  newBooking: {
    date: string;
    startTime: string;
  };
  message: string;
}

export interface ApiErrorResponse {
  error: string;
  message: string;
  code?: number;
  conflictingSlot?: {
    date: string;
    startTime: string;
  };
  closestAvailableSlots?: ScheduledSlot[];
}

export interface DevSettings {
  simulate409Conflict: boolean;
  simulate500Error: boolean;
  simulateNetworkOffline: boolean;
  artificialLatencyMs: number;
}

