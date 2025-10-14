// src/utils/pricingUtils.ts

export interface CustomPricing {
  basePricePerCredit: number;
  discountTiers: Array<{
    minCredits: number;
    maxCredits: number;
    discountPercent: number;
    name: string;
  }>;
}

export interface PricingResult {
  credits: number;
  basePrice: number;
  discountPercent: number;
  price: number;
  savings: number;
  pricePerCredit: number;
  tierName: string;
}

/**
 * Calculate custom pricing based on credit amount and discount tiers
 */
export const calculateCustomPrice = (
  credits: number, 
  customPricing: CustomPricing
): PricingResult => {
  if (!customPricing || !customPricing.discountTiers) {
    // Fallback to base calculation
    const basePrice = credits * 0.09;
    return {
      credits,
      basePrice: Math.round(basePrice),
      discountPercent: 0,
      price: Math.round(basePrice),
      savings: 0,
      pricePerCredit: 0.09,
      tierName: "Standard Rate"
    };
  }

  const basePricePerCredit = customPricing.basePricePerCredit || 0.09;
  
  // Find the appropriate tier
  const tier = customPricing.discountTiers.find((t) => 
    credits >= t.minCredits && credits <= t.maxCredits
  );

  if (!tier) {
    // For credits beyond max tier, use highest discount
    const maxTier = customPricing.discountTiers[customPricing.discountTiers.length - 1];
    const basePrice = credits * basePricePerCredit;
    const discount = maxTier.discountPercent;
    const discountedPrice = basePrice * (1 - discount / 100);
    const savings = basePrice - discountedPrice;

    return {
      credits,
      basePrice: Math.round(basePrice),
      discountPercent: discount,
      price: Math.round(discountedPrice),
      savings: Math.round(savings),
      pricePerCredit: discountedPrice / credits,
      tierName: maxTier.name
    };
  }

  const basePrice = credits * basePricePerCredit;
  const discount = tier.discountPercent;
  const discountedPrice = basePrice * (1 - discount / 100);
  const savings = basePrice - discountedPrice;

  return {
    credits,
    basePrice: Math.round(basePrice),
    discountPercent: discount,
    price: Math.round(discountedPrice),
    savings: Math.round(savings),
    pricePerCredit: discountedPrice / credits,
    tierName: tier.name
  };
};