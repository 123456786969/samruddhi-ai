import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PhoneCall, 
  MessageSquare, 
  Database, 
  TrendingUp, 
  BarChart3, 
  Sparkles, 
  ArrowUpRight, 
  ChevronLeft, 
  ChevronRight,
  Bot,
  Zap,
  Globe
} from 'lucide-react';

interface FeatureSliderCarouselProps {
  onOpenDemo: () => void;
  onBackgroundShift?: (color: string) => void;
}

interface FeatureItem {
  id: string;
  category: string;
  title: string;
  tagline: string;
  description: string;
  metrics: { label: string; value: string }[];
  bgTint: string;
  accentColor: string;
  icon: React.ElementType;
}

export const FeatureSliderCarousel: React.FC<FeatureSliderCarouselProps> = ({ 
  onOpenDemo,
  onBackgroundShift 
}) => {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const features: FeatureItem[] = [
    {
      id: 'voice-agent',
      category: 'AUTONOMOUS TELEPHONY',
      title: 'Multilingual Inbound & Outbound Calling',
      tagline: 'Instant 15-second response to Facebook, Google, and 99acres ad leads with native regional intonation.',
      description: 'Samruddhi Voice AI dials incoming property enquiries in real time, converses fluently in 7 Indian languages, filters out time-wasters, and locks in verified weekend site visits.',
      metrics: [
        { label: 'Response Latency', value: '< 15 Seconds' },
        { label: 'Site Visit Booking Rate', value: '4.2x Industry Avg' },
        { label: 'Cost Per Qualified Lead', value: '-68% Savings' }
      ],
      bgTint: 'rgba(212, 175, 55, 0.08)',
      accentColor: '#D4AF37',
      icon: PhoneCall
    },
    {
      id: 'whatsapp-engine',
      category: 'CONVERSATIONAL COMMERCE',
      title: 'Automated WhatsApp Sales Funnel',
      tagline: 'Verified Meta Cloud API with dynamic property brochures, floor plans, and automated calendar confirmations.',
      description: 'Engage high-intent homebuyers on their primary channel. Send verified brochures within 3 seconds of enquiry, qualify budgets automatically, and trigger proactive follow-ups before competitors even view the lead.',
      metrics: [
        { label: 'Message Open Rate', value: '98.4%' },
        { label: 'Brochure Downloads', value: '76% Rate' },
        { label: 'No-Show Reduction', value: '52% Drop' }
      ],
      bgTint: 'rgba(0, 230, 118, 0.07)',
      accentColor: '#00E676',
      icon: MessageSquare
    },
    {
      id: 'spanner-crm',
      category: 'DATA & INFRASTRUCTURE',
      title: 'Enterprise CRM & Spanner Synchronization',
      tagline: 'Zero data silos. Bidirectional auto-sync with LeadSquared, Salesforce, HubSpot, and custom real estate CRMs.',
      description: 'Every phone call recording, conversation transcript, buyer budget tag, and site visit schedule is instantly parsed into structured parameters and synced directly with your central database.',
      metrics: [
        { label: 'Sync Latency', value: '< 200ms' },
        { label: 'Data Enrichment', value: '100% Automated' },
        { label: 'CRM Compatibility', value: 'REST / Webhook' }
      ],
      bgTint: 'rgba(56, 189, 248, 0.07)',
      accentColor: '#38BDF8',
      icon: Database
    },
    {
      id: 'ad-roi',
      category: 'GROWTH ENGINE',
      title: 'Instant Ad-to-Visit Conversion Funnel',
      tagline: 'Stop burning marketing budgets on slow follow-ups. Turn expensive Meta & Google clicks into confirmed walkthroughs.',
      description: 'The golden rule of real estate: contacting a buyer within 5 minutes increases conversion odds by 391%. Samruddhi AI engages within 15 seconds, day or night.',
      metrics: [
        { label: 'Follow-Up Speed', value: 'Instant (< 15s)' },
        { label: 'Lead Wastage', value: 'Near Zero' },
        { label: 'ROAS Multiplier', value: '3.4x ROI' }
      ],
      bgTint: 'rgba(245, 158, 11, 0.08)',
      accentColor: '#F59E0B',
      icon: TrendingUp
    },
    {
      id: 'voice-intelligence',
      category: 'NEURAL ANALYTICS',
      title: 'Real-Time Sentiment & Buyer Intent Scoring',
      tagline: 'Deep conversational intelligence classifying high-probability buyers vs casual browsers automatically.',
      description: 'Extract actionable buyer insights from hundreds of daily conversations. Know which configurations (2BHK vs 3BHK vs Villa) are trending and where price sensitivities lie.',
      metrics: [
        { label: 'Intent Classification', value: '94.2% Precision' },
        { label: 'Transcripts Logged', value: '100% Searchable' },
        { label: 'Real-Time Alerts', value: 'Instant WhatsApp' }
      ],
      bgTint: 'rgba(168, 85, 247, 0.07)',
      accentColor: '#A855F7',
      icon: BarChart3
    }
  ];

  const handleSelectCard = (index: number) => {
    setActiveIndex(index);
    onBackgroundShift?.(features[index].bgTint);
  };

  const handleNext = () => {
    const nextIdx = (activeIndex + 1) % features.length;
    handleSelectCard(nextIdx);
  };

  const handlePrev = () => {
    const prevIdx = (activeIndex - 1 + features.length) % features.length;
    handleSelectCard(prevIdx);
  };

  return (
    <section id="features" className="relative py-28 px-4 sm:px-6 overflow-hidden">
      {/* Background Section Glow shifting with active card */}
      <div 
        className="absolute inset-0 transition-colors duration-1000 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 40%, ${features[activeIndex].bgTint} 0%, rgba(10, 10, 10, 0) 70%)`
        }}
      />

      <div className="max-w-7xl mx-auto space-y-12 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/[0.08] pb-8">
          <div className="space-y-3">
            <div className="font-mono text-xs uppercase tracking-[0.25em] text-[#D4AF37] flex items-center gap-2">
              <Zap className="w-3.5 h-3.5" />
              <span>[ Core Capabilities Architecture ]</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-[#F4F4F5] tracking-tight">
              Engineered for Absolute <br className="hidden sm:block" />
              <span className="italic text-[#D4AF37]">Market Supremacy.</span>
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrev}
              className="p-3 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[#F4F4F5] transition-colors"
              aria-label="Previous Feature"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="font-mono text-xs text-[#A1A1AA] px-2">
              0{activeIndex + 1} / 0{features.length}
            </div>
            <button
              onClick={handleNext}
              className="p-3 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[#F4F4F5] transition-colors"
              aria-label="Next Feature"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Expansive Carousel Stage (80vw expansive cards) */}
        <div 
          ref={containerRef}
          className="relative w-full overflow-x-auto scrollbar-none py-4"
        >
          <div className="flex items-stretch gap-6 md:gap-8 w-max">
            {features.map((feature, idx) => {
              const isCurrent = idx === activeIndex;
              const IconComp = feature.icon;

              return (
                <motion.div
                  key={feature.id}
                  onClick={() => handleSelectCard(idx)}
                  whileHover={{ scale: 1.01 }}
                  transition={{ duration: 0.3 }}
                  className={`w-[85vw] sm:w-[650px] md:w-[780px] rounded-3xl p-8 md:p-12 transition-all duration-500 cursor-pointer flex flex-col justify-between relative overflow-hidden group ${
                    isCurrent
                      ? 'bg-[#121215]/90 border border-[#D4AF37]/50 shadow-[0_20px_50px_rgba(0,0,0,0.8)]'
                      : 'bg-[#0E0E10]/60 border border-white/[0.06] hover:border-white/[0.15] opacity-75 hover:opacity-100'
                  }`}
                >
                  {/* Card Background Accent Gradient */}
                  <div 
                    className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none transition-opacity group-hover:opacity-40"
                    style={{ backgroundColor: feature.accentColor }}
                  />

                  {/* Header info */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="p-3 rounded-2xl border"
                          style={{
                            backgroundColor: `${feature.accentColor}15`,
                            borderColor: `${feature.accentColor}40`,
                            color: feature.accentColor
                          }}
                        >
                          <IconComp className="w-6 h-6" />
                        </div>
                        <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#A1A1AA]">
                          {feature.category}
                        </span>
                      </div>

                      <span className="font-mono text-sm text-[#A1A1AA]/60">
                        // 0{idx + 1}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-2xl md:text-3xl font-serif font-bold text-[#F4F4F5] group-hover:text-white transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-[#D4AF37] font-medium text-sm md:text-base leading-relaxed">
                        {feature.tagline}
                      </p>
                      <p className="text-[#A1A1AA] text-xs md:text-sm leading-relaxed max-w-2xl">
                        {feature.description}
                      </p>
                    </div>
                  </div>

                  {/* Metrics Bar & Launch Button */}
                  <div className="pt-8 mt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                    <div className="grid grid-cols-3 gap-4 md:gap-6 w-full sm:w-auto">
                      {feature.metrics.map((m, mIdx) => (
                        <div key={mIdx} className="space-y-0.5">
                          <div className="font-mono text-base md:text-lg font-bold text-[#F4F4F5]">
                            {m.value}
                          </div>
                          <div className="text-[10px] md:text-xs text-[#A1A1AA] uppercase tracking-wider font-mono">
                            {m.label}
                          </div>
                        </div>
                      ))}
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenDemo();
                      }}
                      className="px-5 py-2.5 rounded-full bg-white/[0.06] hover:bg-[#D4AF37] hover:text-[#0A0A0A] text-[#F4F4F5] border border-white/[0.1] text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all self-end sm:self-center"
                    >
                      <span>Explore Engine</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
