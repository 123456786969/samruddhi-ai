import React from 'react';
import { ShieldCheck, Zap, Server, Lock, Cpu, Clock } from 'lucide-react';

export const SocialProof: React.FC = () => {
  const technicalGuarantees = [
    {
      icon: Clock,
      title: '< 15 Seconds',
      label: 'Instant Webhook Response',
      desc: 'Meta, Google, and website ad enquiries are processed and engaged immediately.'
    },
    {
      icon: Server,
      title: '99.99%',
      label: 'Telephony Node SLA',
      desc: 'High-availability multi-region WebRTC telephony clusters with zero queue bottleneck.'
    },
    {
      icon: Lock,
      title: 'Bank-Grade',
      label: 'Data Privacy & Security',
      desc: 'End-to-end encrypted lead databases, automated PII masking, and RERA compliance.'
    }
  ];

  return (
    <section id="specifications" className="scroll-mt-28 py-16 bg-transparent text-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Title */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
            Production-Grade <span className="text-[#D4AF37]">Infrastructure Guarantees</span>
          </h2>
          <p className="text-sm sm:text-base text-zinc-400">
            Real enterprise architecture metrics and verified SLAs built for high-volume Indian real estate launches.
          </p>
        </div>

        {/* Technical Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {technicalGuarantees.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div 
                key={idx}
                className="bg-[#0e0e12]/80 p-6 rounded-2xl border border-white/[0.08] shadow-xl text-center space-y-2 backdrop-blur-xl"
              >
                <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 text-[#D4AF37] flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-3xl sm:text-4xl font-mono font-bold text-[#D4AF37] tracking-tight block">
                  {item.title}
                </span>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  {item.label}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed pt-1">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
