import React, { useState } from 'react';
import { Calculator, TrendingUp, Sparkles, CheckCircle, ArrowRight, DollarSign, Building2, HelpCircle, Layers } from 'lucide-react';
import { PropertyGrowthRoiVisualizer } from './dashboard/PropertyGrowthRoiVisualizer';

interface RoiCalculatorProps {
  onOpenDemoWithLeads: (leads: number) => void;
}

export const RoiCalculator: React.FC<RoiCalculatorProps> = ({ onOpenDemoWithLeads }) => {
  const [calcMode, setCalcMode] = useState<'leads' | 'property'>('leads');
  const [monthlyLeads, setMonthlyLeads] = useState<number>(400);
  const [commissionLakhs, setCommissionLakhs] = useState<number>(2.5); // ₹2.5 Lakhs average commission per deal
  const [leadsLostPercent, setLeadsLostPercent] = useState<number>(50); // 50% leads lost due to slow follow-up

  // Calculations
  // Lost leads per month
  const lostLeadsMonthly = Math.round(monthlyLeads * (leadsLostPercent / 100));
  
  // With Samruddhi AI, we recover ~40% of those lost leads through instant <10s WhatsApp + Multilingual AI Voice
  const recoveredLeadsMonthly = Math.round(lostLeadsMonthly * 0.40);
  
  // Assuming 10% site visit & deal conversion on recovered leads
  const extraDealsMonthly = Number((recoveredLeadsMonthly * 0.08).toFixed(1));
  const extraDealsAnnual = Number((extraDealsMonthly * 12).toFixed(1));

  // Recovered revenue per year in Lakhs & Crores
  const annualRecoveredLakhs = Math.round(extraDealsAnnual * commissionLakhs);
  const annualRecoveredCrores = (annualRecoveredLakhs / 100).toFixed(2);

  // Samruddhi AI estimated monthly cost
  const estimatedCost = monthlyLeads > 1000 ? 63999 : monthlyLeads > 300 ? 27999 : 11999;
  const annualCost = estimatedCost * 12;
  const roiMultiplier = Math.max(8, Math.round((annualRecoveredLakhs * 100000) / annualCost));

  return (
    <section id="roi-calculator" className="scroll-mt-28 py-20 bg-transparent relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-950/80 text-teal-200 text-xs font-bold border border-teal-800/80 shadow-md backdrop-blur-md">
            <Calculator className="w-3.5 h-3.5 text-amber-400" />
            <span>Interactive Real Estate ROI & Growth Calculators</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight drop-shadow-md">
            Calculate Your <span className="text-amber-400">Financial Returns & Growth</span>
          </h2>

          <p className="text-base sm:text-lg text-teal-100">
            Model how Samruddhi AI multiplies brokerage commissions, or simulate long-term compounded wealth and rental appreciation for property investments.
          </p>

          {/* Calculator Mode Switcher */}
          <div className="inline-flex p-1.5 bg-black/60 border border-teal-800/70 rounded-2xl gap-2 mt-4 shadow-xl">
            <button
              onClick={() => setCalcMode('leads')}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                calcMode === 'leads'
                  ? 'bg-amber-400 text-gray-950 shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Brokerage & Ad Lead Recovery</span>
            </button>
            <button
              onClick={() => setCalcMode('property')}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                calcMode === 'property'
                  ? 'bg-amber-400 text-gray-950 shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Property Appreciation & Rental Growth</span>
            </button>
          </div>
        </div>

        {calcMode === 'property' ? (
          <PropertyGrowthRoiVisualizer />
        ) : (
          /* Calculator Widget Box */
          <div className="bg-[#031814]/85 rounded-2xl border border-teal-800/80 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 backdrop-blur-xl">
          
          {/* Controls Column */}
          <div className="lg:col-span-7 p-6 sm:p-10 space-y-8 bg-[#020d0a]/90 border-b lg:border-b-0 lg:border-r border-teal-900">
            <div className="flex items-center justify-between border-b border-teal-900/80 pb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-400" />
                <span>Your Lead & Sales Metrics</span>
              </h3>
              <span className="text-xs text-teal-300 font-semibold">Adjust sliders to calculate</span>
            </div>

            {/* Slider 1: Monthly Lead Volume */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm font-bold">
                <label className="text-white flex items-center gap-1.5">
                  Leads Per Month
                  <span className="text-teal-300/70 text-xs font-normal">(Meta & Google Ads)</span>
                </label>
                <span className="text-amber-400 text-lg font-black bg-teal-950 px-3 py-1 rounded-lg border border-teal-800">
                  {monthlyLeads} Leads / Mo
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="2000"
                step="50"
                value={monthlyLeads}
                onChange={(e) => setMonthlyLeads(Number(e.target.value))}
                className="w-full h-2.5 bg-teal-950 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
              <div className="flex justify-between text-[11px] text-teal-400 font-semibold">
                <span>50 Leads</span>
                <span>500 Leads</span>
                <span>2,000+ Leads</span>
              </div>
            </div>

            {/* Slider 2: Average Commission Per Deal */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm font-bold">
                <label className="text-white flex items-center gap-1.5">
                  Average Commission / Profit Per Deal
                </label>
                <span className="text-amber-400 text-lg font-black bg-teal-950 px-3 py-1 rounded-lg border border-teal-800">
                  ₹{commissionLakhs} Lakhs
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="10"
                step="0.5"
                value={commissionLakhs}
                onChange={(e) => setCommissionLakhs(Number(e.target.value))}
                className="w-full h-2.5 bg-teal-950 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
              <div className="flex justify-between text-[11px] text-teal-400 font-semibold">
                <span>₹50,000</span>
                <span>₹2.5 Lakhs</span>
                <span>₹10 Lakhs+</span>
              </div>
            </div>

            {/* Slider 3: % of Leads Lost Due to Slow Follow-up */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm font-bold">
                <label className="text-white flex items-center gap-1.5">
                  % of Leads Currently Lost / Uncontacted
                </label>
                <span className="text-rose-400 text-lg font-black bg-teal-950 px-3 py-1 rounded-lg border border-teal-800">
                  {leadsLostPercent}% Leakage
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="80"
                step="5"
                value={leadsLostPercent}
                onChange={(e) => setLeadsLostPercent(Number(e.target.value))}
                className="w-full h-2.5 bg-teal-950 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
              <div className="flex justify-between text-[11px] text-teal-400 font-semibold">
                <span>20% (Low)</span>
                <span>50% (Industry Average)</span>
                <span>80% (High Leakage)</span>
              </div>
            </div>

            <div className="p-4 bg-teal-950/80 rounded-xl border border-teal-800/80 text-xs text-teal-200 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-amber-400 shrink-0" />
              <span>Based on benchmark data from 120+ active real estate developer campaigns in India.</span>
            </div>
          </div>

          {/* Results Output Column */}
          <div className="lg:col-span-5 bg-[#020e0c] text-white p-6 sm:p-10 flex flex-col justify-between gap-6 relative border-t lg:border-t-0 lg:border-l border-teal-900">
            
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-teal-900 pb-3">
                <span className="text-xs font-mono text-teal-300">ANNUAL RECOVERED REVENUE</span>
                <span className="text-xs bg-amber-400 text-gray-950 font-bold px-2.5 py-0.5 rounded-full">
                  {roiMultiplier}x Estimated ROI
                </span>
              </div>

              {/* Highlight Numbers */}
              <div className="space-y-4">
                <div className="bg-teal-950/80 p-4 rounded-xl border border-teal-800/80">
                  <span className="text-xs text-teal-300 font-semibold block uppercase tracking-wider">
                    Potential Recovered Revenue / Year
                  </span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-3xl font-black text-amber-400">
                      ₹{annualRecoveredLakhs >= 100 ? `${annualRecoveredCrores} Cr` : `${annualRecoveredLakhs} Lakhs`}
                    </span>
                    <span className="text-xs text-emerald-400 font-bold">/ Year</span>
                  </div>
                  <p className="text-[11px] text-teal-200/80 mt-1">
                    By recovering <strong className="text-white">{recoveredLeadsMonthly} lost leads/mo</strong> with instant WhatsApp & Voice AI.
                  </p>
                </div>

                <div className="bg-teal-950/80 p-4 rounded-xl border border-teal-800/80">
                  <span className="text-xs text-teal-300 font-semibold block uppercase tracking-wider">
                    Additional Closed Deals / Year
                  </span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-3xl font-black text-white">
                      +{extraDealsAnnual} Deals
                    </span>
                    <span className="text-xs text-amber-400 font-bold">+{extraDealsMonthly}/mo</span>
                  </div>
                  <p className="text-[11px] text-teal-200/80 mt-1">
                    At ₹{commissionLakhs} Lakhs average commission per booking.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-teal-900 space-y-3">
              <button
                onClick={() => onOpenDemoWithLeads(monthlyLeads)}
                className="w-full py-4 bg-amber-400 hover:bg-amber-300 text-gray-950 font-extrabold text-base rounded-xl shadow-lg shadow-amber-400/20 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Recover My Lost Revenue Now</span>
                <ArrowRight className="w-5 h-5 text-gray-950" />
              </button>

              <p className="text-[11px] text-center text-teal-300/70">
                Guaranteed lead response SLA included in all developer contracts.
              </p>
            </div>

          </div>

        </div>
        )}

      </div>
    </section>
  );
};
