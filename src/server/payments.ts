import crypto from 'crypto';
import {
  adminDb,
  getPlanStatus,
  claimPayment,
  releasePayment,
  applyPlanPayment,
  addVoiceTopUpMinutes,
} from './billing';
import { PLANS, PlanId, planPricePaise, topUpPricePaise } from '../shared/plans';

/**
 * Razorpay payment handling. Rules this module enforces:
 *  - Prices, the founding discount and GST are computed here from the single price config, in paise.
 *    No amount from the client is ever used.
 *  - A plan/top-up is credited only after server-side verification (signed webhook, or a verified
 *    signature + Razorpay order lookup), and only from the order record we stored ourselves -
 *    never from fields the browser sends.
 *  - Crediting is idempotent: each Razorpay payment id is claimed atomically, and webhook event ids
 *    are de-duplicated, so retries never extend a plan twice.
 *  - Every step is logged: `payments` (one document per order) and `payment_events` (append-only).
 */

export interface RazorpayLike {
  orders: {
    create(params: any): Promise<any>;
    fetch(orderId: string): Promise<any>;
  };
}

export interface PaymentsConfig {
  razorpay: RazorpayLike | null;
  keyId: string;
  keySecret: string;
  webhookSecret?: string;
  isProd: boolean;
}

export class PaymentError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
  }
}

function db(): any {
  if (!adminDb) throw new Error('Firestore Admin is not initialised.');
  return adminDb;
}

const payments = () => db().collection('payments');

async function logEvent(entry: Record<string, any>) {
  try {
    const clean = JSON.parse(JSON.stringify(entry)); // drop undefined values Firestore rejects
    await db().collection('payment_events').add({ ...clean, received_at: Date.now() });
  } catch (e) {
    console.error('[Payments] Could not write payment_events entry:', e);
  }
}

const safeEqual = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

// ---------------------------------------------------------------------------------------------
// 1. Create order
// ---------------------------------------------------------------------------------------------
export async function createOrder(
  cfg: PaymentsConfig,
  input: { uid: string; email?: string; type?: string; planId?: string; billingCycle?: string; packId?: string }
) {
  const { uid } = input;
  const type = input.type || 'plan';
  const cycle: 'monthly' | 'annual' = input.billingCycle === 'annual' ? 'annual' : 'monthly';

  if (!cfg.razorpay && cfg.isProd) {
    throw new PaymentError(503, 'Payments are not configured. Please contact support.');
  }

  const planStatus = await getPlanStatus(uid, input.email);

  let price: { subtotalPaise: number; gstPaise: number; totalPaise: number };
  let description: string;
  let planId: string | null = null;
  let packId: string | null = null;

  if (type === 'plan') {
    const p = planPricePaise(input.planId || '', cycle, planStatus.isFoundingPartner);
    if (!p || !PLANS[input.planId as PlanId]) {
      throw new PaymentError(400, 'Invalid plan_id. Must be starter, pro, or elite.');
    }
    price = p;
    planId = input.planId!;
    description = `Samruddhi AI ${PLANS[planId as PlanId].name} Plan (${cycle})${planStatus.isFoundingPartner ? ' - Founding Partner 40% Off' : ''}`;
  } else if (type === 'voice_topup') {
    if (planStatus.status !== 'active') {
      throw new PaymentError(400, 'Voice minute top-ups require an active plan subscription.');
    }
    const t = topUpPricePaise(input.packId || '');
    if (!t) throw new PaymentError(400, 'Invalid pack_id. Must be voice_100 or voice_500.');
    price = t;
    packId = t.pack.id;
    description = `Samruddhi AI ${t.pack.minutes} Extra Voice Minutes Top-up Pack`;
  } else {
    throw new PaymentError(400, 'Invalid order type. Must be plan or voice_topup.');
  }

  let orderId: string;
  if (cfg.razorpay) {
    try {
      const order = await cfg.razorpay.orders.create({
        amount: price.totalPaise,
        currency: 'INR',
        receipt: `rcpt_${uid.slice(0, 6)}_${Date.now().toString().slice(-6)}`,
        notes: { uid, type, plan_id: planId || '', billing_cycle: type === 'plan' ? cycle : '', pack_id: packId || '' },
      });
      orderId = order.id;
    } catch (e: any) {
      console.error('[Payments] Razorpay order creation failed:', e?.message || e);
      throw new PaymentError(502, 'Could not create the payment order. Please try again.');
    }
  } else {
    orderId = `order_sim_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`; // development only
  }

  // Our own record of what this order is worth and who it belongs to.
  await payments().doc(orderId).set({
    order_id: orderId,
    uid,
    type,
    plan_id: planId,
    billing_cycle: type === 'plan' ? cycle : null,
    pack_id: packId,
    subtotal_paise: price.subtotalPaise,
    gst_paise: price.gstPaise,
    total_paise: price.totalPaise,
    currency: 'INR',
    founding_partner: planStatus.isFoundingPartner,
    status: 'created',
    simulated: !cfg.razorpay,
    created_at: Date.now(),
    updated_at: Date.now(),
  });
  await logEvent({ type: 'order.created', order_id: orderId, uid, amount_paise: price.totalPaise, gst_paise: price.gstPaise, status: 'created' });

  return {
    success: true,
    orderId,
    id: orderId,
    amount: price.totalPaise, // paise, as Razorpay expects
    currency: 'INR',
    key: cfg.keyId,
    type,
    plan_id: planId || undefined,
    billing_cycle: type === 'plan' ? cycle : undefined,
    pack_id: packId || undefined,
    // rupee figures for display only
    subtotal: price.subtotalPaise / 100,
    gst: price.gstPaise / 100,
    total: price.totalPaise / 100,
    subtotal_paise: price.subtotalPaise,
    gst_paise: price.gstPaise,
    total_paise: price.totalPaise,
    description,
    isFoundingPartner: planStatus.isFoundingPartner,
  };
}

// ---------------------------------------------------------------------------------------------
// 2. Credit a verified payment (shared by verify-payment and the webhook)
// ---------------------------------------------------------------------------------------------
export type CreditOutcome = 'credited' | 'duplicate';

export async function creditPayment(
  order: Record<string, any>,
  paymentId: string,
  source: 'webhook' | 'verify',
  amountPaidPaise: number
): Promise<CreditOutcome> {
  const claimed = await claimPayment(paymentId, {
    order_id: order.order_id,
    uid: order.uid,
    type: order.type,
    plan_id: order.plan_id || null,
    billing_cycle: order.billing_cycle || null,
    pack_id: order.pack_id || null,
    amount_paise: amountPaidPaise,
    source,
  });
  if (!claimed) {
    await logEvent({ type: 'payment.duplicate_ignored', order_id: order.order_id, payment_id: paymentId, uid: order.uid, source, status: 'duplicate' });
    return 'duplicate';
  }

  try {
    if (order.type === 'plan') {
      await applyPlanPayment(order.uid, order.plan_id as PlanId, order.billing_cycle === 'annual' ? 'annual' : 'monthly');
    } else if (order.type === 'voice_topup') {
      const t = topUpPricePaise(order.pack_id);
      if (!t) throw new Error(`Unknown pack ${order.pack_id}`);
      await addVoiceTopUpMinutes(order.uid, t.pack.minutes);
    } else {
      throw new Error(`Unknown order type ${order.type}`);
    }
  } catch (err) {
    // Release the claim so Razorpay's webhook retry (or the user's retry) can credit it
    await releasePayment(paymentId).catch(() => {});
    await logEvent({ type: 'payment.credit_failed', order_id: order.order_id, payment_id: paymentId, uid: order.uid, source, status: 'credit_failed', error: String((err as any)?.message || err) });
    throw err;
  }

  await payments().doc(order.order_id).set(
    { status: 'paid', payment_id: paymentId, amount_paid_paise: amountPaidPaise, paid_at: Date.now(), credited_via: source, updated_at: Date.now() },
    { merge: true }
  );
  await logEvent({
    type: 'payment.credited',
    order_id: order.order_id,
    payment_id: paymentId,
    uid: order.uid,
    amount_paise: amountPaidPaise,
    gst_paise: order.gst_paise,
    status: 'paid',
    source,
  });
  return 'credited';
}

async function getOrderRecord(orderId: string): Promise<Record<string, any> | null> {
  if (!orderId || typeof orderId !== 'string' || orderId.includes('/')) return null;
  const snap = await payments().doc(orderId).get();
  return snap.exists ? snap.data() : null;
}

// ---------------------------------------------------------------------------------------------
// 3. Browser-triggered verification (the user returning from the Razorpay popup)
//    The browser only passes Razorpay's ids + signature; nothing it says about WHAT was bought is used.
// ---------------------------------------------------------------------------------------------
export async function verifyPayment(
  cfg: PaymentsConfig,
  input: { uid: string; orderId?: string; paymentId?: string; signature?: string }
): Promise<CreditOutcome> {
  const { uid, orderId, paymentId, signature } = input;
  if (!paymentId || typeof paymentId !== 'string' || !orderId || typeof orderId !== 'string') {
    throw new PaymentError(400, 'Order ID and payment ID are required.');
  }

  const order = await getOrderRecord(orderId);
  if (!order || order.uid !== uid) {
    throw new PaymentError(403, 'This payment does not belong to your account.');
  }

  if (cfg.razorpay) {
    // Live mode: signature mandatory, simulated payments never accepted
    if (order.simulated || typeof signature !== 'string' || paymentId.startsWith('sim_pay_')) {
      throw new PaymentError(400, 'Payment signature verification failed.');
    }
    const expected = crypto.createHmac('sha256', cfg.keySecret).update(`${orderId}|${paymentId}`).digest('hex');
    if (!safeEqual(expected, signature)) {
      await logEvent({ type: 'payment.bad_signature', order_id: orderId, payment_id: paymentId, uid, status: 'rejected' });
      throw new PaymentError(400, 'Payment signature verification failed.');
    }

    // Ask Razorpay (not the browser) whether the order is paid, and for how much
    const rzpOrder = await cfg.razorpay.orders.fetch(orderId);
    if (!rzpOrder || rzpOrder.status !== 'paid') {
      throw new PaymentError(402, 'Payment has not been completed.');
    }
    if (rzpOrder.currency !== 'INR' || Number(rzpOrder.amount_paid) !== order.total_paise) {
      await logEvent({ type: 'payment.amount_mismatch', order_id: orderId, payment_id: paymentId, uid, amount_paise: Number(rzpOrder.amount_paid), status: 'rejected' });
      throw new PaymentError(400, 'Payment amount does not match the order.');
    }
    return creditPayment(order, paymentId, 'verify', Number(rzpOrder.amount_paid));
  }

  // Development without Razorpay keys: simulated payments only, and only for simulated orders
  if (cfg.isProd) throw new PaymentError(503, 'Payments are not configured. Please contact support.');
  if (!order.simulated || !paymentId.startsWith('sim_pay_')) {
    throw new PaymentError(400, 'Payment signature verification failed.');
  }
  return creditPayment(order, paymentId, 'verify', order.total_paise);
}

// ---------------------------------------------------------------------------------------------
// 4. Webhook
// ---------------------------------------------------------------------------------------------
export async function processWebhook(
  cfg: PaymentsConfig,
  input: { rawBody: Buffer; signature?: string; eventId?: string }
): Promise<{ status: 'ok' | 'ignored' | 'duplicate'; detail?: string }> {
  const secret = cfg.webhookSecret;
  if (!secret && cfg.isProd) throw new PaymentError(503, 'Webhook is not configured');

  if (secret) {
    const expected = crypto.createHmac('sha256', secret).update(input.rawBody).digest('hex');
    if (!input.signature || !safeEqual(expected, input.signature)) {
      throw new PaymentError(400, 'Invalid webhook signature');
    }
  }

  let body: any;
  try {
    body = JSON.parse(input.rawBody.toString('utf8'));
  } catch {
    throw new PaymentError(400, 'Invalid JSON');
  }

  const event: string = body?.event || 'unknown';
  const payment = body?.payload?.payment?.entity;

  // Event-level idempotency: Razorpay retries deliveries with the same event id
  let eventClaim: any = null;
  if (input.eventId && !input.eventId.includes('/')) {
    eventClaim = db().collection('webhook_events').doc(input.eventId);
    try {
      await eventClaim.create({ event, received_at: Date.now() });
    } catch (e: any) {
      if (e?.code === 6 || /already exists/i.test(e?.message || '')) {
        await logEvent({ type: `webhook.${event}`, event_id: input.eventId, status: 'duplicate_event' });
        return { status: 'duplicate' };
      }
      throw e;
    }
  }

  try {
    if ((event === 'payment.captured' || event === 'order.paid') && payment?.id) {
      const order = await getOrderRecord(payment.order_id);
      if (!order) {
        await logEvent({ type: `webhook.${event}`, event_id: input.eventId, order_id: payment.order_id, payment_id: payment.id, amount_paise: payment.amount, status: 'unknown_order' });
        return { status: 'ignored', detail: 'unknown order' };
      }
      if (payment.currency !== 'INR' || Number(payment.amount) !== order.total_paise) {
        await logEvent({ type: 'payment.amount_mismatch', event_id: input.eventId, order_id: order.order_id, payment_id: payment.id, uid: order.uid, amount_paise: Number(payment.amount), status: 'rejected' });
        return { status: 'ignored', detail: 'amount mismatch' };
      }
      const outcome = await creditPayment(order, payment.id, 'webhook', Number(payment.amount));
      return { status: outcome === 'credited' ? 'ok' : 'duplicate' };
    }

    if (event === 'payment.failed' && payment?.id) {
      const order = await getOrderRecord(payment.order_id);
      if (order && order.status !== 'paid') {
        await payments().doc(order.order_id).set(
          { status: 'failed', payment_id: payment.id, failure_reason: payment.error_description || null, updated_at: Date.now() },
          { merge: true }
        );
      }
      await logEvent({ type: 'payment.failed', event_id: input.eventId, order_id: payment.order_id, payment_id: payment.id, uid: order?.uid, amount_paise: payment.amount, status: 'failed' });
      return { status: 'ok' };
    }

    // Anything else (refunds etc.) is logged only for now
    await logEvent({ type: `webhook.${event}`, event_id: input.eventId, order_id: payment?.order_id, payment_id: payment?.id, status: 'logged_only' });
    return { status: 'ignored', detail: event };
  } catch (err) {
    // Let Razorpay's retry reprocess this event
    if (eventClaim) await eventClaim.delete().catch(() => {});
    throw err;
  }
}
