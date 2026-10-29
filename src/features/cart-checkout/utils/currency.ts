import { Currency } from "../types";

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  THB: "฿",
  NPR: "NPR ",
  INR: "₹",
};

/**
 * Format a numeric amount with appropriate currency symbols and localization.
 * Avoids any multi-currency conversions.
 */
export function formatCurrency(amount: number, currency: Currency | string): string {
  const safeAmount = isNaN(amount) ? 0 : amount;
  const formattedNumber = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: Number.isInteger(safeAmount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(safeAmount);

  switch (currency) {
    case "THB":
      return `฿${formattedNumber}`;
    case "NPR":
      return `NPR ${formattedNumber}`;
    case "INR":
      return `₹${formattedNumber}`;
    default:
      return `${currency} ${formattedNumber}`;
  }
}

/**
 * Formats a dictionary of subtotals in multiple currencies.
 * Returns an array of human-readable currency strings: e.g. ["฿1,677", "NPR 12,520"]
 */
export function formatSubtotals(subtotals: Record<string, number>): { currency: string; amount: number; formatted: string }[] {
  return Object.entries(subtotals)
    .filter(([, amount]) => typeof amount === "number" && !isNaN(amount) && amount > 0)
    .map(([currency, amount]) => ({
      currency,
      amount,
      formatted: formatCurrency(amount, currency),
    }));
}

/**
 * Safe currency addition to prevent floating-point anomalies
 */
export function addMoney(a: number, b: number): number {
  return Math.round((a + b) * 100) / 100;
}

