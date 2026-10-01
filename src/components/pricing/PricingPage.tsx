import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Check,
  Sparkles,
  Phone,
  Users,
  Zap,
  Shield,
  HelpCircle,
  ArrowRight,
  Crown,
  ChevronDown,
  ChevronUp,
  FileText,
  Clock,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { auth } from '../../lib/firebase';
import { apiFetch } from '../../lib/api';
import {
  PLANS,
  PlanId,
  BillingCycle,
  priceFor,
  formatINR,
  OVERAGE_VOICE_PER_MIN,
  VOICE_TOP_UP_PACKS,
  FOUNDING_PARTNER_DISCOUNT,
} from '../../shared/plans';
import { launchRazorpayPayment } from '../../lib/razorpay';
import { Navbar } from '../Navbar';
import { Footer } from '../Footer';
import { VoiceTopUpModal } from '../dashboard/VoiceTopUpModal';
import { BookDemoModal } from '../BookDemoModal';
import { LoginModal } from '../LoginModal';
import { useToast } from '../dashboard/ui/Toast';
import { useNavigate } from 'react-router-dom';

interface PricingPageProps {
  isEmbeddedInDashboard?: boolean;
}

export const PricingPage: React.FC<PricingPageProps> = ({ isEmbeddedInDashboard = false }) => {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('annual');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [topUpModalOpen, setTopUpModalOpen] = useState(false);
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // User & Subscription Status
  const [isFoundingPartner, setIsFoundingPartner] = useState(false);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(auth.currentUser);

  let toast: ReturnType<typeof useToast> | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    toast = useToast();
  } catch {}

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      setCurrentUser(u);
      if (u) {
        apiFetch('/api/billing/status')
          .then((status) => {
            if (status) {
              setIsFoundingPartner(!!status.isFoundingPartner);
              setCurrentPlanId(status.status === 'active' ? status.plan_id : null);
            }
          })
          .catch(() => {});
      }
    });
    return () => unsub();
  }, []);

  const handleSelectPlan = async (planId: PlanId) => {
    if (!currentUser) {
      setLoginModalOpen(true);
      return;
    }

    setLoadingPlan(planId);
    try {
      await launchRazorpayPayment({
        type: 'plan',
        planId,
        billingCycle,
        userName: currentUser.displayName || 'Advisor',
        userEmail: currentUser.email || 'agent@realty.com',
        onSuccess: (status) => {
          setLoadingPlan(null);
          setCurrentPlanId(planId);
          if (toast) toast.success(`Subscribed to ${PLANS[planId].name} plan!`);
          if (isEmbeddedInDashboard) {
            navigate('/dashboard');
          }
        },
        onError: (err: any) => {
          setLoadingPlan(null);
          if (toast) toast.error(err?.message || 'Payment initiation failed.');
        },
        onDismiss: () => {
          setLoadingPlan(null);
        },
      });
    } catch (err: any) {
      setLoadingPlan(null);
      if (toast) toast.error(err?.message || 'Could not launch payment flow.');
    }
  };

  const faqs = [
    {
      q: 'What happens if I exceed my monthly lead limit?',
      a: 'We never drop or block your leads. Even if you exceed your monthly quota, newly created or incoming leads are permanently saved to your CRM. However, automated WhatsApp follow-ups and AI scoring will be safely paused on those overflow leads until your plan renews or you upgrade.',
    },
    {
      q: 'Do unused AI Voice minutes roll over to the next month?',
      a: 'Monthly allowance minutes reset with each billing cycle. However, purchased Voice Top-up Packs (100 or 500 minutes) carry over indefinitely and never expire until fully consumed.',
    },
    {
      q: 'Are GST invoices provided for business tax write-offs?',
      a: 'Yes. All plans are billed in Indian Rupees (INR) with 18% GST. You will automatically receive a compliant GST tax invoice immediately upon payment with your GSTIN.',
    },
    {
      q: 'Can I upgrade, downgrade, or cancel at any time?',
      a: 'Yes, you can upgrade your plan instantly. Downgrades take effect seamlessly at the end of your current active billing period.',
    },
  ];

  const content = (
    <div className={`space-y-12 ${isEmbeddedInDashboard ? 'py-4' : 'py-16 md:py-24'} max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 font-crm-sans text-[#F4F4F5]`}>
      {/* Founding Partner Banner */}
      {isFoundingPartner && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-[#D4AF37]/20 via-[#1A1A1A] to-[#D4AF37]/20 border border-[#D4AF37] rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 shadow-xl shadow-[#D4AF37]/10"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37] text-black flex items-center justify-center font-bold shrink-0">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>Founding Partner Privilege Active</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#D4AF37] text-black">
                  40% Off
                </span>
              </div>
              <p className="text-xs text-gray-300">
                Your 40% VIP discount is locked for 12 months across all subscription plans and renewals.
              </p>
            </div>
          </div>
          <span className="hidden md:inline-flex text-xs font-mono text-[#D4AF37] uppercase tracking-wider font-semibold">
            Applied at Checkout
          </span>
        </motion.div>
      )}

      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Transparent Indian Pricing</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-white tracking-tight">
          Invest in High-Conversion AI Infrastructure
        </h1>
        <p className="text-gray-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          Stop losing ad leads to slow follow-ups. Select a plan tailored for individual brokers, expanding sales teams, and premium developers.
        </p>

        {/* Monthly / Annual Toggle */}
        <div className="pt-4 flex items-center justify-center">
          <div className="bg-[#141414] p-1.5 rounded-xl border border-[rgba(255,255,255,0.08)] flex items-center gap-2">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'bg-[#202020] text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                billingCycle === 'annual'
                  ? 'bg-[#D4AF37] text-black shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span>Annual Billing</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  billingCycle === 'annual'
                    ? 'bg-black text-[#D4AF37]'
                    : 'bg-[#D4AF37]/20 text-[#D4AF37]'
                }`}
              >
                2 Months Free
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 3 Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-stretch pt-4">
        {(['starter', 'pro', 'elite'] as PlanId[]).map((planId) => {
          const plan = PLANS[planId];
          const isCurrent = currentPlanId === planId;
          const isPopular = plan.popular;

          // Compute raw price and discounted price if founding partner
          const standardPricing = priceFor(planId, billingCycle, false);
          const finalPricing = priceFor(planId, billingCycle, isFoundingPartner);

          const monthlyEquivalent =
            billingCycle === 'annual'
              ? Math.round(finalPricing.subtotal / 12)
              : finalPricing.subtotal;

          const standardMonthlyEquivalent =
            billingCycle === 'annual'
              ? Math.round(standardPricing.subtotal / 12)
              : standardPricing.subtotal;

          return (
            <div
              key={planId}
              className={`relative rounded-2xl flex flex-col justify-between transition-all duration-200 ${
                isPopular
                  ? 'bg-[#141414] border-2 border-[#D4AF37] shadow-2xl shadow-[#D4AF37]/15 md:-translate-y-2'
                  : 'bg-[#141414] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.15)] shadow-xl'
              }`}
            >
              {/* Popular Badge */}
              {isPopular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#D4AF37] text-black font-black text-[11px] uppercase tracking-wider shadow-md">
                  Most Popular
                </div>
              )}

              <div className="p-6 sm:p-8 space-y-6">
                {/* Title & Limits Summary */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-serif font-bold text-white tracking-tight">
                      {plan.name}
                    </h3>
                    {isCurrent && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Active Plan
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">
                    Up to {plan.limits.users} team members
                  </p>
                </div>

                {/* Price Display */}
                <div className="space-y-1 pt-2">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    {isFoundingPartner && (
                      <span className="text-gray-500 line-through text-lg font-serif">
                        {formatINR(standardMonthlyEquivalent)}
                      </span>
                    )}
                    <span className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight">
                      {formatINR(monthlyEquivalent)}
                    </span>
                    <span className="text-xs text-gray-400 font-crm-mono">
                      / month
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-500 font-crm-mono">
                    {billingCycle === 'annual'
                      ? `Billed annually at ${formatINR(finalPricing.subtotal)} + 18% GST`
                      : '+ 18% GST'}
                  </div>
                </div>

                {/* Clear Limits Box */}
                <div className="p-3.5 rounded-xl bg-[#1A1A1A] border border-[rgba(255,255,255,0.06)] space-y-2 text-xs">
                  <div className="flex justify-between items-center text-gray-300">
                    <span className="flex items-center gap-1.5 text-gray-400">
                      <Users className="w-3.5 h-3.5 text-[#D4AF37]" /> Monthly Leads:
                    </span>
                    <span className="font-semibold text-white font-crm-mono">
                      {plan.limits.leadsPerMonth.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-gray-300">
                    <span className="flex items-center gap-1.5 text-gray-400">
                      <Phone className="w-3.5 h-3.5 text-[#D4AF37]" /> AI Voice Minutes:
                    </span>
                    <span className="font-semibold text-white font-crm-mono">
                      {plan.limits.voiceMinutesPerMonth.toLocaleString('en-IN')} mins
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-gray-300">
                    <span className="flex items-center gap-1.5 text-gray-400">
                      <Shield className="w-3.5 h-3.5 text-[#D4AF37]" /> Users Included:
                    </span>
                    <span className="font-semibold text-white font-crm-mono">
                      {plan.limits.users} seats
                    </span>
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-3 pt-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    What&apos;s Included
                  </div>
                  <ul className="space-y-2.5 text-xs text-gray-300">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* CTA Button */}
              <div className="p-6 sm:p-8 pt-0">
                <button
                  onClick={() => handleSelectPlan(planId)}
                  disabled={loadingPlan === planId || isCurrent}
                  className={`w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isCurrent
                      ? 'bg-[#202020] text-gray-400 border border-[rgba(255,255,255,0.06)] cursor-default'
                      : isPopular
                      ? 'bg-[#D4AF37] hover:bg-[#b8952b] text-black shadow-lg shadow-[#D4AF37]/20 font-bold'
                      : 'bg-[#202020] hover:bg-[#2A2A2A] text-white border border-[rgba(255,255,255,0.12)]'
                  }`}
                >
                  {loadingPlan === planId ? (
                    'Opening Razorpay...'
                  ) : isCurrent ? (
                    'Current Plan'
                  ) : (
                    <>
                      <span>Choose {plan.name}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Extra Voice Minutes & Top-ups Section */}
      <div className="bg-[#141414] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
            <Phone className="w-4 h-4" />
            <span>Need More Voice Capacity?</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-serif font-bold text-white">
            Extra Voice Minutes: ₹9/min with Roll-Over Packs
          </h3>
          <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
            Purchase top-up packs of 100 or 500 minutes anytime. Unlike monthly plan allowances, voice top-ups never expire and roll over indefinitely.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setTopUpModalOpen(true)}
            className="px-5 py-3 rounded-xl bg-[#202020] hover:bg-[#2A2A2A] text-white border border-[#D4AF37]/40 hover:border-[#D4AF37] text-xs font-semibold transition-all cursor-pointer flex items-center gap-2"
          >
            <Zap className="w-4 h-4 text-[#D4AF37]" />
            <span>Top-up Voice Packs</span>
          </button>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="pt-8 space-y-6 max-w-3xl mx-auto">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-gray-400">
            Clear terms, fair policies, and zero lock-in headaches.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="bg-[#141414] border border-[rgba(255,255,255,0.06)] rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left gap-4 cursor-pointer hover:bg-white/[0.02]"
                >
                  <span className="text-sm font-semibold text-white">{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-5 pb-5 text-xs text-gray-400 leading-relaxed border-t border-[rgba(255,255,255,0.04)] pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Voice Top-Up Modal */}
      <VoiceTopUpModal
        isOpen={topUpModalOpen}
        onClose={() => setTopUpModalOpen(false)}
        userEmail={currentUser?.email}
        userName={currentUser?.displayName}
      />

      {/* Login Modal */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onSuccess={() => setLoginModalOpen(false)}
      />
    </div>
  );

  if (isEmbeddedInDashboard) {
    return content;
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col justify-between selection:bg-[#D4AF37]/30 selection:text-white">
      <Navbar onOpenDemo={() => setDemoModalOpen(true)} onOpenLogin={() => setLoginModalOpen(true)} />
      <main className="flex-1">{content}</main>
      <Footer />
      <BookDemoModal isOpen={demoModalOpen} onClose={() => setDemoModalOpen(false)} />
    </div>
  );
};
