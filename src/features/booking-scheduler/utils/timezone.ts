import { TimezoneOption } from "../types";

/**
 * Standard country-to-default-IANA-timezone map.
 * When a provider leaves timezone blank or enters an invalid value,
 * fall back to the primary operational timezone of their country.
 */
export const COUNTRY_TIMEZONE_MAP: Record<string, string> = {
  TH: "Asia/Bangkok",    // Thailand (UTC+07:00)
  NP: "Asia/Kathmandu",  // Nepal (UTC+05:45)
  IN: "Asia/Kolkata",    // India (UTC+05:30)
  SG: "Asia/Singapore",  // Singapore (UTC+08:00)
  GB: "Europe/London",   // United Kingdom
  US: "America/New_York" // United States (East)
};

/**
 * Known Windows-style or colloquial timezone names mapped to standard IANA identifiers.
 */
export const WINDOWS_TIMEZONE_MAP: Record<string, string> = {
  "nepal standard time": "Asia/Kathmandu",
  "india standard time": "Asia/Kolkata",
  "se asia standard time": "Asia/Bangkok",
  "singapore standard time": "Asia/Singapore",
  "gmt standard time": "Europe/London",
  "eastern standard time": "America/New_York",
  "pacific standard time": "America/Los_Angeles",
  "tokyo standard time": "Asia/Tokyo",
  "arabian standard time": "Asia/Dubai",
  "utc": "UTC"
};

/**
 * Popular patient timezones with friendly display metadata.
 */
export const POPULAR_PATIENT_TIMEZONES: Omit<TimezoneOption, "offsetMinutes" | "formattedOffset">[] = [
  { iana: "Asia/Kathmandu", label: "Kathmandu, Nepal (NPT)", city: "Kathmandu", country: "Nepal", flag: "🇳🇵" },
  { iana: "Asia/Bangkok", label: "Bangkok, Thailand (ICT)", city: "Bangkok", country: "Thailand", flag: "🇹🇭" },
  { iana: "Asia/Kolkata", label: "New Delhi / Mumbai, India (IST)", city: "New Delhi", country: "India", flag: "🇮🇳" },
  { iana: "Asia/Singapore", label: "Singapore (SGT)", city: "Singapore", country: "Singapore", flag: "🇸🇬" },
  { iana: "Europe/London", label: "London, United Kingdom (GMT/BST)", city: "London", country: "United Kingdom", flag: "🇬🇧" },
  { iana: "America/New_York", label: "New York, USA (EST/EDT)", city: "New York", country: "United States", flag: "🇺🇸" },
  { iana: "America/Los_Angeles", label: "Los Angeles, USA (PST/PDT)", city: "Los Angeles", country: "United States", flag: "🇺🇸" },
  { iana: "Australia/Sydney", label: "Sydney, Australia (AEST/AEDT)", city: "Sydney", country: "Australia", flag: "🇦🇺" },
  { iana: "Asia/Dubai", label: "Dubai, UAE (GST)", city: "Dubai", country: "United Arab Emirates", flag: "🇦🇪" },
  { iana: "Asia/Tokyo", label: "Tokyo, Japan (JST)", city: "Tokyo", country: "Japan", flag: "🇯🇵" },
  { iana: "UTC", label: "Universal Time Coordinated (UTC)", city: "UTC", country: "Global", flag: "🌐" }
];

/**
 * Normalizes any free-text timezone entered by healthcare providers into a valid IANA timezone.
 * Handles:
 * - Trimming whitespace (" UTC+05:45", "Asia/Katmandu ")
 * - Legacy spellings ("Asia/Katmandu" -> "Asia/Kathmandu")
 * - Windows timezone names ("Nepal Standard Time" -> "Asia/Kathmandu")
 * - Parenthesized GMT offsets ("(GMT+5:45)" -> "Asia/Kathmandu")
 * - Direct UTC offsets ("UTC+05:45", "+05:30", "GMT+7")
 * - Empty string or unrecognizable formats -> fallback to provider's country code.
 */
export function normalizeTimezone(
  rawTimezone: string | null | undefined,
  countryCode: string = "TH"
): { resolvedTimezone: string; resolutionNote: string } {
  const trimmed = (rawTimezone ?? "").trim();

  // 1. Empty string -> fallback to country code
  if (!trimmed) {
    const fallback = COUNTRY_TIMEZONE_MAP[countryCode.toUpperCase()] || "UTC";
    return {
      resolvedTimezone: fallback,
      resolutionNote: `Empty timezone field. Defaulted to country code ${countryCode.toUpperCase()} (${fallback}).`
    };
  }

  // 2. Direct legacy spelling correction
  const legacyFixed = trimmed
    .replace(/^Asia\/Katmandu$/i, "Asia/Kathmandu")
    .replace(/^Asia\/Calcutta$/i, "Asia/Kolkata");

  // 3. Test if already valid IANA identifier
  if (isValidIanaTimezone(legacyFixed)) {
    return {
      resolvedTimezone: legacyFixed,
      resolutionNote: legacyFixed !== trimmed ? `Sanitized legacy spelling from "${trimmed}" to "${legacyFixed}".` : "Direct valid IANA timezone."
    };
  }

  // 4. Windows timezone names (case-insensitive)
  const lower = trimmed.toLowerCase();
  if (WINDOWS_TIMEZONE_MAP[lower]) {
    const resolved = WINDOWS_TIMEZONE_MAP[lower];
    return {
      resolvedTimezone: resolved,
      resolutionNote: `Mapped Windows timezone identifier "${trimmed}" to IANA "${resolved}".`
    };
  }

  // 5. Offset formats: "(GMT+5:45)", "UTC+05:45", "GMT+07:00", "+05:30", etc.
  const offsetMatch = trimmed.match(/(?:GMT|UTC)?\s*([+-])\s*(\d{1,2})(?::(\d{2}))?/i);
  if (offsetMatch) {
    const sign = offsetMatch[1];
    const hours = parseInt(offsetMatch[2], 10);
    const minutes = parseInt(offsetMatch[3] || "0", 10);
    const totalOffsetMinutes = (sign === "-" ? -1 : 1) * (hours * 60 + minutes);

    // Map common regional offsets in MedEx territory to specific IANA zones:
    if (totalOffsetMinutes === 345) { // +05:45
      return {
        resolvedTimezone: "Asia/Kathmandu",
        resolutionNote: `Parsed offset ${trimmed} (+05:45) and mapped to Asia/Kathmandu.`
      };
    }
    if (totalOffsetMinutes === 330) { // +05:30
      return {
        resolvedTimezone: "Asia/Kolkata",
        resolutionNote: `Parsed offset ${trimmed} (+05:30) and mapped to Asia/Kolkata.`
      };
    }
    if (totalOffsetMinutes === 420) { // +07:00
      return {
        resolvedTimezone: "Asia/Bangkok",
        resolutionNote: `Parsed offset ${trimmed} (+07:00) and mapped to Asia/Bangkok.`
      };
    }
    if (totalOffsetMinutes === 480) { // +08:00
      return {
        resolvedTimezone: "Asia/Singapore",
        resolutionNote: `Parsed offset ${trimmed} (+08:00) and mapped to Asia/Singapore.`
      };
    }
    if (totalOffsetMinutes === 0) {
      return {
        resolvedTimezone: "UTC",
        resolutionNote: `Parsed offset ${trimmed} and mapped to UTC.`
      };
    }
  }

  // 6. Unknown / Unparseable format fallback to country
  const countryFallback = COUNTRY_TIMEZONE_MAP[countryCode.toUpperCase()] || "UTC";
  return {
    resolvedTimezone: countryFallback,
    resolutionNote: `Unrecognized timezone string "${trimmed}". Safely fell back to provider's country ${countryCode.toUpperCase()} (${countryFallback}).`
  };
}

/**
 * Checks if a string is a valid IANA timezone in the current JavaScript runtime.
 */
export function isValidIanaTimezone(timeZone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Returns the current wall-clock date string (YYYY-MM-DD) in a specific timezone.
 */
export function getCurrentDateInTimezone(timeZone: string, referenceDate: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  return formatter.format(referenceDate); // en-CA outputs YYYY-MM-DD
}

/**
 * Returns the current wall-clock time string (HH:mm) in a specific timezone.
 */
export function getCurrentTimeInTimezone(timeZone: string, referenceDate: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
  return formatter.format(referenceDate);
}

/**
 * Converts a specific date (YYYY-MM-DD) and time (HH:mm) from a given timezone into an absolute UTC Date instant.
 */
export function parseZonedInstant(
  dateStr: string, // "2026-10-31"
  timeStr: string, // "10:00"
  timeZone: string
): Date {
  const [yearStr, monthStr, dayStr] = dateStr.split("-");
  const [hourStr, minStr] = timeStr.split(":");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minStr, 10);

  // Target wall clock time as UTC timestamp
  const targetUtc = Date.UTC(year, month - 1, day, hour, minute, 0);

  // Format targetUtc in the target timeZone to see what wall-clock was generated
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false
  });

  const parts = formatter.formatToParts(new Date(targetUtc));
  const p: Record<string, number> = {};
  for (const part of parts) {
    if (part.type !== "literal") {
      p[part.type] = parseInt(part.value, 10);
    }
  }
  if (p.hour === 24) p.hour = 0;

  const tzAsUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  const offsetMs = tzAsUtc - targetUtc;

  // The true UTC instant is targetUtc - offsetMs
  return new Date(targetUtc - offsetMs);
}

/**
 * Formats a UTC Date instant in a specific target timezone into time, date, and day transition offset.
 */
export function formatInstantInTimezone(
  instant: Date,
  targetTimezone: string,
  referenceDateStr: string // Provider's date (YYYY-MM-DD) for relative date offset calculation
): {
  startTime: string; // "08:45"
  date: string;      // "2026-10-31"
  formattedDate: string; // "Sat, Oct 31"
  dateOffsetDays: number; // 0, +1, or -1
  timeZoneLabel: string; // "NPT (Kathmandu)"
} {
  const timeFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: targetTimezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });

  const dateFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: targetTimezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  const displayDateFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: targetTimezone,
    weekday: "short",
    month: "short",
    day: "numeric"
  });

  const tzNameFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: targetTimezone,
    timeZoneName: "short"
  });

  const convertedDateStr = dateFormatter.format(instant);
  const convertedTimeStr = timeFormatter.format(instant);
  const formattedDate = displayDateFormatter.format(instant);

  // Compute date transition relative to provider's reference date
  let dateOffsetDays = 0;
  if (convertedDateStr > referenceDateStr) {
    dateOffsetDays = 1;
  } else if (convertedDateStr < referenceDateStr) {
    dateOffsetDays = -1;
  }

  // Extract short abbreviation
  const tzParts = tzNameFormatter.formatToParts(instant);
  const shortTz = tzParts.find((p) => p.type === "timeZoneName")?.value || "";
  const city = targetTimezone.split("/").pop()?.replace(/_/g, " ") || targetTimezone;
  const timeZoneLabel = `${shortTz} (${city})`;

  return {
    startTime: convertedTimeStr,
    date: convertedDateStr,
    formattedDate,
    dateOffsetDays,
    timeZoneLabel
  };
}

/**
 * Returns UTC offset in minutes for a given timezone at a specific point in time.
 */
export function getTimezoneOffsetMinutes(timeZone: string, referenceDate: Date = new Date()): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false
  });

  const parts = formatter.formatToParts(referenceDate);
  const p: Record<string, number> = {};
  for (const part of parts) {
    if (part.type !== "literal") {
      p[part.type] = parseInt(part.value, 10);
    }
  }
  if (p.hour === 24) p.hour = 0;

  const tzAsUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return Math.round((tzAsUtc - referenceDate.getTime()) / 60000);
}

/**
 * Formats a timezone offset in standard ISO representation, e.g. "UTC+05:45", "UTC-04:00".
 */
export function formatOffsetMinutes(offsetMinutes: number): string {
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMinutes);
  const hours = Math.floor(abs / 60).toString().padStart(2, "0");
  const mins = (abs % 60).toString().padStart(2, "0");
  return `UTC${sign}${hours}:${mins}`;
}

/**
 * Returns an explanatory phrase comparing two timezones.
 * e.g. "Bangkok is 1 hr 15 mins ahead of Kathmandu"
 */
export function getRelativeTimezoneExplanation(
  providerTimezone: string,
  patientTimezone: string,
  providerCity: string = "Hospital",
  patientCity: string = "Your location"
): string {
  if (providerTimezone === patientTimezone) {
    return `Both you and the hospital are in the same time zone (${providerTimezone.split("/").pop()?.replace(/_/g, " ")}).`;
  }

  const now = new Date();
  const providerOffset = getTimezoneOffsetMinutes(providerTimezone, now);
  const patientOffset = getTimezoneOffsetMinutes(patientTimezone, now);
  const diffMinutes = providerOffset - patientOffset;

  if (diffMinutes === 0) {
    return `${providerCity} and ${patientCity} share the same UTC offset.`;
  }

  const isAhead = diffMinutes > 0;
  const absDiff = Math.abs(diffMinutes);
  const hours = Math.floor(absDiff / 60);
  const mins = absDiff % 60;

  let timeString = "";
  if (hours > 0 && mins > 0) {
    timeString = `${hours} hr ${mins} mins`;
  } else if (hours > 0) {
    timeString = `${hours} hr${hours > 1 ? "s" : ""}`;
  } else {
    timeString = `${mins} mins`;
  }

  return `${providerCity} is ${timeString} ${isAhead ? "ahead of" : "behind"} ${patientCity}.`;
}

/**
 * Builds the full options list for the Timezone selector.
 */
export function getFullTimezoneOptions(): TimezoneOption[] {
  const now = new Date();
  return POPULAR_PATIENT_TIMEZONES.map((tz) => {
    const offsetMinutes = getTimezoneOffsetMinutes(tz.iana, now);
    return {
      ...tz,
      offsetMinutes,
      formattedOffset: formatOffsetMinutes(offsetMinutes)
    };
  });
}

