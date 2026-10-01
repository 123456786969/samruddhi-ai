import React from 'react';
import { Sparkles, ArrowRight, ShieldCheck, Building2, PhoneCall } from 'lucide-react';

interface FinalCtaProps {
  onOpenDemo: () => void;
}

export const FinalCta: React.FC<FinalCtaProps> = ({ onOpenDemo }) => {
  return (
    <section className="py-20 bg-gradient-to-br from-[#020b08]/90 via-[#031814]/90 to-[#010907]/90 backdrop-blur-xl text-white relative overflow-hidden border-t border-teal-900/80">
      {/* Decorative Lights */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-8">
        
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-950/80 text-amber-300 text-xs font-bold border border-teal-800">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Transform Your Sales Funnel In Under 24 Hours</span>
        </div>

        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
          Ready to scale your <br className="hidden sm:inline" />
          <span className="text-amber-400">real estate sales?</span>
        </h2>

        <p className="text-base sm:text-xl text-teal-100 max-w-2xl mx-auto font-normal leading-relaxed">
          Join 120+ top builders and channel partners already booking 40% more site visits with zero extra ad spend.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onOpenDemo}
            className="w-full sm:w-auto px-9 py-4 bg-amber-400 hover:bg-amber-300 text-gray-950 font-black text-lg rounded-xl shadow-2xl shadow-amber-400/20 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3 cursor-pointer group"
          >
            <span>Start Free</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={onOpenDemo}
            className="w-full sm:w-auto px-8 py-4 bg-[#05221c]/90 hover:bg-[#072f27] text-teal-100 font-bold text-lg rounded-xl border border-teal-700/80 shadow-lg backdrop-blur-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Book a Demo</span>
          </button>
        </div>

        <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-teal-200">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Zero Setup Fee Guarantee</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-amber-400" />
            <span>Integrates with All Major CRMs</span>
          </span>
          <span className="flex items-center gap-1.5">
            <PhoneCall className="w-4 h-4 text-amber-400" />
            <span>24/7 Dedicated Support</span>
          </span>
        </div>

      </div>
    </section>
  );
};
