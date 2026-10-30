import { NextRequest, NextResponse } from "next/server";
import { rescheduleBooking } from "@/features/booking-scheduler/services/mock-db";
import { RescheduleRequest } from "@/features/booking-scheduler/types";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: bookingId } = await context.params;
  const { searchParams } = new URL(request.url);
  const latency = parseInt(searchParams.get("latency") || "200", 10);
  const simulateError = searchParams.get("simulateError") === "true";
  const simulate409 = searchParams.get("simulate409") === "true";

  if (latency > 0) {
    await new Promise((r) => setTimeout(r, latency));
  }

  if (simulateError) {
    return NextResponse.json(
      { error: "Simulated Reschedule Failure (500)" },
      { status: 500 }
    );
  }

  try {
    const body: RescheduleRequest = await request.json();
    if (!body.date || !body.startTime) {
      return NextResponse.json(
        { error: "Missing required fields: date, startTime" },
        { status: 400 }
      );
    }

    const result = await rescheduleBooking(bookingId, body.date, body.startTime, simulate409);
    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error,
          conflictingSlot: { date: body.date, startTime: body.startTime },
          closestAvailableSlots: result.closestAvailableSlots
        },
        { status: result.status }
      );
    }

    return NextResponse.json(result.data, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: "Reschedule execution error", details: String(err) },
      { status: 500 }
    );
  }
}

