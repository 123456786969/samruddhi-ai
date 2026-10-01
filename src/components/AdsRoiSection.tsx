import React, { useState } from 'react';
import { Megaphone, TrendingUp, BarChart3, Image as ImageIcon, Sparkles, DollarSign, CheckCircle2, ArrowRight } from 'lucide-react';

interface AdsRoiSectionProps {
  onOpenDemo: () => void;
}

export const AdsRoiSection: React.FC<AdsRoiSectionProps> = ({ onOpenDemo }) => {
  const [activeTab, setActiveTab] = useState<'ad-creative' | 'analytics'>('ad-creative');

  // Ad campaign performance metrics
  const monthlyData = [
    { month: 'Month 1', adSpend: '₹50,000', leads: 220, siteVisits: 38, revenue: '₹12,00,000', roi: '24x' },
    { month: 'Month 2', adSpend: '₹1,00,000', leads: 480, siteVisits: 84, revenue: '₹28,00,000', roi: '28x' },
    { month: 'Month 3', adSpend: '₹1,50,000', leads: 760, siteVisits: 142, revenue: '₹48,00,000', roi: '32x' },
  ];

  return (
    <section id="ads-roi" className="scroll-mt-28 py-20 bg-transparent relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-950/80 text-teal-200 text-xs font-bold border border-teal-800/80 shadow-md backdrop-blur-md">
            <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
            <span>Listing-to-Ad Engine & ROI Tracking</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight drop-shadow-md">
            Turn Any Property Listing Into <br className="hidden sm:inline" />
            <span className="text-amber-400">High-ROI Facebook & Google Ads</span>
          </h2>

          <p className="text-base sm:text-lg text-teal-100">
            Upload property details once. Samruddhi AI auto-generates high-converting ad creatives, launches Meta & Google campaigns, and tracks closed revenue down to the rupee.
          </p>
        </div>

        {/* Main Interactive Card Box */}
        <div className="bg-[#031814]/90 rounded-3xl border border-teal-800/80 shadow-2xl overflow-hidden backdrop-blur-xl grid grid-cols-1 lg:grid-cols-12">
          
          {/* Left Column: Property Listing -> Branded Ad Transformation */}
          <div className="lg:col-span-6 p-6 sm:p-10 space-y-6 border-b lg:border-b-0 lg:border-r border-teal-900">
            <div className="flex items-center justify-between border-b border-teal-900 pb-3">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-amber-400" />
                <h3 className="text-xl font-bold text-white">Listing to Ad Generator</h3>
              </div>
              <span className="text-xs bg-amber-400 text-gray-950 font-bold px-2.5 py-1 rounded-full">
                AI Powered
              </span>
            </div>

            {/* Input Property Card */}
            <div className="bg-[#020d0a] p-4 rounded-xl border border-teal-900 space-y-3">
              <span className="text-[11px] font-mono text-teal-300 uppercase tracking-wider block">
                1. Input: Property Listing Details
              </span>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-lg bg-teal-900 overflow-hidden shrink-0 border border-teal-700">
                  <img 
                    src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=300" 
                    alt="Luxury Property" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-1 text-xs">
                  <h4 className="font-bold text-white">Pavilion Grand — 3 BHK Luxury Apartment</h4>
                  <p className="text-teal-200">Sarjapur Road, Bengaluru • ₹1.45 Cr onwards</p>
                  <p className="text-[10px] text-emerald-400 font-semibold">Amenities: Club House, Pool, EV Charging</p>
                </div>
              </div>
            </div>

            {/* AI Arrow Transformation */}
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-400 py-1">
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>Samruddhi AI Auto-Generates Branded Ad Creative in 3 Sec</span>
            </div>

            {/* Output Meta Ad Mockup */}
            <div className="bg-[#18191a] rounded-xl p-4 border border-teal-800 space-y-3 text-white text-xs shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[10px]">
                    P
                  </div>
                  <div>
                    <span className="font-bold text-white block leading-none">Prime Luxury Estates</span>
                    <span className="text-[10px] text-gray-400">Sponsored • Facebook & Instagram</span>
                  </div>
                </div>
                <span className="text-[10px] bg-teal-900 text-teal-200 px-2 py-0.5 rounded">High Intent</span>
              </div>

              <p className="text-gray-200 text-xs leading-relaxed">
                🏡 Looking for 3 BHK Luxury Apartments on Sarjapur Road? Experience premium living at ₹1.45 Cr. Click below to chat directly on WhatsApp & receive instant floorplans!
              </p>

              <div className="relative rounded-lg overflow-hidden border border-gray-700 aspect-video">
                <img 
                  src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=600" 
                  alt="Pavilion Grand Ad"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 bg-black/80 px-2.5 py-1 rounded text-[10px] font-bold text-amber-300">
                  Pavilion Grand | WhatsApp Floorplan
                </div>
              </div>

              <div className="bg-[#242526] p-2.5 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase text-gray-400 block font-semibold">WhatsApp Automation</span>
                  <span className="font-bold text-white text-xs">Chat on WhatsApp & Book Visit</span>
                </div>
                <button className="px-3 py-1.5 bg-[#0084ff] hover:bg-blue-600 font-bold text-white rounded text-xs">
                  Send Message
                </button>
              </div>
            </div>

          </div>

          {/* Right Column: Spend vs Revenue Chart & ROI Analytics */}
          <div className="lg:col-span-6 p-6 sm:p-10 space-y-6 bg-[#020d0a]/90 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-teal-900 pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-xl font-bold text-white">Closed Revenue & ROI Chart</h3>
                </div>
                <span className="text-xs text-teal-300 font-semibold">Real-Time Meta Sync</span>
              </div>

              {/* Spend vs Revenue Visual Chart Bars */}
              <div className="space-y-4">
                <span className="text-xs font-mono text-teal-300 uppercase tracking-wider block">
                  Ad Spend vs Net Closed Revenue Growth
                </span>

                <div className="space-y-3">
                  {monthlyData.map((d, i) => (
                    <div key={i} className="bg-[#031814] p-3.5 rounded-xl border border-teal-900 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-white">{d.month} Campaign</span>
                        <span className="text-amber-400 font-black">{d.roi} ROI</span>
                      </div>

                      {/* Visual Bar Comparison */}
                      <div className="space-y-1.5">
                        {/* Spend Bar */}
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className="text-teal-300 w-20 shrink-0">Ad Spend:</span>
                          <div className="flex-1 bg-teal-950 h-3 rounded-full overflow-hidden">
                            <div 
                              className="bg-rose-500 h-full rounded-full" 
                              style={{ width: `${(i + 1) * 30}%` }}
                            ></div>
                          </div>
                          <span className="font-bold text-rose-300 w-16 text-right">{d.adSpend}</span>
                        </div>

                        {/* Revenue Bar */}
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className="text-teal-300 w-20 shrink-0">Revenue:</span>
                          <div className="flex-1 bg-teal-950 h-3 rounded-full overflow-hidden">
                            <div 
                              className="bg-emerald-400 h-full rounded-full" 
                              style={{ width: `${(i + 1) * 33}%` }}
                            ></div>
                          </div>
                          <span className="font-bold text-emerald-300 w-20 text-right">{d.revenue}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-teal-200/80 pt-1 border-t border-teal-900/60">
                        <span>Leads Generated: <strong className="text-white">{d.leads}</strong></span>
                        <span>Site Visits Booked: <strong className="text-amber-300">{d.siteVisits}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Value Bullet summary */}
              <div className="bg-teal-950/80 p-4 rounded-xl border border-teal-800/80 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>Automatic Lead Attribution to Specific Ad Creatives</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>Syncs directly with Facebook Lead Ads & Google Search Ads</span>
                </div>
              </div>
            </div>

            <button
              onClick={onOpenDemo}
              className="w-full py-4 bg-amber-400 hover:bg-amber-300 text-gray-950 font-extrabold text-base rounded-xl shadow-lg shadow-amber-400/20 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer mt-4"
            >
              <span>Launch High-ROI Ads For Your Listings</span>
              <ArrowRight className="w-5 h-5 text-gray-950" />
            </button>
          </div>

        </div>

      </div>
    </section>
  );
};
