export type PlanId = 'starter' | 'pro' | 'elite';
export type BillingCycle = 'monthly' | 'annual';

export interface PlanLimits {
  leadsPerMonth: number;
  voiceMinutesPerMonth: number;
  whatsappMessagesPerMonth: number;
  users?: number;
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
 * Plans Configuration - Vridhi AI style: call minutes & WhatsApp messages based, zero per-seat fees
 */
export const PLANS: Record<PlanId, PlanDefinition> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 6999,
    annualPrice: 69990, // billed yearly = 10 months, i.e. 2 months free
    limits: {
      leadsPerMonth: 500,
      voiceMinutesPerMonth: 500,
      whatsappMessagesPerMonth: 2500,
    },
    features: [
      '500 AI Voice Call Minutes / month',
      '2,500 WhatsApp Messages / month',
      'AI Lead CRM & Pipeline (500 leads)',
      'Instant 60s inbound lead qualification',
      'Site visit scheduling & calendar sync',
      'Public property catalogue',
      'Unlimited team members (zero per-seat fees)',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 37799,
    annualPrice: 377990,
    popular: true,
    limits: {
      leadsPerMonth: 3000,
      voiceMinutesPerMonth: 3000,
      whatsappMessagesPerMonth: 15000,
    },
    features: [
      'Everything in Starter',
      '3,000 AI Voice Call Minutes / month',
      '15,000 WhatsApp Messages / month',
      '3,000 CRM leads / month',
      'Full Meta Ads Management & auto lead sync',
      'Multi-lingual AI caller (Hindi, Kannada, Telugu, English)',
      'Live call transfer to sales closers',
      'Unlimited team members (zero per-seat fees)',
    ],
  },
  elite: {
    id: 'elite',
    name: 'Elite',
    monthlyPrice: 54899,
    annualPrice: 548990,
    limits: {
      leadsPerMonth: 6000,
      voiceMinutesPerMonth: 6000,
      whatsappMessagesPerMonth: 35000,
    },
    features: [
      'Everything in Pro',
      '6,000 AI Voice Call Minutes / month',
      '35,000 WhatsApp Messages / month',
      '6,000 CRM leads / month',
      'Dedicated Meta Ads Growth Manager',
      'Custom AI Voice cloning for top closers',
      'Custom Webhooks & CRM integrations',
      '24/7 Priority SLA & VIP Account Director',
      'Unlimited team members (zero per-seat fees)',
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
 * Formats INR amounts with comma grouping like ₹6,999 / ₹37,799 / ₹54,899
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}
