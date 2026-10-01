import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Volume2, VolumeX, Play, ChevronRight, Phone, Mic, MicOff, PhoneOff, Sparkles, Activity, RefreshCw } from 'lucide-react';
import { languageSamples } from '../data/languageSamples';
import { voiceEngine } from '../services/voiceEngine';
import { voiceCache } from '../utils/voiceCache';

interface AiDemoSimulatorProps {
  onOpenDemo: () => void;
}

export const AiDemoSimulator: React.FC<AiDemoSimulatorProps> = ({ onOpenDemo }) => {
  const [transcripts] = useState(languageSamples);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [callDuration, setCallDuration] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);

  const isPlayingRef = useRef(false);
  const transcriptAreaRef = useRef<HTMLDivElement>(null);
  const timerIntervalRef = useRef<any>(null);
  const stepTimeoutRef = useRef<any>(null);

  const currentSample = transcripts.find(s => s.code === selectedLanguage) || transcripts[0];
  const conversation = currentSample.conversation || [];

  // Auto pre-cache core languages (English, Hindi, and Kannada) in IndexedDB
  useEffect(() => {
    voiceCache.preCacheCoreLanguages(transcripts, ['en', 'hi', 'kn']).catch((err) => {
      console.warn('[AiDemoSimulator] Error pre-caching core languages:', err);
    });
  }, [transcripts]);

  const stopPlaying = useCallback(() => {
    if (stepTimeoutRef.current) {
      clearTimeout(stepTimeoutRef.current);
      stepTimeoutRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    voiceEngine.stop();
    setIsPlaying(false);
    setIsSpeaking(false);
    isPlayingRef.current = false;
    setCallDuration(0);
  }, []);

  const handleLanguageChange = (code: string) => {
    stopPlaying();
    setSelectedLanguage(code);
    setCurrentStep(0);
    
    // Preload first turn of selected language
    const sample = transcripts.find(s => s.code === code);
    if (sample && sample.conversation?.[0]) {
      voiceEngine.preload(sample.conversation[0].text, code, sample.conversation[0].sender);
    }
  };

  const playMessage = useCallback((index: number) => {
    if (!isPlayingRef.current) return;

    if (index >= conversation.length) {
      // Completed full dialogue
      stepTimeoutRef.current = setTimeout(() => {
        if (isPlayingRef.current) {
          stopPlaying();
        }
      }, 1500);
      return;
    }

    setCurrentStep(index + 1);
    const msg = conversation[index];
    const lang = selectedLanguage;

    // Preload next message in queue
    const nextMsg = conversation[index + 1];
    if (nextMsg) {
      voiceEngine.preload(nextMsg.text, lang, nextMsg.sender, nextMsg.audioSrc);
    }

    voiceEngine.playVoice({
      text: msg.text,
      lang: lang,
      sender: msg.sender,
      audioSrc: msg.audioSrc,
      emotion: msg.emotion,
      onStart: () => {
        if (isPlayingRef.current) {
          setIsSpeaking(true);
        }
      },
      onEnd: () => {
        if (!isPlayingRef.current) return;
        setIsSpeaking(false);

        // Natural conversational pause between turns
        stepTimeoutRef.current = setTimeout(() => {
          if (isPlayingRef.current) {
            playMessage(index + 1);
          }
        }, 400);
      },
      onError: (err) => {
        console.warn('[Simulator] Voice message fallback triggered', err);
        if (!isPlayingRef.current) return;
        stepTimeoutRef.current = setTimeout(() => {
          if (isPlayingRef.current) {
            playMessage(index + 1);
          }
        }, 800);
      }
    });
  }, [conversation, selectedLanguage, stopPlaying]);

  const startPlaying = () => {
    stopPlaying();
    setIsPlaying(true);
    isPlayingRef.current = true;
    setCallDuration(0);
    setCurrentStep(0);

    timerIntervalRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    playMessage(0);
  };

  const togglePlay = () => {
    if (isPlaying) {
      stopPlaying();
    } else {
      startPlaying();
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    voiceEngine.setMuted(nextMuted);
  };

  const toggleSpeaker = () => {
    setSpeakerOn(prev => !prev);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Scroll transcript down smoothly
  useEffect(() => {
    if (transcriptAreaRef.current) {
      transcriptAreaRef.current.scrollTop = transcriptAreaRef.current.scrollHeight;
    }
  }, [currentStep, isPlaying, isSpeaking]);

  // Preload initial greeting on mount
  useEffect(() => {
    if (conversation[0]) {
      voiceEngine.preload(conversation[0].text, selectedLanguage, conversation[0].sender);
    }
  }, [selectedLanguage, conversation]);

  useEffect(() => {
    return () => {
      stopPlaying();
    };
  }, [stopPlaying]);

  return (
    <section className="py-24 bg-transparent relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Column: Controls & Info */}
          <div className="space-y-8 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-950/80 text-teal-200 text-xs font-bold border border-teal-800/80 shadow-md backdrop-blur-md mb-6">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>Gemini Flash Live Voice AI Simulator</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight drop-shadow-md leading-tight">
                Experience Natural <span className="text-amber-400">Fluent Human</span> Voice AI
              </h2>

              <p className="mt-5 text-base sm:text-lg text-teal-100">
                Listen to Samruddhi AI converse with authentic human inflection, regional cadence, and natural pauses in multiple Indian languages — qualifying leads and scheduling visits effortlessly.
              </p>
            </div>

            {/* Language Selector */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-teal-400 uppercase tracking-widest">Select Language</h3>
                <span className="text-[11px] text-teal-400/80 font-medium">Native Accent & Emotion</span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {transcripts.map((s) => (
                  <button
                    key={s.code}
                    onClick={() => handleLanguageChange(s.code)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                      selectedLanguage === s.code
                        ? 'bg-[#ffb300] text-gray-950 shadow-lg shadow-amber-500/20 scale-105 ring-2 ring-amber-300'
                        : 'bg-teal-900/60 text-teal-200 border border-teal-800/80 hover:bg-teal-800/90'
                    }`}
                  >
                    <span className="text-base">{s.flag}</span>
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Play Controls */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                onClick={togglePlay}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-black text-lg transition-all cursor-pointer ${
                  isPlaying
                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-[0_0_30px_rgba(239,68,68,0.4)]'
                    : 'bg-[#ffb300] hover:bg-amber-400 text-gray-950 shadow-[0_0_30px_rgba(255,179,0,0.35)] active:scale-95'
                }`}
              >
                {isPlaying ? (
                  <>
                    <PhoneOff className="w-6 h-6 fill-current" />
                    <span>End Voice Call</span>
                  </>
                ) : (
                  <>
                    <Play className="w-6 h-6 fill-current" />
                    <span>Simulate Call in {currentSample.label}</span>
                  </>
                )}
              </button>

              {isPlaying && (
                <button
                  onClick={() => {
                    stopPlaying();
                    setTimeout(startPlaying, 100);
                  }}
                  className="px-4 py-4 rounded-2xl bg-teal-900/60 hover:bg-teal-800 text-teal-200 border border-teal-700/60 flex items-center justify-center gap-2 text-sm font-bold cursor-pointer"
                  title="Restart Conversation"
                >
                  <RefreshCw className="w-5 h-5 text-amber-400" />
                  <span className="hidden sm:inline">Restart</span>
                </button>
              )}
            </div>

            <button
              onClick={onOpenDemo}
              className="w-full sm:w-auto px-8 py-3.5 bg-teal-950/90 hover:bg-teal-900 text-teal-200 font-bold text-sm rounded-xl border border-teal-700/60 transition-colors flex items-center justify-center gap-2 cursor-pointer mt-4 shadow-md"
            >
              <span>Deploy AI Voice Model For Your Projects</span>
              <ChevronRight className="w-4 h-4 text-amber-400" />
            </button>
          </div>

          {/* Right Column: Realistic Phone UI */}
          <div className="flex justify-center items-center relative z-10">
            {/* Phone Body */}
            <div className="w-[320px] sm:w-[360px] h-[640px] sm:h-[700px] bg-gray-950 rounded-[3rem] p-3.5 shadow-2xl relative border-[6px] border-gray-800 flex shrink-0 ring-4 ring-gray-900/50 shadow-[#004d40]/30">
              
              {/* Inner Screen */}
              <div className="bg-[#0b141a] w-full h-full rounded-[2.2rem] overflow-hidden flex flex-col relative border border-gray-800/80">
                
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-950 rounded-b-2xl z-20 flex justify-center items-center shadow-sm">
                   <div className="w-12 h-1 bg-gray-800 rounded-full"></div>
                </div>

                {/* Call Header */}
                <div className="pt-10 pb-4 bg-gradient-to-b from-teal-950/90 via-[#0e1f26] to-[#0b141a] flex flex-col items-center justify-center border-b border-teal-900/30 shrink-0 z-10">
                  <div className="relative mt-2">
                    <div className={`w-16 h-16 bg-gradient-to-br from-teal-400 to-[#004d40] rounded-full flex items-center justify-center mb-2 shadow-xl transition-transform ${isPlaying ? 'ring-4 ring-amber-400/50 scale-105' : ''}`}>
                      <Phone className="w-7 h-7 text-white fill-current" />
                    </div>
                    {isPlaying && (
                      <div className="absolute -inset-1 rounded-full border-2 border-amber-400 animate-ping opacity-60"></div>
                    )}
                  </div>
                  <h3 className="text-white font-bold text-lg tracking-wide flex items-center gap-1.5">
                    Samruddhi AI
                    {isPlaying && <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-amber-400 text-xs font-mono font-bold bg-teal-950/80 px-2.5 py-0.5 rounded-full border border-teal-800/60 flex items-center gap-1.5">
                      {isPlaying ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                          <span>Connected • {formatTimer(callDuration)}</span>
                        </>
                      ) : (
                        <span>Ready for Call</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Transcript Area */}
                <div 
                  ref={transcriptAreaRef}
                  className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-[#0b141a] to-teal-950/20 scroll-smooth flex flex-col pb-6"
                >
                  {currentStep > 0 && conversation.slice(0, currentStep).map((msg, idx) => {
                    const isLatest = idx === currentStep - 1 && isPlaying;
                    return (
                      <div key={idx} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
                        <div className={`px-4 py-3 rounded-2xl max-w-[88%] text-[13px] leading-relaxed shadow-md relative transition-all ${
                          msg.sender === 'user' 
                            ? 'bg-[#005c4b] text-white rounded-br-none ring-1 ring-emerald-400/20' 
                            : 'bg-[#202c33] text-gray-100 rounded-bl-none border border-teal-800/40'
                        }`}>
                          <p>{msg.text}</p>
                          {isLatest && (
                            <div className="flex items-center gap-1.5 mt-2 pt-1 border-t border-white/10 text-[10px] text-amber-300 font-medium">
                              <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                              <span>{msg.sender === 'bot' ? 'Samruddhi AI Speaking' : 'Buyer Answering'}</span>
                              <div className="flex items-center gap-0.5 ml-auto">
                                <span className="w-1 h-3 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                <span className="w-1 h-4 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                <span className="w-1 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {isPlaying && currentStep < conversation.length && isSpeaking && (
                     <div className="flex justify-start animate-in fade-in duration-300 mt-2">
                        <div className="px-4 py-2.5 bg-[#202c33] rounded-2xl rounded-bl-none text-teal-300 text-xs flex items-center gap-2 border border-teal-800/40 shadow-sm">
                          <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                          <span className="text-[11px] font-medium tracking-wide">
                            Voice AI Active...
                          </span>
                        </div>
                     </div>
                  )}

                  {!isPlaying && currentStep === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center px-6 opacity-80">
                       <div className="w-14 h-14 rounded-2xl bg-teal-950/60 border border-teal-800/80 flex items-center justify-center mb-3 text-amber-400 shadow-inner">
                         <Mic className="w-7 h-7" />
                       </div>
                       <h4 className="text-white font-bold text-sm mb-1">Live Voice Engine Ready</h4>
                       <p className="text-teal-400 text-xs leading-relaxed max-w-[240px]">
                         Choose any language above and hit play to experience fluent, human-like voice AI conversations.
                       </p>
                    </div>
                  )}
                </div>

                {/* Call Controls */}
                <div className="p-5 bg-[#0b141a] border-t border-gray-800/80 flex justify-around items-center shrink-0">
                   <button 
                     onClick={toggleMute}
                     className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                       isMuted ? 'bg-red-900/60 text-red-300 border border-red-500/50' : 'bg-gray-800/80 hover:bg-gray-700 text-gray-300'
                     }`}
                     title={isMuted ? 'Unmute' : 'Mute'}
                   >
                      {isMuted ? <MicOff className="w-5 h-5 text-red-400" /> : <Mic className="w-5 h-5" />}
                   </button>
                   <button 
                     onClick={isPlaying ? stopPlaying : togglePlay}
                     className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-xl cursor-pointer ${
                       isPlaying 
                         ? 'bg-red-500 hover:bg-red-600 shadow-[0_0_20px_rgba(239,68,68,0.5)] scale-110' 
                         : 'bg-emerald-500 hover:bg-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.5)] hover:scale-105'
                     }`}
                     title={isPlaying ? 'Hang Up' : 'Start Call'}
                   >
                      {isPlaying ? (
                        <PhoneOff className="w-7 h-7 text-white fill-current" />
                      ) : (
                        <Phone className="w-7 h-7 text-white fill-current" />
                      )}
                   </button>
                   <button 
                     onClick={toggleSpeaker}
                     className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                       speakerOn ? 'bg-teal-900/60 text-teal-300 border border-teal-500/40' : 'bg-gray-800/80 hover:bg-gray-700 text-gray-400'
                     }`}
                     title={speakerOn ? 'Speaker On' : 'Speaker Off'}
                   >
                      {speakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                   </button>
                </div>
                
              </div>
            </div>
            
            {/* Background Glow behind Phone */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-teal-500/10 blur-[100px] rounded-full -z-10 pointer-events-none"></div>
          </div>
          
        </div>
      </div>
    </section>
  );
};
