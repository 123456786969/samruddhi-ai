import React from 'react';
import { Linkedin, Quote, Sparkles, Building2, ShieldCheck } from 'lucide-react';
import { SafeAvatar } from './common/SafeAvatar';

export const FounderStory: React.FC = () => {
  return (
    <section id="founder-story" className="scroll-mt-28 py-20 bg-transparent relative z-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Card Container */}
        <div className="bg-[#031814]/90 rounded-3xl p-8 sm:p-12 border border-teal-800/80 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          {/* Background Ambient Lights */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative z-10">
            
            {/* Founder Avatar & Profile Column */}
            <div className="md:col-span-4 flex flex-col items-center text-center space-y-4">
              <div className="relative">
                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden border-4 border-amber-400 shadow-2xl bg-teal-950 flex items-center justify-center">
                  <SafeAvatar
                    src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=400"
                    alt="Dharan R Gowda - Founder & CEO"
                    name="Dharan R Gowda"
                    fallbackSeed="dharan-gowda-founder"
                    isFounder={true}
                    className="w-full h-full"
                  />
                </div>
                <div className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-emerald-500 text-gray-950 flex items-center justify-center font-bold text-xs shadow-lg border-2 border-[#031814]" title="Verified Founder">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-white">Dharan R Gowda</h3>
                <p className="text-xs font-semibold text-amber-400">Founder & CEO, Samruddhi AI</p>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mt-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-medium">
                  <span>16-Year-Old AI Engineer & Tech Founder</span>
                </div>
              </div>

              <a
                href="https://www.linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-950/80 border border-teal-800 text-teal-200 text-xs font-bold hover:bg-teal-900 hover:text-white transition-colors"
              >
                <Linkedin className="w-4 h-4 text-amber-400" />
                <span>Connect on LinkedIn</span>
              </a>
            </div>

            {/* Founder Quote & Mission Text Column */}
            <div className="md:col-span-8 space-y-5 border-t md:border-t-0 md:border-l border-teal-900/80 pt-6 md:pt-0 md:pl-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold border border-amber-400/30">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Why I Built Samruddhi AI</span>
              </div>

              <Quote className="w-10 h-10 text-amber-400/30" />

              <p className="text-base sm:text-lg text-teal-100 leading-relaxed font-normal italic">
                "I started building conversational AI models because I saw real estate developers and brokers across India burning lakhs every month on Meta and Google ads, yet losing up to 65% of potential buyers simply because nobody contacted them within the first crucial 10 minutes. By the time a sales rep called hours later, the lead was already cold.
              </p>

              <p className="text-sm text-teal-200/90 leading-relaxed font-normal">
                At 16, I engineered <strong className="text-white font-bold">Samruddhi AI</strong> to solve this fundamental problem. By combining instant sub-10s WhatsApp brochure delivery with human-grade multilingual voice AI in Kannada, Hindi, Telugu, Tamil, Marathi, and English, we empower Indian real estate teams to never miss a high-intent buyer again."
              </p>

              <div className="pt-2 flex items-center gap-6 text-xs text-teal-300">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Trusted by 120+ Indian Developers</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Next-Gen Indian PropTech AI</span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
