import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, ChildProcess } from 'node:child_process';

// Real server + Auth/Firestore emulators: what the browser actually gets at the limit.
process.env.FIREBASE_PROJECT_ID = 'demo-samruddhi';
const PORT = 3219;
const BASE = `http://127.0.0.1:${PORT}`;
const AUTH = `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`;
const run = Date.now().toString(36);
let server: ChildProcess;
let b: typeof import('../src/server/billing');

before(async () => {
  b = await import('../src/server/billing');
  server = spawn('node_modules/.bin/tsx', ['server.ts'], {
    env: { ...process.env, PORT: String(PORT), NODE_ENV: 'development', OTP_HMAC_SECRET: 'leads-http-secret-1234567', SMTP_EMAIL: '', SMTP_PASSWORD: '' },
    stdio: 'ignore',
  });
  for (let i = 0; i < 90; i++) {
    try { if ((await fetch(`${BASE}/api/billing/status`)).status === 401) return; } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('server did not start');
});
after(() => server?.kill());

const j = (path: string, token?: string, body?: any) =>
  fetch(`${BASE}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });

async function loggedInUser(label: string) {
  const email = `${label}.${run}@example.com`;
  const r: any = await (await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password: 'Passw0rd!x', returnSecureToken: true }),
  })).json();
  await b.adminAuth.updateUser(r.localId, { emailVerified: true });
  const refresh = async () => ((await (await fetch(`${AUTH}/securetoken.googleapis.com/v1/token?key=fake`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ grant_type: 'refresh_token', refresh_token: r.refreshToken }),
  })).json()) as any).id_token as string;
  let token = await refresh();
  const sent: any = await (await j('/api/send-otp', token, {})).json();
  assert.equal((await j('/api/verify-otp', token, { otp: sent.devOtp })).status, 200);
  token = await refresh();
  return { uid: r.localId as string, token };
}

test('agent without a plan: POST /api/leads -> 402 PLAN_REQUIRED + action upgrade', async () => {
  const { token } = await loggedInUser('noplan');
  const res = await j('/api/leads', token, { name: 'Ravi', phone: '9876543210' });
  assert.equal(res.status, 402);
  const body: any = await res.json();
  assert.equal(body.code, 'PLAN_REQUIRED');
  assert.equal(body.action, 'upgrade');
});

test('agent at the cap: 402 LEAD_LIMIT with limit/used; under the cap: 201 and counted', async () => {
  const { uid, token } = await loggedInUser('atcap');
  await b.saveSubscription(uid, { plan_id: 'starter', status: 'active', billing_cycle: 'monthly', current_period_start: Date.now(), current_period_end: Date.now() + 30 * 86400000 });
  const start = (await b.getPlanStatus(uid)).usageCycle.start;
  await b.adminDb.collection('usage').doc(b.usageDocId(uid, String(start))).set({ agent_id: uid, leads_created: 499 });

  const ok = await j('/api/leads', token, { name: 'Last Free', phone: '9876543210' });
  assert.equal(ok.status, 201);
  const blocked = await j('/api/leads', token, { name: 'One Too Many', phone: '9876543211' });
  assert.equal(blocked.status, 402);
  const body: any = await blocked.json();
  assert.deepEqual({ c: body.code, a: body.action, l: body.limit, u: body.used }, { c: 'LEAD_LIMIT', a: 'upgrade', l: 500, u: 500 });
  assert.equal((await b.adminDb.collection('leads').where('agent_id', '==', uid).get()).size, 1);
});

test('public catalogue enquiry for an agent at the cap is still accepted (201, paused)', async () => {
  const { uid } = await loggedInUser('pubcap');
  await b.saveSubscription(uid, { plan_id: 'starter', status: 'active', billing_cycle: 'monthly', current_period_start: Date.now(), current_period_end: Date.now() + 30 * 86400000 });
  const start = (await b.getPlanStatus(uid)).usageCycle.start;
  await b.adminDb.collection('usage').doc(b.usageDocId(uid, String(start))).set({ agent_id: uid, leads_created: 500 });
  const res = await j('/api/public/leads', undefined, { agent_id: uid, name: 'Buyer', phone: '9000000001', property_id: 'p1', property_title: 'Villa' });
  assert.equal(res.status, 201);
  const body: any = await res.json();
  assert.equal(body.automation_paused, true);
  assert.equal(body.overLimit, true);
  assert.ok(body.leadId && body.visitId);
});
