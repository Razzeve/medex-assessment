import { NextRequest, NextResponse } from "next/server";
import {
  removeCartItem,
  updateItemQuantity,
  updateItemWellnessDuration,
} from "@/features/cart-checkout/services/mock-db";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ lineId: string }> }
) {
  const { lineId } = await context.params;
  const { searchParams } = new URL(request.url);

  const latency = parseInt(
    searchParams.get("latency") || request.headers.get("x-latency-ms") || "150",
    10
  );
  const simulateError =
    searchParams.get("simulateError") === "true" ||
    request.headers.get("x-simulate-error") === "true";
  const failStatus = parseInt(
    searchParams.get("failStatus") || request.headers.get("x-fail-status") || "0",
    10
  );

  if (latency > 0) {
    await new Promise((resolve) => setTimeout(resolve, latency));
  }

  if (simulateError || failStatus === 500) {
    return NextResponse.json(
      { error: "Simulated server failure on cart item update (500)" },
      { status: 500 }
    );
  }

  if (failStatus === 409) {
    return NextResponse.json(
      { error: "Conflict: inventory allocation locked or modified concurrently (409 Conflict)" },
      { status: 409 }
    );
  }

  try {
    const body = await request.json();

    if (typeof body.quantity === "number") {
      const result = await updateItemQuantity(lineId, body.quantity);
      if (result.notFound) {
        return NextResponse.json({ error: "Item not found in cart" }, { status: 404 });
      }
      return NextResponse.json({ cart: result.cart });
    }

    if (body.wellnessPricingId) {
      const result = await updateItemWellnessDuration(lineId, body.wellnessPricingId);
      if (result.notFound) {
        return NextResponse.json({ error: "Item not found in cart" }, { status: 404 });
      }
      return NextResponse.json({ cart: result.cart });
    }

    return NextResponse.json(
      { error: "Invalid PATCH payload. Expected quantity or wellnessPricingId" },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to update cart item", details: String(err) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ lineId: string }> }
) {
  const { lineId } = await context.params;
  const { searchParams } = new URL(request.url);

  const latency = parseInt(
    searchParams.get("latency") || request.headers.get("x-latency-ms") || "150",
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
      { error: "Simulated failure on cart item deletion (500)" },
      { status: 500 }
    );
  }

  try {
    const result = await removeCartItem(lineId);
    if (result.notFound) {
      return NextResponse.json({ error: "Item not found in cart" }, { status: 404 });
    }

    // 204 No Content per brief specification
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to delete cart item", details: String(err) },
      { status: 500 }
    );
  }
}
