import test from "node:test";
import assert from "node:assert/strict";
import {
  generateDaySlots,
  build90DayCalendarAvailability,
  findClosestAlternativeSlots,
  timeStringToMinutes,
  minutesToTimeString
} from "../utils/slots";
import { Provider, Specialist, BookedSlot } from "../types";

const mockProvider48: Provider = {
  id: 48,
  name: "Riverside International Hospital",
  country: "TH",
  rawTimezone: "Asia/Bangkok",
  resolvedTimezone: "Asia/Bangkok",
  daySchedules: {
    monday: { startTime: "08:00", endTime: "20:00" },
    tuesday: { startTime: "08:00", endTime: "20:00" },
    wednesday: { startTime: "08:00", endTime: "20:00" },
    thursday: { startTime: "08:00", endTime: "20:00" },
    friday: { startTime: "08:00", endTime: "17:00" },
    saturday: { startTime: "09:00", endTime: "13:00" }
    // sunday is intentionally missing = closed
  },
  specialists: []
};

const mockSpecialistCardio: Specialist = {
  id: "2a2f07eb-7886-4f83-82ab-ca56f415da44",
  name: "Dr. A. Wongsakul",
  speciality: "Cardiology",
  consultation: {
    startTime: "10:00",
    endTime: "16:00",
    durationInMinutes: 30,
    bufferInMinutes: 10
  },
  fee: { amount: 1500, currency: "THB" }
};

test("Slot Rule - Generates slots repeating every (duration + buffer) up to endTime", () => {
  // Monday: provider open 08:00 - 20:00.
  // Specialist: 10:00 - 16:00 with 30 min duration + 10 min buffer = 40 min cycle.
  // Slots: 10:00, 10:40, 11:20, 12:00, 12:40, 13:20, 14:00, 14:40, 15:20 (ends 15:50 <= 16:00).
  // Next would be 16:00 (ends 16:30 > 16:00, so omitted).
  // Total slots = 9 slots.
  const { slots } = generateDaySlots({
    provider: mockProvider48,
    specialist: mockSpecialistCardio,
    date: "2026-11-02", // A Monday
    patientTimezone: "Asia/Kathmandu",
    bookedSlots: []
  });

  assert.equal(slots.length, 9);
  assert.equal(slots[0].startTime, "10:00");
  assert.equal(slots[0].endTime, "10:30");
  assert.equal(slots[0].slotEndWithBuffer, "10:40");

  assert.equal(slots[1].startTime, "10:40");
  assert.equal(slots[1].endTime, "11:10");

  assert.equal(slots[slots.length - 1].startTime, "15:20");
  assert.equal(slots[slots.length - 1].endTime, "15:50");
});

test("Provider Opening Hours Overlap - Saturday truncation", () => {
  // On Saturday, hospital closes early at 13:00!
  // Dr. Wongsakul advertised 10:00 - 16:00.
  // Slots offered must lie entirely within 09:00 - 13:00 hospital opening hours!
  // Slots: 10:00 (ends 10:30), 10:40 (ends 11:10), 11:20 (ends 11:50), 12:00 (ends 12:30).
  // 12:40 would end at 13:10 > 13:00, so NOT offered!
  const { slots, overlapWarning } = generateDaySlots({
    provider: mockProvider48,
    specialist: mockSpecialistCardio,
    date: "2026-10-31", // A Saturday
    patientTimezone: "Asia/Bangkok",
    bookedSlots: []
  });

  assert.ok(overlapWarning, "Expected overlap warning explaining hospital closing hours");
  assert.match(overlapWarning!, /operating hours on saturdays/i);
  assert.equal(slots.length, 4);
  assert.equal(slots[slots.length - 1].startTime, "12:00");
  assert.equal(slots[slots.length - 1].endTime, "12:30");
});

test("Provider Closed Day - Sunday returns 0 slots", () => {
  const { slots } = generateDaySlots({
    provider: mockProvider48,
    specialist: mockSpecialistCardio,
    date: "2026-11-01", // A Sunday
    patientTimezone: "Asia/Bangkok",
    bookedSlots: []
  });

  assert.equal(slots.length, 0);
});

test("Today Past Slots Cutoff - Measured by provider clock", () => {
  // Mock provider clock at 11:00 AM on today
  const mockCurrentDateTime = { date: "2026-11-02", time: "11:00" };

  const { slots } = generateDaySlots({
    provider: mockProvider48,
    specialist: mockSpecialistCardio,
    date: "2026-11-02",
    patientTimezone: "Asia/Bangkok",
    bookedSlots: [],
    mockCurrentDateTime
  });

  // 10:00 and 10:40 are before 11:00, so they are marked as past
  const pastSlots = slots.filter((s) => s.isPast);
  assert.equal(pastSlots.length, 2);
  assert.equal(pastSlots[0].startTime, "10:00");
  assert.equal(pastSlots[1].startTime, "10:40");

  // 11:20 is after 11:00, so it is available
  assert.equal(slots[2].startTime, "11:20");
  assert.equal(slots[2].isPast, false);
  assert.equal(slots[2].isAvailable, true);
});

test("Group Booking Consecutive Slots - Requires N consecutive free slots with buffers", () => {
  const bookedSlots: BookedSlot[] = [
    // 10:40 is booked!
    {
      providerId: 48,
      specialistId: mockSpecialistCardio.id,
      dayOffset: 0,
      date: "2026-11-02",
      startTime: "10:40"
    }
  ];

  // Requesting for group size = 2 people
  const { slots } = generateDaySlots({
    provider: mockProvider48,
    specialist: mockSpecialistCardio,
    date: "2026-11-02",
    patientTimezone: "Asia/Bangkok",
    bookedSlots,
    groupSize: 2
  });

  // Slot 0 (10:00): is free, but next slot (10:40) is booked! So consecutive = 1 < 2!
  // Therefore, 10:00 CANNOT accommodate 2 people!
  assert.equal(slots[0].startTime, "10:00");
  assert.equal(slots[0].consecutiveAvailableCount, 1);
  assert.equal(slots[0].isEligibleForGroupSize, false);
  assert.equal(slots[0].status, "insufficient_consecutive_slots");

  // Slot 1 (10:40): is booked
  assert.equal(slots[1].startTime, "10:40");
  assert.equal(slots[1].isBooked, true);

  // Slot 2 (11:20): is followed by 12:00, 12:40 etc. all free!
  // So consecutive >= 2, eligible for group booking!
  assert.equal(slots[2].startTime, "11:20");
  assert.ok(slots[2].consecutiveAvailableCount >= 2);
  assert.equal(slots[2].isEligibleForGroupSize, true);
});

test("Conflict Resolution - Finds closest available alternatives on 409", () => {
  const { slots } = generateDaySlots({
    provider: mockProvider48,
    specialist: mockSpecialistCardio,
    date: "2026-11-02",
    patientTimezone: "Asia/Bangkok",
    bookedSlots: [
      {
        providerId: 48,
        specialistId: mockSpecialistCardio.id,
        dayOffset: 0,
        date: "2026-11-02",
        startTime: "11:20"
      }
    ]
  });

  // Customer wanted 11:20, but it was just taken
  const alternatives = findClosestAlternativeSlots("11:20", slots, 2);
  assert.equal(alternatives.length, 2);
  // Closest should be 10:40 (40 mins away) and 12:00 (40 mins away)
  const times = alternatives.map((s) => s.startTime);
  assert.ok(times.includes("10:40") || times.includes("12:00"));
});

test("90-Day Calendar Availability & Time Conversion Helpers", () => {
  // Test time string helpers
  assert.equal(timeStringToMinutes("10:30"), 630);
  assert.equal(minutesToTimeString(630), "10:30");

  // Test 90-day calendar availability builder
  const calendar = build90DayCalendarAvailability({
    provider: mockProvider48,
    specialist: mockSpecialistCardio,
    closures: [{ providerId: 48, dayOffset: 12, reason: "Public holiday" }],
    bookedSlots: [],
    startDateStr: "2026-11-02"
  });

  assert.equal(calendar.length, 90);
  // Day offset 12 should be marked as closed due to closure
  const closedHoliday = calendar.find((d) => d.dayOffset === 12);
  assert.ok(closedHoliday);
  assert.equal(closedHoliday.isClosedByClosure, true);
  assert.equal(closedHoliday.statusLabel, "Public holiday");
});
