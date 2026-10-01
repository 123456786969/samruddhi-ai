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

export const GST_PERCENT = 18;
export const GST_RATE = GST_PERCENT / 100;
export const OVERAGE_VOICE_PER_MIN = 9;
export const FOUNDING_PARTNER_DISCOUNT_PERCENT = 40; // 40% off, locked for 12 months
export const FOUNDING_PARTNER_DISCOUNT = FOUNDING_PARTNER_DISCOUNT_PERCENT / 100;

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
 * PRICING - single source of truth.
 *
 * List prices live in PLANS / VOICE_TOP_UP_PACKS (whole rupees, before GST). All charging maths is
 * done in INTEGER PAISE so no floating-point rupee amounts ever reach Razorpay or the database:
 *   subtotal = list price (minus the founding-partner discount, if any)
 *   gst      = 18% of subtotal, rounded to the nearest paise
 *   total    = subtotal + gst
 * The server uses the *Paise functions to create orders and to check what was actually paid.
 * The rupee helpers below are for display only and are derived from the same numbers.
 */
export interface PricePaise {
  subtotalPaise: number;
  gstPaise: number;
  totalPaise: number;
}

const rupeesToPaise = (rupees: number) => Math.round(rupees * 100);

function withGst(subtotalPaise: number): PricePaise {
  const gstPaise = Math.round((subtotalPaise * GST_PERCENT) / 100);
  return { subtotalPaise, gstPaise, totalPaise: subtotalPaise + gstPaise };
}

export function planPricePaise(
  planId: PlanId | string,
  cycle: BillingCycle = 'monthly',
  isFoundingPartner: boolean = false
): PricePaise | null {
  const plan = PLANS[planId as PlanId];
  if (!plan) return null;
  const listPaise = rupeesToPaise(cycle === 'annual' ? plan.annualPrice : plan.monthlyPrice);
  // list price is a whole number of rupees, so this is an exact integer
  const subtotalPaise = isFoundingPartner
    ? Math.round((listPaise * (100 - FOUNDING_PARTNER_DISCOUNT_PERCENT)) / 100)
    : listPaise;
  return withGst(subtotalPaise);
}

export function topUpPricePaise(packId: string): (PricePaise & { pack: VoiceTopUpPack }) | null {
  const pack = VOICE_TOP_UP_PACKS.find((p) => p.id === packId);
  if (!pack) return null;
  return { ...withGst(rupeesToPaise(pack.price)), pack };
}

const toRupees = (paise: number) => paise / 100;

/** Display helper: subtotal, GST and total in rupees (may contain paise), derived from the paise maths. */
export function priceFor(
  planId: PlanId | string,
  cycle: BillingCycle = 'monthly',
  isFoundingPartner: boolean = false
): { subtotal: number; gst: number; total: number } {
  const p = planPricePaise(planId, cycle, isFoundingPartner);
  if (!p) return { subtotal: 0, gst: 0, total: 0 };
  return { subtotal: toRupees(p.subtotalPaise), gst: toRupees(p.gstPaise), total: toRupees(p.totalPaise) };
}

/** Display helper for voice top-up packs, derived from the paise maths. */
export function priceForTopUp(packId: string): {
  subtotal: number;
  gst: number;
  total: number;
  pack?: VoiceTopUpPack;
} {
  const p = topUpPricePaise(packId);
  if (!p) return { subtotal: 0, gst: 0, total: 0 };
  return { subtotal: toRupees(p.subtotalPaise), gst: toRupees(p.gstPaise), total: toRupees(p.totalPaise), pack: p.pack };
}

/**
 * Formats INR amounts with comma grouping like ₹6,999 / ₹24,999
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
