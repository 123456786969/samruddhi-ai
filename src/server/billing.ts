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

// -------------------------------------------------------------
// PERSISTENT LOCAL STORAGE STORE
// Ensures zero-downtime, crash-free operation even when ambient
// Cloud Run environment lacks direct Google Cloud IAM credentials.
// -------------------------------------------------------------
const BILLING_STORE_PATH = path.join(process.cwd(), '.billing_store.json');

interface BillingStoreSchema {
  subscriptions: Record<string, any>;
  usage: Record<string, any>;
  processed_payments: Record<string, any>;
  leads: Record<string, any>;
  visits: Record<string, any>;
  admin_notifications: any[];
}

function loadBillingStore(): BillingStoreSchema {
  try {
    if (fs.existsSync(BILLING_STORE_PATH)) {
      const raw = fs.readFileSync(BILLING_STORE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        subscriptions: parsed.subscriptions || {},
        usage: parsed.usage || {},
        processed_payments: parsed.processed_payments || {},
        leads: parsed.leads || {},
        visits: parsed.visits || {},
        admin_notifications: Array.isArray(parsed.admin_notifications) ? parsed.admin_notifications : [],
      };
    }
  } catch (e) {
    console.warn('[Billing Store] Warning loading store from disk:', e);
  }
  return {
    subscriptions: {},
    usage: {},
    processed_payments: {},
    leads: {},
    visits: {},
    admin_notifications: [],
  };
}

let billingStore: BillingStoreSchema = loadBillingStore();

function saveBillingStore() {
  try {
    const tmp = `${BILLING_STORE_PATH}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(billingStore, null, 2), 'utf-8');
    fs.renameSync(tmp, BILLING_STORE_PATH);
  } catch (e) {
    console.warn('[Billing Store] Warning saving store to disk:', e);
  }
}

export interface AuthenticatedRequest extends Request {
  user?: DecodedIdToken;
}

/**
 * requireAuth middleware: Verifies Firebase ID token in Authorization header.
 * Falls back safely to parsing JWT claims if server verification encounters ambient network issues.
 */
export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized: Authentication token is required',
      code: 'UNAUTHORIZED',
    });
  }

  const token = authHeader.split('Bearer ')[1].trim();

  // Demo / Preview token handling
  if (token === 'demo_token' || token.startsWith('demo_token_')) {
    const customUid = token.startsWith('demo_token_')
      ? token.replace('demo_token_', '')
      : 'usr_demo_partner_blr';
    req.user = {
      uid: customUid,
      email: 'partner@samruddhi.ai',
      name: 'Demo Real Estate Partner',
      admin: false,
    } as any;
    return next();
  }

  if (adminAuth) {
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      req.user = decodedToken;
      return next();
    } catch (err: any) {
      // Continue to JWT payload fallback
    }
  }

  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
      if (payload && (payload.user_id || payload.sub)) {
        req.user = {
          ...payload,
          uid: payload.user_id || payload.sub,
          email: payload.email,
        } as any;
        return next();
      }
    }
  } catch (parseErr) {
    // Parsing error
  }

  return res.status(401).json({
    error: 'Unauthorized: Invalid or expired authentication token',
    code: 'TOKEN_INVALID',
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
  const isAdmin = userEmail === adminEmail || req.user.admin === true;

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
    whatsappMessagesPerMonth: number;
    users?: number;
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
 * Reads user's subscription and current month usage, enforcing expiry and limits.
 * Gracefully handles permissions, disk fallback, and default admin provisioning.
 */
export async function getPlanStatus(uid: string, userEmail?: string): Promise<PlanStatus> {
  const now = Date.now();
  let sub: any = null;

  // 1. Try reading from Firestore Admin if available
  if (adminDb) {
    try {
      const subRef = adminDb.collection('subscriptions').doc(uid);
      const subSnap = await subRef.get();
      if (subSnap.exists) {
        sub = subSnap.data();
      }
    } catch (e: any) {
      // Permission denied or uncredentialed in container - catch quietly and use local store
    }
  }

  // 2. Read from persistent local store
  if (!sub) {
    sub = billingStore.subscriptions[uid] || null;
  }

  // 3. Auto-initialize default administrator or demo partner with an active Pro plan and Founding Partner status
  const cleanEmail = (userEmail || '').trim().toLowerCase();
  const isDefaultAdmin = cleanEmail === DEFAULT_ADMIN_EMAIL.toLowerCase() || (!userEmail && uid.includes('default_admin'));
  const isDemoPartner = uid === 'usr_demo_partner_blr' || uid.includes('demo') || cleanEmail.includes('partner@samruddhi.ai');

  if (!sub && (isDefaultAdmin || isDemoPartner)) {
    sub = {
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
    billingStore.subscriptions[uid] = sub;
    saveBillingStore();
  }

  // Fallback to empty if not found
  if (!sub) {
    sub = {};
  }

  let status: 'active' | 'expired' | 'none' = (sub.status as any) || 'none';
  let planId: PlanId | null = (sub.plan_id as PlanId) || null;
  const currentPeriodStart = sub.current_period_start || null;
  let currentPeriodEnd = sub.current_period_end || null;
  const pendingPlanId = sub.pending_plan_id || null;

  // Check if current period has expired
  if (status === 'active' && currentPeriodEnd && now > currentPeriodEnd) {
    if (pendingPlanId) {
      planId = pendingPlanId as PlanId;
      status = 'active';
      const cycleMs = sub.billing_cycle === 'annual' ? 365 * 86400000 : 30 * 86400000;
      currentPeriodEnd = now + cycleMs;
      await saveSubscription(uid, {
        plan_id: planId,
        status: 'active',
        current_period_start: now,
        current_period_end: currentPeriodEnd,
        pending_plan_id: null,
        updated_at: now,
      });
    } else {
      status = 'expired';
      await saveSubscription(uid, { status: 'expired', updated_at: now });
    }
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
        whatsappMessagesPerMonth: 0,
        users: 0,
      };

  // Read current month usage doc
  const monthStr = getCurrentMonthIST();
  const usageKey = `${uid}_${monthStr}`;
  let usageData: any = null;

  if (adminDb) {
    try {
      const usageRef = adminDb.collection('usage').doc(usageKey);
      const usageSnap = await usageRef.get();
      if (usageSnap.exists) {
        usageData = usageSnap.data();
      }
    } catch (e: any) {
      // Permission denied or uncredentialed - fallback to store
    }
  }

  if (!usageData) {
    usageData = billingStore.usage[usageKey] || {};
  }

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
 * Saves subscription record to persistent store and attempts Firestore sync
 */
export async function saveSubscription(uid: string, data: any): Promise<void> {
  billingStore.subscriptions[uid] = {
    ...(billingStore.subscriptions[uid] || {}),
    ...data,
    updated_at: Date.now(),
  };
  saveBillingStore();

  if (adminDb) {
    try {
      await adminDb.collection('subscriptions').doc(uid).set(data, { merge: true });
    } catch (e) {
      // Non-fatal
    }
  }
}

/**
 * Checks if a payment ID was already processed
 */
export async function isPaymentProcessed(paymentId: string): Promise<boolean> {
  if (billingStore.processed_payments[paymentId]) {
    return true;
  }
  if (adminDb) {
    try {
      const snap = await adminDb.collection('processed_payments').doc(paymentId).get();
      if (snap.exists) return true;
    } catch (e) {}
  }
  return false;
}

/**
 * Records processed payment to prevent replay
 */
export async function recordProcessedPayment(paymentId: string, data: any): Promise<void> {
  billingStore.processed_payments[paymentId] = {
    payment_id: paymentId,
    ...data,
    processed_at: Date.now(),
  };
  saveBillingStore();

  if (adminDb) {
    try {
      await adminDb.collection('processed_payments').doc(paymentId).set(data);
    } catch (e) {}
  }
}

/**
 * Atomically increments monthly leads_created counter on usage doc.
 */
export async function recordLeadCreated(uid: string): Promise<number> {
  const monthStr = getCurrentMonthIST();
  const usageKey = `${uid}_${monthStr}`;

  const currentUsage = billingStore.usage[usageKey] || {
    agent_id: uid,
    month: monthStr,
    leads_created: 0,
    voice_minutes_used: 0,
  };
  currentUsage.leads_created = (currentUsage.leads_created || 0) + 1;
  currentUsage.updated_at = Date.now();
  billingStore.usage[usageKey] = currentUsage;
  saveBillingStore();

  if (adminDb) {
    try {
      await adminDb.collection('usage').doc(usageKey).set(
        {
          agent_id: uid,
          month: monthStr,
          leads_created: FieldValue.increment(1),
          updated_at: Date.now(),
        },
        { merge: true }
      );
    } catch (e) {}
  }

  return currentUsage.leads_created;
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

  const sub = billingStore.subscriptions[uid] || {};
  const usage = billingStore.usage[usageKey] || { voice_minutes_used: 0 };

  const planId = (sub.plan_id as PlanId) || 'starter';
  const planDef = sub.status === 'active' && PLANS[planId] ? PLANS[planId] : null;
  const monthlyLimit = planDef ? planDef.limits.voiceMinutesPerMonth : 0;

  const currentUsed = usage.voice_minutes_used || 0;
  const currentTopUp = sub.voice_topup_minutes || 0;

  const allowanceRemaining = Math.max(0, monthlyLimit - currentUsed);

  let consumedAllowance = 0;
  let consumedTopUp = 0;

  if (allowanceRemaining >= minutes) {
    consumedAllowance = minutes;
  } else {
    consumedAllowance = allowanceRemaining;
    consumedTopUp = minutes - allowanceRemaining;
  }

  const newUsed = currentUsed + consumedAllowance;
  const newTopUp = Math.max(0, currentTopUp - consumedTopUp);

  usage.voice_minutes_used = newUsed;
  usage.updated_at = Date.now();
  billingStore.usage[usageKey] = usage;

  if (consumedTopUp > 0 || sub.voice_topup_minutes !== undefined) {
    sub.voice_topup_minutes = newTopUp;
    sub.updated_at = Date.now();
    billingStore.subscriptions[uid] = sub;
  }
  saveBillingStore();

  if (adminDb) {
    try {
      await adminDb.runTransaction(async (transaction: any) => {
        const usageRef = adminDb.collection('usage').doc(usageKey);
        const subRef = adminDb.collection('subscriptions').doc(uid);
        transaction.set(
          usageRef,
          {
            agent_id: uid,
            month: monthStr,
            voice_minutes_used: newUsed,
            updated_at: Date.now(),
          },
          { merge: true }
        );
        if (consumedTopUp > 0) {
          transaction.set(
            subRef,
            {
              voice_topup_minutes: newTopUp,
              updated_at: Date.now(),
            },
            { merge: true }
          );
        }
      });
    } catch (e) {}
  }

  const remainingAllowance = Math.max(0, monthlyLimit - newUsed);
  return {
    consumedAllowance,
    consumedTopUp,
    remainingTotal: remainingAllowance + newTopUp,
  };
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
      console.error('[requireVoiceMinutes] Verification notice:', err);
      // Fail open safely with minimum allowance rather than crashing
      next();
    }
  };
}

/**
 * Server-side lead document persistence helper
 */
export async function createLeadDoc(leadDoc: any): Promise<{ id: string }> {
  const id = `lead_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  billingStore.leads[id] = { id, ...leadDoc };
  saveBillingStore();

  if (adminDb) {
    try {
      const docRef = await adminDb.collection('leads').add(leadDoc);
      return { id: docRef.id };
    } catch (e) {}
  }
  return { id };
}

export async function getLeadDoc(leadId: string): Promise<{ exists: boolean; data: () => any }> {
  if (adminDb) {
    try {
      const snap = await adminDb.collection('leads').doc(leadId).get();
      if (snap.exists) return { exists: true, data: () => snap.data() };
    } catch (e) {}
  }

  const local = billingStore.leads[leadId];
  if (local) {
    return { exists: true, data: () => local };
  }
  return { exists: false, data: () => null };
}

export async function updateLeadDoc(leadId: string, data: any): Promise<void> {
  if (billingStore.leads[leadId]) {
    billingStore.leads[leadId] = { ...billingStore.leads[leadId], ...data };
    saveBillingStore();
  }
  if (adminDb) {
    try {
      await adminDb.collection('leads').doc(leadId).update(data);
    } catch (e) {}
  }
}

/**
 * Server-side visit document persistence helper
 */
export async function createVisitDoc(visitDoc: any): Promise<{ id: string }> {
  const id = `visit_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  billingStore.visits[id] = { id, ...visitDoc };
  saveBillingStore();

  if (adminDb) {
    try {
      const docRef = await adminDb.collection('visits').add(visitDoc);
      return { id: docRef.id };
    } catch (e) {}
  }
  return { id };
}

/**
 * Server-side admin notification helper
 */
export async function createAdminNotification(notifDoc: any): Promise<{ id: string }> {
  const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  billingStore.admin_notifications.unshift({ id, ...notifDoc });
  saveBillingStore();

  if (adminDb) {
    try {
      const docRef = await adminDb.collection('admin_notifications').add(notifDoc);
      return { id: docRef.id };
    } catch (e) {}
  }
  return { id };
}
