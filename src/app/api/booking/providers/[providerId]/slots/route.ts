import { NextRequest, NextResponse } from "next/server";
import {
  getSlotsForDate,
  getCalendarAvailability
} from "@/features/booking-scheduler/services/mock-db";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ providerId: string }> }
) {
  const { providerId: providerIdStr } = await context.params;
  const providerId = parseInt(providerIdStr, 10);
  const { searchParams } = new URL(request.url);

  const date = searchParams.get("date");
  const specialistId = searchParams.get("specialistId");
  const patientTimezone = searchParams.get("patientTimezone") || "Asia/Kathmandu";
  const groupSize = parseInt(searchParams.get("groupSize") || "1", 10);
  const mode = searchParams.get("mode"); // "calendar" or default slots

  const latency = parseInt(searchParams.get("latency") || "100", 10);
  const simulateError = searchParams.get("simulateError") === "true";

  if (latency > 0) {
    await new Promise((r) => setTimeout(r, latency));
  }

  if (simulateError) {
    return NextResponse.json(
      { error: "Simulated Slots API Failure (500 Internal Server Error)" },
      { status: 500 }
    );
  }

  if (!specialistId) {
    return NextResponse.json(
      { error: "Missing required parameter: specialistId" },
      { status: 400 }
    );
  }

  try {
    if (mode === "calendar") {
      const calendar = await getCalendarAvailability({
        providerId,
        specialistId,
        groupSize
      });
      return NextResponse.json({ calendar });
    }

    if (!date) {
      return NextResponse.json(
        { error: "Missing required parameter: date (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    const result = await getSlotsForDate({
      providerId,
      specialistId,
      date,
      patientTimezone,
      groupSize
    });

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to generate slots", details: String(err) },
      { status: 500 }
    );
  }
}

