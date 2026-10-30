import { NextRequest, NextResponse } from "next/server";
import { getSlotsForDate, getCalendarAvailability } from "@/features/booking-scheduler/services/mock-db";

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
  const mode = searchParams.get("mode");

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
        { error: "Missing required parameter: date" },
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

