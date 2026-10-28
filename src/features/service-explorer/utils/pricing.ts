import {
  Currency,
  RawService,
  WellnessPricingOption,
  CalculatedPrice,
  WellnessCalculatedOption,
} from '../types';

/**
 * Calculates the final price for a service or wellness option following MedEx business rules:
 *
 * discountAmount = discountType === 'percent' ? price * discount / 100 : discount
 * afterDiscount = price - discountAmount
 * chargeAmount = serviceChargeType === 'percent' ? afterDiscount * serviceCharge / 100 : serviceCharge
 * finalPrice = afterDiscount + chargeAmount
 *
 * NOTE: Rounding is applied ONLY at display time, never in intermediary calculations.
 * Data quirks handled:
 * - If discountAmount > price, discount is clamped to price to prevent negative prices.
 * - String numbers are parsed safely; fallback to 0 if NaN.
 */
export function calculateSingleOptionPrice(
  rawPrice: string | number,
  rawDiscount: string | number | null | undefined,
  discountType: 'percent' | 'amount' | null | undefined,
  rawServiceCharge: string | number | null | undefined,
  serviceChargeType: 'percent' | 'amount' | null | undefined
): {
  originalPrice: number;
  discountAmount: number;
  serviceChargeAmount: number;
  finalPrice: number;
} {
  const price = typeof rawPrice === 'string' ? parseFloat(rawPrice) || 0 : rawPrice || 0;
  const discountVal = typeof rawDiscount === 'string' ? parseFloat(rawDiscount) || 0 : rawDiscount || 0;
  const chargeVal =
    typeof rawServiceCharge === 'string' ? parseFloat(rawServiceCharge) || 0 : rawServiceCharge || 0;

  let discountAmount = 0;
  if (discountType === 'percent') {
    discountAmount = (price * discountVal) / 100;
  } else if (discountType === 'amount') {
    discountAmount = discountVal;
  }

  // Handle data inconsistency: discount exceeds base price
  discountAmount = Math.min(Math.max(0, discountAmount), price);

  const afterDiscount = Math.max(0, price - discountAmount);

  let serviceChargeAmount = 0;
  if (serviceChargeType === 'percent') {
    serviceChargeAmount = (afterDiscount * chargeVal) / 100;
  } else if (serviceChargeType === 'amount') {
    serviceChargeAmount = chargeVal;
  }

  const finalPrice = Math.max(0, afterDiscount + serviceChargeAmount);

  return {
    originalPrice: price,
    discountAmount,
    serviceChargeAmount,
    finalPrice,
  };
}

/**
 * Calculates pricing for any service (Standard or Wellness).
 */
export function calculateServicePrice(
  service: RawService,
  providerCurrency: Currency = 'THB'
): CalculatedPrice {
  if (service.type === 'wellness') {
    const rawOptions = service.wellnessPricing || [];
    if (rawOptions.length === 0) {
      return {
        isWellness: true,
        currency: providerCurrency,
        originalPrice: 0,
        discountAmount: 0,
        serviceChargeAmount: 0,
        finalPrice: 0,
        wellnessOptions: [],
      };
    }

    const calculatedOptions: WellnessCalculatedOption[] = rawOptions.map(
      (opt: WellnessPricingOption) => {
        const { originalPrice, discountAmount, serviceChargeAmount, finalPrice } =
          calculateSingleOptionPrice(
            opt.price,
            opt.discount,
            opt.discountType,
            opt.serviceCharge,
            opt.serviceChargeType
          );
        return {
          id: opt.id,
          durationInMinutes: opt.durationInMinutes,
          originalPrice,
          discountAmount,
          serviceChargeAmount,
          finalPrice,
        };
      }
    );

    // Pick the lowest option as the representative "From" price
    const minOption = calculatedOptions.reduce(
      (min, opt) => (opt.finalPrice < min.finalPrice ? opt : min),
      calculatedOptions[0]
    );

    return {
      isWellness: true,
      currency: providerCurrency,
      originalPrice: minOption.originalPrice,
      discountAmount: minOption.discountAmount,
      serviceChargeAmount: minOption.serviceChargeAmount,
      finalPrice: minOption.finalPrice,
      wellnessOptions: calculatedOptions,
      minDuration: minOption.durationInMinutes,
    };
  }

  const { originalPrice, discountAmount, serviceChargeAmount, finalPrice } =
    calculateSingleOptionPrice(
      service.price || '0',
      service.discount,
      service.discountType,
      service.serviceCharge,
      service.serviceChargeType
    );

  return {
    isWellness: false,
    currency: providerCurrency,
    originalPrice,
    discountAmount,
    serviceChargeAmount,
    finalPrice,
  };
}

/**
 * Formats currency to 2 decimal places with localized thousands separator.
 * Displays currency code before the number (e.g. THB 5,970.60).
 */
export function formatPrice(amount: number, currency: Currency): string {
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return `${currency} ${formatted}`;
}
