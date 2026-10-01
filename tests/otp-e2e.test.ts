import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, ChildProcess } from 'node:child_process';

// End-to-end through the real Express server, Firebase Auth emulator and Firestore emulator:
// sign in -> API is blocked -> request code -> verify -> refresh token -> API works.
process.env.FIREBASE_PROJECT_ID = 'demo-samruddhi';
const PORT = 3217;
const BASE = `http://127.0.0.1:${PORT}`;
const AUTH = `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`;
let server: ChildProcess;

async function waitForServer() {
  for (let i = 0; i < 90; i++) {
    try {
      const r = await fetch(`${BASE}/api/billing/status`);
      if (r.status === 401) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('server did not start');
}

before(async () => {
  assert.ok(process.env.FIREBASE_AUTH_EMULATOR_HOST, 'Run with `npm test` (Auth emulator required)');
  server = spawn('node_modules/.bin/tsx', ['server.ts'], {
    env: {
      ...process.env,
      PORT: String(PORT),
      NODE_ENV: 'development', // no SMTP configured -> the dev code is returned in the response
      OTP_HMAC_SECRET: 'e2e-secret-at-least-16-chars',
      FIREBASE_PROJECT_ID: 'demo-samruddhi',
      SMTP_EMAIL: '',
      SMTP_PASSWORD: '',
    },
    stdio: 'ignore',
  });
  await waitForServer();
});

after(() => server?.kill());

async function signUp(email: string) {
  const r = await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password: 'Passw0rd!x', returnSecureToken: true }),
  });
  const j: any = await r.json();
  return { idToken: j.idToken as string, uid: j.localId as string, refreshToken: j.refreshToken as string };
}

// Google sign-in always yields a verified email; emulator email/password users don't, so mark it.
async function signUpVerified(email: string) {
  const { adminAuth } = await import('../src/server/billing');
  const u = await signUp(email);
  await adminAuth.updateUser(u.uid, { emailVerified: true });
  return { ...u, idToken: await refresh(u.refreshToken) };
}

async function refresh(refreshToken: string) {
  const r = await fetch(`${AUTH}/securetoken.googleapis.com/v1/token?key=fake`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ grant_type: 'refresh_token', refresh_token: refreshToken }),
  });
  const j: any = await r.json();
  return j.id_token as string;
}

const api = (path: string, token?: string, body?: any) =>
  fetch(`${BASE}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });

test('full OTP login: blocked -> code -> verify -> refreshed token unlocks the API', async () => {
  const email = `e2e.${Date.now()}@example.com`;
  const { idToken, refreshToken } = await signUpVerified(email);

  // Signed in but not OTP-verified: API refuses
  let r = await api('/api/billing/status', idToken);
  assert.equal(r.status, 403);
  assert.equal(((await r.json()) as any).code, 'OTP_REQUIRED');

  // Request a code (email comes from the token; a different email in the body is ignored)
  r = await api('/api/send-otp', idToken, { email: 'victim@example.com' });
  assert.equal(r.status, 200);
  const sent: any = await r.json();
  assert.match(sent.devOtp, /^\d{6}$/);

  // Wrong code is rejected with the generic message
  const wrong = sent.devOtp === '000000' ? '111111' : '000000';
  r = await api('/api/verify-otp', idToken, { otp: wrong });
  assert.equal(r.status, 400);
  assert.equal(((await r.json()) as any).error, 'Invalid or expired verification code.');

  // Correct code works
  r = await api('/api/verify-otp', idToken, { otp: sent.devOtp });
  assert.equal(r.status, 200);

  // Replay of the same code fails
  r = await api('/api/verify-otp', idToken, { otp: sent.devOtp });
  assert.equal(r.status, 400);

  // The OLD token has no claim yet; after refreshing it does
  r = await api('/api/billing/status', idToken);
  assert.equal(r.status, 403);
  const fresh = await refresh(refreshToken);
  r = await api('/api/billing/status', fresh);
  assert.equal(r.status, 200);
  assert.equal(((await r.json()) as any).status, 'none');
});

test('the code cannot be requested for or verified by another account', async () => {
  const a = await signUpVerified(`owner.${Date.now()}@example.com`);
  const b = await signUpVerified(`attacker.${Date.now()}@example.com`);
  const sent: any = await (await api('/api/send-otp', a.idToken, {})).json();
  // attacker tries A's code on their own account
  const r = await api('/api/verify-otp', b.idToken, { otp: sent.devOtp });
  assert.equal(r.status, 400);
  // and still has no access
  const fresh = await refresh(b.refreshToken);
  assert.equal((await api('/api/billing/status', fresh)).status, 403);
});

test('send-otp is limited to 3 per email per 15 minutes', async () => {
  const { idToken } = await signUpVerified(`limit.${Date.now()}@example.com`);
  const statuses: number[] = [];
  for (let i = 0; i < 4; i++) statuses.push((await api('/api/send-otp', idToken, {})).status);
  assert.deepEqual(statuses, [200, 200, 200, 429]);
});
