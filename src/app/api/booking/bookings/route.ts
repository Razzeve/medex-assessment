import { NextRequest, NextResponse } from "next/server";
import { createBooking } from "@/features/booking-scheduler/services/mock-db";
import { BookingRequest } from "@/features/booking-scheduler/types";

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const latency = parseInt(searchParams.get("latency") || "200", 10);
  const simulateError = searchParams.get("simulateError") === "true";
  const simulate409 = searchParams.get("simulate409") === "true";

  if (latency > 0) {
    await new Promise((r) => setTimeout(r, latency));
  }

  if (simulateError) {
    return NextResponse.json(
      { error: "Simulated Booking Execution Failure (500)" },
      { status: 500 }
    );
  }

  try {
    const body: BookingRequest = await request.json();
    if (!body.providerId || !body.specialistId || !body.date || !body.startTime) {
      return NextResponse.json(
        { error: "Missing required booking fields" },
        { status: 400 }
      );
    }

    const result = await createBooking(body, simulate409);
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

    return NextResponse.json(result.data, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "Booking execution error", details: String(err) },
      { status: 500 }
    );
  }
}

