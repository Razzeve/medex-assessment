import {
  Provider,
  ScheduledSlot,
  DayAvailability,
  BookingRequest,
  BookingResponse,
  RescheduleRequest,
  RescheduleResponse,
  ExistingBooking
} from "../types";

export interface BookingServiceOptions {
  latency?: number;
  simulateError?: boolean;
  simulate409?: boolean;
}

export class BookingApiError extends Error {
  status?: number;
  conflictingSlot?: { date: string; startTime: string };
  closestAvailableSlots?: ScheduledSlot[];

  constructor(
    message: string,
    status?: number,
    conflictingSlot?: { date: string; startTime: string },
    closestAvailableSlots?: ScheduledSlot[]
  ) {
    super(message);
    this.name = "BookingApiError";
    this.status = status;
    this.conflictingSlot = conflictingSlot;
    this.closestAvailableSlots = closestAvailableSlots;
  }
}

export const bookingService = {
  async getProviders(options?: BookingServiceOptions): Promise<{
    providers: Provider[];
    existingBooking: ExistingBooking;
  }> {
    const params = new URLSearchParams();
    if (options?.latency !== undefined) params.set("latency", String(options.latency));
    if (options?.simulateError) params.set("simulateError", "true");

    const res = await fetch(`/api/booking/providers?${params.toString()}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to fetch providers (Status ${res.status})`);
    }
    return res.json();
  },

  async getProviderById(id: number, options?: BookingServiceOptions): Promise<Provider> {
    const params = new URLSearchParams();
    if (options?.latency !== undefined) params.set("latency", String(options.latency));
    if (options?.simulateError) params.set("simulateError", "true");

    const res = await fetch(`/api/booking/providers/${id}?${params.toString()}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to fetch provider ${id}`);
    }
    return res.json();
  },

  async getCalendarAvailability(
    providerId: number,
    specialistId: string,
    groupSize: number = 1,
    options?: BookingServiceOptions
  ): Promise<DayAvailability[]> {
    const params = new URLSearchParams({
      specialistId,
      groupSize: String(groupSize),
      mode: "calendar"
    });
    if (options?.latency !== undefined) params.set("latency", String(options.latency));
    if (options?.simulateError) params.set("simulateError", "true");

    const res = await fetch(`/api/booking/providers/${providerId}/slots?${params.toString()}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to load calendar availability");
    }
    const data = await res.json();
    return data.calendar;
  },

  async getSlotsForDate(
    providerId: number,
    specialistId: string,
    date: string,
    patientTimezone: string,
    groupSize: number = 1,
    options?: BookingServiceOptions
  ): Promise<{
    slots: ScheduledSlot[];
    overlapWarning?: string;
    provider: Provider;
  }> {
    const params = new URLSearchParams({
      specialistId,
      date,
      patientTimezone,
      groupSize: String(groupSize)
    });
    if (options?.latency !== undefined) params.set("latency", String(options.latency));
    if (options?.simulateError) params.set("simulateError", "true");

    const res = await fetch(`/api/booking/providers/${providerId}/slots?${params.toString()}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to load appointment slots");
    }
    return res.json();
  },

  async bookAppointment(
    request: BookingRequest,
    options?: BookingServiceOptions
  ): Promise<BookingResponse> {
    const params = new URLSearchParams();
    if (options?.latency !== undefined) params.set("latency", String(options.latency));
    if (options?.simulateError) params.set("simulateError", "true");
    if (options?.simulate409) params.set("simulate409", "true");

    const res = await fetch(`/api/booking/bookings?${params.toString()}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new BookingApiError(
        data.error || "Failed to confirm booking",
        res.status,
        data.conflictingSlot,
        data.closestAvailableSlots
      );
    }
    return data;
  },

  async rescheduleAppointment(
    bookingId: string,
    request: RescheduleRequest,
    options?: BookingServiceOptions
  ): Promise<RescheduleResponse> {
    const params = new URLSearchParams();
    if (options?.latency !== undefined) params.set("latency", String(options.latency));
    if (options?.simulateError) params.set("simulateError", "true");
    if (options?.simulate409) params.set("simulate409", "true");

    const res = await fetch(`/api/booking/bookings/${bookingId}?${params.toString()}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new BookingApiError(
        data.error || "Failed to reschedule booking",
        res.status,
        data.conflictingSlot,
        data.closestAvailableSlots
      );
    }
    return data;
  },

  async resetDatabase(): Promise<void> {
    await fetch("/api/booking/providers?reset=true");
  }
};
