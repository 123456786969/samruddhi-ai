import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Runs against the Firestore emulator (npm test starts it via `firebase emulators:exec`).
let b: typeof import('../src/server/billing');
const run = Date.now().toString(36); // keeps ids unique across repeated runs on one emulator
const id = (s: string) => `${s}_${run}`;

before(async () => {
  assert.ok(process.env.FIRESTORE_EMULATOR_HOST, 'Run with `npm test` so the Firestore emulator is used');
  b = await import('../src/server/billing');
});

const activeStarter = () => ({
  plan_id: 'starter',
  status: 'active',
  billing_cycle: 'monthly',
  current_period_start: Date.now(),
  current_period_end: Date.now() + 30 * 86400000,
});

test('claimPayment lets exactly one concurrent caller win', async () => {
  const pay = id('pay');
  const results = await Promise.all(Array.from({ length: 8 }, () => b.claimPayment(pay, { uid: 'u' })));
  assert.equal(results.filter(Boolean).length, 1);
});

test('released claim can be claimed again (failed credit is retryable)', async () => {
  const pay = id('pay_rel');
  assert.equal(await b.claimPayment(pay, {}), true);
  assert.equal(await b.claimPayment(pay, {}), false);
  await b.releasePayment(pay);
  assert.equal(await b.claimPayment(pay, {}), true);
});

test('concurrent voice usage never overspends allowance + top-up', async () => {
  const uid = id('voice');
  await b.saveSubscription(uid, { ...activeStarter(), voice_topup_minutes: 100 });
  // starter allowance 300 + 100 top-up = 400 minutes; 20 x 30 = 600 requested
  await Promise.all(Array.from({ length: 20 }, () => b.recordVoiceMinutes(uid, 30)));
  const s = await b.getPlanStatus(uid);
  assert.equal(s.remaining.voiceMinutes, 0);
  assert.equal(s.remaining.voiceAllowance, 0);
  assert.equal(s.remaining.voiceTopUp, 0);
});

test('concurrent top-up credits are all applied', async () => {
  const uid = id('topup');
  await b.saveSubscription(uid, activeStarter());
  await Promise.all(Array.from({ length: 10 }, () => b.addVoiceTopUpMinutes(uid, 100)));
  assert.equal((await b.getPlanStatus(uid)).remaining.voiceTopUp, 1000);
});

test('concurrent lead creation never exceeds the plan limit and never loses a count', async () => {
  const uid = id('leads');
  await b.saveSubscription(uid, activeStarter()); // starter = 500 leads / cycle
  // pre-fill usage to 490 so only 10 more fit
  const cycle = (await b.getPlanStatus(uid)).usageCycle;
  await b.adminDb.collection('usage').doc(b.usageDocId(uid, String(cycle.start))).set({ agent_id: uid, leads_created: 490 });
  const results = await Promise.allSettled(
    Array.from({ length: 25 }, (_, i) => b.createLeadWithinLimit(uid, { agent_id: uid, name: `L${i}`, phone: '9999999999', created_at: Date.now() }, 'agent'))
  );
  assert.equal(results.filter((r) => r.status === 'fulfilled').length, 10);
  const rejected = results.filter((r) => r.status === 'rejected') as PromiseRejectedResult[];
  assert.equal(rejected.length, 15);
  assert.ok(rejected.every((r) => r.reason.code === 'LEAD_LIMIT' && r.reason.status === 402 && r.reason.action === 'upgrade'));
  const s = await b.getPlanStatus(uid);
  assert.equal(s.usage.leads, 500);
  assert.equal(s.remaining.leads, 0);
  const stored = await b.adminDb.collection('leads').where('agent_id', '==', uid).get();
  assert.equal(stored.size, 10); // blocked attempts created nothing
});

test('expired subscription becomes expired exactly once and loses entitlements', async () => {
  const uid = id('expired');
  await b.saveSubscription(uid, { ...activeStarter(), current_period_end: Date.now() - 1000 });
  const [a, c] = await Promise.all([b.getPlanStatus(uid), b.getPlanStatus(uid)]);
  assert.equal(a.status, 'expired');
  assert.equal(c.status, 'expired');
  assert.equal(a.remaining.leads, 0);
});

test('a concurrent renewal is not overwritten by the expiry check', async () => {
  const uid = id('renew');
  const past = Date.now() - 1000;
  await b.saveSubscription(uid, { ...activeStarter(), current_period_end: past });
  // Renew (as a payment would) before the expiry transition runs
  await b.saveSubscription(uid, { current_period_end: Date.now() + 30 * 86400000 });
  assert.equal((await b.getPlanStatus(uid)).status, 'active');
});

test('pending plan is applied when the period ends', async () => {
  const uid = id('pending');
  await b.saveSubscription(uid, { ...activeStarter(), current_period_end: Date.now() - 1000, pending_plan_id: 'pro' });
  const s = await b.getPlanStatus(uid);
  assert.equal(s.status, 'active');
  assert.equal(s.plan_id, 'pro');
});

test('default admin is provisioned once even under concurrency', async () => {
  const uid = id('admin');
  const email = b.DEFAULT_ADMIN_EMAIL;
  const all = await Promise.all(Array.from({ length: 6 }, () => b.getPlanStatus(uid, email)));
  assert.ok(all.every((s) => s.status === 'active' && s.plan_id === 'pro'));
  const nonAdmin = await b.getPlanStatus(id('regular'), 'someone@example.com');
  assert.equal(nonAdmin.status, 'none');
});

test('migration script copies legacy data, is idempotent, never overwrites, and --delete removes files', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'migrate-'));
  const subId = id('mig_sub');
  fs.writeFileSync(
    path.join(dir, '.billing_store.json'),
    JSON.stringify({
      subscriptions: { [subId]: { plan_id: 'pro', status: 'active' } },
      usage: {}, processed_payments: {}, leads: {}, visits: {}, admin_notifications: [],
    })
  );
  fs.writeFileSync(path.join(dir, '.otp_store.json'), '{}');
  const script = path.resolve('scripts/migrate-local-stores.ts');
  const tsx = path.resolve('node_modules/.bin/tsx');
  const exec = (...args: string[]) =>
    execFileSync(tsx, [script, ...args], { cwd: dir, env: process.env, encoding: 'utf8' });

  exec();
  assert.equal((await b.adminDb.collection('subscriptions').doc(subId).get()).data().plan_id, 'pro');

  // Firestore is the source of truth: a re-run must not overwrite newer data
  await b.saveSubscription(subId, { plan_id: 'elite' });
  exec();
  assert.equal((await b.adminDb.collection('subscriptions').doc(subId).get()).data().plan_id, 'elite');

  exec('--delete');
  assert.equal(fs.existsSync(path.join(dir, '.billing_store.json')), false);
  assert.equal(fs.existsSync(path.join(dir, '.otp_store.json')), false);
});
