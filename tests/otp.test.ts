import { test, before } from 'node:test';
import assert from 'node:assert/strict';

process.env.OTP_HMAC_SECRET = 'test-secret-at-least-16-chars';
process.env.ALLOW_UNVERIFIED_TOKENS = 'true'; // tokens in these tests are unsigned
delete process.env.OTP_REQUIRED;

let otp: typeof import('../src/server/otp');
let b: typeof import('../src/server/billing');
let shared: typeof import('../src/shared/otp');
const run = Date.now().toString(36);
const uid = (s: string) => `${s}_${run}`;
const email = (s: string) => `${s}.${run}@example.com`;

before(async () => {
  assert.ok(process.env.FIRESTORE_EMULATOR_HOST, 'Run with `npm test` so the Firestore emulator is used');
  otp = await import('../src/server/otp');
  b = await import('../src/server/billing');
  shared = await import('../src/shared/otp');
});

const issue = async (u: string, e: string, ip = `ip_${u}`) => {
  const r = await otp.issueOtp({ uid: u, email: e, ip });
  assert.ok(r.allowed, 'expected OTP to be issued');
  return (r as { code: string }).code;
};

test('code is 6 digits, works once, and a replay fails', async () => {
  const u = uid('once'), e = email('once');
  const code = await issue(u, e);
  assert.match(code, /^\d{6}$/);
  assert.equal(await otp.checkOtp({ uid: u, email: e, code }), true);
  assert.equal(await otp.checkOtp({ uid: u, email: e, code }), false);
});

test('only an HMAC is stored, never the plain code', async () => {
  const u = uid('hash'), e = email('hash');
  const code = await issue(u, e);
  const snap = await b.adminDb.collection('otp_codes').get();
  const dump = JSON.stringify(snap.docs.map((d: any) => d.data()));
  assert.ok(!dump.includes(`"${code}"`) && !dump.includes(code + '"'), 'plain code leaked into Firestore');
  assert.ok(snap.docs.some((d: any) => /^[0-9a-f]{64}$/.test(d.data().codeHash)));
});

test('the 5th wrong attempt invalidates the code, even for the correct code afterwards', async () => {
  const u = uid('lock'), e = email('lock');
  const code = await issue(u, e);
  const wrong = code === '000000' ? '111111' : '000000';
  for (let i = 0; i < 5; i++) assert.equal(await otp.checkOtp({ uid: u, email: e, code: wrong }), false);
  assert.equal(await otp.checkOtp({ uid: u, email: e, code }), false);
});

test('4 wrong attempts do not lock; the right code still works', async () => {
  const u = uid('four'), e = email('four');
  const code = await issue(u, e);
  const wrong = code === '000000' ? '111111' : '000000';
  for (let i = 0; i < 4; i++) await otp.checkOtp({ uid: u, email: e, code: wrong });
  assert.equal(await otp.checkOtp({ uid: u, email: e, code }), true);
});

test('expired codes are rejected', async () => {
  const u = uid('exp'), e = email('exp');
  const code = await issue(u, e);
  const snap = await b.adminDb.collection('otp_codes').where('uid', '==', u).get();
  await snap.docs[0].ref.update({ expiresAt: Date.now() - 1 });
  assert.equal(await otp.checkOtp({ uid: u, email: e, code }), false);
});

test('a code is bound to its user: another uid cannot use it', async () => {
  const e = email('bound');
  const code = await issue(uid('owner'), e);
  assert.equal(await otp.checkOtp({ uid: uid('attacker'), email: e, code }), false);
  assert.equal(await otp.checkOtp({ uid: uid('owner'), email: e, code }), true);
});

test('a new code replaces the previous one', async () => {
  const u = uid('replace'), e = email('replace');
  const first = await issue(u, e);
  const second = await issue(u, e);
  if (first !== second) assert.equal(await otp.checkOtp({ uid: u, email: e, code: first }), false);
  assert.equal(await otp.checkOtp({ uid: u, email: e, code: second }), true);
});

test('max 3 codes per email per 15 minutes', async () => {
  const u = uid('rl'), e = email('rl');
  for (let i = 0; i < 3; i++) assert.ok((await otp.issueOtp({ uid: u, email: e, ip: `ip_rl_${i}_${run}` })).allowed);
  assert.equal((await otp.issueOtp({ uid: u, email: e, ip: `ip_rl_x_${run}` })).allowed, false);
});

test('per-IP limit applies across different emails', async () => {
  const ip = `shared_ip_${run}`;
  let allowed = 0;
  for (let i = 0; i < 12; i++) {
    if ((await otp.issueOtp({ uid: uid(`ipl${i}`), email: email(`ipl${i}`), ip })).allowed) allowed++;
  }
  assert.equal(allowed, 10);
});

test('rate limiter holds under concurrency (exactly max allowed)', async () => {
  const key = `concurrent_${run}`;
  const results = await Promise.all(Array.from({ length: 20 }, () => otp.rateLimitAllow(key, 5, 60_000)));
  assert.equal(results.filter(Boolean).length, 5);
});

test('rate limit window resets', async () => {
  const key = `reset_${run}`;
  assert.equal(await otp.rateLimitAllow(key, 1, 50), true);
  assert.equal(await otp.rateLimitAllow(key, 1, 50), false);
  await new Promise((r) => setTimeout(r, 80));
  assert.equal(await otp.rateLimitAllow(key, 1, 50), true);
});

test('isOtpClaimValid: fresh ok; missing, stale, future and junk rejected', () => {
  const now = Date.now();
  assert.equal(shared.isOtpClaimValid({ otp_verified_at: now - 1000 }, now), true);
  assert.equal(shared.isOtpClaimValid({}, now), false);
  assert.equal(shared.isOtpClaimValid(null, now), false);
  assert.equal(shared.isOtpClaimValid({ otp_verified_at: now - 31 * 86400000 }, now), false);
  assert.equal(shared.isOtpClaimValid({ otp_verified_at: now + 10 * 60_000 }, now), false);
  assert.equal(shared.isOtpClaimValid({ otp_verified_at: 'abc' }, now), false);
});

// --- requireAuth middleware: OTP claim is enforced on API calls ---
const fakeToken = (payload: Record<string, any>) =>
  'h.' + Buffer.from(JSON.stringify(payload)).toString('base64url') + '.s';

async function callMiddleware(mw: any, token?: string) {
  const req: any = { headers: token ? { authorization: `Bearer ${token}` } : {} };
  let status = 200, body: any = null, passed = false;
  const res: any = { status(c: number) { status = c; return this; }, json(x: any) { body = x; return this; } };
  await mw(req, res, () => { passed = true; });
  return { status, body, passed, req };
}

test('requireAuth rejects a signed-in user without OTP verification (403 OTP_REQUIRED)', async () => {
  const r = await callMiddleware(b.requireAuth, fakeToken({ sub: 'u1', email: 'a@b.com' }));
  assert.equal(r.passed, false);
  assert.equal(r.status, 403);
  assert.equal(r.body.code, 'OTP_REQUIRED');
});

test('requireAuth accepts a user with a fresh OTP claim; rejects a stale one', async () => {
  const ok = await callMiddleware(b.requireAuth, fakeToken({ sub: 'u1', email: 'a@b.com', otp_verified_at: Date.now() }));
  assert.equal(ok.passed, true);
  const stale = await callMiddleware(b.requireAuth, fakeToken({ sub: 'u1', otp_verified_at: Date.now() - 40 * 86400000 }));
  assert.equal(stale.passed, false);
  assert.equal(stale.status, 403);
});

test('requireIdentity works without OTP (needed by the OTP routes); no token is 401', async () => {
  const id = await callMiddleware(b.requireIdentity, fakeToken({ sub: 'u1', email: 'a@b.com' }));
  assert.equal(id.passed, true);
  const none = await callMiddleware(b.requireAuth);
  assert.equal(none.status, 401);
});
