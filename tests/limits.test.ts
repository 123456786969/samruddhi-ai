import { test, before } from 'node:test';
import assert from 'node:assert/strict';

// Plan limits enforced on the server, per billing cycle (Firestore emulator).
let b: typeof import('../src/server/billing');
let cycles: typeof import('../src/shared/cycles');
const run = Date.now().toString(36);
const uid = (s: string) => `${s}_${run}`;
const DAY = 86400000;

before(async () => {
  assert.ok(process.env.FIRESTORE_EMULATOR_HOST, 'Run with `npm test` so the Firestore emulator is used');
  b = await import('../src/server/billing');
  cycles = await import('../src/shared/cycles');
});

const subscribe = (u: string, plan: string, over: Record<string, any> = {}) =>
  b.saveSubscription(u, {
    plan_id: plan,
    status: 'active',
    billing_cycle: 'monthly',
    current_period_start: Date.now(),
    current_period_end: Date.now() + 30 * DAY,
    ...over,
  });
const lead = (u: string, n = 'Test') => ({ agent_id: u, name: n, phone: '9876543210', created_at: Date.now() });

// ---- billing cycles ---------------------------------------------------------------------------
test('usage cycle is anchored to the subscription start, in 30-day steps', () => {
  const anchor = Date.UTC(2026, 0, 17, 10, 0, 0); // 17 Jan
  const at = (days: number) => cycles.usageCycle({ current_period_start: anchor }, anchor + days * DAY);
  assert.equal(at(0).start, anchor);
  assert.equal(at(29.9).start, anchor);
  assert.equal(at(30).start, anchor + 30 * DAY); // resets on day 30, not on the 1st of a month
  assert.equal(at(65).start, anchor + 60 * DAY);
  assert.equal(at(65).end, anchor + 90 * DAY);
  assert.equal(cycles.usageCycle({}, Date.now()).key, 'none');
  assert.equal(cycles.usageCycle(null, Date.now()).key, 'none');
  // clock skew: never a negative cycle
  assert.equal(cycles.usageCycle({ current_period_start: anchor }, anchor - DAY).start, anchor);
});

test('lead counter resets when the billing cycle rolls over (not at month end)', async () => {
  const u = uid('reset');
  const start = Date.now() - 31 * DAY; // current cycle began 1 day ago (cycle #1)
  await subscribe(u, 'starter', { current_period_start: start, current_period_end: Date.now() + 29 * DAY });
  // 500 leads used in the PREVIOUS cycle (cycle #0)
  await b.adminDb.collection('usage').doc(b.usageDocId(u, String(start))).set({ agent_id: u, leads_created: 500 });
  const s = await b.getPlanStatus(u);
  assert.equal(s.usage.leads, 0); // fresh counter in the new cycle
  assert.equal(s.remaining.leads, 500);
  assert.equal(s.usageCycle.start, start + 30 * DAY);
  await b.createLeadWithinLimit(u, lead(u), 'agent');
  assert.equal((await b.getPlanStatus(u)).usage.leads, 1);
});

test('voice allowance also resets per billing cycle; top-ups carry over', async () => {
  const u = uid('voicereset');
  const start = Date.now() - 31 * DAY;
  await subscribe(u, 'starter', { current_period_start: start, current_period_end: Date.now() + 29 * DAY, voice_topup_minutes: 50 });
  await b.adminDb.collection('usage').doc(b.usageDocId(u, String(start))).set({ agent_id: u, voice_minutes_used: 300 });
  const s = await b.getPlanStatus(u);
  assert.equal(s.remaining.voiceAllowance, 300); // allowance restored
  assert.equal(s.remaining.voiceTopUp, 50); // purchased minutes untouched
});

test('renewing early extends the period without moving the cycle anchor', async () => {
  const u = uid('anchor');
  const start = Date.now() - 10 * DAY;
  await subscribe(u, 'starter', { current_period_start: start, current_period_end: Date.now() + 20 * DAY });
  await b.applyPlanPayment(u, 'starter', 'monthly');
  const s = await b.getPlanStatus(u);
  assert.equal(s.current_period_start, start);
  assert.equal(s.usageCycle.start, start);
});

// ---- lead limit --------------------------------------------------------------------------------
test('each plan enforces its own lead cap (500 / 1500 / 3000)', async () => {
  for (const [plan, cap] of [['starter', 500], ['pro', 1500], ['elite', 3000]] as const) {
    const u = uid(`cap_${plan}`);
    await subscribe(u, plan);
    const start = (await b.getPlanStatus(u)).usageCycle.start;
    await b.adminDb.collection('usage').doc(b.usageDocId(u, String(start))).set({ agent_id: u, leads_created: cap - 1 });
    await b.createLeadWithinLimit(u, lead(u), 'agent'); // the last free slot
    await assert.rejects(b.createLeadWithinLimit(u, lead(u), 'agent'), (e: any) => e.code === 'LEAD_LIMIT' && e.limit === cap);
  }
});

test('agent without an active plan gets PLAN_REQUIRED; expired plan too', async () => {
  await assert.rejects(b.createLeadWithinLimit(uid('noplan'), lead(uid('noplan')), 'agent'), (e: any) => e.code === 'PLAN_REQUIRED' && e.action === 'upgrade');
  const u = uid('lapsed');
  await subscribe(u, 'pro', { current_period_end: Date.now() - 1000 });
  await assert.rejects(b.createLeadWithinLimit(u, lead(u), 'agent'), (e: any) => e.code === 'PLAN_REQUIRED');
});

test('public catalogue leads are NEVER dropped: saved paused, score 0, not counted', async () => {
  const u = uid('public');
  await subscribe(u, 'starter');
  const start = (await b.getPlanStatus(u)).usageCycle.start;
  await b.adminDb.collection('usage').doc(b.usageDocId(u, String(start))).set({ agent_id: u, leads_created: 500 }); // at the cap
  const r = await b.createLeadWithinLimit(u, { ...lead(u), score: 75 }, 'public', { whenOverLimit: { score: 0 } });
  assert.equal(r.overLimit, true);
  assert.equal(r.automation_paused, true);
  const doc = (await b.adminDb.collection('leads').doc(r.id).get()).data();
  assert.equal(doc.automation_paused, true);
  assert.equal(doc.score, 0);
  assert.equal((await b.getPlanStatus(u)).usage.leads, 500); // not counted

  // an agent with no plan at all also still receives the enquiry
  const none = await b.createLeadWithinLimit(uid('public_noplan'), lead(uid('public_noplan')), 'public');
  assert.equal(none.automation_paused, true);

  // and under the cap it is normal: automation on, counted
  const ok = uid('public_ok');
  await subscribe(ok, 'starter');
  const r2 = await b.createLeadWithinLimit(ok, { ...lead(ok), score: 75 }, 'public', { whenOverLimit: { score: 0 } });
  assert.equal(r2.automation_paused, false);
  assert.equal((await b.adminDb.collection('leads').doc(r2.id).get()).data().score, 75);
  assert.equal((await b.getPlanStatus(ok)).usage.leads, 1);
});

// ---- voice minutes --------------------------------------------------------------------------------
test('consumeVoiceMinutes: allowance first, then top-up, then VOICE_LIMIT (action: top_up)', async () => {
  const u = uid('voice');
  await subscribe(u, 'starter', { voice_topup_minutes: 20 }); // 300 allowance + 20 top-up
  const start = (await b.getPlanStatus(u)).usageCycle.start;
  await b.adminDb.collection('usage').doc(b.usageDocId(u, String(start))).set({ agent_id: u, voice_minutes_used: 295 }); // 5 allowance left
  const r = await b.consumeVoiceMinutes(u, 10); // 5 from allowance + 5 from top-up
  assert.deepEqual({ a: r.consumedAllowance, t: r.consumedTopUp, left: r.remainingTotal }, { a: 5, t: 5, left: 15 });
  await assert.rejects(b.consumeVoiceMinutes(u, 16), (e: any) => e.code === 'VOICE_LIMIT' && e.action === 'top_up' && e.status === 402 && e.remaining === 15);
  assert.equal((await b.getPlanStatus(u)).remaining.voiceMinutes, 15); // a refused call consumed nothing
  await b.consumeVoiceMinutes(u, 15);
  await assert.rejects(b.consumeVoiceMinutes(u, 1), (e: any) => e.code === 'VOICE_LIMIT');
});

test('concurrent voice reservations can never overspend', async () => {
  const u = uid('voiceconc');
  await subscribe(u, 'starter', { voice_topup_minutes: 100 }); // 400 total
  const results = await Promise.allSettled(Array.from({ length: 20 }, () => b.consumeVoiceMinutes(u, 30)));
  assert.equal(results.filter((r) => r.status === 'fulfilled').length, 13); // 13 * 30 = 390, the 14th would need 420
  assert.equal((await b.getPlanStatus(u)).remaining.voiceMinutes, 10);
});

test('voice calls need an active plan (PLAN_REQUIRED)', async () => {
  await assert.rejects(b.consumeVoiceMinutes(uid('voicenoplan'), 2), (e: any) => e.code === 'PLAN_REQUIRED');
});

test('requireVoiceMinutes middleware returns 402 with VOICE_LIMIT / PLAN_REQUIRED bodies', async () => {
  const call = async (u: string, mins: number) => {
    let status = 200, body: any = null, passed = false;
    const res: any = { status(c: number) { status = c; return this; }, json(x: any) { body = x; return this; } };
    await b.requireVoiceMinutes(mins)({ user: { uid: u } } as any, res, () => { passed = true; });
    return { status, body, passed };
  };
  const u = uid('mw');
  await subscribe(u, 'starter');
  assert.equal((await call(u, 2)).passed, true);
  const low = await call(u, 301);
  assert.equal(low.status, 402);
  assert.equal(low.body.code, 'VOICE_LIMIT');
  assert.equal(low.body.action, 'top_up');
  const none = await call(uid('mw_none'), 2);
  assert.equal(none.body.code, 'PLAN_REQUIRED');
  assert.equal(none.body.action, 'upgrade');
});

test('recordVoiceMinutes (after a call) floors at zero instead of failing', async () => {
  const u = uid('record');
  await subscribe(u, 'starter');
  const start = (await b.getPlanStatus(u)).usageCycle.start;
  await b.adminDb.collection('usage').doc(b.usageDocId(u, String(start))).set({ agent_id: u, voice_minutes_used: 299 });
  const r = await b.recordVoiceMinutes(u, 10); // call ran 10 min, only 1 minute was left
  assert.equal(r.consumedAllowance, 1);
  assert.equal(r.remainingTotal, 0);
});

// ---- team seats ---------------------------------------------------------------------------------------
test('seat limits per plan: 2 / 5 / 15, owner counts as one', async () => {
  for (const [plan, cap] of [['starter', 2], ['pro', 5], ['elite', 15]] as const) {
    const u = uid(`seat_${plan}`);
    await subscribe(u, plan);
    assert.deepEqual(await b.getSeatStatus(u), { limit: cap, used: 1, remaining: cap - 1 });
    for (let i = 1; i < cap; i++) {
      await b.assertSeatAvailable(u);
      await b.adminDb.collection('team_members').add({ owner_id: u, email: `m${i}@example.com` });
    }
    await assert.rejects(b.assertSeatAvailable(u), (e: any) => e.code === 'USER_LIMIT' && e.action === 'upgrade' && e.status === 402 && e.limit === cap);
  }
  await assert.rejects(b.assertSeatAvailable(uid('seat_noplan')), (e: any) => e.code === 'PLAN_REQUIRED');
});

test('PlanLimitError serialises to the JSON the frontend reads', () => {
  const e = new b.PlanLimitError('LEAD_LIMIT', 'msg', 'upgrade', { limit: 500, used: 500 });
  assert.deepEqual(e.toJSON(), { error: 'msg', code: 'LEAD_LIMIT', action: 'upgrade', limit: 500, used: 500 });
});
