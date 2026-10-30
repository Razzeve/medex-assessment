"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BookingRequest,
  RescheduleRequest,
  ScheduledSlot,
  Provider
} from "../types";
import { bookingService, BookingServiceOptions } from "../services/booking.service";

export function useBookingProviders(options?: BookingServiceOptions) {
  return useQuery({
    queryKey: ["booking-providers", options],
    queryFn: () => bookingService.getProviders(options),
    staleTime: 1000 * 60 * 5 // 5 minutes
  });
}

export function useCalendarAvailability(
  providerId: number | undefined,
  specialistId: string | undefined,
  groupSize: number = 1,
  options?: BookingServiceOptions
) {
  return useQuery({
    queryKey: ["calendar-availability", providerId, specialistId, groupSize, options],
    queryFn: () => {
      if (!providerId || !specialistId) return [];
      return bookingService.getCalendarAvailability(providerId, specialistId, groupSize, options);
    },
    enabled: Boolean(providerId && specialistId),
    staleTime: 1000 * 30 // 30 seconds
  });
}

export function useDaySlots(
  providerId: number | undefined,
  specialistId: string | undefined,
  date: string | undefined,
  patientTimezone: string,
  groupSize: number = 1,
  options?: BookingServiceOptions
) {
  return useQuery({
    queryKey: ["day-slots", providerId, specialistId, date, patientTimezone, groupSize, options],
    queryFn: async (): Promise<{
      slots: ScheduledSlot[];
      overlapWarning?: string;
      provider?: Provider;
    }> => {
      if (!providerId || !specialistId || !date) {
        return { slots: [] };
      }
      return bookingService.getSlotsForDate(
        providerId,
        specialistId,
        date,
        patientTimezone,
        groupSize,
        options
      );
    },
    enabled: Boolean(providerId && specialistId && date),
    staleTime: 1000 * 15
  });
}

export function useBookAppointmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      request,
      options
    }: {
      request: BookingRequest;
      options?: BookingServiceOptions;
    }) => bookingService.bookAppointment(request, options),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["day-slots", variables.request.providerId]
      });
      queryClient.invalidateQueries({
        queryKey: ["calendar-availability", variables.request.providerId]
      });
    }
  });
}

export function useRescheduleAppointmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      bookingId,
      request,
      options
    }: {
      bookingId: string;
      request: RescheduleRequest;
      options?: BookingServiceOptions;
    }) => bookingService.rescheduleAppointment(bookingId, request, options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["day-slots"] });
      queryClient.invalidateQueries({ queryKey: ["calendar-availability"] });
      queryClient.invalidateQueries({ queryKey: ["booking-providers"] });
    }
  });
}
