import { NextRequest, NextResponse } from "next/server";
import { getProviders, getExistingBooking, resetDb } from "@/features/booking-scheduler/services/mock-db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const latency = parseInt(searchParams.get("latency") || "100", 10);
  const simulateError = searchParams.get("simulateError") === "true";
  const reset = searchParams.get("reset") === "true";

  if (latency > 0) {
    await new Promise((r) => setTimeout(r, latency));
  }

  if (simulateError) {
    return NextResponse.json(
      { error: "Simulated Provider Service Failure (500 Internal Server Error)" },
      { status: 500 }
    );
  }

  if (reset) {
    await resetDb();
  }

  try {
    const providers = await getProviders();
    const existingBooking = await getExistingBooking();
    return NextResponse.json({ providers, existingBooking });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch providers", details: String(err) },
      { status: 500 }
    );
  }
}

