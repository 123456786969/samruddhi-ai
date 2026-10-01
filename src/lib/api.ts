import { auth } from './firebase';

export interface ApiFetchOptions extends RequestInit {
  skipAuth?: boolean;
}

export class ApiError extends Error {
  status: number;
  code?: string;
  data?: any;

  constructor(message: string, status: number, code?: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

// Global 402 event listener target for toast/modal dispatch
export const BILLING_402_EVENT = 'samruddhi:billing_402';

export interface Billing402EventDetail {
  code: 'PLAN_REQUIRED' | 'LEAD_LIMIT' | 'VOICE_LIMIT' | 'USER_LIMIT' | string;
  message: string;
  /** What the UI should offer: upgrade the plan, or buy a voice top-up pack. */
  action?: 'upgrade' | 'top_up';
}

/**
 * Robust fetch wrapper that attaches Firebase ID token and handles 402 paywalls globally.
 */
export async function apiFetch<T = any>(url: string, options: ApiFetchOptions = {}): Promise<T> {
  const headers = new Headers(options.headers || {});

  // Add Content-Type if JSON body
  if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Attach Firebase ID token if user is signed in
  if (!options.skipAuth && auth.currentUser) {
    try {
      const idToken = await auth.currentUser.getIdToken();
      headers.set('Authorization', `Bearer ${idToken}`);
    } catch (e) {
      console.warn('[apiFetch] Could not retrieve Firebase ID token:', e);
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle 402 Payment Required
  if (response.status === 402) {
    let errorData: any = {};
    try {
      errorData = await response.json();
    } catch {}

    const detail: Billing402EventDetail = {
      code: errorData.code || 'PLAN_REQUIRED',
      message: errorData.error || 'A subscription or voice minute top-up is required.',
      action: errorData.action || (errorData.code === 'VOICE_LIMIT' ? 'top_up' : 'upgrade'),
    };

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(BILLING_402_EVENT, { detail }));
    }

    throw new ApiError(detail.message, 402, detail.code, errorData);
  }

  if (!response.ok) {
    let errMessage = `HTTP ${response.status}: ${response.statusText}`;
    let code: string | undefined;
    let data: any;

    try {
      data = await response.json();
      if (data?.error) errMessage = data.error;
      if (data?.code) code = data.code;
    } catch {
      try {
        errMessage = await response.text();
      } catch {}
    }

    throw new ApiError(errMessage, response.status, code, data);
  }

  // If response is JSON, parse and return
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return (await response.json()) as T;
  }

  return (await response.text()) as unknown as T;
}
