import React from 'react';
import { Check, X, Sparkles, Building2 } from 'lucide-react';

interface ComparisonTableProps {
  onOpenDemo: () => void;
}

export const ComparisonTable: React.FC<ComparisonTableProps> = ({ onOpenDemo }) => {
  const features = [
    {
      name: 'Instant Reply Speed',
      samruddhi: '< 10 Seconds (WhatsApp & Call)',
      genericCrm: '15 Mins - 2 Hours (Manual)',
      manual: 'Hours to Next Day',
      highlight: true
    },
    {
      name: 'Multilingual AI Voice Calls',
      samruddhi: 'Native (HI, TN, KA, TE, EN)',
      genericCrm: 'No Voice / English Only SMS',
      manual: 'Limited by Sales Team Skills',
      highlight: true
    },
    {
      name: 'Automated Site Visit Booking',
      samruddhi: 'Instant 24/7 Calendar Sync',
      genericCrm: 'Requires Manual Follow-up',
      manual: 'Manual Phone Tag',
      highlight: false
    },
    {
      name: 'Drip Auto-Follow-Up Sequences',
      samruddhi: 'Autonomous Multi-channel (WA+Voice)',
      genericCrm: 'Basic Email Drips (Low Open Rate)',
      manual: 'Forgotten After Day 2',
      highlight: false
    },
    {
      name: 'AI Lead Scoring & Budget Qualification',
      samruddhi: 'Deep Natural Language Intent Detection',
      genericCrm: 'Static Form Fields Only',
      manual: 'Unstructured Notes / Guesswork',
      highlight: true
    },
    {
      name: 'Ad Creative & ROI Auto-Tracking',
      samruddhi: 'Automated Listing-to-Ad & CPL Sync',
      genericCrm: 'Separate Analytics Tool Needed',
      manual: 'Manual Excel Tracking',
      highlight: false
    },
    {
      name: 'Brochures & Floorplan Sharing',
      samruddhi: 'Instant Automated WhatsApp PDF / Photos',
      genericCrm: 'Manual Email Attachment',
      manual: 'Delayed WhatsApp Send',
      highlight: false
    }
  ];

  return (
    <section id="comparison" className="scroll-mt-28 py-20 bg-transparent relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-950/80 text-teal-200 text-xs font-bold border border-teal-800/80 shadow-md backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Why Top Real Estate Teams Choose Us</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight drop-shadow-md">
            Samruddhi AI vs. <span className="text-amber-400">Traditional Alternatives</span>
          </h2>

          <p className="text-base sm:text-lg text-teal-100">
            See how Samruddhi AI compares against generic CRMs and manual lead follow-up methods across essential sales capabilities.
          </p>
        </div>

        {/* Comparison Table Card */}
        <div className="bg-[#031814]/90 rounded-2xl border border-teal-800/80 shadow-2xl overflow-hidden backdrop-blur-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-teal-900 bg-[#020e0c]/90 text-xs uppercase tracking-wider">
                  <th className="p-5 text-teal-300 font-bold w-2/5">Capabilities & Features</th>
                  <th className="p-5 text-amber-400 font-black bg-teal-950/90 border-x border-teal-800/80 text-center w-1/5 shadow-md">
                    <div className="flex items-center justify-center gap-1.5 text-sm">
                      <Building2 className="w-4 h-4 text-amber-400" />
                      <span>Samruddhi AI</span>
                    </div>
                  </th>
                  <th className="p-5 text-teal-200 font-bold text-center w-1/5">Generic CRM</th>
                  <th className="p-5 text-teal-200 font-bold text-center w-1/5">Manual / WhatsApp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-teal-900/60 text-xs sm:text-sm">
                {features.map((item, index) => (
                  <tr 
                    key={index} 
                    className={`hover:bg-teal-950/50 transition-colors ${
                      item.highlight ? 'bg-teal-950/30' : ''
                    }`}
                  >
                    <td className="p-4 sm:p-5 font-semibold text-white flex items-center gap-2">
                      <span>{item.name}</span>
                    </td>

                    {/* Samruddhi AI Column */}
                    <td className="p-4 sm:p-5 bg-teal-950/80 border-x border-teal-800/80 text-center font-bold text-emerald-300 shadow-inner">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                        <span className="text-amber-300 font-extrabold">{item.samruddhi}</span>
                      </div>
                    </td>

                    {/* Generic CRM Column */}
                    <td className="p-4 sm:p-5 text-center text-teal-200/80">
                      <div className="flex items-center justify-center gap-1.5">
                        <X className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>{item.genericCrm}</span>
                      </div>
                    </td>

                    {/* Manual / WhatsApp Column */}
                    <td className="p-4 sm:p-5 text-center text-teal-200/70">
                      <div className="flex items-center justify-center gap-1.5">
                        <X className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>{item.manual}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Bottom Action Bar */}
          <div className="p-6 bg-[#020e0c]/90 border-t border-teal-900 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-teal-200/90 text-center sm:text-left">
              <span className="font-bold text-amber-400">Result: </span>
              <span>Samruddhi AI delivers 3.4x higher conversion rate from lead ad click to site visit.</span>
            </div>

            <button
              onClick={onOpenDemo}
              className="px-6 py-3 bg-amber-400 hover:bg-amber-300 text-gray-950 font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-400/20 transition-transform transform hover:scale-105 shrink-0"
            >
              Switch to Samruddhi AI Today
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};
