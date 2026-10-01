import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { spawn, ChildProcess } from 'node:child_process';

// The real Express route: proves the signature really is computed over the raw request bytes.
process.env.FIREBASE_PROJECT_ID = 'demo-samruddhi';
const PORT = 3218;
const BASE = `http://127.0.0.1:${PORT}`;
const SECRET = 'http_webhook_secret_test';
const run = Date.now().toString(36);
let server: ChildProcess;
let b: typeof import('../src/server/billing');

before(async () => {
  b = await import('../src/server/billing');
  server = spawn('node_modules/.bin/tsx', ['server.ts'], {
    env: { ...process.env, PORT: String(PORT), NODE_ENV: 'development', RAZORPAY_WEBHOOK_SECRET: SECRET, RAZORPAY_KEY_ID: '', RAZORPAY_KEY_SECRET: '' },
    stdio: 'ignore',
  });
  for (let i = 0; i < 90; i++) {
    try { if ((await fetch(`${BASE}/api/billing/status`)).status === 401) return; } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('server did not start');
});
after(() => server?.kill());

const post = (raw: string, headers: Record<string, string>) =>
  fetch(`${BASE}/api/billing/webhook`, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: raw });
const sig = (raw: string) => crypto.createHmac('sha256', SECRET).update(raw).digest('hex');

test('webhook over HTTP: bad signature -> 400; exact signed bytes -> credited once; retry -> still once', async () => {
  const uid = `httpwh_${run}`;
  const orderId = `order_http_${run}`;
  await b.adminDb.collection('payments').doc(orderId).set({
    order_id: orderId, uid, type: 'plan', plan_id: 'starter', billing_cycle: 'monthly',
    subtotal_paise: 699900, gst_paise: 125982, total_paise: 825882, currency: 'INR', status: 'created',
  });

  // pretty-printed JSON with odd spacing: only correct if the server hashes the raw bytes
  const raw = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: `pay_http_${run}`, order_id: orderId, amount: 825882, currency: 'INR' } } } }, null, 4) + '\n';

  assert.equal((await post(raw, { 'x-razorpay-signature': 'nope', 'x-razorpay-event-id': `evt_h1_${run}` })).status, 400);
  assert.equal((await post(raw, { 'x-razorpay-event-id': `evt_h1b_${run}` })).status, 400);
  assert.equal((await b.adminDb.collection('subscriptions').doc(uid).get()).exists, false);

  assert.equal((await post(raw, { 'x-razorpay-signature': sig(raw), 'x-razorpay-event-id': `evt_h2_${run}` })).status, 200);
  const end1 = (await b.adminDb.collection('subscriptions').doc(uid).get()).data().current_period_end;
  assert.ok(end1 > Date.now());

  // Razorpay retry of the same event, and a second event for the same payment
  assert.equal((await post(raw, { 'x-razorpay-signature': sig(raw), 'x-razorpay-event-id': `evt_h2_${run}` })).status, 200);
  assert.equal((await post(raw, { 'x-razorpay-signature': sig(raw), 'x-razorpay-event-id': `evt_h3_${run}` })).status, 200);
  assert.equal((await b.adminDb.collection('subscriptions').doc(uid).get()).data().current_period_end, end1);
});
