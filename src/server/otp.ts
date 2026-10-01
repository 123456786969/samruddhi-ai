import crypto from 'crypto';
import { adminDb } from './billing';
import { OTP_CODE_TTL_MS, OTP_MAX_WRONG_ATTEMPTS } from '../shared/otp';

/**
 * OTP storage and checks. Everything lives in Firestore (collections "otp_codes" and
 * "rate_limits", server-only via default-deny rules) so it works across server instances
 * and survives redeploys.
 *
 * - Only an HMAC of the code is stored (keyed with OTP_HMAC_SECRET), never the code itself.
 * - A code is bound to one user (uid + email), expires after 10 minutes, works once, and is
 *   invalidated on the 5th wrong attempt.
 */

function db(): any {
  if (!adminDb) throw new Error('Firestore Admin is not initialised.');
  return adminDb;
}

let warnedDevSecret = false;
function hmacSecret(): string {
  const secret = process.env.OTP_HMAC_SECRET;
  if (secret && secret.length >= 16) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('OTP_HMAC_SECRET (min 16 chars) must be set in production.');
  }
  if (!warnedDevSecret) {
    warnedDevSecret = true;
    console.warn('[OTP] OTP_HMAC_SECRET not set - using an insecure development secret.');
  }
  return 'dev-only-insecure-otp-secret';
}

const sha256 = (v: string) => crypto.createHash('sha256').update(v).digest('hex');
const hashCode = (uid: string, email: string, code: string) =>
  crypto.createHmac('sha256', hmacSecret()).update(`${uid}:${email}:${code}`).digest('hex');
const otpRef = (uid: string, email: string) => db().collection('otp_codes').doc(sha256(`${uid}:${email}`));

/**
 * Fixed-window rate limiter backed by Firestore. Returns true when the call is allowed.
 * Runs in a transaction so concurrent requests can't slip past the limit.
 */
export async function rateLimitAllow(key: string, max: number, windowMs: number): Promise<boolean> {
  const ref = db().collection('rate_limits').doc(sha256(key));
  return db().runTransaction(async (tx: any) => {
    const snap = await tx.get(ref);
    const now = Date.now();
    const cur = snap.exists ? snap.data() : null;
    if (!cur || cur.resetAt <= now) {
      tx.set(ref, { count: 1, resetAt: now + windowMs });
      return true;
    }
    if (cur.count >= max) return false;
    tx.update(ref, { count: cur.count + 1 });
    return true;
  });
}

export const OTP_EMAIL_LIMIT = { max: 3, windowMs: 15 * 60 * 1000 }; // 3 codes / email / 15 min
export const OTP_IP_LIMIT = { max: 10, windowMs: 15 * 60 * 1000 }; // 10 codes / IP / 15 min

/**
 * Creates a fresh code for this user, replacing any previous one.
 * Returns { allowed:false } when a rate limit is hit, otherwise the plain code to be emailed.
 */
export async function issueOtp(params: {
  uid: string;
  email: string;
  ip: string;
}): Promise<{ allowed: false } | { allowed: true; code: string }> {
  const email = params.email.trim().toLowerCase();

  // Count both limits first so an attacker can't probe one while draining the other
  const emailOk = await rateLimitAllow(`otp:email:${email}`, OTP_EMAIL_LIMIT.max, OTP_EMAIL_LIMIT.windowMs);
  const ipOk = await rateLimitAllow(`otp:ip:${params.ip}`, OTP_IP_LIMIT.max, OTP_IP_LIMIT.windowMs);
  if (!emailOk || !ipOk) return { allowed: false };

  const code = crypto.randomInt(100000, 1000000).toString();
  const now = Date.now();
  await otpRef(params.uid, email).set({
    uid: params.uid,
    codeHash: hashCode(params.uid, email, code),
    expiresAt: now + OTP_CODE_TTL_MS,
    createdAt: now,
    attempts: 0,
  });
  return { allowed: true, code };
}

/** Drops a code (e.g. when the email could not be delivered). */
export async function discardOtp(uid: string, email: string): Promise<void> {
  await otpRef(uid, email.trim().toLowerCase()).delete();
}

/**
 * Checks a code. Every failure mode (no code, expired, wrong, locked) is reported as the same
 * `false`, so callers can't tell an attacker anything about the state of the code.
 */
export async function checkOtp(params: { uid: string; email: string; code: string }): Promise<boolean> {
  const email = params.email.trim().toLowerCase();
  const ref = otpRef(params.uid, email);

  return db().runTransaction(async (tx: any) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return false;
    const rec = snap.data();

    if (Date.now() > rec.expiresAt) {
      tx.delete(ref);
      return false;
    }

    const given = Buffer.from(hashCode(params.uid, email, params.code));
    const expected = Buffer.from(rec.codeHash);
    if (given.length === expected.length && crypto.timingSafeEqual(given, expected)) {
      tx.delete(ref); // single use
      return true;
    }

    const attempts = (rec.attempts || 0) + 1;
    if (attempts >= OTP_MAX_WRONG_ATTEMPTS) tx.delete(ref); // invalidate on the 5th wrong guess
    else tx.update(ref, { attempts });
    return false;
  });
}
