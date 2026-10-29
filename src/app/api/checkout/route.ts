import { NextRequest, NextResponse } from "next/server";
import {
  getOrderByKey,
  saveOrder,
} from "@/features/cart-checkout/services/mock-db";
import { CheckoutOrder, OrderStatus } from "@/features/cart-checkout/types";

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const latency = parseInt(
    searchParams.get("latency") || request.headers.get("x-latency-ms") || "250",
    10
  );
  const simulateError =
    searchParams.get("simulateError") === "true" ||
    request.headers.get("x-simulate-error") === "true";
  const failStatus = parseInt(
    searchParams.get("failStatus") || request.headers.get("x-fail-status") || "0",
    10
  );
  const failGroup =
    searchParams.get("failGroup") || request.headers.get("x-fail-group");

  if (latency > 0) {
    await new Promise((resolve) => setTimeout(resolve, latency));
  }

  try {
    const body = await request.json();
    const {
      groupType,
      items,
      paymentMethod = "card",
      idempotencyKey,
      patientDetails,
      packageTitle,
      providerName,
      subtotals = {},
      deliveryFees = {},
      finalTotals = {},
    } = body;

    if (!idempotencyKey) {
      return NextResponse.json(
        { error: "Missing required 'idempotencyKey' header or body field" },
        { status: 400 }
      );
    }

    // 1. Check idempotency store - if already executed with this key, return the existing order
    const existingOrder = getOrderByKey(idempotencyKey);
    if (existingOrder) {
      // If previous execution had succeeded or is stored, return it with 200/201
      return NextResponse.json(
        {
          orderId: existingOrder.orderId,
          status: existingOrder.status,
          order: existingOrder,
          idempotentReplay: true,
        },
        { status: 200 }
      );
    }

    // 2. Failure injection checks
    if (simulateError || failStatus === 500) {
      return NextResponse.json(
        {
          error: "Checkout transaction failed: upstream provider settlement error (500)",
          idempotencyKey,
          groupType,
        },
        { status: 500 }
      );
    }

    if (failStatus === 402) {
      return NextResponse.json(
        {
          error: "Payment declined: insufficient funds or card authorization failed (402 Payment Required)",
          idempotencyKey,
          groupType,
        },
        { status: 402 }
      );
    }

    if (failStatus === 409 || (failGroup && failGroup === groupType)) {
      return NextResponse.json(
        {
          error: `Booking slot conflict: provider slot for group [${groupType}] was claimed by another patient (409 Conflict)`,
          idempotencyKey,
          groupType,
        },
        { status: 409 }
      );
    }

    // 3. Create fresh order
    const orderId = `MDX-${groupType.toUpperCase().slice(0, 3)}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const status: OrderStatus = paymentMethod === "pay_at_clinic" ? "pending" : "paid";

    const newOrder: CheckoutOrder = {
      orderId,
      idempotencyKey,
      groupType,
      packageTitle: packageTitle || `${groupType.toUpperCase()} Order`,
      providerName: providerName || "MedEx Healthcare Network",
      paymentMethod,
      status,
      items: items || [],
      subtotals,
      deliveryFees,
      finalTotals,
      patientDetails: patientDetails || { fullName: "Guest Patient", email: "patient@medex.asia", phone: "+66 81 234 5678" },
      createdAt: new Date().toISOString(),
    };

    saveOrder(newOrder);

    return NextResponse.json(
      {
        orderId: newOrder.orderId,
        status: newOrder.status,
        order: newOrder,
        idempotentReplay: false,
      },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to process checkout", details: String(err) },
      { status: 500 }
    );
  }
}

