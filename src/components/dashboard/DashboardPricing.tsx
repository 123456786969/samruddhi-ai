import React, { useState, useEffect } from 'react';
import { PricingPage } from '../pricing/PricingPage';
import {
  Sparkles,
  Phone,
  Users,
  CheckCircle2,
  AlertCircle,
  Zap,
  Calendar,
  Clock,
  Shield,
  Loader2,
} from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { apiFetch } from '../../lib/api';
import { VoiceTopUpModal } from './VoiceTopUpModal';
import { formatINR } from '../../shared/plans';

export const DashboardPricing: React.FC = () => {
  const { user } = useOutletContext<{ user: any; userData: any }>();
  const [planStatus, setPlanStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [topUpModalOpen, setTopUpModalOpen] = useState(false);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/api/billing/status');
      setPlanStatus(data);
    } catch (e) {
      console.warn('Could not fetch billing status:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.uid) {
      fetchStatus();
    }
  }, [user]);

  const renewalDate = planStatus?.current_period_end
    ? new Date(planStatus.current_period_end).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'No active renewal';

  const planName = planStatus?.plan?.name || (planStatus?.status === 'active' ? 'Active Plan' : 'Free / No Plan');
  const leadsUsed = planStatus?.usage?.leads ?? 0;
  const leadsLimit = planStatus?.limits?.leadsPerMonth ?? 0;
  const leadsPct = leadsLimit > 0 ? Math.min(100, Math.round((leadsUsed / leadsLimit) * 100)) : 0;

  const voiceUsed = planStatus?.usage?.voiceMinutes ?? 0;
  const voiceLimit = planStatus?.limits?.voiceMinutesPerMonth ?? 0;
  const voiceTopUp = planStatus?.remaining?.voiceTopUp ?? 0;
  const voiceRemaining = planStatus?.remaining?.voiceMinutes ?? 0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-crm-sans text-[#F4F4F5]">
      {/* Current Quota & Plan Overview Banner */}
      <div className="bg-[#141414] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6 sm:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30">
              Subscription & Usage Overview
            </span>
            {planStatus?.status === 'active' ? (
              <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Active Subscription
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-amber-400 font-semibold">
                <AlertCircle className="w-3.5 h-3.5" /> Subscription Inactive
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
            Plans & Usage Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 max-w-xl">
            Monitor real-time lead limits, AI voice minute allowances, and instant roll-over top-ups.
          </p>
        </div>

        {/* Current Plan Summary Pill */}
        <div className="bg-[#1A1A1A] border border-[rgba(255,255,255,0.06)] rounded-xl p-4 flex items-center gap-6 text-xs font-crm-mono shrink-0">
          <div>
            <span className="text-gray-500 block text-[10px] uppercase font-bold tracking-wider">
              Current Tier
            </span>
            <span className="text-base font-serif font-bold text-white">
              {planName}
            </span>
          </div>
          <div className="border-l border-[rgba(255,255,255,0.08)] pl-6">
            <span className="text-gray-500 block text-[10px] uppercase font-bold tracking-wider">
              Cycle Renewal
            </span>
            <span className="text-sm font-semibold text-[#D4AF37]">
              {renewalDate}
            </span>
          </div>
        </div>
      </div>

      {/* Usage Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Leads Usage */}
        <div className="bg-[#141414] border border-[rgba(255,255,255,0.06)] rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-semibold text-xs">
              <Users className="w-4 h-4 text-[#D4AF37]" />
              <span>Monthly CRM Leads</span>
            </div>
            <span className="text-xs font-crm-mono text-gray-400">
              {leadsUsed} / {leadsLimit} leads ({leadsPct}%)
            </span>
          </div>
          <div className="w-full h-2 bg-[#202020] rounded-full overflow-hidden border border-[rgba(255,255,255,0.06)]">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                leadsPct >= 100 ? 'bg-amber-400' : 'bg-[#D4AF37]'
              }`}
              style={{ width: `${leadsPct}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[11px] text-gray-400 pt-1">
            <span>
              {Math.max(0, leadsLimit - leadsUsed)} leads remaining this billing cycle
            </span>
            {leadsPct >= 100 && (
              <span className="text-amber-400 font-semibold">
                Limit reached • Automation paused
              </span>
            )}
          </div>
        </div>

        {/* AI Voice Minutes Quota */}
        <div className="bg-[#141414] border border-[rgba(255,255,255,0.06)] rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-semibold text-xs">
              <Phone className="w-4 h-4 text-[#D4AF37]" />
              <span>AI Voice Minutes Balance</span>
            </div>
            <span className="text-xs font-crm-mono text-gray-400">
              {voiceUsed} mins used • {voiceRemaining} mins left
            </span>
          </div>
          <div className="w-full h-2 bg-[#202020] rounded-full overflow-hidden border border-[rgba(255,255,255,0.06)]">
            <div
              className="h-full bg-gradient-to-r from-[#D4AF37] to-amber-200 rounded-full transition-all duration-300"
              style={{
                width: `${
                  voiceLimit > 0
                    ? Math.min(100, Math.round((voiceUsed / voiceLimit) * 100))
                    : 0
                }%`,
              }}
            />
          </div>
          <div className="flex justify-between items-center text-[11px] text-gray-400 pt-1">
            <span>
              Allowance: {Math.max(0, voiceLimit - voiceUsed)}m | Top-up pack: {voiceTopUp}m
            </span>
            <button
              onClick={() => setTopUpModalOpen(true)}
              className="text-[#D4AF37] hover:text-amber-300 font-semibold cursor-pointer hover:underline flex items-center gap-1"
            >
              <Zap className="w-3 h-3" />
              <span>+ Top-up Minutes</span>
            </button>
          </div>
        </div>
      </div>

      {/* Embedded Pricing Section */}
      <div className="pt-4 border-t border-[rgba(255,255,255,0.06)]">
        <PricingPage isEmbeddedInDashboard={true} />
      </div>

      {/* Top-Up Modal */}
      <VoiceTopUpModal
        isOpen={topUpModalOpen}
        onClose={() => setTopUpModalOpen(false)}
        onSuccess={() => fetchStatus()}
        userEmail={user?.email}
        userName={user?.displayName}
      />
    </div>
  );
};
