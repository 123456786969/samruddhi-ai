import React, { useState, useRef } from 'react';
import { MessageSquare, PhoneCall, RefreshCw, BarChart3, CheckCircle, Play, Volume2, Sparkles, ArrowUpRight, Zap, ShieldCheck } from 'lucide-react';
import { languageSamples } from '../data/languageSamples';

interface FeaturesGridProps {
  onOpenDemo: () => void;
}

export const FeaturesGrid: React.FC<FeaturesGridProps> = ({ onOpenDemo }) => {
  const [selectedVoice, setSelectedVoice] = useState('en');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const activeSample = languageSamples.find(v => v.code === selectedVoice) || languageSamples[0];

  const handleVoiceChange = (code: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlayingAudio(false);
    setAudioError(false);
    setSelectedVoice(code);
  };

  const toggleAudio = () => {
    if (isPlayingAudio) {
      if (audioRef.current) audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      setAudioError(false);
      const audio = new Audio(activeSample.audioSrc);
      audioRef.current = audio;
      audio.onended = () => setIsPlayingAudio(false);
      audio.onerror = () => {
        setIsPlayingAudio(false);
        setAudioError(true);
      };
      setIsPlayingAudio(true);
      audio.play().catch((err) => {
        if (err?.name === 'AbortError' || err?.message?.includes('interrupted by a call to pause')) {
          return;
        }
        setIsPlayingAudio(false);
        setAudioError(true);
      });
    }
  };

  return (
    <section id="features" className="scroll-mt-28 py-20 bg-transparent relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-950/80 text-teal-200 text-xs font-bold border border-teal-800/80 shadow-md backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Built Exclusively for Real Estate Sales</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight drop-shadow-md">
            The 4 AI Pillars Driving <br className="hidden sm:inline" />
            <span className="text-amber-400">3x More Site Visits</span>
          </h2>

          <p className="text-base sm:text-lg text-teal-100">
            Generic CRM tools fail because real estate leads go cold in minutes. Samruddhi AI combines instant WhatsApp engagement with human-grade multilingual phone calls.
          </p>
        </div>

        {/* 4-Column Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Pillar 1: Instant WhatsApp Engagement */}
          <div className="bg-[#031814]/85 rounded-2xl p-6 border border-teal-800/60 hover:border-amber-400/60 hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group backdrop-blur-xl">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-900 text-amber-400 flex items-center justify-center shadow-lg shadow-emerald-950/40 group-hover:scale-110 transition-transform border border-emerald-400/30">
                <MessageSquare className="w-6 h-6" />
              </div>

              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-300 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-700/60">
                <Zap className="w-3 h-3 text-amber-400" />
                <span>&lt; 10 Second Response</span>
              </div>

              <h3 className="text-xl font-bold text-white">
                Instant WhatsApp Engagement
              </h3>

              <p className="text-sm text-teal-100/90 leading-relaxed">
                Engages ad traffic in seconds. Qualifies budget, location, and timeline automatically.
              </p>

              {/* Feature Micro Visual */}
              <div className="bg-[#020d0a]/90 p-3.5 rounded-xl border border-teal-900 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <CheckCircle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>Shares PDF Brochure & Floorplans</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <CheckCircle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>Interactive Budget Qualifier</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <CheckCircle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>Location Pin & Directions</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-teal-900/80 mt-6">
              <span className="text-xs font-bold text-amber-400 group-hover:text-amber-300 flex items-center gap-1">
                Explore WhatsApp Bot Flow <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* Pillar 2: Multilingual AI Voice Calls */}
          <div className="bg-[#031814]/85 rounded-2xl p-6 border border-teal-800/60 hover:border-amber-400/60 hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group backdrop-blur-xl">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-900 text-amber-400 flex items-center justify-center shadow-lg shadow-emerald-950/40 group-hover:scale-110 transition-transform border border-emerald-400/30">
                <PhoneCall className="w-6 h-6" />
              </div>

              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-teal-200 bg-teal-950/80 px-2.5 py-1 rounded-full border border-teal-700/60">
                <Volume2 className="w-3 h-3 text-amber-400" />
                <span>5 Indian Languages</span>
              </div>

              <h3 className="text-xl font-bold text-white">
                Multilingual AI Voice Calls
              </h3>

              <p className="text-sm text-teal-100/90 leading-relaxed">
                Human-like AI outbound calls in English, Hindi, Kannada, Tamil, and Telugu to push for site visits.
              </p>

              {/* Language Selector Preview */}
              <div className="bg-[#020d0a]/90 p-3 rounded-xl border border-teal-900 space-y-2 text-xs">
                <div className="flex flex-wrap gap-1">
                  {languageSamples.map((v) => (
                    <button
                      key={v.code}
                      onClick={() => handleVoiceChange(v.code)}
                      className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                        selectedVoice === v.code
                          ? 'bg-amber-400 text-gray-950'
                          : 'bg-teal-950/80 text-teal-200 hover:bg-teal-900'
                      }`}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>

                <div className="p-2 bg-teal-950/90 rounded-lg flex items-center justify-between border border-teal-800/60">
                  <span className="text-[11px] font-semibold text-teal-100">
                    {activeSample.label} AI Voice Agent
                  </span>
                  <button
                    onClick={toggleAudio}
                    disabled={audioError}
                    className={`p-1 ${audioError ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-amber-400 text-gray-950 hover:bg-amber-300 cursor-pointer'} rounded transition-colors`}
                    title={audioError ? "Sample coming soon" : "Play audio sample"}
                  >
                    {audioError ? <Volume2 className="w-3.5 h-3.5" /> : isPlayingAudio ? <Volume2 className="w-3.5 h-3.5 animate-bounce" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-teal-900/80 mt-6">
              <span className="text-xs font-bold text-amber-400 group-hover:text-amber-300 flex items-center gap-1">
                Listen to Audio Samples <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* Pillar 3: Relentless Auto-Follow-Up */}
          <div className="bg-[#031814]/85 rounded-2xl p-6 border border-teal-800/60 hover:border-amber-400/60 hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group backdrop-blur-xl">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-900 text-amber-400 flex items-center justify-center shadow-lg shadow-emerald-950/40 group-hover:scale-110 transition-transform border border-emerald-400/30">
                <RefreshCw className="w-6 h-6" />
              </div>

              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-300 bg-amber-950/80 px-2.5 py-1 rounded-full border border-amber-700/60">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Zero Cold Leads</span>
              </div>

              <h3 className="text-xl font-bold text-white">
                Relentless Auto-Follow-Up
              </h3>

              <p className="text-sm text-teal-100/90 leading-relaxed">
                Never drop a cold lead. The AI follows up until they respond, freeing your brokers from manual CRM updates.
              </p>

              {/* Drip Sequence Box */}
              <div className="bg-[#020d0a]/90 p-3 rounded-xl border border-teal-900 space-y-2 text-xs">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-teal-300/80 font-semibold">Day 1: Instant Call</span>
                  <span className="text-emerald-400 font-bold">Done</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-teal-300/80 font-semibold">Day 3: Price Update SMS</span>
                  <span className="text-emerald-400 font-bold">Done</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-teal-300/80 font-semibold">Day 7: Virtual Walkthrough</span>
                  <span className="text-amber-400 font-bold">Scheduled</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-teal-900/80 mt-6">
              <span className="text-xs font-bold text-amber-400 group-hover:text-amber-300 flex items-center gap-1">
                View Drip Sequences <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* Pillar 4: Ad Generation & ROI Tracking */}
          <div className="bg-[#031814]/85 rounded-2xl p-6 border border-teal-800/60 hover:border-amber-400/60 hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group backdrop-blur-xl">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-900 text-amber-400 flex items-center justify-center shadow-lg shadow-emerald-950/40 group-hover:scale-110 transition-transform border border-emerald-400/30">
                <BarChart3 className="w-6 h-6" />
              </div>

              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-300 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-700/60">
                <ShieldCheck className="w-3 h-3 text-amber-400" />
                <span>Meta & Google Sync</span>
              </div>

              <h3 className="text-xl font-bold text-white">
                Ad Generation & ROI Tracking
              </h3>

              <p className="text-sm text-teal-100/90 leading-relaxed">
                Turn property listings into high-converting ads and track the exact return on your ad spend in one dashboard.
              </p>

              {/* Performance Indicator */}
              <div className="bg-[#020d0a]/90 p-3 rounded-xl border border-teal-900 space-y-2 text-xs">
                <div className="flex justify-between items-baseline">
                  <span className="text-teal-300/80 font-semibold">Meta Ad Spend:</span>
                  <span className="font-bold text-white">₹1,50,000</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-teal-300/80 font-semibold">Site Visits Booked:</span>
                  <span className="font-bold text-amber-400">62 Visits</span>
                </div>
                <div className="flex justify-between items-baseline pt-1 border-t border-teal-900">
                  <span className="text-teal-100 font-bold">Tracked Ad ROI:</span>
                  <span className="font-black text-emerald-400 text-sm">16.4x</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-teal-900/80 mt-6">
              <span className="text-xs font-bold text-amber-400 group-hover:text-amber-300 flex items-center gap-1">
                Check Ad Dashboard <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

        </div>

        {/* Bottom Banner inside Features */}
        <div className="mt-12 bg-gradient-to-r from-[#03231c] via-[#052d24] to-[#021813] text-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl border border-teal-700/60 backdrop-blur-xl">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-xl sm:text-2xl font-bold text-white">
              Want to see these 4 pillars working live for your project?
            </h4>
            <p className="text-teal-100/90 text-sm">
              We set up custom AI prompts for your exact property pricing, amenities, and location.
            </p>
          </div>

          <button
            onClick={onOpenDemo}
            className="px-6 py-3 bg-amber-400 hover:bg-amber-300 text-gray-950 font-extrabold text-sm rounded-xl shrink-0 shadow-lg shadow-amber-400/20 transition-transform transform hover:scale-105"
          >
            Schedule 15-Min Live Setup
          </button>
        </div>

      </div>
    </section>
  );
};
