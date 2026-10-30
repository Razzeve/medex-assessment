import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeTimezone,
  getTimezoneOffsetMinutes,
  formatOffsetMinutes,
  parseZonedInstant,
  formatInstantInTimezone,
  getRelativeTimezoneExplanation
} from "../utils/timezone";

test("Timezone Normalizer - Handles all messy dataset strings", () => {
  // 1. Direct standard IANA
  const bangkok = normalizeTimezone("Asia/Bangkok", "TH");
  assert.equal(bangkok.resolvedTimezone, "Asia/Bangkok");

  // 2. Leading whitespace and offset format: " UTC+05:45" (Provider 46)
  const himal = normalizeTimezone(" UTC+05:45", "NP");
  assert.equal(himal.resolvedTimezone, "Asia/Kathmandu");

  // 3. Windows-style name: "Nepal Standard Time" (Provider 112)
  const annapurna = normalizeTimezone("Nepal Standard Time", "NP");
  assert.equal(annapurna.resolvedTimezone, "Asia/Kathmandu");

  // 4. Parenthesized GMT format: "(GMT+5:45)" (Provider 118)
  const pashupati = normalizeTimezone("(GMT+5:45)", "NP");
  assert.equal(pashupati.resolvedTimezone, "Asia/Kathmandu");

  // 5. Trailing whitespace and legacy spelling: "Asia/Katmandu " (Provider 121)
  const lumbini = normalizeTimezone("Asia/Katmandu ", "NP");
  assert.equal(lumbini.resolvedTimezone, "Asia/Kathmandu");

  // 6. Blank / Empty string: "" with country "IN" (Provider 131)
  const aravali = normalizeTimezone("", "IN");
  assert.equal(aravali.resolvedTimezone, "Asia/Kolkata");
  assert.match(aravali.resolutionNote, /Defaulted to country code IN/);

  // 7. Blank string with country "TH"
  const thaiDefault = normalizeTimezone("", "TH");
  assert.equal(thaiDefault.resolvedTimezone, "Asia/Bangkok");

  // 8. Garbage/unrecognized string fallback to country
  const fallback = normalizeTimezone("RandomHospitalTz123", "NP");
  assert.equal(fallback.resolvedTimezone, "Asia/Kathmandu");
  assert.match(fallback.resolutionNote, /Unrecognized timezone string/);
});

test("Timezone Differential & Explanations", () => {
  // Test offset formatting
  assert.equal(formatOffsetMinutes(345), "UTC+05:45");
  assert.equal(formatOffsetMinutes(-240), "UTC-04:00");
  assert.equal(getTimezoneOffsetMinutes("Asia/Kathmandu", new Date("2026-10-31T12:00:00Z")), 345);

  // Bangkok (+7) vs Kathmandu (+5:45) is 1 hour 15 minutes difference
  const explanation = getRelativeTimezoneExplanation("Asia/Bangkok", "Asia/Kathmandu", "Bangkok", "Kathmandu");
  assert.match(explanation, /Bangkok is 1 hr 15 mins ahead of Kathmandu/i);

  // Same timezone
  const same = getRelativeTimezoneExplanation("Asia/Bangkok", "Asia/Bangkok", "Bangkok", "Bangkok");
  assert.match(same, /same time zone/i);
});

test("Two Clocks & Cross-Midnight Boundary Calculation", () => {
  // A morning slot at 10:00 in Bangkok (2026-10-31)
  const instant = parseZonedInstant("2026-10-31", "10:00", "Asia/Bangkok");

  // Patient in Kathmandu (UTC+05:45)
  // Bangkok 10:00 is 03:00 UTC, which is 08:45 in Kathmandu
  const kathmandu = formatInstantInTimezone(instant, "Asia/Kathmandu", "2026-10-31");
  assert.equal(kathmandu.startTime, "08:45");
  assert.equal(kathmandu.dateOffsetDays, 0); // Same day

  // Patient in New York (EDT, UTC-4)
  // 03:00 UTC is 23:00 (11:00 PM) on the previous day (2026-10-30)!
  const newYork = formatInstantInTimezone(instant, "America/New_York", "2026-10-31");
  assert.equal(newYork.startTime, "23:00");
  assert.equal(newYork.date, "2026-10-30");
  assert.equal(newYork.dateOffsetDays, -1); // Previous day!

  // Late evening slot in London at 23:30 (UTC+0) viewed from Bangkok (UTC+7)
  const londonInstant = parseZonedInstant("2026-10-31", "23:30", "Europe/London");
  const bangkokView = formatInstantInTimezone(londonInstant, "Asia/Bangkok", "2026-10-31");
  // 23:30 in London is 06:30 the NEXT day in Bangkok (+1 day)
  assert.equal(bangkokView.startTime, "06:30");
  assert.equal(bangkokView.date, "2026-11-01");
  assert.equal(bangkokView.dateOffsetDays, 1); // Next day!
});
