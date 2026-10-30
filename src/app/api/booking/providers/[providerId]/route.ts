import { NextRequest, NextResponse } from "next/server";
import { getProviderById } from "@/features/booking-scheduler/services/mock-db";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ providerId: string }> }
) {
  const { providerId: providerIdStr } = await context.params;
  const providerId = parseInt(providerIdStr, 10);
  const { searchParams } = new URL(request.url);
  const latency = parseInt(searchParams.get("latency") || "100", 10);
  const simulateError = searchParams.get("simulateError") === "true";

  if (latency > 0) {
    await new Promise((r) => setTimeout(r, latency));
  }

  if (simulateError) {
    return NextResponse.json(
      { error: "Simulated Provider Detail Failure (500)" },
      { status: 500 }
    );
  }

  try {
    const provider = await getProviderById(providerId);
    if (!provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }
    return NextResponse.json(provider);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch provider", details: String(err) },
      { status: 500 }
    );
  }
}

