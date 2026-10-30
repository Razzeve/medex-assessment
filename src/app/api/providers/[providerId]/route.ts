import { NextRequest, NextResponse } from "next/server";
import { getProviderById } from "@/features/booking-scheduler/services/mock-db";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ providerId: string }> }
) {
  const { providerId: providerIdStr } = await context.params;
  const providerId = parseInt(providerIdStr, 10);
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

