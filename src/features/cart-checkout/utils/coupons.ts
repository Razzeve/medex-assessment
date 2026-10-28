import { CouponDiscount, Currency } from "../types";

export const AVAILABLE_COUPONS: Record<string, CouponDiscount> = {
  MEDEX10: {
    code: "MEDEX10",
    description: "10% Healthcare savings across all marketplace providers",
    percentageDiscount: 10,
  },
  HEALTH500: {
    code: "HEALTH500",
    description: "Flat 500 credit off service fees (minimum order 1,500)",
    fixedDiscounts: {
      THB: 500,
      NPR: 500,
      INR: 500,
    },
  },
  FREESHIP: {
    code: "FREESHIP",
    description: "100% discount on phlebotomist home sample collection dispatch",
  },
};

export function validateCoupon(code: string): {
  valid: boolean;
  coupon?: CouponDiscount;
  message: string;
} {
  const normalized = code.trim().toUpperCase();
  if (!normalized) {
    return { valid: false, message: "Please enter a promo code" };
  }

  const coupon = AVAILABLE_COUPONS[normalized];
  if (!coupon) {
    return {
      valid: false,
      message: `Promo code "${code}" is invalid or expired. Try MEDEX10 or HEALTH500`,
    };
  }

  return {
    valid: true,
    coupon,
    message: `Promo code "${normalized}" applied successfully!`,
  };
}

/**
 * Calculates discount amount per currency.
 */
export function calculateDiscount(
  coupon: CouponDiscount | null,
  subtotals: Record<string, number>
): Record<string, number> {
  if (!coupon) return {};
  const discounts: Record<string, number> = {};

  for (const [currency, subtotal] of Object.entries(subtotals)) {
    if (coupon.percentageDiscount) {
      const discountVal = (subtotal * coupon.percentageDiscount) / 100;
      discounts[currency] = Math.round(discountVal * 100) / 100;
    } else if (coupon.fixedDiscounts) {
      const cur = currency as Currency;
      const fixed = coupon.fixedDiscounts[cur] || 0;
      // Do not exceed the subtotal
      discounts[currency] = Math.min(subtotal, fixed);
    }
  }

  return discounts;
}
