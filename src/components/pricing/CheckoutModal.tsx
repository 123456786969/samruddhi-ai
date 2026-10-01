import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, ShieldCheck, Sparkles, CreditCard, QrCode, Building, ArrowRight, Loader2, CheckCircle2, Copy, AlertCircle, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAuthHeaders } from '../../lib/api';

export interface CheckoutSessionData {
  session_id: string;
  plan_id: string;
  plan_name: string;
  billing_cycle: 'monthly' | 'annual';
  subtotal: number;
  gst_amount: number;
  total_amount: number;
  currency: string;
  inclusions?: {
    call_minutes?: number;
    whatsapp_messages?: number;
  };
}

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionData: CheckoutSessionData | null;
  onSuccess?: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  sessionData,
  onSuccess,
}) => {
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [processing, setProcessing] = useState(false);
  const [successResult, setSuccessResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [gstin, setGstin] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);

  if (!isOpen || !sessionData) return null;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText('samruddhiai@icici');
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setErrorMsg(null);

    try {
      // Simulate gateway processing delay
      const res = await fetch('/api/billing/confirm-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionData.session_id,
          payment_id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          utr_number: `UTR${Math.floor(100000000000 + Math.random() * 900000000000)}`,
          gstin: gstin.trim() || undefined,
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to complete payment transaction');
      }

      setSuccessResult(data.session);

      // Dispatch real-time admin alert to rajubasavanahalli@gmail.com
      getAuthHeaders().then(authHeaders => fetch('/api/admin/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          type: 'checkout',
          email: cardName || (sessionData as any).customer_email || 'subscriber@realty.com',
          name: cardName || 'Subscriber',
          companyName: (sessionData as any).business_name || 'Direct Realty Subscriber',
          details: {
            plan: sessionData.plan_name,
            amount: sessionData.total_amount,
            billingCycle: sessionData.billing_cycle,
            paymentMethod: paymentMethod,
            sessionId: sessionData.session_id
          }
        })
      })).catch(err => console.warn('Admin notification notice:', err));

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setErrorMsg(err.message || 'Payment could not be processed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleFinishAndNavigate = () => {
    onClose();
    navigate('/dashboard');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-[#02060b]/80 backdrop-blur-xl"
          onClick={successResult ? undefined : onClose}
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-[#071318]/95 border border-emerald-500/30 rounded-2xl shadow-2xl shadow-emerald-950/80 overflow-hidden z-10 my-auto"
        >
          {/* Ambient Glow */}
          <div className="absolute top-0 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-teal-900/50 bg-[#051115]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Samruddhi AI Secure Checkout</span>
                  <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    256-Bit SSL
                  </span>
                </h3>
                <p className="text-xs text-gray-400">
                  Instant subscription activation for {sessionData.plan_name}
                </p>
              </div>
            </div>

            {!successResult && (
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Modal Body */}
          {successResult ? (
            /* Success State */
            <div className="p-6 sm:p-8 text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-500/20 animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <h4 className="text-2xl font-black text-white">Payment Confirmed & Plan Activated!</h4>
                <p className="text-sm text-emerald-200">
                  Welcome to Samruddhi AI {sessionData.plan_name}. Your automated lead engine is now active.
                </p>
              </div>

              <div className="bg-black/50 border border-emerald-900/60 rounded-xl p-4 text-left text-xs space-y-2 font-mono">
                <div className="flex justify-between text-gray-400">
                  <span>Transaction / UTR:</span>
                  <span className="text-emerald-300 font-bold">{successResult.utr_number}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Plan Activated:</span>
                  <span className="text-white font-bold">{sessionData.plan_name} ({sessionData.billing_cycle})</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Total Paid (incl. GST):</span>
                  <span className="text-amber-400 font-bold">₹{sessionData.total_amount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>AI Voice Minutes Quota:</span>
                  <span className="text-emerald-400 font-bold">{sessionData.inclusions?.call_minutes ?? 1500} Mins</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>WhatsApp Quota:</span>
                  <span className="text-teal-300 font-bold">{sessionData.inclusions?.whatsapp_messages ?? 5000} Messages</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleFinishAndNavigate}
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-gray-950 font-black text-sm shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
                >
                  <span>Launch CRM Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* Checkout Form */
            <div className="p-5 sm:p-6 space-y-6">
              {/* Plan Order Summary Card */}
              <div className="bg-[#050e12] border border-teal-900/60 rounded-xl p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-teal-900/40 gap-2">
                  <div>
                    <span className="text-xs text-emerald-400 uppercase font-bold tracking-wider block">
                      Selected Tier
                    </span>
                    <span className="text-lg font-bold text-white">{sessionData.plan_name}</span>
                    <span className="text-xs text-gray-400 ml-2">
                      ({sessionData.billing_cycle === 'annual' ? 'Annual Billing - 20% Saved' : 'Monthly Billing'})
                    </span>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-xs text-gray-400 block">Total Due</span>
                    <span className="text-xl font-black text-amber-400">
                      ₹{sessionData.total_amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div className="pt-3 grid grid-cols-2 gap-2 text-xs text-gray-300">
                  <div className="bg-white/5 p-2 rounded-lg border border-teal-900/40">
                    <span className="text-gray-400 block text-[10px]">AI Voice Calls</span>
                    <span className="font-bold text-emerald-300">
                      {sessionData.inclusions?.call_minutes ?? 1500} Minutes
                    </span>
                  </div>
                  <div className="bg-white/5 p-2 rounded-lg border border-teal-900/40">
                    <span className="text-gray-400 block text-[10px]">WhatsApp Auto-Pilot</span>
                    <span className="font-bold text-teal-300">
                      {sessionData.inclusions?.whatsapp_messages ?? 5000} Messages
                    </span>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="mt-3 pt-3 border-t border-teal-900/30 text-xs space-y-1 text-gray-400 font-mono">
                  <div className="flex justify-between">
                    <span>Base Amount:</span>
                    <span className="text-gray-200">₹{sessionData.subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST (18% itemized with input tax credit):</span>
                    <span className="text-gray-200">₹{sessionData.gst_amount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method Selector Tabs */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('upi')}
                    className={`py-3 px-2 rounded-xl text-xs font-bold transition-all border flex flex-col items-center gap-1.5 ${
                      paymentMethod === 'upi'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-md shadow-emerald-500/10'
                        : 'bg-black/40 text-gray-400 border-teal-900/50 hover:text-white'
                    }`}
                  >
                    <QrCode className="w-4 h-4 text-emerald-400" />
                    <span>Instant UPI / QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`py-3 px-2 rounded-xl text-xs font-bold transition-all border flex flex-col items-center gap-1.5 ${
                      paymentMethod === 'card'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-md shadow-emerald-500/10'
                        : 'bg-black/40 text-gray-400 border-teal-900/50 hover:text-white'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                    <span>Credit / Debit Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('netbanking')}
                    className={`py-3 px-2 rounded-xl text-xs font-bold transition-all border flex flex-col items-center gap-1.5 ${
                      paymentMethod === 'netbanking'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-md shadow-emerald-500/10'
                        : 'bg-black/40 text-gray-400 border-teal-900/50 hover:text-white'
                    }`}
                  >
                    <Building className="w-4 h-4 text-emerald-400" />
                    <span>NetBanking / NEFT</span>
                  </button>
                </div>
              </div>

              {/* Payment Details Section */}
              <form onSubmit={handleConfirmPayment} className="space-y-4">
                {errorMsg && (
                  <div className="bg-red-500/10 border border-red-500/50 text-red-300 p-3 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {paymentMethod === 'upi' && (
                  <div className="bg-black/40 border border-teal-900/60 rounded-xl p-4 space-y-3 text-xs">
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      {/* Interactive Simulated QR Code */}
                      <div className="w-28 h-28 bg-white p-2 rounded-xl flex items-center justify-center shadow-lg shrink-0">
                        <div className="relative w-full h-full border-2 border-dashed border-gray-900 flex flex-col items-center justify-center p-1 text-center">
                          <QrCode className="w-12 h-12 text-gray-900" />
                          <span className="text-[9px] font-black text-gray-900 uppercase tracking-tighter">
                            GPay • PhonePe
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 flex-1 text-left">
                        <span className="text-gray-300 font-semibold block">
                          Scan with any UPI App or use Official VPA:
                        </span>
                        <div className="flex items-center gap-2">
                          <code className="bg-black/70 px-3 py-1.5 rounded-lg border border-teal-800/80 text-amber-300 font-mono font-bold text-xs">
                            samruddhiai@icici
                          </code>
                          <button
                            type="button"
                            onClick={handleCopyUpi}
                            className="px-2.5 py-1.5 rounded-lg bg-teal-900/60 hover:bg-teal-800 text-teal-200 text-xs font-semibold flex items-center gap-1 transition-colors"
                          >
                            {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                        <p className="text-[11px] text-gray-400">
                          Supports Google Pay, PhonePe, Paytm, CRED & BHIM. Auto-activated on payment.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'card' && (
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-gray-300 font-semibold mb-1">Cardholder Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Ramesh Kumar"
                        value={cardName}
                        onChange={e => setCardName(e.target.value)}
                        className="w-full bg-black/50 border border-teal-900/80 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 font-semibold mb-1">Card Number</label>
                      <input
                        type="text"
                        placeholder="4532 •••• •••• 8892"
                        value={cardNumber}
                        onChange={e => setCardNumber(e.target.value)}
                        className="w-full bg-black/50 border border-teal-900/80 rounded-xl px-3.5 py-2.5 text-white font-mono outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-gray-300 font-semibold mb-1">Expiry (MM/YY)</label>
                        <input
                          type="text"
                          placeholder="12/28"
                          value={cardExpiry}
                          onChange={e => setCardExpiry(e.target.value)}
                          className="w-full bg-black/50 border border-teal-900/80 rounded-xl px-3.5 py-2.5 text-white font-mono outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-300 font-semibold mb-1">CVV</label>
                        <input
                          type="password"
                          maxLength={4}
                          placeholder="•••"
                          value={cardCvv}
                          onChange={e => setCardCvv(e.target.value)}
                          className="w-full bg-black/50 border border-teal-900/80 rounded-xl px-3.5 py-2.5 text-white font-mono outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'netbanking' && (
                  <div className="bg-black/40 border border-teal-900/60 rounded-xl p-4 space-y-2 text-xs">
                    <span className="text-gray-300 font-semibold block">Select Your Bank</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Mahindra', 'IndusInd Bank'].map(bank => (
                        <div
                          key={bank}
                          className="p-2.5 rounded-lg bg-white/5 hover:bg-emerald-500/10 border border-teal-900/50 hover:border-emerald-500/50 text-center text-[11px] font-semibold text-gray-200 cursor-pointer transition-colors"
                        >
                          {bank}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Optional GSTIN for B2B Input Tax Credit */}
                <div className="pt-1">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-3.5 h-3.5 text-gray-400" />
                    <label className="text-[11px] font-semibold text-gray-300">
                      Company GSTIN (Optional — for B2B Tax Credit)
                    </label>
                  </div>
                  <input
                    type="text"
                    placeholder="29AAAAA0000A1Z5"
                    value={gstin}
                    onChange={e => setGstin(e.target.value.toUpperCase())}
                    className="w-full bg-black/50 border border-teal-900/80 rounded-xl px-3.5 py-2 text-xs font-mono text-white placeholder-gray-600 outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={processing}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-gray-950 font-black text-sm shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-gray-950" />
                      <span>Authorizing & Activating Plan...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-gray-950" />
                      <span>
                        Pay ₹{sessionData.total_amount.toLocaleString('en-IN')} & Activate Plan
                      </span>
                    </>
                  )}
                </button>

                <p className="text-[10px] text-center text-gray-500">
                  🔒 Encrypted and processed securely via RBI-compliant banking rails. Instant activation with invoice sent to your email.
                </p>
              </form>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
