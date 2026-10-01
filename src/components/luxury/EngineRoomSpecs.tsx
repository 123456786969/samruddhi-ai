import React from 'react';
import { motion } from 'motion/react';
import { Cpu, Globe2, Shield, Zap, Server, Network, Gauge, Terminal } from 'lucide-react';

export const EngineRoomSpecs: React.FC = () => {
  const specs = [
    {
      metric: '418 ms',
      label: 'End-to-End Voice Latency',
      subtext: 'Neural inference + ASR + TTS pipeline (99.8th percentile SLA)',
      icon: Gauge
    },
    {
      metric: '7 Dialects',
      label: 'Regional Indian Models',
      subtext: 'Native phonetic intonation: EN, HI, KN, TA, TE, ML, MR',
      icon: Globe2
    },
    {
      metric: '< 15 Sec',
      label: 'Ad Lead Dial Speed',
      subtext: 'Automated Meta & Google Webhook instant call triggering',
      icon: Zap
    },
    {
      metric: '99.99%',
      label: 'Telephony Uptime SLA',
      subtext: 'Multi-region redundancy via Google Cloud Spanner & WebRTC',
      icon: Server
    },
    {
      metric: '10,000+',
      label: 'Concurrent Streams',
      subtext: 'Elastic scale handling high-traffic weekend property launches',
      icon: Network
    },
    {
      metric: 'SOC-2 / ISO',
      label: 'Bank-Grade Privacy',
      subtext: 'Encrypted call logs, PII data masking, and RERA compliance',
      icon: Shield
    }
  ];

  return (
    <section id="engine-room" className="relative py-24 px-4 sm:px-6 bg-[#0A0A0C]">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Section Header */}
        <div className="space-y-4 max-w-2xl">
          <div className="font-mono text-xs uppercase tracking-[0.25em] text-[#D4AF37] flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5" />
            <span>[ Technical Architecture & Telemetry ]</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-[#F4F4F5]">
            The Engine Room.
          </h2>
          <p className="text-[#A1A1AA] text-sm md:text-base leading-relaxed">
            Engineered from silicon to software for zero-latency Indian real estate communication. No third-party wrappers, no robotic delays.
          </p>
        </div>

        {/* Brutalist Hairline Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-t border-l border-white/[0.08]">
          {specs.map((spec, idx) => {
            const IconComponent = spec.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08, duration: 0.5 }}
                className="p-8 md:p-10 border-r border-b border-white/[0.08] bg-[#0E0E11]/40 hover:bg-[#141418]/80 transition-colors group relative"
              >
                <div className="flex items-center justify-between mb-8">
                  <span className="font-mono text-xs text-[#A1A1AA]/50 uppercase tracking-widest">
                    SPEC_0{idx + 1}
                  </span>
                  <div className="p-2 rounded-lg bg-white/[0.03] group-hover:bg-[#D4AF37]/10 text-[#A1A1AA] group-hover:text-[#D4AF37] transition-colors">
                    <IconComponent className="w-4 h-4" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="font-mono text-3xl md:text-4xl font-bold text-[#F4F4F5] group-hover:text-[#D4AF37] transition-colors">
                    {spec.metric}
                  </div>
                  <div className="text-sm font-semibold uppercase tracking-wider text-[#F4F4F5]">
                    {spec.label}
                  </div>
                  <p className="text-xs text-[#A1A1AA] leading-relaxed pt-2">
                    {spec.subtext}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Live System Status Monospace Ticker */}
        <div className="p-4 rounded-2xl bg-[#0E0E10] border border-white/[0.06] flex flex-wrap items-center justify-between gap-4 font-mono text-xs text-[#A1A1AA]">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[#F4F4F5] font-semibold">GLOBAL CLUSTER STATUS: OPTIMAL</span>
            <span className="text-white/[0.2] hidden sm:inline">|</span>
            <span className="hidden sm:inline">VOICE NODE: ASIA-SOUTH-1 (MUMBAI)</span>
          </div>
          <div className="text-[#D4AF37]">
            LATENCY AVG: 418.2ms // 0 PACKET LOSS
          </div>
        </div>
      </div>
    </section>
  );
};
