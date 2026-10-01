import React from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, Play, Sparkles, PhoneCall, ShieldCheck, Activity } from 'lucide-react';
import { VoiceHardwareSimulator } from './VoiceHardwareSimulator';

interface LuxuryHeroProps {
  onOpenDemo: () => void;
  onOpenVideo?: () => void;
}

export const LuxuryHero: React.FC<LuxuryHeroProps> = ({ onOpenDemo, onOpenVideo }) => {
  const headlineWords = ["The", "Voice", "of", "Samruddhi."];

  return (
    <section className="relative min-h-screen pt-32 pb-20 px-4 sm:px-6 flex flex-col justify-center items-center overflow-hidden">
      {/* Abstract fluid background gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[900px] h-[400px] bg-gradient-to-br from-[#D4AF37]/10 via-[#1a1810]/5 to-transparent blur-[140px] pointer-events-none" />
      <div className="absolute top-2/3 right-1/4 w-[400px] h-[300px] bg-emerald-500/5 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full space-y-12 relative z-10 flex flex-col items-center text-center">
        {/* Top Monospace Category Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl"
        >
          <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
          <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-[#D4AF37] font-semibold">
            Autonomous Real Estate Telephony Engine
          </span>
        </motion.div>

        {/* Massive Serif Headline with Staggered Word Reveal */}
        <div className="space-y-4 max-w-4xl">
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-serif font-extrabold text-[#F4F4F5] tracking-tight leading-[1.08] flex flex-wrap justify-center gap-x-4 sm:gap-x-6">
            {headlineWords.map((word, index) => (
              <span key={index} className="inline-block overflow-hidden py-1">
                <motion.span
                  initial={{ y: '100%', opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{
                    duration: 0.9,
                    ease: [0.16, 1, 0.3, 1],
                    delay: 0.2 + index * 0.12
                  }}
                  className={`inline-block ${
                    word === 'Samruddhi.' ? 'italic text-[#D4AF37]' : ''
                  }`}
                >
                  {word}
                </motion.span>
              </span>
            ))}
          </h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-base sm:text-lg md:text-xl text-[#A1A1AA] max-w-2xl mx-auto font-light leading-relaxed pt-2"
          >
            Zero-latency conversational AI agents speaking 7 Indian dialects. Instant lead qualification on WhatsApp and automated site visit scheduling for elite developers.
          </motion.p>
        </div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.75 }}
          className="flex flex-wrap items-center justify-center gap-4 pt-2"
        >
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={onOpenDemo}
            className="px-7 py-3.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#E5C358] text-[#0A0A0A] text-xs uppercase tracking-widest font-bold shadow-xl shadow-[#D4AF37]/25 flex items-center gap-2"
          >
            <span>Deploy Voice Agent</span>
            <ArrowUpRight className="w-4 h-4" />
          </motion.button>

          {onOpenVideo && (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={onOpenVideo}
              className="px-6 py-3.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-xs uppercase tracking-widest text-[#F4F4F5] font-semibold flex items-center gap-2.5 backdrop-blur-xl transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current text-[#D4AF37]" />
              <span>Watch Architecture Film</span>
            </motion.button>
          )}
        </motion.div>

        {/* Centerpiece: The High-End Voice Simulator Console */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="w-full pt-8"
        >
          <VoiceHardwareSimulator onOpenDemo={onOpenDemo} />
        </motion.div>
      </div>
    </section>
  );
};
