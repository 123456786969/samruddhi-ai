import React, { useState } from 'react';
import { 
  ArrowRight, 
  Building2, 
  Flame, 
  Zap, 
  Sparkles 
} from 'lucide-react';

interface RoiCalculatorProps {
  onOpenDemoWithLeads: (leads: number) => void;
}

export const RoiCalculator: React.FC<RoiCalculatorProps> = ({ onOpenDemoWithLeads }) => {
  // Fine-grained state with granular step control
  const [monthlyLeads, setMonthlyLeads] = useState<number>(450);
  const [commissionLakhs, setCommissionLakhs] = useState<number>(3.0); // ₹3 Lakhs avg commission per deal
  const [leadsLostPercent, setLeadsLostPercent] = useState<number>(50); // 50% industry benchmark leakage
  const leadSourceCost = 850; // Average CPL in INR on Meta/Google

  // Mathematical Projections
  // 1. Monthly Leads that leak out / drop off because follow-up took >15 minutes
  const monthlyLeakedLeads = Math.round(monthlyLeads * (leadsLostPercent / 100));
  const annualLeakedLeads = monthlyLeakedLeads * 12;

  // 2. Wasted Monthly Ad Spend burning on leaked leads
  const monthlyWastedAdSpend = monthlyLeakedLeads * leadSourceCost;

  // 3. Autonomous Instant Recovery (Samruddhi AI calls within <15s + sends WhatsApp brochure in 8s)
  // Conservatively recaptures 42% of otherwise dead leads
  const monthlyRecoveredLeads = Math.round(monthlyLeakedLeads * 0.42);

  // 4. Recovered weekend site visits (approx. 28% of recaptured high-intent buyers visit site)
  const monthlySiteVisits = Math.round(monthlyRecoveredLeads * 0.28);
  const annualSiteVisits = monthlySiteVisits * 12;

  // 5. Additional closed deals resulting from recovered site visits (8.5% conversion on site visits)
  const monthlyDeals = Number((monthlyRecoveredLeads * 0.085).toFixed(1));
  const annualDeals = Math.round(monthlyDeals * 12);

  // 6. Annual Recovered Brokerage / Profit Revenue
  const annualRecoveredLakhs = Math.round(annualDeals * commissionLakhs);
  const annualRecoveredCrores = (annualRecoveredLakhs / 100).toFixed(2);

  // 7. Estimated Cost & Multiple
  const estimatedMonthlyCost = monthlyLeads > 2000 ? 54899 : monthlyLeads > 500 ? 37799 : 6999;
  const annualCost = estimatedMonthlyCost * 12;
  const roiMultiplier = Math.max(7, Math.round((annualRecoveredLakhs * 100000) / annualCost));

  return (
    <section id="roi-calculator" className="scroll-mt-28 py-16 bg-[#0A0A0A] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950/40 border border-rose-500/30 text-rose-400 text-xs font-mono">
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            <span>REAL ESTATE LEAD LEAKAGE AUDIT</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-extrabold text-[#F4F4F5] tracking-tight">
            Lead Leakage &amp; <span className="italic text-[#D4AF37]">Revenue Recovery</span> Calculator
          </h2>

          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
            Real estate buyer intent drops by 80% after 15 minutes. Calculate how much brokerage commission you are silently losing to delayed follow-ups — and how much Samruddhi AI's &lt;15-second autonomous calling restores.
          </p>
        </div>

        {/* Lead Leakage Interactive Workstation - Seamlessly matching page background */}
        <div className="bg-[#0A0A0C] rounded-3xl border border-white/[0.08] shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          
          {/* Controls Column (7 Cols) */}
          <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 space-y-8 bg-[#0A0A0C] border-b lg:border-b-0 lg:border-r border-white/[0.08]">
            
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-base sm:text-lg">
                <Building2 className="w-5 h-5 text-[#D4AF37]" />
                <span>Campaign &amp; Sales Metrics</span>
              </div>
              <span className="text-xs font-mono text-zinc-500">Fine-Grained Sliders (Step ±10)</span>
            </div>

            {/* Metric 1: Monthly Inbound Leads (Step 10 for fine control) */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs sm:text-sm font-semibold">
                <label className="text-white flex items-center gap-2">
                  <span>Monthly Inbound Ad Leads</span>
                  <span className="text-zinc-500 text-xs font-mono">(Meta, Google, 99acres)</span>
                </label>
                <span className="text-[#D4AF37] font-mono text-base font-bold bg-white/[0.04] px-3.5 py-1 rounded-xl border border-white/[0.08]">
                  {monthlyLeads.toLocaleString()} Leads / Mo
                </span>
              </div>

              <input
                type="range"
                min="10"
                max="4000"
                step="10"
                value={monthlyLeads}
                onChange={(e) => setMonthlyLeads(Number(e.target.value))}
                className="w-full h-2 bg-white/[0.1] rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
              />

              <div className="flex justify-between text-[11px] text-zinc-500 font-mono">
                <span>10 Leads</span>
                <span>1,000 Leads</span>
                <span>2,500 Leads</span>
                <span>4,000+ Leads</span>
              </div>
            </div>

            {/* Metric 2: Average Commission Per Booking (Clean, fine-grained control) */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs sm:text-sm font-semibold">
                <label className="text-white flex items-center gap-2">
                  <span>Average Commission / Deal Margin</span>
                  <span className="text-zinc-500 text-xs font-mono">(Net Profit)</span>
                </label>
                <span className="text-[#D4AF37] font-mono text-base font-bold bg-white/[0.04] px-3.5 py-1 rounded-xl border border-white/[0.08]">
                  ₹{commissionLakhs.toFixed(1)} Lakhs
                </span>
              </div>

              <input
                type="range"
                min="0.5"
                max="20"
                step="0.1"
                value={commissionLakhs}
                onChange={(e) => setCommissionLakhs(Number(e.target.value))}
                className="w-full h-2 bg-white/[0.1] rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
              />

              <div className="flex justify-between text-[11px] text-zinc-500 font-mono">
                <span>₹50,000</span>
                <span>₹5 Lakhs</span>
                <span>₹10 Lakhs</span>
                <span>₹20 Lakhs</span>
              </div>
            </div>

            {/* Metric 3: Current Lead Leakage Rate (Granular Step 1%) */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs sm:text-sm font-semibold">
                <label className="text-white flex items-center gap-2">
                  <span className="text-rose-400">Current Lead Leakage Rate</span>
                  <span className="text-zinc-500 text-xs font-mono">(Uncontacted / Delayed)</span>
                </label>
                <span className="text-rose-400 font-mono text-base font-bold bg-rose-950/30 px-3.5 py-1 rounded-xl border border-rose-500/30">
                  {leadsLostPercent}% Leaked
                </span>
              </div>

              <input
                type="range"
                min="10"
                max="85"
                step="1"
                value={leadsLostPercent}
                onChange={(e) => setLeadsLostPercent(Number(e.target.value))}
                className="w-full h-2 bg-white/[0.1] rounded-lg appearance-none cursor-pointer accent-rose-500"
              />

              <div className="flex justify-between text-[11px] text-zinc-500 font-mono">
                <span>10% (Low Loss)</span>
                <span>50% (Industry Benchmark)</span>
                <span>85% (Severe Leakage)</span>
              </div>
            </div>

            {/* The Leakage Diagnostic Strip */}
            <div className="p-4 rounded-2xl bg-[#0E0E12] border border-white/[0.06] grid grid-cols-2 gap-4 text-xs font-mono">
              <div className="space-y-1">
                <span className="text-zinc-400 block text-[11px]">Monthly Leaked Enquiries:</span>
                <span className="text-rose-400 text-lg font-bold">
                  {monthlyLeakedLeads} Leads / Mo
                </span>
                <span className="text-[10px] text-zinc-500 block">({annualLeakedLeads.toLocaleString()} / year lost)</span>
              </div>

              <div className="space-y-1">
                <span className="text-zinc-400 block text-[11px]">Wasted Ad Budget Leaking:</span>
                <span className="text-[#D4AF37] text-lg font-bold">
                  ₹{(monthlyWastedAdSpend / 100000).toFixed(2)} Lakhs / Mo
                </span>
                <span className="text-[10px] text-zinc-500 block">(Burned on cold leads)</span>
              </div>
            </div>

          </div>

          {/* Results Output Column (5 Cols) */}
          <div className="lg:col-span-5 bg-[#0E0E12] text-white p-6 sm:p-8 lg:p-10 flex flex-col justify-between gap-6 relative border-t lg:border-t-0">
            
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                  RECOVERED ANNUAL BROKERAGE
                </span>
                <span className="text-xs bg-[#D4AF37] text-black font-extrabold px-3 py-0.5 rounded-full shadow-sm">
                  {roiMultiplier}x Net ROI
                </span>
              </div>

              {/* Major Value Highlight Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#D4AF37]/15 via-white/[0.02] to-transparent border border-[#D4AF37]/30 space-y-2">
                <span className="text-xs font-mono uppercase text-[#D4AF37] font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                  <span>Annual Recovered Commission</span>
                </span>
                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-3xl sm:text-4xl lg:text-5xl font-serif font-extrabold text-white tracking-tight">
                    ₹{annualRecoveredLakhs >= 100 ? `${annualRecoveredCrores} Cr` : `${annualRecoveredLakhs} Lakhs`}
                  </span>
                  <span className="text-xs font-mono text-emerald-400 font-bold">/ Year</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed pt-1">
                  Recapturing <strong className="text-white">{monthlyRecoveredLeads} high-intent leads/mo</strong> via &lt;15-sec instant autonomous calling.
                </p>
              </div>

              {/* Secondary Recovered Performance Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1">
                  <span className="text-[10.5px] font-mono text-zinc-400 uppercase block">Extra Site Visits</span>
                  <span className="text-xl sm:text-2xl font-mono font-bold text-emerald-400 block">
                    +{annualSiteVisits}
                  </span>
                  <span className="text-[10px] text-zinc-500">+{monthlySiteVisits} visits booked / mo</span>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1">
                  <span className="text-[10.5px] font-mono text-zinc-400 uppercase block">Extra Closed Deals</span>
                  <span className="text-xl sm:text-2xl font-mono font-bold text-[#D4AF37] block">
                    +{annualDeals} Deals
                  </span>
                  <span className="text-[10px] text-zinc-500">+{monthlyDeals} bookings / mo</span>
                </div>
              </div>

              {/* Response Speed Comparison Mini-Card */}
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] text-xs space-y-2 font-mono">
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Traditional Broker Delay:</span>
                  <span className="text-rose-400 font-bold">45 - 120 Mins (Cold)</span>
                </div>
                <div className="flex items-center justify-between text-zinc-200">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Samruddhi AI Telephony:</span>
                  </span>
                  <span className="text-emerald-400 font-bold">&lt; 15 Seconds (Instant)</span>
                </div>
              </div>
            </div>

            {/* CTA Trigger */}
            <div className="pt-2 space-y-2.5">
              <button
                onClick={() => onOpenDemoWithLeads(monthlyLeads)}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] hover:from-[#e5c358] hover:to-[#ffeeb3] text-black font-extrabold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-[#D4AF37]/15 transition-all transform active:scale-98 cursor-pointer"
              >
                <span>Recover My Lost Revenue Now</span>
                <ArrowRight className="w-4 h-4 text-black" />
              </button>
              <p className="text-[10.5px] text-center text-zinc-500 font-mono">
                Zero onboarding friction • Connects directly to Meta, Google &amp; CRM webhooks
              </p>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
