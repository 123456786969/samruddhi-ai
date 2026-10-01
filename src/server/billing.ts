import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getAuth, DecodedIdToken } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
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
      projectId: firebaseConfig.projectId || 'xerotic-destiny-06rpq',
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
 * requireAuth middleware: Verifies the Firebase ID token in the Authorization header.
 */
export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
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
 * Computes current month in Indian Standard Time (Asia/Kolkata) formatted as YYYY-MM
 */
export function getCurrentMonthIST(): string {
  const d = new Date();
  const utc = d.getTime() + d.getTimezoneOffset() * 60000;
  const ist = new Date(utc + 3600000 * 5.5);
  const year = ist.getFullYear();
  const month = String(ist.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
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

const randomSuffix = () => Math.random().toString(36).substring(2, 8);

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
  let sub: any = await db().runTransaction(async (tx: any) => {
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
    const next: any = await db().runTransaction(async (tx: any) => {
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
  const monthStr = getCurrentMonthIST();
  const usageKey = `${uid}_${monthStr}`;
  const usageSnap = await db().collection('usage').doc(usageKey).get();
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
 * Atomically increments monthly leads_created counter on usage doc.
 */
export async function recordLeadCreated(uid: string): Promise<number> {
  const monthStr = getCurrentMonthIST();
  const usageKey = `${uid}_${monthStr}`;
  const ref = db().collection('usage').doc(usageKey);
  await ref.set(
    {
      agent_id: uid,
      month: monthStr,
      leads_created: FieldValue.increment(1),
      updated_at: Date.now(),
    },
    { merge: true }
  );
  const snap = await ref.get();
  return snap.data()?.leads_created || 1;
}

/**
 * Atomically records voice minutes consumed, using allowance first then extra top-up pack.
 */
export async function recordVoiceMinutes(uid: string, rawMinutes: number): Promise<{
  consumedAllowance: number;
  consumedTopUp: number;
  remainingTotal: number;
}> {
  const minutes = Math.max(1, Math.ceil(rawMinutes));
  const monthStr = getCurrentMonthIST();
  const usageKey = `${uid}_${monthStr}`;
  const usageRef = db().collection('usage').doc(usageKey);
  const subRef = db().collection('subscriptions').doc(uid);

  return db().runTransaction(async (tx: any) => {
    const [usageSnap, subSnap] = await Promise.all([tx.get(usageRef), tx.get(subRef)]);
    const usage = usageSnap.exists ? usageSnap.data() : {};
    const sub = subSnap.exists ? subSnap.data() : {};

    const planId = sub.plan_id as PlanId;
    const planDef = sub.status === 'active' && planId && PLANS[planId] ? PLANS[planId] : null;
    const monthlyLimit = planDef ? planDef.limits.voiceMinutesPerMonth : 0;

    const currentUsed = usage.voice_minutes_used || 0;
    const currentTopUp = sub.voice_topup_minutes || 0;
    const allowanceRemaining = Math.max(0, monthlyLimit - currentUsed);

    const consumedAllowance = Math.min(allowanceRemaining, minutes);
    const consumedTopUp = Math.min(currentTopUp, minutes - consumedAllowance);

    const newUsed = currentUsed + consumedAllowance;
    const newTopUp = currentTopUp - consumedTopUp;

    tx.set(
      usageRef,
      { agent_id: uid, month: monthStr, voice_minutes_used: newUsed, updated_at: Date.now() },
      { merge: true }
    );
    if (consumedTopUp > 0) {
      tx.set(subRef, { voice_topup_minutes: newTopUp, updated_at: Date.now() }, { merge: true });
    }

    return {
      consumedAllowance,
      consumedTopUp,
      remainingTotal: Math.max(0, monthlyLimit - newUsed) + newTopUp,
    };
  });
}

/**
 * Middleware: Requires available voice call minutes before proceeding
 */
export function requireVoiceMinutes(estimatedMinutes = 2) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
    }

    try {
      const planStatus = await getPlanStatus(req.user.uid, req.user.email);
      if (planStatus.status !== 'active') {
        return res.status(402).json({
          error: 'An active plan is required to use AI Voice calling.',
          code: 'PLAN_REQUIRED',
        });
      }

      if (planStatus.remaining.voiceMinutes < estimatedMinutes) {
        return res.status(402).json({
          error: `Insufficient voice minutes. You have ${planStatus.remaining.voiceMinutes} minute(s) remaining. Please top up your voice allowance.`,
          code: 'VOICE_LIMIT',
          remaining: planStatus.remaining.voiceMinutes,
        });
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
 * Server-side lead document persistence helper
 */
export async function createLeadDoc(leadDoc: any): Promise<{ id: string }> {
  const docRef = await db().collection('leads').add(leadDoc);
  return { id: docRef.id };
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
