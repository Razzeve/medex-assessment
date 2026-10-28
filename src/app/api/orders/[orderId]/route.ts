import { NextRequest, NextResponse } from "next/server";
import { getOrderById } from "@/features/cart-checkout/services/mock-db";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await context.params;

  const order = getOrderById(orderId);
  if (!order) {
    return NextResponse.json(
      { error: `Order ${orderId} not found` },
      { status: 404 }
    );
  }

  return NextResponse.json({
    orderId: order.orderId,
    status: order.status,
    order,
  });
}
