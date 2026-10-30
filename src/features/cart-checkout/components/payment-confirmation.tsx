import React, { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Copy,
  Check,
  Printer,
  ShoppingBag,
  ArrowRight,
  MapPin,
  Building2,
  Sparkles,
  FlaskConical,
  Stethoscope,
  ShieldCheck,
  CreditCard,
  User,
} from "lucide-react";
import { CheckoutOrder } from "../types";
import { formatCurrency } from "../utils/currency";

interface PaymentConfirmationProps {
  orders: CheckoutOrder[];
  remainingPackagesCount?: number;
}

export function PaymentConfirmation({
  orders,
  remainingPackagesCount = 0,
}: PaymentConfirmationProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (orderId: string) => {
    navigator.clipboard.writeText(orderId);
    setCopiedId(orderId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const getGroupIcon = (type: string) => {
    switch (type) {
      case "lab_test":
        return <FlaskConical className="h-5 w-5 text-teal-600" />;
      case "wellness":
        return <Sparkles className="h-5 w-5 text-purple-600" />;
      case "package":
        return <Building2 className="h-5 w-5 text-blue-600" />;
      default:
        return <Stethoscope className="h-5 w-5 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Success Hero Banner */}
      <div className="rounded-3xl border border-emerald-200 bg-gradient-to-b from-emerald-50/80 to-white p-6 sm:p-8 text-center shadow-xs">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/25 ring-8 ring-emerald-100">
          <CheckCircle2 className="h-9 w-9" />
        </div>

        <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Idempotent Settlement Authorized</span>
        </span>

        <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          Order Confirmed &amp; Payment Processed!
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600 leading-relaxed">
          Your medical order and fulfillment passes have been registered directly with accredited provider
          gateways. Digital receipts and clinical vouchers have been dispatched to your email.
        </p>

        {/* Remaining Packages Prompt */}
        {remainingPackagesCount > 0 && (
          <div className="mt-6 mx-auto max-w-lg rounded-2xl border border-teal-200 bg-teal-50/80 p-4 text-left">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-teal-950 uppercase tracking-wide">
                  Additional Packages Waiting in Cart
                </h4>
                <p className="text-xs text-teal-800 mt-0.5">
                  You have {remainingPackagesCount} remaining fulfillment package(s) ready in your cart.
                </p>
              </div>
              <Link
                href="/checkout"
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-teal-700 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-800 transition-colors shrink-0"
              >
                <span>Checkout Next Package</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Split Order Breakdown Cards */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
            Fulfilled Split Packages ({orders.length})
          </h3>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors print:hidden"
          >
            <Printer className="h-4 w-4 text-slate-500" />
            <span>Print Confirmation Pass</span>
          </button>
        </div>

        {orders.map((order) => {
          const isCopied = copiedId === order.orderId;

          return (
            <div
              key={order.orderId}
              className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden"
            >
              {/* Order Header */}
              <div className="border-b border-slate-100 bg-slate-50/80 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-2xs border border-slate-200">
                    {getGroupIcon(order.groupType)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-slate-900 text-base">
                        {order.packageTitle}
                      </h4>
                      <span className="rounded-full bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 uppercase tracking-wide">
                        {order.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Provider: <strong className="text-slate-800">{order.providerName}</strong>
                    </p>
                  </div>
                </div>

                {/* Reference Badge with Copy */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-mono font-bold text-slate-800">
                    <span className="text-slate-400 font-sans font-normal text-[11px]">Ref:</span>
                    <span>{order.orderId}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(order.orderId)}
                      className="min-h-[44px] min-w-[44px] -my-2 -mr-2 flex items-center justify-center text-slate-400 hover:text-teal-600 transition-colors"
                      title="Copy Order ID"
                      aria-label="Copy Order ID"
                    >
                      {isCopied ? (
                        <Check className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Order Items List */}
              <div className="p-4 sm:p-5 space-y-3">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Itemized Services &amp; Dispatches:
                </div>
                <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between py-2 text-xs text-slate-700"
                    >
                      <div className="font-medium pr-4">
                        <span className="font-bold text-slate-900">{item.quantity}x</span>{" "}
                        {item.product.title || "Medical Offering"}
                        {item.selectedWellnessPricing && (
                          <span className="text-[11px] text-slate-500 block">
                            ({item.selectedWellnessPricing.durationInMinutes} Mins Session)
                          </span>
                        )}
                      </div>
                      <div className="font-bold text-slate-900 shrink-0">
                        {item.product.currency}{" "}
                        {item.product.price
                          ? formatCurrency(
                              item.product.price * item.quantity,
                              item.product.currency || "THB"
                            )
                          : "Custom Option"}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Settlement Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3">
                  {/* Financial Settlement */}
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2 text-xs">
                    <div className="font-bold text-slate-700 flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5 text-teal-600" />
                      Payment &amp; Settlement:
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Method:</span>
                      <span className="font-semibold text-slate-900 capitalize">
                        {order.paymentMethod.replace("_", " ")}
                      </span>
                    </div>
                    {Object.entries(order.subtotals).map(([cur, amount]) => {
                      const fee = order.deliveryFees[cur] ?? 0;
                      const total = order.finalTotals[cur] ?? amount + fee;

                      return (
                        <div key={cur} className="border-t border-slate-100 pt-2 space-y-1">
                          <div className="flex justify-between text-slate-600">
                            <span>Services Subtotal:</span>
                            <span className="font-semibold text-slate-800">
                              {formatCurrency(amount, cur)}
                            </span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>Fulfillment Fee:</span>
                            <span className="font-semibold text-slate-800">
                              {fee > 0 ? formatCurrency(fee, cur) : "Free"}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm font-extrabold text-slate-900 border-t border-slate-100 pt-1">
                            <span>Total Settled:</span>
                            <span className="text-teal-700">{formatCurrency(total, cur)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Patient & Dispatch Details */}
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2 text-xs">
                    <div className="font-bold text-slate-700 flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-teal-600" />
                      Patient &amp; Dispatch Routing:
                    </div>
                    <div className="text-slate-600 space-y-1">
                      <p>
                        Patient: <strong className="text-slate-900">{order.patientDetails.fullName}</strong>
                      </p>
                      <p>
                        Contact: <strong className="text-slate-900">{order.patientDetails.phone}</strong>
                      </p>
                      <p>
                        Digital Receipt: <strong className="text-slate-900">{order.patientDetails.email}</strong>
                      </p>
                      {order.patientDetails.addressLine && (
                        <p className="flex items-start gap-1">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
                          <span>
                            {order.patientDetails.addressLine}, {order.patientDetails.city}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Navigation CTAs */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
        <Link
          href="/cart"
          className="inline-flex min-h-[44px] w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <ShoppingBag className="h-4 w-4 text-teal-600" />
          <span>Return to Healthcare Cart</span>
        </Link>

        <Link
          href="/services"
          className="inline-flex min-h-[44px] w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-teal-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-teal-700 transition-all focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <span>Explore More Services</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
