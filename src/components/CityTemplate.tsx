import React, { useEffect } from 'react';
import { CityData, CITIES_DATA } from '../data/cities';
import { 
  Building2, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  MapPin, 
  Globe2, 
  MessageSquare, 
  PhoneCall, 
  Users, 
  Clock, 
  TrendingUp, 
  Quote, 
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { AiDemoSimulator } from './AiDemoSimulator';
import { HowItWorks } from './HowItWorks';
import { RoiCalculator } from './RoiCalculator';
import { ComparisonTable } from './ComparisonTable';
import { FinalCta } from './FinalCta';
import { SafeAvatar } from './common/SafeAvatar';

interface CityTemplateProps {
  city: CityData;
  onOpenDemo: (prefilledCity?: string) => void;
  onNavigateHome: () => void;
  onNavigateCity: (slug: string) => void;
  onOpenLogin: () => void;
}

export const CityTemplate: React.FC<CityTemplateProps> = ({
  city,
  onOpenDemo,
  onNavigateHome,
  onNavigateCity,
  onOpenLogin,
}) => {
  // Update document title and meta description for SEO
  useEffect(() => {
    document.title = city.seo.title;

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', city.seo.metaDescription);

    // Scroll to top on city change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [city]);

  return (
    <div className="min-h-screen bg-[#020d0a] text-slate-100 font-sans selection:bg-amber-400 selection:text-gray-950 relative overflow-x-hidden">
      
      {/* Background Decorative Lighting */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-gradient-to-b from-teal-900/20 via-emerald-950/10 to-transparent pointer-events-none z-0 blur-3xl"></div>
      <div className="fixed top-1/4 right-0 w-[400px] h-[400px] bg-amber-500/5 rounded-full pointer-events-none z-0 blur-3xl"></div>

      {/* Global Navbar */}
      <Navbar onOpenDemo={() => onOpenDemo(city.name)} onOpenLogin={onOpenLogin} />

      {/* Breadcrumb Navigation Bar */}
      <div className="pt-24 pb-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex items-center gap-2 text-xs font-semibold text-teal-300/80">
          <button 
            onClick={onNavigateHome}
            className="hover:text-amber-400 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>Home</span>
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-teal-600" />
          <span className="text-teal-400">City Solutions</span>
          <ChevronRight className="w-3.5 h-3.5 text-teal-600" />
          <span className="text-amber-400 font-bold">{city.name}</span>
        </div>
      </div>

      {/* Hero Section per City */}
      <section className="pt-4 pb-16 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-4xl mx-auto space-y-6">
            
            {/* City Tag Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-950/90 text-amber-300 text-xs font-bold border border-teal-800/80 shadow-lg backdrop-blur-md">
              <MapPin className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
              <span>{city.tagline}</span>
            </div>

            {/* City Specific Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.15] drop-shadow-md">
              {city.heroHeadline.split(city.name)[0]}
              <span className="text-amber-400 underline decoration-emerald-400 decoration-wavy decoration-2">
                {city.name}
              </span>
              {city.heroHeadline.split(city.name)[1] || ''}
            </h1>

            {/* Subheadline */}
            <p className="text-base sm:text-xl text-teal-100/90 max-w-3xl mx-auto leading-relaxed font-normal">
              {city.heroSubheadline}
            </p>

            {/* Micro-markets Tags */}
            <div className="pt-2 space-y-2">
              <span className="text-xs font-bold text-teal-300 uppercase tracking-wider block">
                Popular {city.name} Micromarkets Covered:
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto">
                {city.microMarkets.map((market) => (
                  <span 
                    key={market} 
                    className="px-3 py-1 rounded-lg bg-teal-950/80 border border-teal-800/60 text-xs text-teal-200 font-semibold"
                  >
                    📍 {market}
                  </span>
                ))}
              </div>
            </div>

            {/* CTAs */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => onOpenDemo(city.name)}
                className="w-full sm:w-auto px-8 py-4 bg-amber-400 hover:bg-amber-300 text-gray-950 font-extrabold text-base sm:text-lg rounded-xl shadow-xl shadow-amber-400/20 hover:shadow-amber-400/40 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3 cursor-pointer group"
              >
                <span>Start Free in {city.name}</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => onOpenDemo(city.name)}
                className="w-full sm:w-auto px-7 py-4 bg-[#05221c]/80 hover:bg-[#072f27] text-teal-100 font-bold text-base rounded-xl border border-teal-700/80 shadow-md backdrop-blur-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Book a Demo</span>
              </button>
            </div>

            {/* Regional Languages Badge */}
            <div className="pt-2 flex items-center justify-center gap-2 text-xs text-teal-300 font-semibold">
              <Globe2 className="w-4 h-4 text-emerald-400" />
              <span>Supported Regional Languages in {city.name}: </span>
              <span className="text-amber-300 font-bold">{city.languagesSupported.join(', ')}</span>
            </div>

          </div>

        </div>
      </section>

      {/* Localized Stats Block */}
      <section className="py-12 bg-transparent relative z-10 border-y border-teal-900/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center">
            
            <div className="bg-[#031814]/90 p-5 rounded-2xl border border-teal-800/80 shadow-lg backdrop-blur-md space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
                <Users className="w-4 h-4" />
                <span>Active Brokers</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white">{city.stats.activeAgents}</div>
              <div className="text-[11px] text-teal-300/80">In {city.name} & Suburbs</div>
            </div>

            <div className="bg-[#031814]/90 p-5 rounded-2xl border border-teal-800/80 shadow-lg backdrop-blur-md space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
                <Clock className="w-4 h-4" />
                <span>Response Speed</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white">{city.stats.avgResponseTime}</div>
              <div className="text-[11px] text-teal-300/80">WhatsApp & AI Voice Call</div>
            </div>

            <div className="bg-[#031814]/90 p-5 rounded-2xl border border-teal-800/80 shadow-lg backdrop-blur-md space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
                <MessageSquare className="w-4 h-4" />
                <span>Recovered Leads</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white">{city.stats.leadsRecovered}</div>
              <div className="text-[11px] text-teal-300/80">From Meta & Google Ads</div>
            </div>

            <div className="bg-[#031814]/90 p-5 rounded-2xl border border-teal-800/80 shadow-lg backdrop-blur-md space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
                <TrendingUp className="w-4 h-4" />
                <span>Site Visit Lift</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white">{city.stats.siteVisitIncrease}</div>
              <div className="text-[11px] text-teal-300/80">Compared to Manual Follow-Up</div>
            </div>

          </div>

        </div>
      </section>

      {/* Local Testimonial Block */}
      <section className="py-16 relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="bg-[#031814]/90 rounded-3xl p-8 sm:p-10 border border-teal-800/80 shadow-2xl backdrop-blur-xl relative overflow-hidden space-y-6">
            <div className="flex items-center justify-between border-b border-teal-900 pb-4">
              <div className="flex items-center gap-2">
                <Quote className="w-6 h-6 text-amber-400" />
                <h3 className="text-lg font-extrabold text-white">Local Agent Success Story — {city.name}</h3>
              </div>
              <span className="text-xs bg-emerald-500/20 text-emerald-300 font-bold px-3 py-1 rounded-full border border-emerald-500/30">
                Verified Broker
              </span>
            </div>

            <p className="text-base sm:text-lg text-teal-100 font-normal italic leading-relaxed">
              "{city.testimonial.quote}"
            </p>

            <div className="flex items-center gap-4 pt-2">
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-amber-400 shadow-md flex-shrink-0 bg-teal-950 flex items-center justify-center">
                <SafeAvatar 
                  src={city.testimonial.image} 
                  alt={city.testimonial.author} 
                  name={city.testimonial.author}
                  fallbackSeed={`city-${city.slug}`}
                  className="w-full h-full"
                />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-white">{city.testimonial.author}</h4>
                <p className="text-xs text-amber-400 font-semibold">{city.testimonial.role}, {city.testimonial.company}</p>
                <p className="text-[11px] text-teal-300/80 mt-0.5">Operating in {city.name}</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Live AI Demo Simulator embedded for this city */}
      <AiDemoSimulator onOpenDemo={() => onOpenDemo(city.name)} />

      {/* Interactive Lead-Leakage Calculator */}
      <RoiCalculator onOpenDemoWithLeads={() => onOpenDemo(city.name)} />

      {/* Comparison Table */}
      <ComparisonTable onOpenDemo={() => onOpenDemo(city.name)} />

      {/* Switch City Footer Navigator */}
      <section className="py-12 bg-transparent relative z-10 border-t border-teal-900/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-xl font-bold text-white">Explore Other Real Estate Hubs</h3>
            <p className="text-xs text-teal-300">Samruddhi AI delivers 24/7 lead recovery across major Indian metro cities</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {Object.values(CITIES_DATA).map((c) => (
              <button
                key={c.slug}
                onClick={() => onNavigateCity(c.slug)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  c.slug === city.slug
                    ? 'bg-amber-400 text-gray-950 shadow-md scale-105'
                    : 'bg-teal-950/80 text-teal-200 border border-teal-800/80 hover:bg-teal-900 hover:text-white'
                }`}
              >
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>{c.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <FinalCta onOpenDemo={() => onOpenDemo(city.name)} />

      {/* Global Footer */}
      <Footer />

    </div>
  );
};
