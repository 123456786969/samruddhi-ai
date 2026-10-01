import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

/**
 * Production = any deployment that is not an explicit local/dev run.
 * Dev-only conveniences (simulated OTP, local JSON stores, unverified-token fallback)
 * are NEVER enabled when this is true.
 */
export const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/** Escape a value for safe interpolation into HTML email bodies. */
export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Constant-time string comparison (safe for differing lengths). */
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

interface RateLimitOptions {
  windowMs: number;
  max: number;
  /** Builds the bucket key. Defaults to client IP. */
  key?: (req: Request) => string;
  message?: string;
}

/**
 * Small in-memory fixed-window rate limiter. Per-instance only: it blunts abuse
 * but is not a substitute for an edge/WAF limit when running multiple instances.
 */
export function rateLimit(opts: RateLimitOptions) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
  }, Math.max(opts.windowMs, 60_000));
  sweep.unref();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = (opts.key ? opts.key(req) : req.ip) || 'unknown';
    const now = Date.now();
    let entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + opts.windowMs };
      hits.set(key, entry);
    }
    entry.count += 1;
    if (entry.count > opts.max) {
      res.setHeader('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
      return res.status(429).json({
        error: opts.message || 'Too many requests. Please try again later.',
        code: 'RATE_LIMITED',
      });
    }
    next();
  };
}
