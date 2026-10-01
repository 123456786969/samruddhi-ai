import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  RotateCcw, 
  Radio, 
  Sparkles, 
  Activity, 
  CheckCircle2, 
  PhoneCall, 
  ArrowRight,
  Headphones,
  HardDriveDownload,
  Wifi,
  WifiOff,
  Zap,
  ShieldCheck,
  Globe2,
  Sliders,
  Cpu
} from 'lucide-react';
import { languageSamples, LanguageSample } from '../../data/languageSamples';
import { voiceEngine } from '../../services/voiceEngine';
import { voiceCache, VoiceCacheStats } from '../../utils/voiceCache';
import { offlineVoiceCache, CacheStorageMetrics } from '../../services/offlineVoiceCache';

interface VoiceHardwareSimulatorProps {
  onOpenDemo?: () => void;
  selectedLangCode?: string;
  onLanguageChange?: (code: string) => void;
}

type EngineState = 'READY' | 'LISTENING' | 'PROCESSING' | 'TRANSMITTING';

export const VoiceHardwareSimulator: React.FC<VoiceHardwareSimulatorProps> = ({ 
  onOpenDemo,
  selectedLangCode: externalLangCode,
  onLanguageChange: externalLangChange
}) => {
  const [internalLangCode, setInternalLangCode] = useState<string>('en');
  const selectedLangCode = externalLangCode || internalLangCode;

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [engineState, setEngineState] = useState<EngineState>('READY');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [latencyMs, setLatencyMs] = useState<number>(0);
  const [activeSpeaker, setActiveSpeaker] = useState<'bot' | 'user' | null>(null);

  // Offline Caching & Metrics State
  const [isOfflineSimulated, setIsOfflineSimulated] = useState<boolean>(false);
  const [isPreloading, setIsPreloading] = useState<boolean>(false);
  const [preloadProgress, setPreloadProgress] = useState<{ completed: number; total: number } | null>(null);
  const [voiceCacheStats, setVoiceCacheStats] = useState<VoiceCacheStats>({
    totalItems: 0,
    totalSizeBytes: 0,
    totalSizeFormatted: '0 KB',
    languagesCached: [],
    isOfflineReady: false,
    coreLanguagesReady: false
  });
  const [cacheMetrics, setCacheMetrics] = useState<CacheStorageMetrics>({
    totalItems: 0,
    totalSizeBytes: 0,
    totalSizeFormatted: '0 KB',
    tokensSaved: 0,
    bandwidthSavedFormatted: '0 MB',
    isOfflineReady: false,
    languagesCached: []
  });

  const activeSample: LanguageSample = languageSamples.find(s => s.code === selectedLangCode) || languageSamples[0];
  const conversation = activeSample.conversation || [];

  // Subscribe to voiceCache IndexedDB telemetry and auto-cache core languages (EN, HI, KN)
  useEffect(() => {
    const unsubVoiceCache = voiceCache.subscribe((stats) => {
      setVoiceCacheStats(stats);
    });

    const unsubOffline = offlineVoiceCache.subscribe((metrics) => {
      setCacheMetrics(metrics);
    });

    // Auto-cache English, Hindi, and Kannada on initial load into IndexedDB
    voiceCache.preCacheCoreLanguages(languageSamples, ['en', 'hi', 'kn']).catch((err) => {
      console.warn('[VoiceHardwareSimulator] Error pre-caching core languages:', err);
    });

    return () => {
      unsubVoiceCache();
      unsubOffline();
    };
  }, []);

  // Micro-jitter for real-time edge latency display
  useEffect(() => {
    const interval = setInterval(() => {
      if (isPlaying) {
        // If cached or offline, latency is instantaneous 0-4ms edge compute
        if (isOfflineSimulated || cacheMetrics.isOfflineReady) {
          setLatencyMs(Math.floor(Math.random() * 4)); // 0-4ms instant edge cache!
        } else {
          setLatencyMs(Math.floor(40 + Math.random() * 25)); // Ultra-fast sub-70ms
        }
      } else {
        setLatencyMs(0);
      }
    }, 1200);
    return () => clearInterval(interval);
  }, [isPlaying, isOfflineSimulated, cacheMetrics.isOfflineReady]);

  // Handle conversation step playback with zero-lag edge caching
  const playStep = (stepIdx: number) => {
    if (stepIdx >= conversation.length) {
      setIsPlaying(false);
      setEngineState('READY');
      setActiveSpeaker(null);
      setCurrentStepIndex(0);
      return;
    }

    const item = conversation[stepIdx];
    setCurrentStepIndex(stepIdx);
    setActiveSpeaker(item.sender);

    if (item.sender === 'bot') {
      setEngineState('TRANSMITTING');
    } else {
      setEngineState('LISTENING');
    }

    voiceEngine.playVoice({
      lang: selectedLangCode,
      sender: item.sender,
      text: item.text,
      audioSrc: item.audioSrc,
      stepIndex: stepIdx,
      emotion: item.emotion,
      onStart: () => {
        setIsPlaying(true);
      },
      onEnd: () => {
        // Natural turn-taking pause (400ms)
        setEngineState('PROCESSING');
        setTimeout(() => {
          playStep(stepIdx + 1);
        }, 450);
      },
      onError: () => {
        setIsPlaying(false);
        setEngineState('READY');
      }
    });
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      voiceEngine.stop();
      setIsPlaying(false);
      setEngineState('READY');
      setActiveSpeaker(null);
    } else {
      playStep(0);
    }
  };

  const handleReset = () => {
    voiceEngine.stop();
    setIsPlaying(false);
    setEngineState('READY');
    setCurrentStepIndex(0);
    setActiveSpeaker(null);
  };

  const handleLanguageSelect = (code: string) => {
    voiceEngine.stop();
    setIsPlaying(false);
    setEngineState('READY');
    setCurrentStepIndex(0);
    setActiveSpeaker(null);

    if (externalLangChange) {
      externalLangChange(code);
    } else {
      setInternalLangCode(code);
    }
  };

  const handleToggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    voiceEngine.setMuted(newMuted);
  };

  const handleToggleOfflineMode = () => {
    const nextState = !isOfflineSimulated;
    setIsOfflineSimulated(nextState);
    offlineVoiceCache.setSimulatedOffline(nextState);
  };

  const handlePreloadAllPacks = async () => {
    if (isPreloading) return;
    setIsPreloading(true);
    try {
      // 1. Cache to voiceCache IndexedDB utility
      for (const sample of languageSamples) {
        if (sample.conversation) {
          await voiceCache.cacheVoicePack(sample.code, sample.conversation, (completed, total) => {
            setPreloadProgress({ completed, total });
          });
        }
      }
      // 2. Sync to offlineVoiceCache
      await offlineVoiceCache.preCacheAllVoicePacks(
        languageSamples,
        (completed, total) => {
          setPreloadProgress({ completed, total });
        }
      );
    } finally {
      setIsPreloading(false);
      setTimeout(() => setPreloadProgress(null), 2500);
    }
  };

  // Status mapping
  const statusBadgeText = {
    READY: '[ SYSTEM READY ]',
    LISTENING: '[ INCOMING VOICE ]',
    PROCESSING: '[ NEURAL COMPUTE ]',
    TRANSMITTING: '[ SYNTHESIZING VOICE ]'
  }[engineState];

  return (
    <div id="voice-simulator" className="relative w-full max-w-5xl mx-auto py-8 px-4 sm:px-6">
      {/* Ambient background glow behind hardware frame */}
      <div 
        className={`absolute -inset-4 rounded-3xl blur-3xl opacity-30 transition-all duration-1000 pointer-events-none ${
          isPlaying 
            ? 'bg-gradient-to-tr from-[#D4AF37]/40 via-emerald-500/25 to-[#D4AF37]/30' 
            : 'bg-gradient-to-tr from-[#141414] via-[#D4AF37]/15 to-[#141414]'
        }`}
      />

      {/* Main Hardware Console Chassis */}
      <div className="relative rounded-3xl bg-[#0E0E10]/95 backdrop-blur-2xl border border-white/[0.09] shadow-[0_30px_90px_rgba(0,0,0,0.85)] overflow-hidden">
        
        {/* Top Hardware Header & Real-time Caching Status */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 md:px-8 py-4 border-b border-white/[0.06] bg-[#0A0A0C]/90">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full transition-colors duration-500 ${
                isPlaying ? 'bg-[#D4AF37] animate-ping' : 'bg-emerald-500'
              }`} />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 -ml-4.5" />
            </div>
            <div>
              <div className="font-mono text-xs text-[#F4F4F5] font-bold tracking-wider flex items-center gap-2">
                <span>SAMRUDDHI NEURAL VOCODER</span>
                <span className="text-[#D4AF37] text-[10px] bg-[#D4AF37]/10 px-2 py-0.5 rounded border border-[#D4AF37]/30">
                  7-DIALECT NEURAL CORE
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Offline Simulation Toggle */}
            <button
              onClick={handleToggleOfflineMode}
              title={isOfflineSimulated ? 'Exit Offline Simulation' : 'Simulate Offline Flight Mode (0ms Local Playback)'}
              className={`px-3 py-1 rounded-full font-mono text-[11px] font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
                isOfflineSimulated 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm shadow-amber-500/20' 
                  : 'bg-white/[0.04] text-zinc-300 hover:text-white border-white/10 hover:border-white/20'
              }`}
            >
              {isOfflineSimulated ? (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                  <span>OFFLINE MODE (0ms CACHE)</span>
                </>
              ) : (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span>CELLULAR ONLINE</span>
                </>
              )}
            </button>

            {/* Status indicator */}
            <div className={`px-3 py-1 rounded-full font-mono text-[11px] uppercase tracking-widest border transition-all duration-300 ${
              engineState === 'READY' 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/40 shadow-sm shadow-[#D4AF37]/20'
            }`}>
              {statusBadgeText}
            </div>

            {/* Latency Meter */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-[11px] text-zinc-300 bg-white/[0.03] border border-white/[0.08]">
              <Zap className="w-3 h-3 text-[#D4AF37]" />
              <span>{latencyMs}ms Edge</span>
            </div>
          </div>
        </div>

        {/* Dialect Selector Bar */}
        <div className="px-6 md:px-8 py-3.5 bg-black/50 border-b border-white/[0.04] flex items-center justify-between gap-4 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-zinc-400 mr-2 shrink-0">
              <Globe2 className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Language:</span>
            </div>
            {languageSamples.map((sample) => (
              <button
                key={sample.code}
                onClick={() => handleLanguageSelect(sample.code)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  selectedLangCode === sample.code
                    ? 'bg-gradient-to-r from-[#D4AF37] to-[#E5C358] text-[#0A0A0A] font-bold shadow-md shadow-[#D4AF37]/25 scale-102'
                    : 'bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08] border border-white/[0.05]'
                }`}
              >
                <span>{sample.label}</span>
                {selectedLangCode === sample.code && <span className="w-1.5 h-1.5 rounded-full bg-[#0A0A0A]" />}
              </button>
            ))}
          </div>

          {/* Quick Offline Cache Sync Action */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            <button
              onClick={handlePreloadAllPacks}
              disabled={isPreloading}
              className="px-3 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10.5px] font-mono flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <HardDriveDownload className="w-3 h-3 text-emerald-400" />
              <span>
                {isPreloading 
                  ? `Caching (${preloadProgress ? `${preloadProgress.completed}/${preloadProgress.total}` : '...'})` 
                  : cacheMetrics.isOfflineReady 
                  ? 'All 7 Packs Cached (0ms)' 
                  : 'Preload Offline Voice Packs'}
              </span>
            </button>
          </div>
        </div>

        {/* Active Localized Voice Persona & Formant Strip */}
        <div className="px-6 md:px-8 py-3 bg-[#111114] border-b border-white/[0.05] flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <img 
              src={activeSample.personaAvatar} 
              alt={activeSample.persona}
              referrerPolicy="no-referrer"
              className="w-7 h-7 rounded-full object-cover border border-[#D4AF37]/50 shadow-sm"
            />
            <div>
              <div className="font-semibold text-white flex items-center gap-2">
                <span>{activeSample.persona}</span>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30">
                  {activeSample.accent}
                </span>
              </div>
              <div className="text-[10.5px] text-zinc-400 font-mono flex items-center gap-3">
                <span>Emotion: <strong className="text-emerald-300 font-normal">{activeSample.emotion}</strong></span>
                <span>•</span>
                <span>Cadence: <strong className="text-zinc-300 font-normal">{activeSample.cadence}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono text-[10.5px] text-zinc-400">
            <div className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              <CheckCircle2 className="w-3 h-3" />
              <span>IndexedDB Cache: Ready</span>
            </div>
            <div className="text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              <span>{cacheMetrics.bandwidthSavedFormatted}</span>
            </div>
          </div>
        </div>

        {/* Central Audio Waveform & Conversation Stage */}
        <div className="p-6 md:p-8 space-y-6">
          {/* Main Visualizer Bar Display */}
          <div className="relative p-6 md:p-8 rounded-2xl bg-[#070709] border border-white/[0.06] overflow-hidden flex flex-col items-center justify-center min-h-[160px]">
            {/* Background grid lines */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

            {/* Glowing Center Waveform */}
            <div className="relative z-10 w-full flex items-center justify-center gap-1.5 sm:gap-2 h-20">
              {[40, 65, 25, 85, 45, 95, 70, 30, 90, 60, 100, 75, 45, 80, 35, 90, 55, 70, 40, 85, 30, 65].map((heightPct, idx) => {
                const isActive = isPlaying;
                const dynamicHeight = isActive 
                  ? Math.max(15, (heightPct * (0.6 + Math.sin(idx + Date.now() * 0.003) * 0.4)))
                  : 12;

                return (
                  <motion.div
                    key={idx}
                    animate={{
                      height: `${dynamicHeight}%`,
                      backgroundColor: isActive ? '#D4AF37' : 'rgba(255,255,255,0.15)'
                    }}
                    transition={{
                      duration: 0.25,
                      repeat: isActive ? Infinity : 0,
                      repeatType: 'reverse',
                      delay: idx * 0.04
                    }}
                    className={`w-1.5 sm:w-2 rounded-full transition-colors ${
                      isActive ? 'shadow-[0_0_14px_rgba(212,175,55,0.85)]' : ''
                    }`}
                  />
                );
              })}
            </div>

            {/* Active Dialogue Snippet Overlay */}
            <div className="mt-4 text-center max-w-xl z-10">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStepIndex + selectedLangCode}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-1"
                >
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#D4AF37]">
                    {activeSpeaker === 'bot' 
                      ? `✦ AI Telephony Agent (${activeSample.persona.split('—')[0].trim()})` 
                      : activeSpeaker === 'user' 
                      ? '👤 Prospect (Vikram • Home Buyer)' 
                      : 'Zero-Lag Voice Ready'}
                  </div>
                  <p className="text-sm md:text-base text-[#F4F4F5] font-serif italic line-clamp-2 px-4">
                    "{isPlaying ? conversation[currentStepIndex]?.text : activeSample.transcript}"
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Conversation Dialogue Timeline */}
          <div className="space-y-2.5 max-h-[210px] overflow-y-auto pr-2 scrollbar-none">
            {conversation.map((msg, idx) => {
              const isCurrent = idx === currentStepIndex && isPlaying;
              const isPast = idx < currentStepIndex && isPlaying;

              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: msg.sender === 'bot' ? -10 : 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`p-3 rounded-xl text-xs md:text-sm flex items-start gap-3 transition-all ${
                    isCurrent
                      ? 'bg-[#181610] border border-[#D4AF37]/50 shadow-sm shadow-[#D4AF37]/15 ring-1 ring-[#D4AF37]/30'
                      : isPast
                      ? 'bg-white/[0.02] border border-white/[0.04] opacity-60'
                      : 'bg-white/[0.01] border border-transparent opacity-80'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                    msg.sender === 'bot'
                      ? 'bg-[#D4AF37]/20 text-[#D4AF37]'
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {msg.sender === 'bot' ? <Sparkles className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                        <span>{msg.sender === 'bot' ? activeSample.persona.split('—')[0].trim() : 'Prospect (Vikram)'}</span>
                        {msg.emotion && (
                          <span className="text-[9px] text-zinc-500 font-mono lowercase bg-white/5 px-1.5 py-0.2 rounded">
                            {msg.emotion}
                          </span>
                        )}
                      </span>
                      {isCurrent && (
                        <span className="font-mono text-[9px] text-[#D4AF37] font-bold animate-pulse flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                          SPEAKING (0ms)
                        </span>
                      )}
                    </div>
                    <p className={`leading-relaxed ${isCurrent ? 'text-white font-medium' : 'text-zinc-300'}`}>
                      {msg.text}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Controls Console */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/[0.06]">
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleTogglePlay}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C358] text-[#0A0A0A] font-bold text-xs uppercase tracking-widest flex items-center gap-2.5 shadow-lg shadow-[#D4AF37]/20 transition-transform cursor-pointer"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span>Halt Simulation</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Simulate {activeSample.label} Call</span>
                  </>
                )}
              </motion.button>

              <button
                onClick={handleReset}
                title="Reset Conversation"
                className="p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={handleToggleMute}
                title={isMuted ? 'Unmute' : 'Mute'}
                className="p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-zinc-400 bg-white/[0.02] px-3 py-1.5 rounded-lg border border-white/[0.05]">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tokens Saved: <strong className="text-emerald-300">{cacheMetrics.tokensSaved.toLocaleString()}</strong></span>
              </div>

              {onOpenDemo && (
                <button
                  onClick={onOpenDemo}
                  className="text-xs font-mono uppercase tracking-widest text-[#D4AF37] hover:text-white flex items-center gap-1.5 transition-colors group cursor-pointer"
                >
                  <span>Deploy Voice Core</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
