/** Shared between server and client so both agree on how long an OTP verification lasts. */
export const OTP_CODE_TTL_MS = 10 * 60 * 1000; // a code is valid for 10 minutes
export const OTP_MAX_WRONG_ATTEMPTS = 5; // the code is invalidated on the 5th wrong guess
export const OTP_VERIFICATION_VALID_MS = 30 * 24 * 60 * 60 * 1000; // a verified login lasts 30 days

/** Custom-claim name written to the Firebase ID token after a successful OTP check. */
export const OTP_CLAIM = 'otp_verified_at';

export function isOtpClaimValid(claims: Record<string, any> | null | undefined, now = Date.now()): boolean {
  const at = Number(claims?.[OTP_CLAIM]);
  return Number.isFinite(at) && at > 0 && at <= now + 60_000 && now - at < OTP_VERIFICATION_VALID_MS;
}
