import React, { useState } from "react";
import {
  Wrench,
  ChevronDown,
  RotateCcw,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { useCartStore } from "../store/use-cart-store";

export function DevPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const devSettings = useCartStore((state) => state.devSettings);
  const setDevSettings = useCartStore((state) => state.setDevSettings);
  const resetAll = useCartStore((state) => state.resetAll);
  const checkoutSession = useCartStore((state) => state.checkoutSession);
  const orders = useCartStore((state) => state.orders);

  const orderCount = Object.keys(orders).length;
  const activeKeysCount = Object.keys(checkoutSession.idempotencyKeys).length;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Collapsed Toggle Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-lg hover:bg-slate-800 transition-all focus:outline-none focus:ring-2 focus:ring-teal-500"
          aria-label="Open Dev & Failure Injection Panel"
        >
          <Wrench className="h-4 w-4 text-teal-400" />
          <span>Dev & Test Tools</span>
          {(devSettings.failPartialSecondGroup ||
            devSettings.failNextCheckout ||
            devSettings.failNextQuantity ||
            devSettings.simulateOffline) && (
            <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
          )}
        </button>
      )}

      {/* Expanded Panel */}
      {isOpen && (
        <div className="w-84 sm:w-96 rounded-2xl border border-slate-700 bg-slate-900 p-5 text-slate-200 shadow-2xl transition-all">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-900/60 text-teal-400">
                <Wrench className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                  Assessment Test Controls
                </h4>
                <p className="text-[10px] text-slate-400">Latency & Failure Injection Mock Engine</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded p-1 text-slate-400 hover:text-white transition-colors"
              aria-label="Close panel"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4 text-xs">
            {/* Latency Selection */}
            <div>
              <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5 mb-1.5">
                <Clock className="h-3.5 w-3.5 text-teal-400" />
                Artificial Network Latency
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[0, 150, 500, 1500].map((ms) => (
                  <button
                    key={ms}
                    type="button"
                    onClick={() => setDevSettings({ latencyMs: ms })}
                    className={`rounded-lg py-1 text-center font-medium transition-all ${
                      devSettings.latencyMs === ms
                        ? "bg-teal-600 text-white font-bold"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {ms === 0 ? "0ms" : `${ms}ms`}
                  </button>
                ))}
              </div>
            </div>

            {/* Failure Injection Toggles */}
            <div className="space-y-2 border-t border-slate-800 pt-3">
              <div className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                Failure Injection Scenarios
              </div>

              {/* Requirement 6: Partial Failure */}
              <label className="flex items-start gap-2.5 rounded-lg bg-slate-800/60 p-2 cursor-pointer hover:bg-slate-800">
                <input
                  type="checkbox"
                  checked={devSettings.failPartialSecondGroup}
                  onChange={(e) =>
                    setDevSettings({ failPartialSecondGroup: e.target.checked })
                  }
                  className="mt-0.5 rounded border-slate-600 text-teal-500 focus:ring-teal-400"
                />
                <span className="leading-snug">
                  <strong className="block text-slate-100">
                    Fail Group 2 on Checkout (Req. 6)
                  </strong>
                  <span className="text-[10px] text-slate-400">
                    Simulates partial failure: Group 1 succeeds, Group 2 fails with retry.
                  </span>
                </span>
              </label>

              {/* Requirement 2: 409 Conflict on Quantity */}
              <label className="flex items-start gap-2.5 rounded-lg bg-slate-800/60 p-2 cursor-pointer hover:bg-slate-800">
                <input
                  type="checkbox"
                  checked={devSettings.failNextQuantity}
                  onChange={(e) =>
                    setDevSettings({ failNextQuantity: e.target.checked })
                  }
                  className="mt-0.5 rounded border-slate-600 text-teal-500 focus:ring-teal-400"
                />
                <span className="leading-snug">
                  <strong className="block text-slate-100">
                    Fail Next Quantity (409 Conflict)
                  </strong>
                  <span className="text-[10px] text-slate-400">
                    Tests optimistic rollback and user notification.
                  </span>
                </span>
              </label>

              {/* Payment Failure */}
              <label className="flex items-start gap-2.5 rounded-lg bg-slate-800/60 p-2 cursor-pointer hover:bg-slate-800">
                <input
                  type="checkbox"
                  checked={devSettings.failNextCheckout}
                  onChange={(e) =>
                    setDevSettings({ failNextCheckout: e.target.checked })
                  }
                  className="mt-0.5 rounded border-slate-600 text-teal-500 focus:ring-teal-400"
                />
                <span className="leading-snug">
                  <strong className="block text-slate-100">
                    Fail Next Payment (402 Declined)
                  </strong>
                  <span className="text-[10px] text-slate-400">
                    Triggers bank card decline error during order processing.
                  </span>
                </span>
              </label>

              {/* Offline mode */}
              <label className="flex items-start gap-2.5 rounded-lg bg-slate-800/60 p-2 cursor-pointer hover:bg-slate-800">
                <input
                  type="checkbox"
                  checked={devSettings.simulateOffline}
                  onChange={(e) =>
                    setDevSettings({ simulateOffline: e.target.checked })
                  }
                  className="mt-0.5 rounded border-slate-600 text-teal-500 focus:ring-teal-400"
                />
                <span className="leading-snug">
                  <strong className="block text-slate-100">Simulate Offline Mode</strong>
                  <span className="text-[10px] text-slate-400">
                    Blocks network requests to verify offline handling.
                  </span>
                </span>
              </label>
            </div>

            {/* In-Memory Orders & Idempotency Monitor */}
            <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-[11px] text-slate-400">
              <span>Orders Placed: <strong className="text-white">{orderCount}</strong></span>
              <span>Idempotency Keys: <strong className="text-teal-400">{activeKeysCount}</strong></span>
            </div>

            {/* Reset All Action */}
            <div className="border-t border-slate-800 pt-3">
              <button
                type="button"
                onClick={() => resetAll()}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-rose-950/60 border border-rose-800/60 px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-900 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Cart, Orders & State</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
