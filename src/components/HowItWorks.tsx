import React, { useState } from 'react';
import { MousePointerClick, MessageSquare, PhoneCall, UserCheck, ArrowRight, CheckCircle2, Clock, MapPin, Sparkles } from 'lucide-react';

interface HowItWorksProps {
  onOpenDemo: () => void;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ onOpenDemo }) => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      stepNumber: 'Step 1',
      title: 'The Click',
      subtitle: 'Buyer clicks your Meta or Google Real Estate Ad',
      description: 'Whether a prospect submits a lead form on Facebook, Instagram, or Google Search, Samruddhi AI intercepts the lead payload instantly.',
      icon: MousePointerClick,
      badge: '0 Seconds',
      detailCard: {
        heading: 'Inbound Ad Lead Payload Captured',
        items: [
          'Meta Form / Google Form Ingested in 200ms',
          'UTM parameters logged for Ad Spend Attribution',
          'Automated phone number & WhatsApp validity check'
        ]
      }
    },
    {
      stepNumber: 'Step 2',
      title: 'The Engagement',
      subtitle: 'Samruddhi AI texts via WhatsApp & shares property photos',
      description: 'Within 6 seconds, the buyer receives a personalized WhatsApp greeting with property brochures, price breakdown, and location pin.',
      icon: MessageSquare,
      badge: '< 10 Seconds',
      detailCard: {
        heading: 'WhatsApp Automated Media Kit',
        items: [
          'High-Res Floorplan PDFs & Virtual Video Walkthroughs',
          'Interactive WhatsApp buttons for 2BHK vs 3BHK selection',
          'Location Pin & Site Distance from Key Tech Parks'
        ]
      }
    },
    {
      stepNumber: 'Step 3',
      title: 'The Call',
      subtitle: 'AI Voice assistant calls to confirm intent & availability',
      description: 'If the buyer does not complete WhatsApp booking immediately, the Multilingual AI Voice Assistant places an outbound call in English, Hindi, Kannada, Tamil, or Telugu.',
      icon: PhoneCall,
      badge: 'Within 3 Minutes',
      detailCard: {
        heading: 'Human-grade AI Outbound Call',
        items: [
          'Qualifies budget limits (e.g. ₹90L - ₹1.5 Cr)',
          'Verifies possession urgency (Immediate / 6 months)',
          'Proposes Saturday or Sunday 11 AM Site Visit slot'
        ]
      }
    },
    {
      stepNumber: 'Step 4',
      title: 'The Handover',
      subtitle: 'Broker gets instant alert: "Site Visit Booked for Tomorrow 10 AM"',
      description: 'The sales head or designated channel manager receives a structured lead dossier on WhatsApp & CRM. The buyer receives a cab link or directions pin.',
      icon: UserCheck,
      badge: '100% Qualified',
      detailCard: {
        heading: 'Instant Sales Manager Alert',
        items: [
          'WhatsApp Alert: "Hot Lead Assigned to Vikram"',
          'Calendar invite synced to Google Calendar / Outlook',
          'CRM record created with exact budget & call audio recording link'
        ]
      }
    }
  ];

  return (
    <section id="how-it-works" className="scroll-mt-28 py-20 bg-transparent relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-950/80 text-teal-200 text-xs font-bold border border-teal-800/80 shadow-md backdrop-blur-md">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Automated Lead Funnel Flow</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight drop-shadow-md">
            How Samruddhi AI Converts Ad Clicks into <span className="text-amber-400">Confirmed Site Visits</span>
          </h2>

          <p className="text-base sm:text-lg text-teal-100">
            A seamless, 4-step autonomous sales pipeline that operates 24 hours a day, 365 days a year without human delay.
          </p>
        </div>

        {/* Step Selector Tabs (Mobile & Desktop) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isSelected = activeStep === idx;
            return (
              <button
                key={step.stepNumber}
                onClick={() => setActiveStep(idx)}
                className={`p-4 rounded-xl text-left border transition-all duration-300 cursor-pointer backdrop-blur-xl ${
                  isSelected
                    ? 'bg-gradient-to-br from-emerald-600 to-teal-900 text-white border-amber-400 shadow-xl shadow-emerald-950/50 scale-[1.02]'
                    : 'bg-[#031814]/80 text-teal-100 border-teal-800/60 hover:border-teal-500 hover:bg-[#052620]/90'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isSelected ? 'bg-amber-400 text-gray-950' : 'bg-teal-950 text-teal-300 border border-teal-800/60'
                  }`}>
                    {step.stepNumber}
                  </span>
                  <span className={`text-[10px] font-semibold ${isSelected ? 'text-amber-300' : 'text-emerald-400'}`}>
                    {step.badge}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-amber-400' : 'text-teal-300'}`} />
                  <h4 className="font-bold text-sm sm:text-base leading-snug">{step.title}</h4>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Step Content Showcase */}
        <div className="bg-[#031814]/90 rounded-2xl p-6 sm:p-10 border border-teal-800/80 shadow-2xl backdrop-blur-xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Detailed Step Explanation */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{steps[activeStep].stepNumber} of 4: {steps[activeStep].badge}</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-black text-white">
              {steps[activeStep].title}: <span className="text-amber-400">{steps[activeStep].subtitle}</span>
            </h3>

            <p className="text-base text-teal-100 leading-relaxed">
              {steps[activeStep].description}
            </p>

            <div className="bg-[#020d0a]/90 p-5 rounded-xl border border-teal-900 space-y-3">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                <span>{steps[activeStep].detailCard.heading}</span>
              </h4>

              <ul className="space-y-2 text-xs text-teal-100/90">
                {steps[activeStep].detailCard.items.map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0"></span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-2 flex items-center gap-4">
              <button
                onClick={onOpenDemo}
                className="px-6 py-3 bg-amber-400 hover:bg-amber-300 text-gray-950 font-extrabold text-sm rounded-xl shadow-lg shadow-amber-400/20 transition-transform transform hover:scale-105 flex items-center gap-2"
              >
                <span>Automate This Flow For Your Project</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {activeStep < 3 && (
                <button
                  onClick={() => setActiveStep(prev => Math.min(3, prev + 1))}
                  className="text-xs font-bold text-amber-400 hover:underline"
                >
                  Next Step ({steps[activeStep + 1].title}) →
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Visual Progression Card */}
          <div className="lg:col-span-5 bg-[#004d40] text-white p-6 sm:p-8 rounded-2xl relative overflow-hidden shadow-2xl space-y-4">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

            <div className="flex items-center justify-between border-b border-teal-800 pb-3">
              <span className="text-xs font-mono text-teal-200">SAMRUDDHI AI FUNNEL ENGINE</span>
              <span className="text-[10px] bg-emerald-950 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-800">
                Active Step #{activeStep + 1}
              </span>
            </div>

            {/* Visual Step Timeline */}
            <div className="space-y-4 pt-2">
              {steps.map((s, idx) => (
                <div 
                  key={s.stepNumber}
                  className={`p-3 rounded-xl transition-all border ${
                    activeStep === idx 
                      ? 'bg-white text-gray-900 border-[#ffb300] shadow-lg' 
                      : idx < activeStep
                      ? 'bg-teal-900/60 text-teal-200 border-teal-700/50'
                      : 'bg-teal-950/40 text-teal-300/60 border-teal-900/40 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                        activeStep === idx 
                          ? 'bg-[#004d40] text-white' 
                          : idx < activeStep
                          ? 'bg-emerald-500 text-gray-950'
                          : 'bg-teal-900 text-teal-300'
                      }`}>
                        {idx + 1}
                      </div>
                      <span className="font-bold text-xs">{s.title}</span>
                    </div>

                    <span className="text-[10px] font-mono">{s.badge}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-teal-800 text-center text-xs text-teal-200">
              ⚡ Guaranteed zero lead drops from click to site visit
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
