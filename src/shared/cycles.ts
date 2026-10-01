/**
 * Usage cycles. Plan limits (leads, voice minutes) are per BILLING cycle of each subscription,
 * not per calendar month: a subscription that started on the 17th resets on the 17th (every 30 days
 * from its own anchor, `current_period_start`), for monthly and annual plans alike.
 *
 * Renewing early extends the period but does not move the anchor, so the cycles stay on schedule.
 */
export const CYCLE_LENGTH_MS = 30 * 24 * 60 * 60 * 1000;

export interface UsageCycle {
  /** Document-id suffix for the usage record; "none" when the user has never had a subscription. */
  key: string;
  start: number | null;
  end: number | null;
}

export function usageCycle(sub: { current_period_start?: unknown } | null | undefined, now = Date.now()): UsageCycle {
  const anchor = Number(sub?.current_period_start);
  if (!Number.isFinite(anchor) || anchor <= 0) return { key: 'none', start: null, end: null };
  const index = Math.max(0, Math.floor((now - anchor) / CYCLE_LENGTH_MS));
  const start = anchor + index * CYCLE_LENGTH_MS;
  return { key: String(start), start, end: start + CYCLE_LENGTH_MS };
}
