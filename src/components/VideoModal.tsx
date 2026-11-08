import React, { useState, useEffect } from 'react';
import { X, Play, Pause, Volume2, MessageSquare, PhoneCall, CheckCircle2, ChevronRight } from 'lucide-react';
import { WHATSAPP_SIMULATION_CHAT } from '../data/mockData';
import { languageSamples } from '../data/languageSamples';
import { voiceEngine } from '../services/voiceEngine';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDemo: () => void;
}

export const VideoModal: React.FC<VideoModalProps> = ({ isOpen, onClose, onOpenDemo }) => {
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'voice' | 'crm'>('whatsapp');
  const [selectedLang, setSelectedLang] = useState('en');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const currentVoice = languageSamples.find(v => v.code === selectedLang) || languageSamples[0];

  const handleSelectLang = (code: string) => {
    voiceEngine.stop();
    setIsPlayingAudio(false);
    setSelectedLang(code);
    
    // Preload selected language sample
    const sample = languageSamples.find(v => v.code === code);
    if (sample) {
      voiceEngine.preload(sample.transcript, code, 'bot', sample.audioSrc);
    }
  };

  const toggleAudio = () => {
    if (isPlayingAudio) {
      voiceEngine.stop();
      setIsPlayingAudio(false);
    } else {
      voiceEngine.playVoice({
        text: currentVoice.transcript,
        lang: currentVoice.code,
        sender: 'bot',
        audioSrc: currentVoice.audioSrc,
        onStart: () => setIsPlayingAudio(true),
        onEnd: () => setIsPlayingAudio(false),
        onError: () => setIsPlayingAudio(false)
      });
    }
  };

  useEffect(() => {
    if (!isOpen) {
      voiceEngine.stop();
      setIsPlayingAudio(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-3xl bg-gray-900 text-white rounded-2xl shadow-2xl overflow-hidden border border-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-gray-800 bg-gray-950">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#004d40] flex items-center justify-center">
              <Play className="w-4 h-4 text-[#ffb300] fill-current" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Samruddhi AI Product Walkthrough</h3>
              <p className="text-xs text-gray-400">See how leads move from ad click to booked site visit in 3 minutes</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-800 bg-gray-950/60 px-6 pt-2">
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`flex items-center gap-2 py-3 px-4 font-medium text-xs border-b-2 transition-colors ${
              activeTab === 'whatsapp' 
                ? 'border-[#ffb300] text-[#ffb300]' 
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>1. WhatsApp Speed AI</span>
          </button>
          
          <button
            onClick={() => setActiveTab('voice')}
            className={`flex items-center gap-2 py-3 px-4 font-medium text-xs border-b-2 transition-colors ${
              activeTab === 'voice' 
                ? 'border-[#ffb300] text-[#ffb300]' 
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <PhoneCall className="w-4 h-4" />
            <span>2. Multilingual Voice Call</span>
          </button>

          <button
            onClick={() => setActiveTab('crm')}
            className={`flex items-center gap-2 py-3 px-4 font-medium text-xs border-b-2 transition-colors ${
              activeTab === 'crm' 
                ? 'border-[#ffb300] text-[#ffb300]' 
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>3. Instant Broker Handover</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 max-h-[65vh] overflow-y-auto">
          {activeTab === 'whatsapp' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Simulated WhatsApp Web Interface</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Avg Response Time: 6 Seconds
                </span>
              </div>

              <div className="bg-[#0b141a] p-4 rounded-xl border border-gray-800 space-y-3 font-sans text-xs">
                {WHATSAPP_SIMULATION_CHAT.map((msg, idx) => (
                  <div 
                    key={idx}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[85%] p-3 rounded-2xl relative ${
                        msg.sender === 'user'
                          ? 'bg-[#005c4b] text-white rounded-tr-none'
                          : 'bg-[#202c33] text-gray-100 rounded-tl-none border border-gray-700/50'
                      }`}
                    >
                      <p className="whitespace-pre-line text-xs">{msg.text}</p>
                      {msg.subtext && (
                        <p className="text-[10px] text-teal-300/80 mt-1 italic">{msg.subtext}</p>
                      )}
                      <span className="text-[9px] text-gray-400 block text-right mt-1">{msg.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'voice' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 mb-2">
                {languageSamples.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleSelectLang(lang.code)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      selectedLang === lang.code
                        ? 'bg-[#004d40] text-[#ffb300] border border-[#00695c]'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {lang.flag ? `${lang.flag} ` : ''}{lang.label}
                  </button>
                ))}
              </div>

              <div className="bg-gray-950 p-5 rounded-xl border border-gray-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-teal-900/60 border border-teal-500/30 flex items-center justify-center text-teal-300">
                      <PhoneCall className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">{currentVoice.label} AI Voice Agent</h4>
                      <p className="text-xs text-teal-400">Outbound Site Visit Sales Call</p>
                    </div>
                  </div>

                  <button
                    onClick={toggleAudio}
                    className="flex items-center gap-2 px-4 py-2 bg-[#ffb300] hover:bg-amber-400 text-gray-950 cursor-pointer font-bold text-xs rounded-lg transition-colors shadow-md"
                  >
                    {isPlayingAudio ? (
                      <>
                        <Pause className="w-4 h-4 fill-current" />
                        <span>Pause Audio</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current" />
                        <span>Listen Audio Sample</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Animated Waveform */}
                <div className="bg-gray-900 p-3 rounded-lg border border-gray-800 flex items-center justify-between gap-1">
                  {[40, 70, 25, 90, 60, 30, 80, 100, 45, 85, 30, 65, 95, 40, 75, 50, 90, 35, 60, 20].map((h, i) => (
                    <div
                      key={i}
                      className={`w-1 rounded-full transition-all duration-300 ${
                        isPlayingAudio ? 'bg-[#ffb300] animate-pulse' : 'bg-gray-700'
                      }`}
                      style={{ height: isPlayingAudio ? `${Math.max(12, Math.floor(h * Math.random()))}px` : '10px' }}
                    ></div>
                  ))}
                </div>

                <div className="space-y-2 text-xs">
                  <div className="text-gray-200 bg-gray-900/80 p-3.5 rounded-lg border border-gray-800 space-y-1">
                    <strong className="text-amber-400 block mb-1">Transcript ({currentVoice.label}):</strong>
                    <p style={{ lineHeight: currentVoice.code === 'en' ? 1.4 : 1.7 }}>
                      {currentVoice.transcript}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'crm' && (
            <div className="space-y-4">
              <div className="bg-gray-950 p-5 rounded-xl border border-gray-800 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Real-Time Broker Notification & CRM Push</span>
                </div>
                <p className="text-xs text-gray-300">
                  The second a site visit is confirmed, Samruddhi AI generates a structured lead dossier and notifies the sales manager via WhatsApp, SMS, and pushes the data to your CRM (Salesforce, LeadSquared, Sell.Do).
                </p>

                <div className="bg-gray-900 p-4 rounded-xl border border-teal-900/50 space-y-2 text-xs">
                  <div className="flex justify-between border-b border-gray-800 pb-2">
                    <span className="text-gray-400">Lead Name:</span>
                    <span className="font-semibold text-white">Rajesh Sharma</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-800 pb-2">
                    <span className="text-gray-400">Qualified Budget:</span>
                    <span className="font-semibold text-emerald-400">₹1.25 Cr - ₹1.5 Cr</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-800 pb-2">
                    <span className="text-gray-400">Timeline to Buy:</span>
                    <span className="font-semibold text-white">Immediate (Next 30 Days)</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-800 pb-2">
                    <span className="text-gray-400">Booked Slot:</span>
                    <span className="font-bold text-[#ffb300]">Saturday, 11:00 AM (Whitefield Site)</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-gray-400">Assigned Broker:</span>
                    <span className="font-semibold text-teal-300">Suresh Kumar (Senior Manager)</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="p-4 px-6 bg-gray-950 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-gray-400 text-center sm:text-left">
            Ready to test this on your active real estate projects?
          </span>
          <button
            onClick={() => {
              onClose();
              onOpenDemo();
            }}
            className="w-full sm:w-auto px-5 py-2.5 bg-[#ffb300] hover:bg-amber-400 text-gray-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-transform transform hover:scale-105"
          >
            <span>Book Live Demo for Your Project</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
