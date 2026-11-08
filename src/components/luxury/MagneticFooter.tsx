import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, CheckCircle2, Sparkles, Send } from 'lucide-react';

interface MagneticFooterProps {
  onOpenDemo: () => void;
  onOpenLogin: () => void;
}

export const MagneticFooter: React.FC<MagneticFooterProps> = ({ onOpenDemo, onOpenLogin }) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;

    setLoading(true);

    try {
      await fetch('/api/admin/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'onboarding',
          email: email.trim().toLowerCase(),
          name: 'Executive Inquiry',
          companyName: 'Direct Portal Request',
          details: { source: 'Magnetic Footer Initiate System' }
        })
      });
    } catch {
      // Non-blocking
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  };

  return (
    <footer className="relative bg-[#050507] pt-24 pb-12 px-4 sm:px-6 border-t border-white/[0.08] overflow-hidden">
      {/* Background radial gold sheen */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#D4AF37]/5 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-20 relative z-10">
        {/* Massive Headline Callout */}
        <div className="space-y-8 text-center max-w-4xl mx-auto">
          <div className="font-mono text-xs uppercase tracking-[0.3em] text-[#D4AF37]">
            [ Autonomous Real Estate Deployment ]
          </div>
          
          <h2 className="text-5xl sm:text-7xl md:text-8xl font-serif font-bold text-[#F4F4F5] tracking-tight">
            Initiate <span className="italic text-[#D4AF37]">System.</span>
          </h2>

          <p className="text-[#A1A1AA] text-base md:text-lg max-w-xl mx-auto font-light leading-relaxed">
            Upgrade your real estate sales engine to zero-latency AI voice and automated WhatsApp conversions today.
          </p>

          {/* Minimalist Email Capture */}
          <div className="max-w-md mx-auto pt-4">
            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-2xl bg-white/[0.03] border border-[#D4AF37]/40 text-center space-y-1"
              >
                <div className="text-sm font-semibold text-[#D4AF37] flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Access Link Transmitted</span>
                </div>
                <p className="text-xs text-[#A1A1AA]">
                  Our founding executive will connect with your team shortly.
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubscribe} className="relative flex items-center">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter executive email address..."
                  required
                  className="w-full pl-5 pr-32 py-4 rounded-full bg-white/[0.04] border border-white/[0.1] focus:border-[#D4AF37] text-sm text-[#F4F4F5] placeholder-[#A1A1AA]/50 outline-none transition-colors backdrop-blur-xl"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="absolute right-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#E5C358] text-[#0A0A0A] text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity flex items-center gap-1.5"
                >
                  {loading ? 'Transmitting...' : 'Request'}
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Quick Action Navigation Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-12 border-t border-white/[0.06] text-xs">
          <div className="space-y-3">
            <div className="font-mono uppercase tracking-widest text-[#F4F4F5] font-semibold">Engine</div>
            <ul className="space-y-2 text-[#A1A1AA]">
              <li><a href="#voice-simulator" className="hover:text-[#D4AF37] transition-colors">Voice Agent Demo</a></li>
              <li><a href="#features" className="hover:text-[#D4AF37] transition-colors">WhatsApp Funnel</a></li>
              <li><a href="#engine-room" className="hover:text-[#D4AF37] transition-colors">CRM Synchronization</a></li>
              <li><a href="#roi" className="hover:text-[#D4AF37] transition-colors">Unit Economics Calculator</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <div className="font-mono uppercase tracking-widest text-[#F4F4F5] font-semibold">Dialects</div>
            <ul className="space-y-2 text-[#A1A1AA]">
              <li>English (Indian Accents)</li>
              <li>Kannada (ಕನ್ನಡ)</li>
              <li>Hindi (हिंदी)</li>
              <li>Telugu (తెలుగు) & Tamil (தமிழ்)</li>
            </ul>
          </div>

          <div className="space-y-3">
            <div className="font-mono uppercase tracking-widest text-[#F4F4F5] font-semibold">Portal</div>
            <ul className="space-y-2 text-[#A1A1AA]">
              <li><button onClick={onOpenLogin} className="hover:text-[#D4AF37] transition-colors">Partner Terminal Login</button></li>
              <li><button onClick={onOpenDemo} className="hover:text-[#D4AF37] transition-colors">Private Demo Scheduling</button></li>
              <li><a href="/pricing" className="hover:text-[#D4AF37] transition-colors">Subscription Tier Matrix</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <div className="font-mono uppercase tracking-widest text-[#F4F4F5] font-semibold">Executive Contact</div>
            <div className="space-y-2 text-[#A1A1AA]">
              <p className="font-mono text-[11px] text-[#D4AF37]">
                rajubasavanahalli@gmail.com
              </p>
              <p className="font-mono text-[11px] text-[#F4F4F5]">
                +91 8884614885 / +91 7892054343
              </p>
              <p className="text-[11px]">
                Bengaluru • Hyderabad • Mumbai • Pune
              </p>
            </div>
          </div>
        </div>

        {/* Bottom copyright & attribution */}
        <div className="pt-8 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[#A1A1AA]/60">
          <div>
            © {new Date().getFullYear()} SAMRUDDHI AI TECHNOLOGIES. ALL RIGHTS RESERVED.
          </div>
          <div className="flex items-center gap-4">
            <span>SOC2 TYPE II</span>
            <span>•</span>
            <span>RERA COMPLIANT</span>
            <span>•</span>
            <span>GRAPH API V20.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
