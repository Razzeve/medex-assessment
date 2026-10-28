import { NextRequest, NextResponse } from "next/server";
import { mergeGuestCart } from "@/features/cart-checkout/services/mock-db";

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const latency = parseInt(
    searchParams.get("latency") || request.headers.get("x-latency-ms") || "200",
    10
  );
  const simulateError =
    searchParams.get("simulateError") === "true" ||
    request.headers.get("x-simulate-error") === "true";

  if (latency > 0) {
    await new Promise((resolve) => setTimeout(resolve, latency));
  }

  if (simulateError) {
    return NextResponse.json(
      { error: "Simulated guest cart synchronization failure (500)" },
      { status: 500 }
    );
  }

  try {
    let items;
    try {
      const body = await request.json();
      items = body.items;
    } catch {
      // Body may be empty if testing default guestCart
      items = undefined;
    }

    const result = await mergeGuestCart(items);
    return NextResponse.json({
      cart: result.cart,
      changes: result.changes,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to merge guest cart", details: String(err) },
      { status: 500 }
    );
  }
}
