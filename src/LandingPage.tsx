import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CITIES_DATA } from './data/cities';
import { CityTemplate } from './components/CityTemplate';
import { LuxuryNavbar } from './components/luxury/LuxuryNavbar';
import { LuxuryHero } from './components/luxury/LuxuryHero';
import { OmnichannelStudioDemo } from './components/luxury/OmnichannelStudioDemo';
import { Globe3DCanvas } from './components/luxury/Globe3DCanvas';
import { FeatureSliderCarousel } from './components/luxury/FeatureSliderCarousel';
import { EngineRoomSpecs } from './components/luxury/EngineRoomSpecs';
import { RoiCalculator } from './components/RoiCalculator';
import { ComparisonTable } from './components/ComparisonTable';
import { MagneticFooter } from './components/luxury/MagneticFooter';
import { BookDemoModal } from './components/BookDemoModal';
import { VideoModal } from './components/VideoModal';
import { LoginModal } from './components/LoginModal';
import { ChatbotWidget } from './components/ChatbotWidget';
import { SplashScreen } from './components/SplashScreen';

interface LandingPageProps {
  citySlug?: string;
}

export const LandingPage: React.FC<LandingPageProps> = ({ citySlug }) => {
  const navigate = useNavigate();
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [prefilledLeads, setPrefilledLeads] = useState<number | undefined>(undefined);
  const [showSplash, setShowSplash] = useState(true);
  const [dynamicBgShift, setDynamicBgShift] = useState<string>('rgba(212, 175, 55, 0.04)');

  const navigateTo = (path: string) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenDemoWithLeads = (leads: number) => {
    setPrefilledLeads(leads);
    setDemoModalOpen(true);
  };

  const handleOpenDemoStandard = () => {
    setPrefilledLeads(undefined);
    setDemoModalOpen(true);
  };

  // Determine if path matches a city slug
  const activeCity = citySlug ? CITIES_DATA[citySlug] : null;

  // Set default homepage document title & SEO
  useEffect(() => {
    if (!activeCity) {
      document.title = "Samruddhi AI — Autonomous Real Estate Voice & WhatsApp Engine";
      let metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute(
          'content',
          "Zero-latency conversational AI agents speaking 7 Indian dialects with instant WhatsApp lead qualification for top builders and developers."
        );
      }
    }
  }, [activeCity]);

  // If active city matched, render the City Page Template
  if (activeCity) {
    return (
      <>
        {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
        <CityTemplate
          city={activeCity}
          onOpenDemo={() => handleOpenDemoStandard()}
          onNavigateHome={() => navigateTo('/')}
          onNavigateCity={(slug) => navigateTo(`/${slug}`)}
          onOpenLogin={() => setLoginModalOpen(true)}
        />

        <BookDemoModal
          isOpen={demoModalOpen}
          onClose={() => setDemoModalOpen(false)}
          prefilledLeads={prefilledLeads}
        />

        <VideoModal
          isOpen={videoModalOpen}
          onClose={() => setVideoModalOpen(false)}
          onOpenDemo={handleOpenDemoStandard}
        />
      </>
    );
  }

  // Full Ultra-Luxury Scandinavian Minimalist Homepage
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F4F4F5] font-sans selection:bg-[#D4AF37] selection:text-[#0A0A0A] relative overflow-x-hidden transition-colors duration-1000">
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}

      {/* 3D WebGL Scroll-to-Zoom Globe & Inward Particle Engine (60fps) */}
      <Globe3DCanvas />

      {/* Dynamic Slide & Shift Ambient Canvas Background Engine */}
      <div 
        className="fixed inset-0 pointer-events-none transition-all duration-1000 z-[1]"
        style={{
          background: `radial-gradient(circle at 50% 30%, ${dynamicBgShift} 0%, rgba(10, 10, 10, 0.4) 60%, rgba(10, 10, 10, 0.85) 95%)`
        }}
      />

      {/* Invisible Luxury Navbar */}
      <LuxuryNavbar 
        onOpenDemo={handleOpenDemoStandard}
        onOpenLogin={() => setLoginModalOpen(true)}
      />

      {/* Main Content Layout */}
      <main className="relative z-10 space-y-12 md:space-y-20">
        {/* Section B: The Cinematic Hero & Voice Simulator Console */}
        <LuxuryHero 
          onOpenDemo={handleOpenDemoStandard}
          onOpenVideo={() => setVideoModalOpen(true)}
        />

        {/* Brand New Sections: WhatsApp AI Post-Call Follow-up & AI Ad Creative Generator */}
        <OmnichannelStudioDemo 
          onOpenDemo={handleOpenDemoStandard}
        />

        {/* Section C: Feature Showcase (Fluid Horizontal Slider / Carousel) */}
        <FeatureSliderCarousel 
          onOpenDemo={handleOpenDemoStandard}
          onBackgroundShift={(tint) => setDynamicBgShift(tint)}
        />

        {/* Section D: The Engine Room (Brutalist Technical Specs) */}
        <EngineRoomSpecs />

        {/* Financial & Commission ROI Engine */}
        <div id="roi" className="pt-8">
          <RoiCalculator onOpenDemoWithLeads={handleOpenDemoWithLeads} />
        </div>

        {/* Architectural Comparison */}
        <div>
          <ComparisonTable onOpenDemo={handleOpenDemoStandard} />
        </div>
      </main>

      {/* Section E: Magnetic Footer ("Initiate System.") */}
      <MagneticFooter 
        onOpenDemo={handleOpenDemoStandard}
        onOpenLogin={() => setLoginModalOpen(true)}
      />

      {/* Modals & Portals */}
      <BookDemoModal
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
        prefilledLeads={prefilledLeads}
      />

      <VideoModal
        isOpen={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
        onOpenDemo={handleOpenDemoStandard}
      />

      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onSuccess={() => {
          setLoginModalOpen(false);
          navigate('/dashboard');
        }}
      />

      {/* Floating Concierge / Simulator Assistant */}
      <ChatbotWidget />
    </div>
  );
};
