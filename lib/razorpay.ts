export const RAZORPAY_PLANS = {
  smart_booker: {
    id: "smart_booker",
    name: "Smart Booker",
    amount: 149900,
    displayPrice: "Rs 1499",
    currency: "INR",
    description: "Trip planning plus flight and hotel booking assistance.",
  },
  concierge_guide: {
    id: "concierge_guide",
    name: "Concierge Guide",
    amount: 499900,
    displayPrice: "Rs 4999",
    currency: "INR",
    description: "Premium travel planning with guide and concierge support.",
  },
} as const;

export type RazorpayPlanId = keyof typeof RAZORPAY_PLANS;

export function isRazorpayPlanId(value: string): value is RazorpayPlanId {
  return value in RAZORPAY_PLANS;
}
