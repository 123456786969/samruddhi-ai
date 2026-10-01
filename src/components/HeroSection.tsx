import React, { useState } from 'react';
import { Sparkles, Play, ShieldCheck, CheckCircle2, MessageSquare, PhoneCall, ArrowRight, Zap, Building, Clock, Users } from 'lucide-react';
import { TypeAnimation } from 'react-type-animation';
import { MOCK_LIVE_LEADS, WHATSAPP_SIMULATION_CHAT } from '../data/mockData';

interface HeroSectionProps {
  onOpenDemo: () => void;
  onOpenVideo: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onOpenDemo, onOpenVideo }) => {
  const [activeTab, setActiveTab] = useState<'leads' | 'chat'>('leads');

  return (
    <section className="relative pt-28 pb-16 lg:pt-36 lg:pb-24 overflow-hidden bg-transparent">
      {/* Background Decorative Lighting Gradients */}
      <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/2 left-0 -ml-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Top Announcement Chip */}
        <div className="flex items-center justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#05231c]/90 border border-teal-700/60 text-teal-100 text-xs sm:text-sm font-semibold shadow-lg backdrop-blur-md">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-teal-300">New:</span>
            <span className="font-bold text-white">Multilingual AI Voice Calls in 5 Regional Languages</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </div>
        </div>

        {/* Hero Main Copy */}
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.15] drop-shadow-md">
            Every lead,{' '}
            <span className="text-yellow-500">
              <TypeAnimation
                sequence={[
                  'caught.',
                  2000,
                  'followed.',
                  2000,
                  'qualified.',
                  2000,
                  'closed.',
                  2000,
                ]}
                wrapper="span"
                cursor={true}
                repeat={Infinity}
              />
            </span>
          </h1>

          <p className="text-base sm:text-lg lg:text-xl text-teal-100 max-w-3xl mx-auto font-normal leading-relaxed drop-shadow-xs">
            Autonomous AI voice calls and follow-ups in local languages while you sleep.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={onOpenDemo}
              className="w-full sm:w-auto px-8 py-4 bg-amber-400 hover:bg-amber-300 text-gray-950 font-extrabold text-base sm:text-lg rounded-xl shadow-xl shadow-amber-400/20 hover:shadow-amber-400/40 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3 cursor-pointer group"
            >
              <span>Start free</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={onOpenDemo}
              className="w-full sm:w-auto px-7 py-4 bg-transparent hover:bg-white/5 text-teal-100 font-bold text-base rounded-xl border-2 border-teal-700/80 shadow-md backdrop-blur-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-amber-400 text-gray-950 flex items-center justify-center">
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
              </div>
              <span>Book a 15-min demo</span>
            </button>
          </div>

          {/* Quick Value Metrics Row */}
          <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto text-left text-xs sm:text-sm font-medium text-teal-100">
            <div className="flex items-center gap-2 bg-[#05221c]/80 p-2.5 rounded-xl border border-teal-800/60 shadow-lg backdrop-blur-md">
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
              <span><strong className="text-white">&lt; 10s</strong> WhatsApp Speed</span>
            </div>
            <div className="flex items-center gap-2 bg-[#05221c]/80 p-2.5 rounded-xl border border-teal-800/60 shadow-lg backdrop-blur-md">
              <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
              <span><strong className="text-white">24/7</strong> Automated Response</span>
            </div>
            <div className="flex items-center gap-2 bg-[#05221c]/80 p-2.5 rounded-xl border border-teal-800/60 shadow-lg backdrop-blur-md">
              <Users className="w-4 h-4 text-amber-400 shrink-0" />
              <span><strong className="text-white">5 Languages</strong> Voice AI</span>
            </div>
            <div className="flex items-center gap-2 bg-[#05221c]/80 p-2.5 rounded-xl border border-teal-800/60 shadow-lg backdrop-blur-md">
              <Building className="w-4 h-4 text-emerald-400 shrink-0" />
              <span><strong className="text-white">100%</strong> CRM Compatible</span>
            </div>
          </div>
        </div>

        {/* Hero Visual Mockup Section */}
        <div className="mt-12 max-w-5xl mx-auto">
          <div className="bg-[#031814]/90 rounded-2xl shadow-2xl border border-teal-800/80 overflow-hidden backdrop-blur-xl">
            
            {/* Mockup Header Bar */}
            <div className="bg-[#020e0c] px-4 sm:px-6 py-3 text-white flex items-center justify-between border-b border-teal-900">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                  <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                  <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
                </div>
                <span className="text-xs font-mono text-teal-300 hidden sm:inline-block">
                  app.samruddhi.ai/dashboard/live-engine
                </span>
              </div>

              {/* Toggle Tabs inside Dashboard Mockup */}
              <div className="flex bg-teal-950/80 p-1 rounded-lg border border-teal-800/80 text-xs font-medium">
                <button
                  onClick={() => setActiveTab('leads')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    activeTab === 'leads' 
                      ? 'bg-[#ffb300] text-gray-950 font-bold shadow-xs' 
                      : 'text-teal-100 hover:text-white'
                  }`}
                >
                  Live Lead Engine
                </button>
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    activeTab === 'chat' 
                      ? 'bg-[#ffb300] text-gray-950 font-bold shadow-xs' 
                      : 'text-teal-100 hover:text-white'
                  }`}
                >
                  WhatsApp & Voice Interaction
                </button>
              </div>
            </div>

            {/* Dashboard Mockup Body */}
            <div className="p-4 sm:p-6 bg-gray-50/50">
              {activeTab === 'leads' ? (
                <div className="space-y-4">
                  {/* Top Stats Banner */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs">
                      <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider block">Today's Inbound</span>
                      <div className="flex items-baseline justify-between mt-1">
                        <span className="text-xl font-black text-gray-900">142</span>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">+28%</span>
                      </div>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs">
                      <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider block">Lead Qualified</span>
                      <div className="flex items-baseline justify-between mt-1">
                        <span className="text-xl font-black text-[#004d40]">118</span>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">83% Rate</span>
                      </div>
                    </div>

                    <div className="bg-[#004d40] text-white p-3.5 rounded-xl shadow-xs">
                      <span className="text-[11px] font-medium text-teal-200 uppercase tracking-wider block">Site Visit Booked</span>
                      <div className="flex items-baseline justify-between mt-1">
                        <span className="text-xl font-black text-[#ffb300]">46</span>
                        <span className="text-xs font-bold text-amber-300 bg-teal-800/80 px-1.5 py-0.5 rounded">This Weekend</span>
                      </div>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs">
                      <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider block">Avg Response</span>
                      <div className="flex items-baseline justify-between mt-1">
                        <span className="text-xl font-black text-emerald-600">6 Sec</span>
                        <span className="text-xs font-bold text-gray-500">24/7 AI</span>
                      </div>
                    </div>
                  </div>

                  {/* Real-Time Lead Stream */}
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
                    <div className="px-4 py-3 bg-gray-100/70 border-b border-gray-200 flex items-center justify-between text-xs font-bold text-gray-700">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Real-Time AI Processing Stream
                      </span>
                      <span className="text-gray-500 text-[11px]">Auto Sync: Connected to Meta & LeadSquared</span>
                    </div>

                    <div className="divide-y divide-gray-100 text-xs">
                      {MOCK_LIVE_LEADS.map((lead) => (
                        <div key={lead.id} className="p-3.5 hover:bg-teal-50/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-teal-100 text-[#004d40] font-bold flex items-center justify-center shrink-0">
                              {lead.name.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-900">{lead.name}</span>
                                <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{lead.phone}</span>
                              </div>
                              <p className="text-[11px] text-gray-500">{lead.source} • Budget: <strong className="text-gray-800">{lead.budget}</strong></p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 text-right">
                            <div className="text-left sm:text-right">
                              <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                lead.status === 'Site Visit Scheduled' 
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                                  : lead.status === 'Qualified'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-teal-100 text-teal-800'
                              }`}>
                                {lead.status}
                              </span>
                              <span className="block text-[10px] text-gray-400 mt-0.5">{lead.aiAction}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* WhatsApp Simulation */}
                  <div className="bg-[#0b141a] rounded-xl p-4 text-white font-sans text-xs space-y-3 border border-gray-800">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-emerald-400" />
                        <span className="font-bold text-emerald-400">WhatsApp AI Conversation</span>
                      </div>
                      <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-800">Verified Bot</span>
                    </div>

                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {WHATSAPP_SIMULATION_CHAT.slice(0, 4).map((msg, i) => (
                        <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`p-2.5 rounded-xl max-w-[85%] ${
                            msg.sender === 'user' ? 'bg-[#005c4b] text-white' : 'bg-[#202c33] text-gray-100'
                          }`}>
                            <p className="whitespace-pre-line">{msg.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI Voice Call Simulation */}
                  <div className="bg-white rounded-xl p-4 border border-gray-200 text-xs space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <PhoneCall className="w-4 h-4 text-[#004d40]" />
                        <span className="font-bold text-[#004d40]">Multilingual AI Voice Call</span>
                      </div>
                      <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-semibold">Hindi & English AI</span>
                    </div>

                    <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900">Ananya (AI Sales Executive)</span>
                        <span className="text-emerald-600 font-mono font-bold">● Active Call (00:24)</span>
                      </div>
                      <p className="text-gray-700 italic bg-white p-2.5 rounded-lg border border-teal-200/80">
                        "नमस्ते शर्मा जी, मैं समृद्धी AI से बात कर रही हूँ। आपने हमारे नया 2 BHK प्रोजेक्ट के लिए जानकारी माँगी थी..."
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-gray-600 pt-1">
                        <span>Intent Detected: <strong className="text-emerald-700">High (Site Visit Ready)</strong></span>
                        <span className="text-teal-800 font-semibold">Language: Hindi</span>
                      </div>
                    </div>

                    <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-bold text-emerald-900">Site Visit Booked: Sat 11:00 AM</span>
                      </div>
                      <span className="text-[10px] text-emerald-700 font-semibold">WhatsApp Confirmation Sent</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
