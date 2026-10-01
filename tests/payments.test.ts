import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

// Payments against the Firestore emulator with a fake Razorpay client (no network).
let b: typeof import('../src/server/billing');
let pay: typeof import('../src/server/payments');
let plans: typeof import('../src/shared/plans');
const run = Date.now().toString(36);
const uid = (s: string) => `${s}_${run}`;

const KEY_SECRET = 'rzp_key_secret_for_tests';
const WEBHOOK_SECRET = 'whsec_for_tests';
const DAY = 86400000;

before(async () => {
  assert.ok(process.env.FIRESTORE_EMULATOR_HOST, 'Run with `npm test` so the Firestore emulator is used');
  b = await import('../src/server/billing');
  pay = await import('../src/server/payments');
  plans = await import('../src/shared/plans');
});

// ---- fake Razorpay -------------------------------------------------------------------------
const rzpOrders = new Map<string, any>();
let seq = 0;
const fakeRazorpay = {
  orders: {
    async create(p: any) {
      const o = { id: `order_t${run}${++seq}`, status: 'created', amount: p.amount, amount_paid: 0, currency: p.currency, notes: p.notes };
      rzpOrders.set(o.id, o);
      return o;
    },
    async fetch(id: string) {
      return rzpOrders.get(id);
    },
  },
};
const live = (over: Partial<import('../src/server/payments').PaymentsConfig> = {}) => ({
  razorpay: fakeRazorpay as any,
  keyId: 'rzp_test_key',
  keySecret: KEY_SECRET,
  webhookSecret: WEBHOOK_SECRET,
  isProd: true,
  ...over,
});
const markPaid = (orderId: string, amountPaid?: number) => {
  const o = rzpOrders.get(orderId);
  o.status = 'paid';
  o.amount_paid = amountPaid ?? o.amount;
};
const sign = (orderId: string, paymentId: string) =>
  crypto.createHmac('sha256', KEY_SECRET).update(`${orderId}|${paymentId}`).digest('hex');

const webhookBody = (event: string, orderId: string, paymentId: string, amount: number, currency = 'INR') =>
  Buffer.from(JSON.stringify({ event, payload: { payment: { entity: { id: paymentId, order_id: orderId, amount, currency, status: 'captured' } } } }));
const whSig = (raw: Buffer, secret = WEBHOOK_SECRET) => crypto.createHmac('sha256', secret).update(raw).digest('hex');

async function newPlanOrder(u: string, plan = 'starter', cycle = 'monthly', email?: string) {
  return pay.createOrder(live(), { uid: u, email, type: 'plan', planId: plan, billingCycle: cycle });
}
const sub = async (u: string) => (await b.adminDb.collection('subscriptions').doc(u).get()).data();

// ---- pricing ---------------------------------------------------------------------------------
test('prices are exact integer paise: list, founding 40% off, 18% GST', () => {
  const s = plans.planPricePaise('starter', 'monthly', false)!;
  assert.deepEqual(s, { subtotalPaise: 699900, gstPaise: 125982, totalPaise: 825882 });
  const f = plans.planPricePaise('starter', 'monthly', true)!;
  assert.deepEqual(f, { subtotalPaise: 419940, gstPaise: 75589, totalPaise: 495529 });
  const t = plans.topUpPricePaise('voice_100')!;
  assert.deepEqual({ a: t.subtotalPaise, b: t.gstPaise, c: t.totalPaise }, { a: 90000, b: 16200, c: 106200 });
  for (const id of ['starter', 'pro', 'elite'] as const)
    for (const cycle of ['monthly', 'annual'] as const)
      for (const founding of [false, true]) {
        const p = plans.planPricePaise(id, cycle, founding)!;
        assert.ok(Number.isInteger(p.subtotalPaise) && Number.isInteger(p.gstPaise) && Number.isInteger(p.totalPaise));
        assert.equal(p.totalPaise, p.subtotalPaise + p.gstPaise);
      }
  assert.equal(plans.planPricePaise('nope'), null);
  assert.equal(plans.topUpPricePaise('nope'), null);
});

test('display helpers are derived from the same paise numbers', () => {
  const p = plans.planPricePaise('pro', 'annual', true)!;
  assert.deepEqual(plans.priceFor('pro', 'annual', true), { subtotal: p.subtotalPaise / 100, gst: p.gstPaise / 100, total: p.totalPaise / 100 });
});

// ---- create order ----------------------------------------------------------------------------
test('createOrder charges the server-computed paise amount and stores an order record', async () => {
  const u = uid('co');
  const o = await newPlanOrder(u, 'pro', 'monthly');
  const expected = plans.planPricePaise('pro', 'monthly', false)!;
  assert.equal(o.amount, expected.totalPaise);
  assert.equal(rzpOrders.get(o.orderId).amount, expected.totalPaise); // what Razorpay was asked to charge
  const rec = (await b.adminDb.collection('payments').doc(o.orderId).get()).data();
  assert.equal(rec.status, 'created');
  assert.equal(rec.uid, u);
  assert.equal(rec.gst_paise, expected.gstPaise);
  assert.equal(rec.total_paise, expected.totalPaise);
});

test('founding partner price is applied from the server-side status', async () => {
  const u = uid('fp');
  await b.saveSubscription(u, { founding_partner: true, founding_partner_until: Date.now() + 100 * DAY });
  const o = await newPlanOrder(u, 'starter');
  assert.equal(o.amount, 495529);
  assert.equal(o.isFoundingPartner, true);
});

test('createOrder rejects bad input and unavailable payments', async () => {
  await assert.rejects(pay.createOrder(live(), { uid: uid('x'), planId: 'platinum' }), (e: any) => e.status === 400);
  await assert.rejects(pay.createOrder(live(), { uid: uid('x'), type: 'voice_topup', packId: 'voice_100' }), (e: any) => e.status === 400); // no active plan
  await assert.rejects(pay.createOrder(live({ razorpay: null }), { uid: uid('x'), planId: 'starter' }), (e: any) => e.status === 503);
});

// ---- webhook: signature + raw body -----------------------------------------------------------
test('webhook with a bad or missing signature is rejected and credits nothing', async () => {
  const u = uid('badsig');
  const o = await newPlanOrder(u);
  const raw = webhookBody('payment.captured', o.orderId, `pay_${run}_bs`, o.amount);
  await assert.rejects(pay.processWebhook(live(), { rawBody: raw, signature: 'deadbeef', eventId: `evt_${run}_bs1` }), (e: any) => e.status === 400);
  await assert.rejects(pay.processWebhook(live(), { rawBody: raw, eventId: `evt_${run}_bs2` }), (e: any) => e.status === 400);
  await assert.rejects(pay.processWebhook(live(), { rawBody: raw, signature: whSig(raw, 'wrong-secret'), eventId: `evt_${run}_bs3` }), (e: any) => e.status === 400);
  assert.equal(await sub(u), undefined);
});

test('webhook signature is checked against the RAW bytes (re-serialised JSON fails)', async () => {
  const u = uid('raw');
  const o = await newPlanOrder(u);
  const pretty = Buffer.from(JSON.stringify(JSON.parse(webhookBody('payment.captured', o.orderId, `pay_${run}_raw`, o.amount).toString()), null, 2));
  const compact = webhookBody('payment.captured', o.orderId, `pay_${run}_raw`, o.amount);
  // signature was made for the compact body, but the pretty body is what arrives
  await assert.rejects(pay.processWebhook(live(), { rawBody: pretty, signature: whSig(compact), eventId: `evt_${run}_raw` }), (e: any) => e.status === 400);
  // and the exact bytes pass
  const r = await pay.processWebhook(live(), { rawBody: compact, signature: whSig(compact), eventId: `evt_${run}_raw2` });
  assert.equal(r.status, 'ok');
});

test('webhook without a configured secret is refused in production', async () => {
  const raw = webhookBody('payment.captured', 'order_x', 'pay_x', 100);
  await assert.rejects(pay.processWebhook(live({ webhookSecret: undefined }), { rawBody: raw, signature: whSig(raw) }), (e: any) => e.status === 503);
});

// ---- webhook: crediting + idempotency --------------------------------------------------------
test('a verified webhook activates the plan and logs the payment', async () => {
  const u = uid('wh');
  const o = await newPlanOrder(u, 'pro', 'monthly');
  const raw = webhookBody('payment.captured', o.orderId, `pay_${run}_wh`, o.amount);
  const r = await pay.processWebhook(live(), { rawBody: raw, signature: whSig(raw), eventId: `evt_${run}_wh` });
  assert.equal(r.status, 'ok');

  const s = await sub(u);
  assert.equal(s.status, 'active');
  assert.equal(s.plan_id, 'pro');
  assert.ok(Math.abs(s.current_period_end - (Date.now() + 30 * DAY)) < 60_000);

  const rec = (await b.adminDb.collection('payments').doc(o.orderId).get()).data();
  assert.equal(rec.status, 'paid');
  assert.equal(rec.payment_id, `pay_${run}_wh`);
  assert.equal(rec.amount_paid_paise, o.amount);
  const evs = await b.adminDb.collection('payment_events').where('order_id', '==', o.orderId).get();
  const credited = evs.docs.map((d: any) => d.data()).find((e: any) => e.type === 'payment.credited');
  assert.equal(credited.gst_paise, o.gst_paise);
  assert.equal(credited.amount_paise, o.amount);
});

test('a retried webhook (same event id) never extends the plan twice', async () => {
  const u = uid('retry');
  const o = await newPlanOrder(u);
  const raw = webhookBody('payment.captured', o.orderId, `pay_${run}_rt`, o.amount);
  const sig = whSig(raw);
  await pay.processWebhook(live(), { rawBody: raw, signature: sig, eventId: `evt_${run}_rt` });
  const end1 = (await sub(u)).current_period_end;
  for (let i = 0; i < 3; i++) {
    const r = await pay.processWebhook(live(), { rawBody: raw, signature: sig, eventId: `evt_${run}_rt` });
    assert.equal(r.status, 'duplicate');
  }
  assert.equal((await sub(u)).current_period_end, end1);
});

test('payment.captured then order.paid for the same payment (different event ids) credits once', async () => {
  const u = uid('twoevents');
  const o = await newPlanOrder(u);
  const pid = `pay_${run}_two`;
  const a = webhookBody('payment.captured', o.orderId, pid, o.amount);
  const c = webhookBody('order.paid', o.orderId, pid, o.amount);
  await pay.processWebhook(live(), { rawBody: a, signature: whSig(a), eventId: `evt_${run}_two_a` });
  const end1 = (await sub(u)).current_period_end;
  const r = await pay.processWebhook(live(), { rawBody: c, signature: whSig(c), eventId: `evt_${run}_two_b` });
  assert.equal(r.status, 'duplicate');
  assert.equal((await sub(u)).current_period_end, end1);
});

test('10 simultaneous deliveries of the same payment credit exactly once', async () => {
  const u = uid('conc');
  const o = await newPlanOrder(u);
  const pid = `pay_${run}_conc`;
  const raw = webhookBody('payment.captured', o.orderId, pid, o.amount);
  const results = await Promise.all(
    Array.from({ length: 10 }, (_, i) => pay.processWebhook(live(), { rawBody: raw, signature: whSig(raw), eventId: `evt_${run}_conc_${i}` }))
  );
  assert.equal(results.filter((r) => r.status === 'ok').length, 1);
  const s = await sub(u);
  assert.ok(Math.abs(s.current_period_end - (Date.now() + 30 * DAY)) < 60_000, 'extended more than one cycle');
});

test('a webhook for the wrong amount or currency is NOT credited', async () => {
  const u = uid('amt');
  const o = await newPlanOrder(u, 'elite');
  const cheap = webhookBody('payment.captured', o.orderId, `pay_${run}_amt1`, 100); // paid ₹1 for an Elite plan
  assert.equal((await pay.processWebhook(live(), { rawBody: cheap, signature: whSig(cheap), eventId: `evt_${run}_amt1` })).status, 'ignored');
  const usd = webhookBody('payment.captured', o.orderId, `pay_${run}_amt2`, o.amount, 'USD');
  assert.equal((await pay.processWebhook(live(), { rawBody: usd, signature: whSig(usd), eventId: `evt_${run}_amt2` })).status, 'ignored');
  assert.equal(await sub(u), undefined);
});

test('a webhook for an unknown order is ignored (and logged), not credited', async () => {
  const raw = webhookBody('payment.captured', `order_unknown_${run}`, `pay_${run}_unk`, 5000);
  assert.equal((await pay.processWebhook(live(), { rawBody: raw, signature: whSig(raw), eventId: `evt_${run}_unk` })).status, 'ignored');
});

test('payment.failed is logged and marks the order failed without crediting', async () => {
  const u = uid('failed');
  const o = await newPlanOrder(u);
  const raw = Buffer.from(JSON.stringify({ event: 'payment.failed', payload: { payment: { entity: { id: `pay_${run}_f`, order_id: o.orderId, amount: o.amount, currency: 'INR', error_description: 'Card declined' } } } }));
  await pay.processWebhook(live(), { rawBody: raw, signature: whSig(raw), eventId: `evt_${run}_f` });
  const rec = (await b.adminDb.collection('payments').doc(o.orderId).get()).data();
  assert.equal(rec.status, 'failed');
  assert.equal(await sub(u), undefined);
});

// ---- extend vs reset ---------------------------------------------------------------------------
test('paying while active EXTENDS the period (remaining days are kept)', async () => {
  const u = uid('extend');
  const start = Date.now() - 10 * DAY;
  const end = Date.now() + 20 * DAY;
  await b.saveSubscription(u, { plan_id: 'starter', status: 'active', billing_cycle: 'monthly', current_period_start: start, current_period_end: end });
  const o = await newPlanOrder(u, 'starter');
  const raw = webhookBody('payment.captured', o.orderId, `pay_${run}_ext`, o.amount);
  await pay.processWebhook(live(), { rawBody: raw, signature: whSig(raw), eventId: `evt_${run}_ext` });
  const s = await sub(u);
  assert.equal(s.current_period_end, end + 30 * DAY);
  assert.equal(s.current_period_start, start); // billing-cycle anchor does not move
});

test('paying after expiry starts a fresh period from now', async () => {
  const u = uid('lapsed');
  await b.saveSubscription(u, { plan_id: 'starter', status: 'expired', billing_cycle: 'monthly', current_period_start: Date.now() - 60 * DAY, current_period_end: Date.now() - 30 * DAY });
  const o = await newPlanOrder(u, 'pro', 'annual');
  const raw = webhookBody('payment.captured', o.orderId, `pay_${run}_lap`, o.amount);
  await pay.processWebhook(live(), { rawBody: raw, signature: whSig(raw), eventId: `evt_${run}_lap` });
  const s = await sub(u);
  assert.equal(s.plan_id, 'pro');
  assert.equal(s.billing_cycle, 'annual');
  assert.ok(Math.abs(s.current_period_end - (Date.now() + 365 * DAY)) < 60_000);
  assert.ok(Math.abs(s.current_period_start - Date.now()) < 60_000);
});

// ---- top-ups ---------------------------------------------------------------------------------------
test('voice top-up credits minutes once', async () => {
  const u = uid('topup');
  await b.saveSubscription(u, { plan_id: 'starter', status: 'active', billing_cycle: 'monthly', current_period_start: Date.now(), current_period_end: Date.now() + 30 * DAY });
  const o = await pay.createOrder(live(), { uid: u, type: 'voice_topup', packId: 'voice_500' });
  assert.equal(o.amount, 450000 + 81000); // ₹4,500 + 18% GST = ₹5,310
  const raw = webhookBody('payment.captured', o.orderId, `pay_${run}_tu`, o.amount);
  await pay.processWebhook(live(), { rawBody: raw, signature: whSig(raw), eventId: `evt_${run}_tu1` });
  await pay.processWebhook(live(), { rawBody: raw, signature: whSig(raw), eventId: `evt_${run}_tu2` });
  assert.equal((await b.getPlanStatus(u)).remaining.voiceTopUp, 500);
});

// ---- failed credit is retryable ------------------------------------------------------------------------
test('if crediting fails the claim is released so the retry succeeds', async () => {
  const u = uid('credfail');
  const o = await newPlanOrder(u);
  // corrupt the stored order so crediting throws
  await b.adminDb.collection('payments').doc(o.orderId).update({ type: 'mystery' });
  const raw = webhookBody('payment.captured', o.orderId, `pay_${run}_cf`, o.amount);
  await assert.rejects(pay.processWebhook(live(), { rawBody: raw, signature: whSig(raw), eventId: `evt_${run}_cf1` }));
  assert.equal(await sub(u), undefined);
  // "fix" the record; Razorpay redelivers the SAME event id and it is processed this time
  await b.adminDb.collection('payments').doc(o.orderId).update({ type: 'plan' });
  const r = await pay.processWebhook(live(), { rawBody: raw, signature: whSig(raw), eventId: `evt_${run}_cf1` });
  assert.equal(r.status, 'ok');
  assert.equal((await sub(u)).status, 'active');
});

// ---- browser-triggered verification ----------------------------------------------------------------
test('verifyPayment: valid signature + paid order credits; replay and webhook-after do not double credit', async () => {
  const u = uid('vp');
  const o = await newPlanOrder(u);
  const pid = `pay_${run}_vp`;
  markPaid(o.orderId);
  assert.equal(await pay.verifyPayment(live(), { uid: u, orderId: o.orderId, paymentId: pid, signature: sign(o.orderId, pid) }), 'credited');
  const end1 = (await sub(u)).current_period_end;
  assert.equal(await pay.verifyPayment(live(), { uid: u, orderId: o.orderId, paymentId: pid, signature: sign(o.orderId, pid) }), 'duplicate');
  const raw = webhookBody('payment.captured', o.orderId, pid, o.amount);
  assert.equal((await pay.processWebhook(live(), { rawBody: raw, signature: whSig(raw), eventId: `evt_${run}_vp` })).status, 'duplicate');
  assert.equal((await sub(u)).current_period_end, end1);
});

test('verifyPayment rejects: bad signature, someone else\'s order, unpaid order, wrong amount, simulated payments', async () => {
  const u = uid('vpr');
  const o = await newPlanOrder(u);
  const pid = `pay_${run}_vpr`;
  const call = (over: any = {}) => pay.verifyPayment(live(), { uid: u, orderId: o.orderId, paymentId: pid, signature: sign(o.orderId, pid), ...over });

  await assert.rejects(call({ signature: 'forged' }), (e: any) => e.status === 400);
  await assert.rejects(call({ uid: uid('someone_else') }), (e: any) => e.status === 403);
  await assert.rejects(call(), (e: any) => e.status === 402); // order not paid yet
  markPaid(o.orderId, 100); // paid ₹1
  await assert.rejects(call(), (e: any) => e.status === 400);
  await assert.rejects(call({ paymentId: 'sim_pay_1', signature: 'simulated_signature' }), (e: any) => e.status === 400);
  await assert.rejects(call({ orderId: `order_missing_${run}` }), (e: any) => e.status === 403);
  assert.equal(await sub(u), undefined);
});

test('verifyPayment ignores plan/amount the browser claims: the stored order decides', async () => {
  const u = uid('claim');
  const o = await newPlanOrder(u, 'starter'); // bought Starter...
  const pid = `pay_${run}_claim`;
  markPaid(o.orderId);
  // (the route doesn't even pass plan fields through; the module has no parameter for them)
  await pay.verifyPayment(live(), { uid: u, orderId: o.orderId, paymentId: pid, signature: sign(o.orderId, pid) });
  assert.equal((await sub(u)).plan_id, 'starter'); // ...gets Starter, whatever the browser said
});

test('simulated payments work only in development, only for simulated orders', async () => {
  const dev = live({ razorpay: null, isProd: false });
  const u = uid('sim');
  const o = await pay.createOrder(dev, { uid: u, planId: 'starter' });
  assert.match(o.orderId, /^order_sim_/);
  await assert.rejects(pay.verifyPayment(dev, { uid: u, orderId: o.orderId, paymentId: 'pay_real_looking', signature: 'x' }), (e: any) => e.status === 400);
  assert.equal(await pay.verifyPayment(dev, { uid: u, orderId: o.orderId, paymentId: `sim_pay_${run}`, signature: '' }), 'credited');
  // the same simulated payment is refused once real Razorpay is configured
  const u2 = uid('sim2');
  const o2 = await pay.createOrder(dev, { uid: u2, planId: 'starter' });
  await assert.rejects(pay.verifyPayment(live(), { uid: u2, orderId: o2.orderId, paymentId: `sim_pay_${run}_2`, signature: 'x' }), (e: any) => e.status === 400);
  // and production without keys refuses outright
  await assert.rejects(pay.verifyPayment(live({ razorpay: null }), { uid: u2, orderId: o2.orderId, paymentId: `sim_pay_${run}_3` }), (e: any) => e.status === 503);
});
