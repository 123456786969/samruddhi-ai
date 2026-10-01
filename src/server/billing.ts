import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getAuth, DecodedIdToken } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { isOtpClaimValid } from '../shared/otp';
import { usageCycle } from '../shared/cycles';
import { PLANS, PlanId, priceFor, priceForTopUp, VoiceTopUpPack, VOICE_TOP_UP_PACKS } from '../shared/plans';

// Load Firebase configuration
const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
let firebaseConfig: any = {};
try {
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  }
} catch (e) {
  console.warn('[Billing Server] Could not load firebase-applet-config.json:', e);
}

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  try {
    initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || firebaseConfig.projectId || 'xerotic-destiny-06rpq',
    });
  } catch (e) {
    console.warn('[Billing Server] Firebase Admin app init notice:', e);
  }
}

// Attempt to connect to Firestore and Auth (used as primary or opportunistic fallback)
let adminDbInstance: any = null;
let adminAuthInstance: any = null;
try {
  adminDbInstance = getFirestore(
    getApp(),
    firebaseConfig.firestoreDatabaseId || 'ai-studio-samruddhiai-a28d48e6-2050-4f48-a32f-f20463cefdb2'
  );
} catch (e) {
  console.warn('[Billing Server] Admin Firestore init notice:', e);
}

try {
  adminAuthInstance = getAuth();
} catch (e) {
  console.warn('[Billing Server] Admin Auth init notice:', e);
}

export const adminDb = adminDbInstance;
export const adminAuth = adminAuthInstance;
export { FieldValue };

export const DEFAULT_ADMIN_EMAIL = 'rajubasavanahalli@gmail.com';

export interface AuthenticatedRequest extends Request {
  user?: DecodedIdToken;
}

/**
 * Verifies a Firebase ID token and returns its decoded claims, or null when it
 * is missing/invalid. Signatures are always verified. Decoding without
 * verification is only possible when ALLOW_UNVERIFIED_TOKENS=true outside
 * production (local development without network access to Google certs).
 */
export async function verifyBearerToken(authHeader: string | undefined): Promise<DecodedIdToken | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) return null;

  if (adminAuth) {
    try {
      return await adminAuth.verifyIdToken(token);
    } catch {
      // fall through to the (dev-only) fallback below
    }
  }

  if (process.env.NODE_ENV !== 'production' && process.env.ALLOW_UNVERIFIED_TOKENS === 'true') {
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
        const uid = payload?.user_id || payload?.sub;
        if (uid) return { ...payload, uid, email: payload.email } as DecodedIdToken;
      }
    } catch {
      // invalid token
    }
  }
  return null;
}

/**
 * requireIdentity: verifies the Firebase ID token only (who is calling).
 * Used by the OTP routes themselves, which must work before OTP verification is complete.
 */
export async function requireIdentity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized: Authentication token is required',
      code: 'UNAUTHORIZED',
    });
  }

  const user = await verifyBearerToken(authHeader);
  if (!user) {
    return res.status(401).json({
      error: 'Unauthorized: Invalid or expired authentication token',
      code: 'TOKEN_INVALID',
    });
  }
  req.user = user;
  return next();
}

/**
 * Whether the OTP second step is enforced. Always on in production; can be switched off
 * for local development with OTP_REQUIRED=false.
 */
export function isOtpEnforced(): boolean {
  return process.env.NODE_ENV === 'production' || process.env.OTP_REQUIRED !== 'false';
}

/**
 * requireAuth middleware: valid Firebase ID token AND a recent server-recorded OTP verification
 * (custom claim set by /api/verify-otp). Without it the login is not considered complete.
 */
export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  return requireIdentity(req, res, () => {
    if (isOtpEnforced() && !isOtpClaimValid(req.user as any)) {
      return res.status(403).json({
        error: 'Verification required: please complete the email verification code step.',
        code: 'OTP_REQUIRED',
      });
    }
    return next();
  });
}

/**
 * requireAdmin middleware: Ensures authenticated user is designated administrator
 */
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  }

  const adminEmail = (
    process.env.ADMIN_NOTIFICATION_EMAIL ||
    process.env.ADMIN_EMAIL ||
    DEFAULT_ADMIN_EMAIL
  )
    .trim()
    .toLowerCase();

  const userEmail = (req.user.email || '').trim().toLowerCase();
  const isAdmin = (userEmail === adminEmail && req.user.email_verified === true) || req.user.admin === true;

  if (!isAdmin) {
    return res.status(403).json({
      error: 'Forbidden: Administrator privileges required',
      code: 'FORBIDDEN',
    });
  }

  next();
}

/**
 * Thrown when a plan limit stops an action. `code` + `action` let the frontend show the right
 * call to action ("Upgrade" vs "Buy top-up"); `status` is always 402 Payment Required.
 */
export type PlanLimitCode = 'PLAN_REQUIRED' | 'LEAD_LIMIT' | 'VOICE_LIMIT' | 'USER_LIMIT';
export class PlanLimitError extends Error {
  status = 402;
  limit?: number;
  used?: number;
  remaining?: number;
  constructor(
    public code: PlanLimitCode,
    message: string,
    public action: 'upgrade' | 'top_up',
    details: { limit?: number; used?: number; remaining?: number } = {}
  ) {
    super(message);
    Object.assign(this, details);
  }
  toJSON() {
    const out: Record<string, any> = { error: this.message, code: this.code, action: this.action };
    for (const k of ['limit', 'used', 'remaining'] as const) if (this[k] !== undefined) out[k] = this[k];
    return out;
  }
}

export const usageDocId = (uid: string, cycleKey: string) => `${uid}_${cycleKey}`;

/** True when the subscription document currently entitles the user to their plan. */
function isEntitled(sub: any, now: number): boolean {
  return !!sub && sub.status === 'active' && !!sub.plan_id && !!PLANS[sub.plan_id as PlanId] &&
    (!sub.current_period_end || now <= sub.current_period_end);
}

export interface PlanStatus {
  plan: {
    id: PlanId;
    name: string;
    monthlyPrice: number;
    annualPrice: number;
  } | null;
  plan_id: string | null;
  billing_cycle: 'monthly' | 'annual';
  status: 'active' | 'expired' | 'none';
  current_period_start: number | null;
  current_period_end: number | null;
  limits: {
    leadsPerMonth: number;
    voiceMinutesPerMonth: number;
    users: number;
  };
  usage: {
    leads: number;
    voiceMinutes: number;
  };
  remaining: {
    leads: number;
    voiceMinutes: number;
    voiceAllowance: number;
    voiceTopUp: number;
  };
  /** Current usage cycle (limits reset at `end`). null when there has never been a subscription. */
  usageCycle: { start: number | null; end: number | null };
  isFoundingPartner: boolean;
  foundingPartnerUntil: number | null;
  pendingPlanId: string | null;
}

/**
 * Firestore is the single source of truth for billing, usage and lead state.
 * Failures are surfaced (never swallowed) so a misconfigured database can't
 * silently grant or lose entitlements.
 */
function db(): any {
  if (!adminDb) {
    throw new Error('Firestore Admin is not initialised; billing storage is unavailable.');
  }
  return adminDb;
}

/**
 * Transactions on the same document (usage counters, a subscription) contend when many requests for
 * one agent arrive together - e.g. a bulk lead import. The SDK default of 5 attempts is too low for
 * that, so allow plenty of retries rather than failing a legitimate request.
 */
const TX_ATTEMPTS = 30;
const runTx = <T>(fn: (tx: any) => Promise<T>): Promise<T> => db().runTransaction(fn, { maxAttempts: TX_ATTEMPTS });


/**
 * Reads user's subscription and current month usage, enforcing expiry and limits.
 * Provisions the default administrator with an active Pro plan on first access.
 */
export async function getPlanStatus(uid: string, userEmail?: string): Promise<PlanStatus> {
  const now = Date.now();
  const subRef = db().collection('subscriptions').doc(uid);

  // Auto-initialize default administrator with an active Pro plan and Founding Partner status.
  // Callers must only pass an email taken from a verified ID token.
  const cleanEmail = (userEmail || '').trim().toLowerCase();
  const isDefaultAdmin = cleanEmail === DEFAULT_ADMIN_EMAIL.toLowerCase();

  // Read (and, for the default admin on first access, create) in one transaction so two
  // simultaneous first requests can't both provision or overwrite each other.
  let sub: any = await runTx(async (tx: any) => {
    const snap = await tx.get(subRef);
    if (snap.exists) return snap.data();
    if (!isDefaultAdmin) return null;
    const created = {
      plan_id: 'pro',
      billing_cycle: 'annual',
      status: 'active',
      current_period_start: now,
      current_period_end: now + 365 * 86400000,
      founding_partner: true,
      founding_partner_until: now + 365 * 86400000,
      voice_topup_minutes: 300,
      updated_at: now,
    };
    tx.set(subRef, created);
    return created;
  });

  if (!sub) {
    sub = {};
  }

  let status: 'active' | 'expired' | 'none' = (sub.status as any) || 'none';
  let planId: PlanId | null = (sub.plan_id as PlanId) || null;
  let currentPeriodStart = sub.current_period_start || null;
  let currentPeriodEnd = sub.current_period_end || null;
  let pendingPlanId = sub.pending_plan_id || null;

  // Check if current period has expired. Re-read inside a transaction so a concurrent
  // payment that just extended the period is never overwritten with "expired".
  if (status === 'active' && currentPeriodEnd && now > currentPeriodEnd) {
    const next: any = await runTx(async (tx: any) => {
      const snap = await tx.get(subRef);
      const cur = snap.exists ? snap.data() : {};
      if (cur.status !== 'active' || !cur.current_period_end || now <= cur.current_period_end) {
        return cur; // already handled or renewed by someone else
      }
      if (cur.pending_plan_id) {
        const cycleMs = cur.billing_cycle === 'annual' ? 365 * 86400000 : 30 * 86400000;
        const renewed = {
          plan_id: cur.pending_plan_id,
          status: 'active',
          current_period_start: now,
          current_period_end: now + cycleMs,
          pending_plan_id: null,
          updated_at: now,
        };
        tx.set(subRef, renewed, { merge: true });
        return { ...cur, ...renewed };
      }
      tx.set(subRef, { status: 'expired', updated_at: now }, { merge: true });
      return { ...cur, status: 'expired' };
    });
    sub = next;
    status = (sub.status as any) || 'none';
    planId = (sub.plan_id as PlanId) || null;
    currentPeriodStart = sub.current_period_start || null;
    currentPeriodEnd = sub.current_period_end || null;
    pendingPlanId = sub.pending_plan_id || null;
  }

  // Check founding partner status
  const foundingPartnerUntil = sub.founding_partner_until || null;
  const isFoundingPartner = !!(
    (sub.founding_partner === true && foundingPartnerUntil && now < foundingPartnerUntil) ||
    isDefaultAdmin
  );

  // Active plan definition
  const planDef = (status === 'active' && planId && PLANS[planId]) ? PLANS[planId] : null;

  const limits = planDef
    ? planDef.limits
    : {
        leadsPerMonth: 0,
        voiceMinutesPerMonth: 0,
        users: 0,
      };

  // Read current month usage doc
  const cycle = usageCycle(sub, now);
  const usageSnap = await db().collection('usage').doc(usageDocId(uid, cycle.key)).get();
  const usageData: any = usageSnap.exists ? usageSnap.data() : {};

  const leadsUsed = usageData.leads_created || 0;
  const voiceMinutesUsed = usageData.voice_minutes_used || 0;
  const voiceTopUpMinutes = sub.voice_topup_minutes || 0;

  const leadsRemaining = Math.max(0, limits.leadsPerMonth - leadsUsed);
  const voiceAllowanceRemaining = Math.max(0, limits.voiceMinutesPerMonth - voiceMinutesUsed);
  const voiceTotalRemaining = voiceAllowanceRemaining + voiceTopUpMinutes;

  return {
    plan: planDef
      ? {
          id: planDef.id,
          name: planDef.name,
          monthlyPrice: planDef.monthlyPrice,
          annualPrice: planDef.annualPrice,
        }
      : null,
    plan_id: planId,
    billing_cycle: sub.billing_cycle || 'monthly',
    status,
    current_period_start: currentPeriodStart,
    current_period_end: currentPeriodEnd,
    limits,
    usage: {
      leads: leadsUsed,
      voiceMinutes: voiceMinutesUsed,
    },
    remaining: {
      leads: leadsRemaining,
      voiceMinutes: voiceTotalRemaining,
      voiceAllowance: voiceAllowanceRemaining,
      voiceTopUp: voiceTopUpMinutes,
    },
    usageCycle: { start: cycle.start, end: cycle.end },
    isFoundingPartner,
    foundingPartnerUntil: foundingPartnerUntil || (isDefaultAdmin ? now + 365 * 86400000 : null),
    pendingPlanId,
  };
}

/**
 * Merges data into the user's subscription document.
 */
export async function saveSubscription(uid: string, data: any): Promise<void> {
  await db().collection('subscriptions').doc(uid).set({ ...data, updated_at: Date.now() }, { merge: true });
}

const CYCLE_MS = { monthly: 30 * 86400000, annual: 365 * 86400000 } as const;

/**
 * Activates or extends a paid plan (called only after a payment has been verified server-side).
 *  - no active plan (new or expired): starts now
 *  - still active: the paid cycle is ADDED to the current period end, so paying early never loses
 *    the remaining days (and the cycle anchor, current_period_start, does not move)
 *  - a different plan while active: the new plan applies immediately and the cycle is added to the
 *    remaining time (proration for up/downgrades is a later phase)
 * Runs in a transaction so concurrent payments stack correctly.
 */
export async function applyPlanPayment(
  uid: string,
  planId: PlanId,
  cycle: 'monthly' | 'annual',
  now = Date.now()
): Promise<{ current_period_start: number; current_period_end: number }> {
  const ref = db().collection('subscriptions').doc(uid);
  return runTx(async (tx: any) => {
    const snap = await tx.get(ref);
    const cur = snap.exists ? snap.data() : {};
    const stillActive = cur.status === 'active' && cur.current_period_end && cur.current_period_end > now;
    const start = stillActive ? cur.current_period_start || now : now;
    const end = (stillActive ? cur.current_period_end : now) + CYCLE_MS[cycle];
    tx.set(
      ref,
      {
        plan_id: planId,
        billing_cycle: cycle,
        status: 'active',
        current_period_start: start,
        current_period_end: end,
        pending_plan_id: null,
        updated_at: now,
      },
      { merge: true }
    );
    return { current_period_start: start, current_period_end: end };
  });
}

/**
 * Credits extra voice minutes atomically (safe against concurrent top-ups).
 */
export async function addVoiceTopUpMinutes(uid: string, minutes: number): Promise<void> {
  await db().collection('subscriptions').doc(uid).set(
    { voice_topup_minutes: FieldValue.increment(minutes), updated_at: Date.now() },
    { merge: true }
  );
}

/**
 * Checks if a payment ID was already processed
 */
export async function isPaymentProcessed(paymentId: string): Promise<boolean> {
  const snap = await db().collection('processed_payments').doc(paymentId).get();
  return snap.exists;
}

/**
 * Atomically claims a payment ID. Returns false if it was already processed,
 * which makes concurrent verify-payment / webhook deliveries credit only once.
 */
export async function claimPayment(paymentId: string, data: any): Promise<boolean> {
  try {
    await db().collection('processed_payments').doc(paymentId).create({
      payment_id: paymentId,
      ...data,
      processed_at: Date.now(),
    });
    return true;
  } catch (e: any) {
    // gRPC ALREADY_EXISTS
    if (e?.code === 6 || /already exists/i.test(e?.message || '')) return false;
    throw e;
  }
}

/**
 * Releases a claim so a failed crediting attempt can be retried (e.g. by webhook redelivery).
 */
export async function releasePayment(paymentId: string): Promise<void> {
  await db().collection('processed_payments').doc(paymentId).delete();
}

/**
 * Records processed payment to prevent replay (kept for callers that don't need the claim result)
 */
export async function recordProcessedPayment(paymentId: string, data: any): Promise<void> {
  await db().collection('processed_payments').doc(paymentId).set({
    payment_id: paymentId,
    ...data,
    processed_at: Date.now(),
  });
}

/**
 * Creates a lead AND counts it against the plan's lead limit in ONE transaction, so two simultaneous
 * requests can never both slip under the limit.
 *
 *  mode 'agent'  - an agent adding their own lead: blocked at the limit with PlanLimitError
 *                  (PLAN_REQUIRED without an active plan, LEAD_LIMIT at the cap).
 *  mode 'public' - a buyer enquiry from the public catalogue: NEVER dropped. At the cap (or without
 *                  an active plan) the lead is still saved, with automation paused, and is not
 *                  counted against the cap.
 */
export async function createLeadWithinLimit(
  uid: string,
  leadDoc: Record<string, any>,
  mode: 'agent' | 'public',
  options: { whenOverLimit?: Record<string, any> } = {},
  now = Date.now()
): Promise<{ id: string; automation_paused: boolean; overLimit: boolean; used: number; limit: number }> {
  const subRef = db().collection('subscriptions').doc(uid);
  const leadRef = db().collection('leads').doc();

  return runTx(async (tx: any) => {
    const subSnap = await tx.get(subRef);
    const sub = subSnap.exists ? subSnap.data() : null;
    const entitled = isEntitled(sub, now);
    const limit = entitled ? PLANS[sub.plan_id as PlanId].limits.leadsPerMonth : 0;

    const cycle = usageCycle(sub, now);
    const usageRef = db().collection('usage').doc(usageDocId(uid, cycle.key));
    const usageSnap = await tx.get(usageRef);
    const used = usageSnap.exists ? usageSnap.data().leads_created || 0 : 0;

    const overLimit = !entitled || used >= limit;

    if (overLimit && mode === 'agent') {
      if (!entitled) {
        throw new PlanLimitError('PLAN_REQUIRED', 'An active plan is required to add leads.', 'upgrade', { limit: 0, used });
      }
      throw new PlanLimitError(
        'LEAD_LIMIT',
        `You have reached your plan's limit of ${limit} leads for this billing cycle. Upgrade your plan to add more.`,
        'upgrade',
        { limit, used }
      );
    }

    tx.create(leadRef, {
      ...leadDoc,
      ...(overLimit ? options.whenOverLimit : {}),
      automation_paused: overLimit || leadDoc.automation_paused === true,
    });
    if (!overLimit) {
      tx.set(
        usageRef,
        {
          agent_id: uid,
          cycle_start: cycle.start,
          leads_created: FieldValue.increment(1),
          updated_at: now,
        },
        { merge: true }
      );
    }
    return { id: leadRef.id, automation_paused: overLimit, overLimit, used: overLimit ? used : used + 1, limit };
  });
}

/**
 * Strictly consumes AI voice minutes: the allowance for the current billing cycle first, then purchased
 * top-up minutes. In ONE transaction it checks there are enough minutes and deducts them, so concurrent
 * calls can't overspend. Throws VOICE_LIMIT (action: top_up) when there aren't enough.
 */
export async function consumeVoiceMinutes(
  uid: string,
  rawMinutes: number,
  now = Date.now()
): Promise<{ consumedAllowance: number; consumedTopUp: number; remainingTotal: number }> {
  const minutes = Math.max(1, Math.ceil(rawMinutes));
  const subRef = db().collection('subscriptions').doc(uid);

  return runTx(async (tx: any) => {
    const subSnap = await tx.get(subRef);
    const sub = subSnap.exists ? subSnap.data() : null;
    if (!isEntitled(sub, now)) {
      throw new PlanLimitError('PLAN_REQUIRED', 'An active plan is required to use AI Voice calling.', 'upgrade');
    }

    const cycle = usageCycle(sub, now);
    const usageRef = db().collection('usage').doc(usageDocId(uid, cycle.key));
    const usageSnap = await tx.get(usageRef);
    const used = usageSnap.exists ? usageSnap.data().voice_minutes_used || 0 : 0;

    const allowance = PLANS[sub.plan_id as PlanId].limits.voiceMinutesPerMonth;
    const topUp = sub.voice_topup_minutes || 0;
    const allowanceLeft = Math.max(0, allowance - used);

    if (allowanceLeft + topUp < minutes) {
      throw new PlanLimitError(
        'VOICE_LIMIT',
        `Not enough voice minutes: ${allowanceLeft + topUp} left, ${minutes} needed. Buy a top-up pack to continue.`,
        'top_up',
        { limit: allowance, used, remaining: allowanceLeft + topUp }
      );
    }

    const fromAllowance = Math.min(allowanceLeft, minutes);
    const fromTopUp = minutes - fromAllowance;

    tx.set(
      usageRef,
      { agent_id: uid, cycle_start: cycle.start, voice_minutes_used: used + fromAllowance, updated_at: now },
      { merge: true }
    );
    if (fromTopUp > 0) {
      tx.set(subRef, { voice_topup_minutes: topUp - fromTopUp, updated_at: now }, { merge: true });
    }
    return {
      consumedAllowance: fromAllowance,
      consumedTopUp: fromTopUp,
      remainingTotal: allowanceLeft - fromAllowance + (topUp - fromTopUp),
    };
  });
}

/**
 * Records minutes a call ACTUALLY used (after it ends). Unlike consumeVoiceMinutes it never throws for
 * lack of minutes - the call already happened - it takes what is available and floors at zero.
 */
export async function recordVoiceMinutes(
  uid: string,
  rawMinutes: number,
  now = Date.now()
): Promise<{ consumedAllowance: number; consumedTopUp: number; remainingTotal: number }> {
  const minutes = Math.max(1, Math.ceil(rawMinutes));
  const subRef = db().collection('subscriptions').doc(uid);

  return runTx(async (tx: any) => {
    const subSnap = await tx.get(subRef);
    const sub = subSnap.exists ? subSnap.data() : {};
    const planDef = isEntitled(sub, now) ? PLANS[sub.plan_id as PlanId] : null;
    const allowance = planDef ? planDef.limits.voiceMinutesPerMonth : 0;

    const cycle = usageCycle(sub, now);
    const usageRef = db().collection('usage').doc(usageDocId(uid, cycle.key));
    const usageSnap = await tx.get(usageRef);
    const used = usageSnap.exists ? usageSnap.data().voice_minutes_used || 0 : 0;
    const topUp = sub.voice_topup_minutes || 0;

    const allowanceLeft = Math.max(0, allowance - used);
    const consumedAllowance = Math.min(allowanceLeft, minutes);
    const consumedTopUp = Math.min(topUp, minutes - consumedAllowance);

    tx.set(
      usageRef,
      { agent_id: uid, cycle_start: cycle.start, voice_minutes_used: used + consumedAllowance, updated_at: now },
      { merge: true }
    );
    if (consumedTopUp > 0) {
      tx.set(subRef, { voice_topup_minutes: topUp - consumedTopUp, updated_at: now }, { merge: true });
    }
    return {
      consumedAllowance,
      consumedTopUp,
      remainingTotal: allowanceLeft - consumedAllowance + (topUp - consumedTopUp),
    };
  });
}

/**
 * Middleware: refuses to start a voice call when the user has no active plan or fewer than
 * `estimatedMinutes` left. (Use consumeVoiceMinutes to actually reserve them without a race.)
 */
export function requireVoiceMinutes(estimatedMinutes = 2) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
    }
    try {
      const planStatus = await getPlanStatus(req.user.uid, req.user.email);
      if (planStatus.status !== 'active') {
        return res.status(402).json(
          new PlanLimitError('PLAN_REQUIRED', 'An active plan is required to use AI Voice calling.', 'upgrade').toJSON()
        );
      }
      if (planStatus.remaining.voiceMinutes < estimatedMinutes) {
        return res.status(402).json(
          new PlanLimitError(
            'VOICE_LIMIT',
            `Insufficient voice minutes. You have ${planStatus.remaining.voiceMinutes} minute(s) remaining. Please top up your voice allowance.`,
            'top_up',
            { limit: planStatus.limits.voiceMinutesPerMonth, used: planStatus.usage.voiceMinutes, remaining: planStatus.remaining.voiceMinutes }
          ).toJSON()
        );
      }
      next();
    } catch (err: any) {
      // Fail closed: if usage can't be verified, don't hand out free minutes
      console.error('[requireVoiceMinutes] Verification failed:', err);
      return res.status(503).json({ error: 'Could not verify your voice minutes. Please try again.' });
    }
  };
}

/**
 * Team seats. The plan's `users` limit (2 / 5 / 15) counts the owner plus invited members.
 * There is no team-invite feature yet; when it exists, call assertSeatAvailable before adding a
 * member. Members are expected in the `team_members` collection with `owner_id == owner uid`.
 */
export async function getSeatStatus(uid: string, now = Date.now()): Promise<{ limit: number; used: number; remaining: number }> {
  const subSnap = await db().collection('subscriptions').doc(uid).get();
  const sub = subSnap.exists ? subSnap.data() : null;
  const limit = isEntitled(sub, now) ? PLANS[sub.plan_id as PlanId].limits.users : 0;
  const members = await db().collection('team_members').where('owner_id', '==', uid).count().get();
  const used = 1 + members.data().count; // the owner always takes a seat
  return { limit, used, remaining: Math.max(0, limit - used) };
}

export async function assertSeatAvailable(uid: string): Promise<void> {
  const seats = await getSeatStatus(uid);
  if (seats.limit === 0) {
    throw new PlanLimitError('PLAN_REQUIRED', 'An active plan is required to add team members.', 'upgrade');
  }
  if (seats.used >= seats.limit) {
    throw new PlanLimitError(
      'USER_LIMIT',
      `Your plan includes ${seats.limit} users and all seats are taken. Upgrade your plan to add more.`,
      'upgrade',
      { limit: seats.limit, used: seats.used, remaining: 0 }
    );
  }
}

export async function getLeadDoc(leadId: string): Promise<{ exists: boolean; data: () => any }> {
  const snap = await db().collection('leads').doc(leadId).get();
  if (snap.exists) return { exists: true, data: () => snap.data() };
  return { exists: false, data: () => null };
}

export async function updateLeadDoc(leadId: string, data: any): Promise<void> {
  await db().collection('leads').doc(leadId).update(data);
}

/**
 * Server-side visit document persistence helper
 */
export async function createVisitDoc(visitDoc: any): Promise<{ id: string }> {
  const docRef = await db().collection('visits').add(visitDoc);
  return { id: docRef.id };
}

/**
 * Server-side admin notification helper
 */
export async function createAdminNotification(notifDoc: any): Promise<{ id: string }> {
  const docRef = await db().collection('admin_notifications').add(notifDoc);
  return { id: docRef.id };
}
