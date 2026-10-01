export type PlanId = 'starter' | 'pro' | 'elite';
export type BillingCycle = 'monthly' | 'annual';

export interface PlanLimits {
  leadsPerMonth: number;
  voiceMinutesPerMonth: number;
  users: number;
}

export interface PlanDefinition {
  id: PlanId;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  popular?: boolean;
  limits: PlanLimits;
  features: string[];
}

export const GST_RATE = 0.18;
export const OVERAGE_VOICE_PER_MIN = 9;
export const FOUNDING_PARTNER_DISCOUNT = 0.40; // 40% off, locked for 12 months

export interface VoiceTopUpPack {
  id: string;
  minutes: number;
  price: number; // Subtotal before GST in INR
}

export const VOICE_TOP_UP_PACKS: VoiceTopUpPack[] = [
  { id: 'voice_100', minutes: 100, price: 900 },
  { id: 'voice_500', minutes: 500, price: 4500 },
];

/**
 * Plans Configuration
 * Note: Features listed only reflect verified functionality implemented in the codebase.
 * Multi-user team invite/management and offline review calls are omitted from display features.
 */
export const PLANS: Record<PlanId, PlanDefinition> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 6999,
    annualPrice: 69990, // billed yearly = 10 months, i.e. 2 months free
    limits: {
      leadsPerMonth: 500,
      voiceMinutesPerMonth: 300,
      users: 2,
    },
    features: [
      'AI lead CRM & pipeline',
      'WhatsApp AI follow-ups',
      '300 AI voice minutes / month',
      '500 leads / month',
      'Site visit scheduling',
      'Public property catalogue',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 24999,
    annualPrice: 249990,
    popular: true,
    limits: {
      leadsPerMonth: 1500,
      voiceMinutesPerMonth: 1500,
      users: 5,
    },
    features: [
      'Everything in Starter',
      '1,500 AI voice minutes / month',
      '1,500 leads / month',
      'Reports & ad-spend tracking',
    ],
  },
  elite: {
    id: 'elite',
    name: 'Elite',
    monthlyPrice: 49999,
    annualPrice: 499990,
    limits: {
      leadsPerMonth: 3000,
      voiceMinutesPerMonth: 3000,
      users: 15,
    },
    features: [
      'Everything in Pro',
      '3,000 AI voice minutes / month',
      '3,000 leads / month',
      'Priority WhatsApp support',
    ],
  },
};

/**
 * Calculates subtotal, 18% GST, and total for a plan with rounding to whole numbers.
 */
export function priceFor(
  planId: PlanId | string,
  cycle: BillingCycle = 'monthly',
  isFoundingPartner: boolean = false
): { subtotal: number; gst: number; total: number } {
  const plan = PLANS[planId as PlanId];
  if (!plan) {
    return { subtotal: 0, gst: 0, total: 0 };
  }

  let basePrice = cycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;

  if (isFoundingPartner) {
    basePrice = Math.round(basePrice * (1 - FOUNDING_PARTNER_DISCOUNT));
  }

  const subtotal = Math.round(basePrice);
  const gst = Math.round(subtotal * GST_RATE);
  const total = subtotal + gst;

  return { subtotal, gst, total };
}

/**
 * Calculates subtotal, 18% GST, and total for a voice top-up pack.
 */
export function priceForTopUp(packId: string): {
  subtotal: number;
  gst: number;
  total: number;
  pack?: VoiceTopUpPack;
} {
  const pack = VOICE_TOP_UP_PACKS.find((p) => p.id === packId);
  if (!pack) {
    return { subtotal: 0, gst: 0, total: 0 };
  }
  const subtotal = pack.price;
  const gst = Math.round(subtotal * GST_RATE);
  const total = subtotal + gst;
  return { subtotal, gst, total, pack };
}

/**
 * Formats INR amounts with comma grouping like ₹6,999 / ₹24,999
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}
