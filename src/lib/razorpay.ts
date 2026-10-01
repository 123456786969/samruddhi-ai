import { apiFetch } from './api';
import { PlanId, BillingCycle } from '../shared/plans';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export interface RazorpayOrderResponse {
  success: boolean;
  orderId: string;
  id: string;
  amount: number;
  currency: string;
  key: string;
  type: 'plan' | 'voice_topup';
  plan_id?: string;
  billing_cycle?: string;
  pack_id?: string;
  subtotal: number;
  gst: number;
  total: number;
  description: string;
  isFoundingPartner: boolean;
}

export interface LaunchCheckoutOptions {
  type: 'plan' | 'voice_topup';
  planId?: PlanId;
  billingCycle?: BillingCycle;
  packId?: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  onSuccess?: (planStatus: any) => void;
  onError?: (err: any) => void;
  onDismiss?: () => void;
}

/**
 * Loads Razorpay SDK if not already in document
 */
export async function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (window.Razorpay) return true;

  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * Creates order on server and launches Razorpay checkout popup
 */
export async function launchRazorpayPayment(options: LaunchCheckoutOptions): Promise<void> {
  const {
    type,
    planId,
    billingCycle = 'monthly',
    packId,
    userName = 'Real Estate Advisor',
    userEmail = 'agent@realty.com',
    userPhone = '+91 98765 43210',
    onSuccess,
    onError,
    onDismiss,
  } = options;

  try {
    // 1. Create Order on Server
    const orderData = await apiFetch<RazorpayOrderResponse>('/api/billing/create-order', {
      method: 'POST',
      body: JSON.stringify({
        type,
        plan_id: planId,
        billing_cycle: billingCycle,
        pack_id: packId,
      }),
    });

    if (!orderData?.orderId) {
      throw new Error('Server could not initialize Razorpay order.');
    }

    // 2. Ensure Razorpay script is ready
    const isLoaded = await loadRazorpayScript();

    // If Razorpay SDK is available and not in sandbox-blocked iframe, launch standard checkout
    if (isLoaded && typeof window.Razorpay === 'function') {
      const rzpOptions = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'Samruddhi AI',
        description: orderData.description,
        order_id: orderData.orderId.startsWith('order_') && !orderData.orderId.includes('sim_') ? orderData.orderId : undefined,
        prefill: {
          name: userName,
          email: userEmail,
          contact: userPhone,
        },
        theme: {
          color: '#D4AF37', // Champagne Gold
        },
        handler: async (response: any) => {
          try {
            const verifyRes = await apiFetch<{ success: boolean; planStatus: any }>('/api/billing/verify-payment', {
              method: 'POST',
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id || orderData.orderId,
                razorpay_payment_id: response.razorpay_payment_id || `pay_${Date.now()}`,
                razorpay_signature: response.razorpay_signature || '',
                type,
                plan_id: planId,
                billing_cycle: billingCycle,
                pack_id: packId,
              }),
            });

            if (onSuccess) {
              onSuccess(verifyRes.planStatus);
            }
          } catch (vErr) {
            console.error('[Razorpay] Verification failure:', vErr);
            if (onError) onError(vErr);
          }
        },
        modal: {
          ondismiss: () => {
            if (onDismiss) onDismiss();
          },
        },
      };

      const rzp = new window.Razorpay(rzpOptions);
      rzp.on('payment.failed', (resp: any) => {
        console.error('[Razorpay] Payment failed:', resp.error);
        if (onError) onError(resp.error);
      });
      rzp.open();
    } else {
      // 3. Simulated verification is for local development / preview sandboxes only.
      //    In production a payment window that failed to load must never look like a payment.
      if (!import.meta.env.DEV) {
        throw new Error('Could not load the payment window. Please check your connection and try again.');
      }
      const simPaymentId = `sim_pay_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const verifyRes = await apiFetch<{ success: boolean; planStatus: any }>('/api/billing/verify-payment', {
        method: 'POST',
        body: JSON.stringify({
          razorpay_order_id: orderData.orderId,
          razorpay_payment_id: simPaymentId,
          razorpay_signature: 'simulated_signature',
          type,
          plan_id: planId,
          billing_cycle: billingCycle,
          pack_id: packId,
        }),
      });

      if (onSuccess) {
        onSuccess(verifyRes.planStatus);
      }
    }
  } catch (err: any) {
    console.error('[launchRazorpayPayment] Error:', err);
    if (onError) onError(err);
  }
}
