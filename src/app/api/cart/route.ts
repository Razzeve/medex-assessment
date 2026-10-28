import { NextRequest, NextResponse } from "next/server";
import { getOrInitCart, resetMockCart } from "@/features/cart-checkout/services/mock-db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const latency = parseInt(
    searchParams.get("latency") || request.headers.get("x-latency-ms") || "150",
    10
  );
  const simulateError =
    searchParams.get("simulateError") === "true" ||
    request.headers.get("x-simulate-error") === "true";
  const shouldReset = searchParams.get("reset") === "true";

  if (latency > 0) {
    await new Promise((resolve) => setTimeout(resolve, latency));
  }

  if (simulateError) {
    return NextResponse.json(
      { error: "Simulated Cart Service Failure (500 Internal Server Error)" },
      { status: 500 }
    );
  }

  try {
    if (shouldReset) {
      const resetCart = await resetMockCart();
      return NextResponse.json({ cart: resetCart });
    }

    const { cart, guestCart } = await getOrInitCart();
    return NextResponse.json({ cart, guestCart });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch cart", details: String(err) },
      { status: 500 }
    );
  }
}
