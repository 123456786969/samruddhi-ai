import React from 'react';
import { ShieldCheck, Star, Building2, TrendingUp, Award, Quote, CheckCircle2 } from 'lucide-react';
import { TESTIMONIALS } from '../data/mockData';
import { SafeAvatar } from './common/SafeAvatar';

export const SocialProof: React.FC = () => {
  return (
    <section id="testimonials" className="scroll-mt-28 py-20 bg-transparent text-white relative overflow-hidden">
      {/* Background Decorative Pattern */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-teal-800/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-900/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Title */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-950/80 text-teal-200 text-xs font-bold border border-teal-800/80 shadow-md backdrop-blur-md">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>Trusted By India's Top Real Estate Builders</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            Proven Results Across <span className="text-amber-400">120+ Active Projects</span>
          </h2>

          <p className="text-base sm:text-lg text-teal-100">
            See how leading developers and channel partners are transforming their weekend site visits and ad ROI.
          </p>
        </div>

        {/* Dynamic Metric Counter Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          
          <div className="bg-[#031814]/85 p-8 rounded-2xl border border-teal-800/80 shadow-xl text-center space-y-2 hover:border-amber-400/50 transition-colors backdrop-blur-xl">
            <span className="text-4xl sm:text-5xl font-black text-amber-400 tracking-tight block">
              10,000+
            </span>
            <h3 className="text-lg font-bold text-white">
              Leads Qualified Automatically
            </h3>
            <p className="text-xs text-teal-200">
              Verified for budget, timeline, and location preference before broker handover.
            </p>
          </div>

          <div className="bg-[#031814]/85 p-8 rounded-2xl border border-teal-800/80 shadow-xl text-center space-y-2 hover:border-amber-400/50 transition-colors backdrop-blur-xl">
            <span className="text-4xl sm:text-5xl font-black text-emerald-400 tracking-tight block">
              40%
            </span>
            <h3 className="text-lg font-bold text-white">
              Increase in Site Visits
            </h3>
            <p className="text-xs text-teal-200">
              Instant WhatsApp and AI phone call reminders eliminate non-shows.
            </p>
          </div>

          <div className="bg-[#031814]/85 p-8 rounded-2xl border border-teal-800/80 shadow-xl text-center space-y-2 hover:border-amber-400/50 transition-colors backdrop-blur-xl">
            <span className="text-4xl sm:text-5xl font-black text-amber-300 tracking-tight block">
              0 Minutes
            </span>
            <h3 className="text-lg font-bold text-white">
              Response Time
            </h3>
            <p className="text-xs text-teal-200">
              24/7 autonomous engagement in under 10 seconds day or night.
            </p>
          </div>

        </div>

        {/* Builder Testimonials Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {TESTIMONIALS.map((t) => (
            <div 
              key={t.id}
              className="bg-[#031814]/90 text-white rounded-2xl p-6 sm:p-8 border border-teal-800/80 shadow-2xl flex flex-col justify-between gap-6 relative backdrop-blur-xl"
            >
              <div className="space-y-4">
                {/* Metric Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs font-bold">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t.metrics}</span>
                </div>

                {/* Rating Stars */}
                <div className="flex gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>

                <Quote className="w-8 h-8 text-teal-500/20" />

                <p className="text-sm text-teal-100 leading-relaxed font-normal">
                  "{t.quote}"
                </p>
              </div>

              {/* Author Footer */}
              <div className="pt-4 border-t border-teal-900 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-amber-400 flex-shrink-0 bg-teal-950 flex items-center justify-center">
                  <SafeAvatar
                    src={t.avatar}
                    alt={t.name}
                    name={t.name}
                    fallbackSeed={`testimonial-${t.id}`}
                    className="w-full h-full"
                  />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">{t.name}</h4>
                  <p className="text-xs text-teal-300">{t.role}</p>
                  <span className="text-[11px] font-semibold text-amber-400">{t.company}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Ecosystem & Channel Partner Network Ribbon */}
        <div className="mt-16 pt-12 border-t border-teal-800 text-center space-y-6">
          <p className="text-xs font-semibold tracking-widest uppercase text-teal-200">
            Engineered For Modern Real Estate Channel Partners & Regional Developer Sales Teams
          </p>

          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 opacity-90">
            {[
              'Independent Real Estate Brokers',
              'Regional Channel Partner Networks',
              'LeadSquared & Farvision ERPs',
              'Meta & 99acres Marketing Teams',
              'RERA-Registered Consultancies'
            ].map((partner) => (
              <div key={partner} className="flex items-center gap-2 text-xs sm:text-sm font-bold text-teal-100 tracking-wide hover:text-amber-300 transition-colors bg-teal-950/60 px-4 py-2 rounded-xl border border-teal-800/60">
                <Building2 className="w-4 h-4 text-[#ffb300]" />
                <span>{partner}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};
