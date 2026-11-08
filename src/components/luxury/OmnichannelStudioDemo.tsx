import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Download, 
  CheckCircle2, 
  Sparkles, 
  Image as ImageIcon, 
  ArrowRight, 
  Copy, 
  Check, 
  Phone, 
  Calendar, 
  Share2, 
  ExternalLink,
  Layers,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Send,
  Eye,
  Building2,
  Clock,
  Sparkle,
  BadgePercent,
  MapPin,
  Flame,
  RotateCcw,
  Globe2,
  HardDriveDownload,
  Wifi,
  WifiOff,
  Zap,
  Cpu,
  Upload,
  RefreshCw
} from 'lucide-react';
import { languageSamples, LanguageSample } from '../../data/languageSamples';
import { offlineVoiceCache, CacheStorageMetrics } from '../../services/offlineVoiceCache';
import { 
  FALLBACK_FLOORPLAN_SVG, 
  FALLBACK_PROPERTY_SVGS, 
  handleImageFallback 
} from '../../utils/fallbackImages';

interface OmnichannelStudioDemoProps {
  onOpenDemo?: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text?: string;
  isBrochure?: boolean;
  time: string;
  status?: 'sent' | 'delivered' | 'read';
}

export const OmnichannelStudioDemo: React.FC<OmnichannelStudioDemoProps> = ({ onOpenDemo }) => {
  // Global Unified Language Selector for WhatsApp & Ad Studio
  const [selectedLangCode, setSelectedLangCode] = useState<string>('en');
  const activeSample: LanguageSample = languageSamples.find(s => s.code === selectedLangCode) || languageSamples[0];

  // Offline Caching & Telemetry Metrics State
  const [isOfflineSimulated, setIsOfflineSimulated] = useState<boolean>(false);
  const [cacheMetrics, setCacheMetrics] = useState<CacheStorageMetrics>({
    totalItems: 0,
    totalSizeBytes: 0,
    totalSizeFormatted: '0 KB',
    tokensSaved: 0,
    bandwidthSavedFormatted: '0 MB',
    isOfflineReady: false,
    languagesCached: []
  });

  // --- SECTION 1: WHATSAPP INTERACTIVE SIMULATOR STATE ---
  const [activeTab, setActiveTab] = useState<'chat' | 'floorplan'>('chat');
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [rescheduleDateTime, setRescheduleDateTime] = useState('24/08 16:00');

  // Script messages derived from selected language sample
  const initialScript = activeSample.whatsappScript || [
    {
      id: 'm-1',
      sender: 'ai',
      text: 'Hi **Vikram**! Great speaking with you during our phone consultation.',
      time: '09:41 AM',
      status: 'read'
    },
    {
      id: 'm-2',
      sender: 'ai',
      text: 'As requested, here is the approved RERA project dossier and unit layout blueprint for **Godrej Woodsman (3BHK Sky Suite)**.',
      time: '09:41 AM',
      status: 'read'
    },
    {
      id: 'm-3',
      sender: 'ai',
      isBrochure: true,
      time: '09:41 AM',
      status: 'read'
    },
    {
      id: 'm-4',
      sender: 'ai',
      text: 'We have reserved a VIP private preview for you this **Saturday at 11:30 AM**. Would you like our site manager to block this slot?',
      time: '09:41 AM',
      status: 'read'
    }
  ];

  // State to track sequential delivery index
  const [scriptIndex, setScriptIndex] = useState<number>(1);
  const [messages, setMessages] = useState<ChatMessage[]>([initialScript[0]]);
  const [isScriptPlaying, setIsScriptPlaying] = useState<boolean>(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const rescheduleInputRef = useRef<HTMLInputElement>(null);

  // Subscribe to offline voice cache telemetry
  useEffect(() => {
    const unsubscribe = offlineVoiceCache.subscribe((metrics) => {
      setCacheMetrics(metrics);
    });
    return () => unsubscribe();
  }, []);

  // Update messages when language changes
  useEffect(() => {
    const freshScript = activeSample.whatsappScript || initialScript;
    setMessages([freshScript[0]]);
    setScriptIndex(1);
    setIsScriptPlaying(true);
    setIsRescheduling(false);
    setIsAiTyping(false);
  }, [selectedLangCode]);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAiTyping, isRescheduling]);

  // Sequential Initial Message Delivery Loop with 2-second delay and typing animation
  useEffect(() => {
    if (!isScriptPlaying) return;
    const currentScript = activeSample.whatsappScript || initialScript;

    if (scriptIndex < currentScript.length) {
      setIsAiTyping(true);
      const timer = setTimeout(() => {
        setIsAiTyping(false);
        const nextMsg = currentScript[scriptIndex];
        setMessages((prev) => [...prev, nextMsg]);
        setScriptIndex((prev) => prev + 1);
      }, 2000);

      return () => clearTimeout(timer);
    } else {
      setIsScriptPlaying(false);
      setIsAiTyping(false);
    }
  }, [scriptIndex, isScriptPlaying, selectedLangCode]);

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text) return;

    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: text,
      time: getCurrentTime(),
      status: 'read'
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsAiTyping(true);

    // AI Replies after exactly 2 seconds
    setTimeout(() => {
      setIsAiTyping(false);
      let replyText = '';
      const lower = text.toLowerCase();

      if (isRescheduling || lower.includes('/') || lower.includes(':') || lower.includes('am') || lower.includes('pm') || lower.includes('aug') || lower.includes('monday') || lower.includes('tuesday') || lower.includes('wednesday') || lower.includes('thursday') || lower.includes('friday') || lower.includes('saturday') || lower.includes('sunday')) {
        setIsRescheduling(false);
        replyText = `✅ Rescheduled your visit to **${text}**! Our senior site manager has updated your slot in the CRM and will receive you at the VIP lounge.`;
      } else if (lower.includes('reschedule') || lower.includes('change date') || lower.includes('different time')) {
        setIsRescheduling(true);
        replyText = `When would you like to reschedule your visit? Please input your preferred date and time in **DD/MM HH:MM** format below.`;
      } else if (lower.includes('call') || lower.includes('sales') || lower.includes('executive') || lower.includes('number') || lower.includes('contact') || lower.includes('phone')) {
        replyText = `📞 Connecting you to our Senior Sales Executive: **+91 xxxxxxxxxx**. We are available immediately to assist you with unit allocations and pricing!`;
      } else if (lower.includes('confirm') || lower.includes('yes') || lower.includes('ok') || lower.includes('sure') || lower.includes('book')) {
        replyText = `🎉 Fantastic! Your VIP site visit for **Saturday at 11:30 AM** is officially locked in. Digital gate pass and live navigation sent to your WhatsApp.`;
      } else if (lower.includes('price') || lower.includes('cost') || lower.includes('offer')) {
        replyText = `The 3BHK Sky Suite starts at **₹1.45 Cr (All Inclusive)** with a 0% stamp duty waiver valid for visits scheduled this week.`;
      } else {
        replyText = `Thank you for your message! Our AI real estate concierge has noted: "${text}". A senior representative will assist you promptly, or connect via **+91 xxxxxxxxxx**.`;
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: replyText,
        time: getCurrentTime(),
        status: 'read'
      };

      setMessages((prev) => [...prev, aiMsg]);
    }, 2000);
  };

  const handlePickReschedule = () => {
    setIsRescheduling(true);
    setTimeout(() => {
      rescheduleInputRef.current?.focus();
    }, 100);
  };

  const handlePickSalesCall = () => {
    setIsRescheduling(false);
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: "📞 I would like to speak to a Sales Executive (+91 xxxxxxxxxx)",
      time: getCurrentTime(),
      status: 'read'
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsAiTyping(true);

    setTimeout(() => {
      setIsAiTyping(false);
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: "📞 Direct Sales Executive Line: **+91 xxxxxxxxxx**. Tap to call or message directly.",
        time: getCurrentTime(),
        status: 'read'
      };
      setMessages((prev) => [...prev, aiMsg]);
    }, 2000);
  };

  const handleConfirmRescheduleSubmit = () => {
    const formatted = rescheduleDateTime.trim();
    if (!formatted) return;

    setIsRescheduling(false);
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: `📅 Reschedule Request: ${formatted}`,
      time: getCurrentTime(),
      status: 'read'
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsAiTyping(true);

    setTimeout(() => {
      setIsAiTyping(false);
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: `✅ Rescheduled your visit to **${formatted}**! Our senior site manager has updated your slot in the CRM and will receive you at the VIP lounge.`,
        time: getCurrentTime(),
        status: 'read'
      };
      setMessages((prev) => [...prev, aiMsg]);
    }, 2000);
  };

  const handleResetChat = () => {
    const currentScript = activeSample.whatsappScript || initialScript;
    setMessages([currentScript[0]]);
    setScriptIndex(1);
    setIsScriptPlaying(true);
    setIsRescheduling(false);
    setIsAiTyping(false);
  };

  const handleToggleOfflineMode = () => {
    const nextState = !isOfflineSimulated;
    setIsOfflineSimulated(nextState);
    offlineVoiceCache.setSimulatedOffline(nextState);
  };

  // --- SECTION 2: AI AD GENERATOR STATE ---
  const [activeSlide, setActiveSlide] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<'instagram' | 'meta' | 'whatsapp'>('instagram');
  const [selectedProject, setSelectedProject] = useState('Godrej Woodsman Estate (3BHK & 4BHK)');
  const [uploadedAssetImage, setUploadedAssetImage] = useState<string | null>(null);
  const [selectedArchetype, setSelectedArchetype] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const archetypePresets = [
    { 
      title: 'Nikoo & Woodsman Skydeck', 
      project: 'Godrej Woodsman & Nikoo Homes (Hebbal & North BLR)',
      image: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Bharatiya_City_Nikoo_Homes_2D_Bangalore.jpg',
      badge: 'Hebbal Skydeck'
    },
    { 
      title: 'Resort Living & Infinity Pool', 
      project: 'Sobha Windsor Biophilic Enclave (Whitefield)',
      image: 'https://upload.wikimedia.org/wikipedia/commons/1/14/Infinitypool.jpg',
      badge: 'Infinity Pool Deck'
    },
    { 
      title: 'Namma Metro Transit Corridor', 
      project: 'Prestige Highline Metro Enclave (ORR Purple Line)',
      image: 'https://upload.wikimedia.org/wikipedia/commons/7/7a/Metro_Trains_of_Namma_Metro.jpg',
      badge: '400m Metro Station'
    },
    { 
      title: 'Prestige Shantiniketan Towers', 
      project: 'Prestige Shantiniketan Signature Residences (Whitefield)',
      image: 'https://upload.wikimedia.org/wikipedia/commons/f/f1/Prestige_Shantiniketan_In_Whitefield_Main_Road.jpg',
      badge: 'Whitefield Main Rd'
    }
  ];

  const propertySlides = [
    {
      title: "Bharatiya City Nikoo Homes & Godrej Woodsman",
      tag: "Hebbal / North BLR",
      desc: "Starting ₹1.45 Cr onwards • 2,150 sq.ft private terrace deck overlooking Thanisandra & Hebbal Lake",
      image: uploadedAssetImage || "https://upload.wikimedia.org/wikipedia/commons/f/fa/Bharatiya_City_Nikoo_Homes_2D_Bangalore.jpg",
      accent: "#D4AF37",
      metrics: "ROI: +18.4% YoY • Ready by Q4 2026"
    },
    {
      title: "World-Class 40+ Lifestyle Amenities & Infinity Pool",
      tag: "Resort Living",
      desc: "Olympic-length 50m Infinity Pool, 25,000 sq.ft Sky Clubhouse & Hydrotherapy Spa",
      image: "https://upload.wikimedia.org/wikipedia/commons/1/14/Infinitypool.jpg",
      accent: "#38BDF8",
      metrics: "5-Tier Security • Biophilic Architecture"
    },
    {
      title: "Zero-Minute Express Namma Metro Transit",
      tag: "400m to Metro",
      desc: "Direct elevated connection to Purple Line, Manyata Tech Park & Kempegowda Intl. Airport",
      image: "https://upload.wikimedia.org/wikipedia/commons/7/7a/Metro_Trains_of_Namma_Metro.jpg",
      accent: "#10B981",
      metrics: "CBD: 18 Mins • Metro Station: 400m"
    },
    {
      title: "Prestige Shantiniketan Signature 3 & 4BHK",
      tag: "Whitefield Main Rd",
      desc: "Zero Stamp Duty + 10:90 Payment Plan with ₹5 Lakhs Modular Kitchen Voucher",
      image: "https://upload.wikimedia.org/wikipedia/commons/f/f1/Prestige_Shantiniketan_In_Whitefield_Main_Road.jpg",
      accent: "#F59E0B",
      metrics: "Valid until Sunday • RERA Approved"
    }
  ];

  const localizedAdSlide = activeSample.adSlides?.[activeSlide % (activeSample.adSlides?.length || 1)];

  const adCaptions = {
    instagram: `✨ Experience unmatched luxury at ${selectedProject}! 🏙️\n\n3 & 4BHK architectural masterpieces crafted for high-net-worth living with panoramic skyline vistas & 40+ resort amenities. 📍 5 Mins to Metro & Prime Tech Hubs.\n\n🎁 Exclusive Pre-Launch Offer: 0% Stamp Duty + Flexible 10:90 Payment Plan this weekend only.\n\n📲 Tap 'Learn More' or DM us for an instant floor plan & VIP private site tour preview!\n\n#BangaloreRealEstate #LuxuryResidences #PropTech #SamruddhiAI #GodrejWoodsman #DreamHomeIndia`,
    meta: `🔥 [JUST LAUNCHED] Pre-Register for High-ROI 3BHK Residences at ${selectedProject}.\n\n• Price: Starting ₹1.45 Cr onwards\n• Configuration: 2,150 - 2,850 Sq.Ft.\n• Amenity Hub: 25,000 Sq.Ft Clubhouse & Sky Infinity Deck\n• Location: Outer Ring Road Corridor\n\n👉 Book your personalized 1-on-1 walkthrough or receive the full cost sheet instantly via WhatsApp.`,
    whatsapp: `*Exclusive Private Invitation: ${selectedProject}*\n\nDear Investor,\n\nHere is your private preview link to Bangalore's most anticipated luxury enclave starting from *₹1.45 Cr*.\n\n✅ Verified RERA Brochure: *Attached (PDF)*\n✅ Master Unit Layout: *Approved 3BHK*\n✅ Site Visit Slot: *Saturday 11:30 AM Available*\n\nReply *YES* to lock in zero stamp duty benefits!`
  };

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(adCaptions[selectedFormat]);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2400);
  };

  const handleRegenerate = (targetSlideIndex?: number) => {
    setIsGenerating(true);
    setGenerationStep('Analyzing architectural CAD lines & elevations...');
    setTimeout(() => {
      setGenerationStep('Synthesizing localized multilingual ad hooks...');
    }, 300);
    setTimeout(() => {
      setGenerationStep('Rendering high-CTR social carousel slides...');
    }, 600);
    setTimeout(() => {
      setIsGenerating(false);
      setGenerationStep('');
      if (typeof targetSlideIndex === 'number') {
        setActiveSlide(targetSlideIndex);
      } else {
        setActiveSlide((prev) => (prev + 1) % propertySlides.length);
      }
    }, 950);
  };

  const handleAssetFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setUploadedAssetImage(event.target.result as string);
          setActiveSlide(0);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownloadSlide = () => {
    const link = document.createElement('a');
    link.href = propertySlides[activeSlide].image;
    link.download = `samruddhi_${selectedFormat}_slide_0${activeSlide + 1}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadBrochure = () => {
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-24 relative z-10">
      
      {/* ========================================================================= */}
      {/* GLOBAL MULTILINGUAL WORKFLOW SWITCHER & EDGE SAVINGS TELEMETRY BANNER */}
      {/* ========================================================================= */}
      <div className="rounded-2xl bg-[#0E0E12]/90 border border-white/[0.08] backdrop-blur-xl p-4 sm:p-5 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
              <Globe2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-[#D4AF37] font-bold">
                Omnichannel Localization Core
              </div>
              <div className="text-sm font-semibold text-white">
                Synchronized Across Voice AI, WhatsApp & Creative Ads
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Offline Simulation Toggle */}
            <button
              onClick={handleToggleOfflineMode}
              className={`px-3 py-1.5 rounded-full font-mono text-[11px] font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
                isOfflineSimulated 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm' 
                  : 'bg-white/[0.04] text-zinc-300 hover:text-white border-white/10'
              }`}
            >
              {isOfflineSimulated ? (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                  <span>OFFLINE CACHED MODE (0ms)</span>
                </>
              ) : (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span>NETWORK ONLINE</span>
                </>
              )}
            </button>

            {/* Real-Time Savings Badges */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-[11px] text-emerald-300 bg-emerald-500/10 border border-emerald-500/30">
              <Zap className="w-3 h-3 text-emerald-400" />
              <span>0ms Edge Latency</span>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-[11px] text-zinc-300 bg-white/[0.04] border border-white/[0.08]">
              <Cpu className="w-3 h-3 text-[#D4AF37]" />
              <span>Bandwidth Saved: <strong className="text-[#D4AF37]">{cacheMetrics.bandwidthSavedFormatted}</strong></span>
            </div>
          </div>
        </div>

        {/* Language Tabs Row */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none border-t border-white/[0.05]">
          <span className="text-[11px] font-mono text-zinc-400 uppercase mr-1 shrink-0">Switch Language:</span>
          {languageSamples.map((sample) => (
            <button
              key={sample.code}
              onClick={() => setSelectedLangCode(sample.code)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                selectedLangCode === sample.code
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#E5C358] text-[#0A0A0A] shadow-md shadow-[#D4AF37]/25'
                  : 'bg-white/[0.03] text-zinc-300 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]'
              }`}
            >
              <span>{sample.label}</span>
              <span className="text-[10px] opacity-70 font-mono">({sample.code.toUpperCase()})</span>
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: WHATSAPP AI POST-CALL FOLLOW-UP & DEAL CLOSER */}
      {/* ========================================================================= */}
      <section className="relative">
        {/* Glow backdrop */}
        <div className="absolute -top-12 -left-12 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Context & Pitch Column */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-medium backdrop-blur-xl">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>OMNICHANNEL REAL ESTATE CONVERSION</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-extrabold text-[#F4F4F5] tracking-tight leading-[1.15]">
              From Voice Call to Instant <span className="italic text-[#D4AF37]">WhatsApp Closure</span>
            </h2>

            <p className="text-sm sm:text-base text-[#A1A1AA] leading-relaxed">
              When a prospective homebuyer finishes a phone consultation, Samruddhi AI immediately dispatches personalized brochure PDFs, verified floor layouts, and automated calendar invitations right inside WhatsApp in their native language (<strong className="text-white">{activeSample.label}</strong>) within <strong className="text-white">15 seconds</strong>.
            </p>

            {/* Micro Feature Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Instant PDF Brochure</span>
                </div>
                <p className="text-xs text-[#A1A1AA] leading-normal">
                  Auto-compresses high-res architectural plans into sub-5MB instant-download formats.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md space-y-1.5">
                <div className="flex items-center gap-2 text-[#D4AF37] font-semibold text-sm">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>1-Tap Slot Booking</span>
                </div>
                <p className="text-xs text-[#A1A1AA] leading-normal">
                  Interactive quick-reply action chips route confirmations directly into your sales CRM.
                </p>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="pt-2 flex flex-wrap items-center gap-6 border-t border-white/[0.08]">
              <div>
                <div className="font-mono text-2xl font-bold text-white">&lt; 15s</div>
                <div className="text-xs text-[#A1A1AA]">Post-Call Dispatch</div>
              </div>
              <div className="h-8 w-px bg-white/[0.08]" />
              <div>
                <div className="font-mono text-2xl font-bold text-emerald-400">92.4%</div>
                <div className="text-xs text-[#A1A1AA]">WhatsApp Open Rate</div>
              </div>
              <div className="h-8 w-px bg-white/[0.08]" />
              <div>
                <div className="font-mono text-2xl font-bold text-[#D4AF37]">3.4x</div>
                <div className="text-xs text-[#A1A1AA]">Site Visit Conversion</div>
              </div>
            </div>
          </div>

          {/* Right WhatsApp Mobile Mockup */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="w-full max-w-[390px] rounded-[38px] bg-[#0c0c10] border-[6px] border-[#22222a] shadow-2xl shadow-emerald-950/30 overflow-hidden relative font-sans">
              
              {/* Phone Dynamic Island / Speaker Notch */}
              <div className="w-full bg-[#111116] pt-3 pb-2 px-6 flex items-center justify-between border-b border-white/[0.05]">
                <span className="text-[11px] font-mono text-zinc-400">09:41</span>
                <div className="w-20 h-4 rounded-full bg-black flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-zinc-800 mr-2" />
                  <span className="w-2 h-2 rounded-full bg-emerald-500/60" />
                </div>
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <span className="text-[10px] font-mono font-bold">5G</span>
                  <div className="w-4 h-2 rounded-sm border border-zinc-500 flex items-center p-0.5">
                    <div className="w-full h-full bg-emerald-400 rounded-[1px]" />
                  </div>
                </div>
              </div>

              {/* WhatsApp App Header */}
              <div className="bg-[#128C7E] px-4 py-3 text-white flex items-center justify-between shadow-md">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-[#075E54] border border-white/20 flex items-center justify-center font-serif font-bold text-base text-[#D4AF37]">
                      S
                    </div>
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#128C7E]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-semibold leading-tight text-white">Samruddhi AI</h4>
                      <span className="w-3.5 h-3.5 rounded-full bg-[#25D366] flex items-center justify-center text-black text-[9px] font-black">✓</span>
                    </div>
                    <p className="text-[10px] text-emerald-100 flex items-center gap-1">
                      {isAiTyping ? (
                        <span className="text-emerald-200 font-medium animate-pulse">typing ({activeSample.label})...</span>
                      ) : (
                        <span>Verified Business • Instant Response</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-white/90">
                  <button 
                    onClick={handleResetChat}
                    title="Reset Conversation"
                    className="p-1.5 rounded-full hover:bg-black/20 text-white/80 hover:text-white transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <a 
                    href="tel:+91xxxxxxxxxx" 
                    title="Call Sales Hotline: +91 xxxxxxxxxx" 
                    className="p-1.5 rounded-full hover:bg-black/20 hover:text-emerald-200 transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* View Switcher Tabs (Chat vs Floorplan preview) */}
              <div className="bg-[#181820] px-3 py-1.5 flex gap-2 border-b border-white/[0.06] text-xs">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex-1 py-1 px-2 rounded-md font-medium text-center transition-colors cursor-pointer ${
                    activeTab === 'chat' ? 'bg-[#075E54] text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Live WhatsApp Conversation
                </button>
                <button
                  onClick={() => setActiveTab('floorplan')}
                  className={`flex-1 py-1 px-2 rounded-md font-medium text-center transition-colors cursor-pointer ${
                    activeTab === 'floorplan' ? 'bg-[#075E54] text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  3BHK Layout Blueprint
                </button>
              </div>

              {/* Chat Canvas / Content Body */}
              <div 
                ref={chatContainerRef}
                className="bg-[#0b141a] p-3.5 space-y-3 min-h-[430px] max-h-[450px] overflow-y-auto relative text-[11px] leading-relaxed scroll-smooth"
              >
                
                {/* Background Pattern Overlay */}
                <div 
                  className="absolute inset-0 opacity-[0.03] pointer-events-none"
                  style={{
                    backgroundImage: `radial-gradient(#25D366 1px, transparent 1px)`,
                    backgroundSize: '16px 16px'
                  }}
                />

                {activeTab === 'chat' ? (
                  <>
                    {/* Timestamp Pill */}
                    <div className="flex justify-center">
                      <span className="px-2.5 py-0.5 rounded-md bg-[#182229] text-[10px] text-zinc-400 font-mono">
                        TODAY • POST-CALL DISPATCH ({activeSample.label.toUpperCase()})
                      </span>
                    </div>

                    {/* Dynamic Messages Loop */}
                    {messages.map((msg) => {
                      if (msg.sender === 'user') {
                        return (
                          <motion.div 
                            key={msg.id}
                            initial={{ opacity: 0, scale: 0.95, y: 6 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className="bg-[#005c4b] text-white p-3 rounded-2xl rounded-tr-none ml-auto max-w-[85%] shadow border border-white/[0.04] space-y-1"
                          >
                            <p className="font-medium whitespace-pre-wrap">{msg.text}</p>
                            <div className="flex justify-end items-center gap-1 text-[9px] text-emerald-200">
                              <span>{msg.time}</span>
                              <span className="text-[#53bdeb]">✓✓</span>
                            </div>
                          </motion.div>
                        );
                      }

                      // AI Message with Brochure Card
                      if (msg.isBrochure) {
                        return (
                          <motion.div 
                            key={msg.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-[#202c33] text-zinc-100 p-2.5 rounded-2xl rounded-tl-none max-w-[92%] shadow border border-white/[0.04]"
                          >
                            <div className="bg-[#111b21] p-2.5 rounded-xl flex items-center justify-between gap-3 border border-white/[0.06]">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-9 h-9 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0">
                                  <FileText className="w-5 h-5 text-rose-400" />
                                </div>
                                <div className="truncate">
                                  <p className="font-semibold text-white truncate text-xs">Godrej_Woodsman_3BHK_Brochure.pdf</p>
                                  <p className="text-[9px] text-zinc-400 font-mono">4.2 MB • 24 Pages • Verified Layout</p>
                                </div>
                              </div>

                              <button 
                                onClick={handleDownloadBrochure}
                                className="p-2 rounded-lg bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] transition-colors shrink-0 cursor-pointer"
                                title="Download Brochure"
                              >
                                {downloadSuccess ? (
                                  <Check className="w-4 h-4 text-emerald-400" />
                                ) : (
                                  <Download className="w-4 h-4" />
                                )}
                              </button>
                            </div>

                            {downloadSuccess && (
                              <p className="text-[10px] text-emerald-400 pt-1.5 px-1 font-mono">
                                ✓ E-Brochure downloaded to local storage.
                              </p>
                            )}

                            <div className="flex justify-end items-center gap-1 text-[9px] text-zinc-400 pt-1">
                              <span>{msg.time}</span>
                              <span className="text-[#53bdeb]">✓✓</span>
                            </div>
                          </motion.div>
                        );
                      }

                      // Standard AI text bubble
                      return (
                        <motion.div 
                          key={msg.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-[#202c33] text-zinc-100 p-3 rounded-2xl rounded-tl-none max-w-[88%] shadow border border-white/[0.04] space-y-1.5"
                        >
                          <div 
                            className="leading-relaxed"
                            dangerouslySetInnerHTML={{
                              __html: (msg.text || '')
                                .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
                                .replace(/(\+91 \d{5} \d{5}|\+91 \d{10}|\+91 x{10})/g, '<a href="tel:+91xxxxxxxxxx" class="text-emerald-400 underline font-mono font-bold">$1</a>')
                            }}
                          />
                          <div className="flex justify-end items-center gap-1 text-[9px] text-zinc-400">
                            <span>{msg.time}</span>
                            <span className="text-[#53bdeb]">✓✓</span>
                          </div>
                        </motion.div>
                      );
                    })}

                    {/* AI 2-Second Typing Indicator Bubble */}
                    {isAiTyping && (
                      <motion.div 
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-[#202c33] text-zinc-100 px-3 py-2 rounded-2xl rounded-tl-none max-w-[70%] shadow border border-white/[0.04] flex items-center gap-2"
                      >
                        <span className="text-[10px] text-zinc-400 font-medium">Samruddhi AI typing</span>
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </motion.div>
                    )}

                    {/* Interactive Rescheduling Dedicated Input Panel */}
                    {isRescheduling && !isAiTyping && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-3 rounded-xl bg-[#141e24] border border-amber-500/40 space-y-2.5 shadow-lg"
                      >
                        <div className="flex items-center justify-between text-amber-400 text-xs font-semibold">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Reschedule Site Visit</span>
                          </div>
                          <span className="text-[9px] font-mono bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">DD/MM HH:MM</span>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] text-zinc-300 font-medium flex items-center justify-between">
                            <span>Preferred Date & Time:</span>
                            <span className="text-[9px] text-zinc-500 font-mono">Format: 24/08 16:00</span>
                          </label>
                          <div className="relative">
                            <input 
                              ref={rescheduleInputRef}
                              type="text" 
                              value={rescheduleDateTime}
                              onChange={(e) => setRescheduleDateTime(e.target.value)}
                              placeholder="e.g. 24/08 16:00"
                              className="w-full bg-[#202c33] text-white text-xs px-3 py-2 rounded-lg border border-amber-400/40 outline-none font-mono focus:border-amber-400 focus:ring-1 focus:ring-amber-400 placeholder:text-zinc-500"
                            />
                            <Calendar className="w-3.5 h-3.5 text-amber-400 absolute right-3 top-2.5 pointer-events-none" />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[9px] text-zinc-400 font-mono">Quick Preset Slots:</span>
                          <div className="flex gap-1.5 flex-wrap">
                            {['24/08 16:00', '25/08 11:30', '26/08 17:00'].map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => setRescheduleDateTime(preset)}
                                className={`px-2 py-1 rounded text-[9.5px] font-mono border transition-colors cursor-pointer ${
                                  rescheduleDateTime === preset 
                                    ? 'bg-amber-500/30 text-amber-300 border-amber-400' 
                                    : 'bg-black/40 text-zinc-300 border-white/10 hover:border-amber-400/50 hover:text-white'
                                }`}
                              >
                                {preset}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setIsRescheduling(false)}
                            className="py-2 px-2 rounded-lg bg-[#202c33] hover:bg-[#2a3942] text-zinc-300 font-semibold text-[11px] transition-colors cursor-pointer text-center"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleConfirmRescheduleSubmit}
                            disabled={!rescheduleDateTime.trim()}
                            className="py-2 px-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-md disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Confirm Slot</span>
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* TWO PRIMARY INTERACTIVE ACTION BUTTONS */}
                    <div className="pt-2 space-y-2">
                      <p className="text-[9px] text-zinc-400 uppercase tracking-wider font-mono font-semibold">
                        Interactive Action Buttons:
                      </p>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={handlePickReschedule}
                          disabled={isAiTyping}
                          className="py-2.5 px-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer text-[10.5px] bg-[#202c33] hover:bg-[#2a3942] text-amber-400 border border-amber-400/30 hover:border-amber-400/60 shadow-sm active:scale-98 disabled:opacity-50"
                        >
                          <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>Reschedule</span>
                        </button>

                        <button
                          onClick={handlePickSalesCall}
                          disabled={isAiTyping}
                          className="py-2 px-2 rounded-xl font-bold flex flex-col items-center justify-center transition-all cursor-pointer bg-[#202c33] hover:bg-[#2a3942] text-emerald-400 border border-emerald-400/30 hover:border-emerald-400/60 shadow-sm active:scale-98 disabled:opacity-50"
                        >
                          <div className="flex items-center gap-1 text-[10.5px]">
                            <Phone className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span>Call Sales Executive</span>
                          </div>
                          <span className="text-[9px] font-mono font-semibold text-emerald-300 tracking-tight">+91 xxxxxxxxxx</span>
                        </button>
                      </div>
                    </div>

                    <div ref={messagesEndRef} />
                  </>
                ) : (
                  /* Floor Plan Visualizer Tab */
                  <div className="space-y-3 p-1">
                    <div className="relative rounded-xl overflow-hidden border border-white/[0.1] bg-[#14141A]">
                      <img 
                        src="https://upload.wikimedia.org/wikipedia/commons/7/70/3d-design-floor-plan-coloured.jpg" 
                        alt="3BHK Master Floor Plan"
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = FALLBACK_FLOORPLAN_SVG;
                        }}
                        className="w-full h-44 object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-3">
                        <span className="px-2 py-0.5 rounded bg-[#D4AF37] text-black font-bold text-[9px] w-fit">
                          RERA VERIFIED BLUEPRINT
                        </span>
                        <h4 className="text-xs font-bold text-white mt-1">Type-A 3BHK Grand Suite (2,150 Sq.Ft)</h4>
                        <p className="text-[10px] text-zinc-300">East-facing Vastu Compliant • 3 Baths + Powder Room</p>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#202c33] border border-white/[0.05] space-y-1 text-[10px]">
                      <div className="flex justify-between text-zinc-400">
                        <span>Carpet Area:</span>
                        <span className="text-white font-mono">1,680 Sq.Ft (78.1%)</span>
                      </div>
                      <div className="flex justify-between text-zinc-400">
                        <span>Balcony Deck:</span>
                        <span className="text-white font-mono">220 Sq.Ft Private Sky Lounge</span>
                      </div>
                      <div className="flex justify-between text-zinc-400">
                        <span>Price Quotation:</span>
                        <span className="text-[#D4AF37] font-bold font-mono">₹1.45 Cr (All Incl.)</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveTab('chat')}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold text-center transition-colors cursor-pointer"
                    >
                      ← Back to WhatsApp Chat
                    </button>
                  </div>
                )}
              </div>

              {/* Chat Real-Time Input Form */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="bg-[#202c33] px-3 py-2 flex items-center gap-2 border-t border-white/[0.06]"
              >
                <div className="flex-1 bg-[#2a3942] rounded-full px-3 py-1.5 text-zinc-200 text-[11px] flex items-center justify-between border border-transparent focus-within:border-emerald-500/40">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Type date/time or question..."
                    className="w-full bg-transparent outline-none text-white text-xs placeholder:text-zinc-500"
                  />
                  <Sparkles className="w-3.5 h-3.5 text-[#D4AF37] shrink-0 ml-1" />
                </div>

                <button 
                  type="submit"
                  disabled={!inputMessage.trim() || isAiTyping}
                  className="w-8 h-8 rounded-full bg-[#00a884] text-white flex items-center justify-center hover:bg-[#02906f] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                  aria-label="Send message"
                >
                  <Send className="w-3.5 h-3.5 ml-0.5" />
                </button>
              </form>

            </div>
          </div>

        </div>
      </section>


      {/* ========================================================================= */}
      {/* SECTION 2: AI MULTI-SLIDE AD & CREATIVE GENERATOR */}
      {/* ========================================================================= */}
      <section className="relative rounded-3xl bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/[0.08] p-6 sm:p-10 lg:p-12 backdrop-blur-2xl overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none" />

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-indigo-400 text-xs font-mono font-medium backdrop-blur-xl">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>AI CREATIVE MARKETING STUDIO ({activeSample.label.toUpperCase()})</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-extrabold text-[#F4F4F5] tracking-tight">
            1-Click AI <span className="italic text-[#D4AF37]">Ad Creative Generator</span>
          </h2>

          <p className="text-sm sm:text-base text-[#A1A1AA] leading-relaxed">
            Upload a single building exterior or floor plan render. Samruddhi AI extracts core architectural highlights and automatically outputs localized multi-slide social carousels and ad copy tailored for Meta, Instagram, and WhatsApp campaigns.
          </p>
        </div>

        {/* Main 2-Column Creative Workstation */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Input Controller & Controls */}
          <div className="lg:col-span-5 space-y-5 bg-[#121218] border border-white/[0.08] p-6 rounded-2xl shadow-xl">
            
            {/* Hidden Real File Input */}
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*"
              onChange={handleAssetFileUpload}
              className="hidden" 
            />

            {/* Uploaded Property Asset Mockup */}
            <div className="space-y-2">
              <div className="text-xs font-mono uppercase text-zinc-400 flex items-center justify-between">
                <span>Input Architectural Asset</span>
                <span className="text-emerald-400 text-[10px] font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Vision Model Analyzed</span>
                </span>
              </div>
              
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="relative rounded-xl border-2 border-dashed border-zinc-700 hover:border-indigo-400/80 p-3.5 transition-all duration-300 bg-white/[0.02] cursor-pointer group flex items-center gap-3.5"
                title="Click to upload your own floorplan or architectural render"
              >
                <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-white/[0.1] relative bg-[#18181f]">
                  <img 
                    src={propertySlides[activeSlide].image} 
                    alt="Analyzed Property" 
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                    onError={(e) => handleImageFallback(e, activeSlide)}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <Upload className="w-5 h-5 text-white/90 group-hover:scale-110 transition-transform" />
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-white truncate flex items-center gap-1.5">
                    <span>{uploadedAssetImage ? 'custom_property_photo.jpg' : 'bangalore_luxury_residence.jpg'}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                      {uploadedAssetImage ? 'CUSTOM' : 'REAL PHOTO'}
                    </span>
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Authentic High-Resolution Site Photography</p>
                  <p className="text-[10px] text-indigo-400 mt-1 font-mono font-medium">Click to upload custom photo or CAD</p>
                </div>
              </div>
            </div>

            {/* Architectural Archetype Presets with Real Apartment Photos */}
            <div className="space-y-1.5">
              <div className="text-xs font-mono uppercase text-zinc-400 flex items-center justify-between">
                <span>Verified Property Photos</span>
                <span className="text-[10px] text-[#D4AF37] font-semibold">● Real Bangalore Sites</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {archetypePresets.map((arch, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedArchetype(idx);
                      setSelectedProject(arch.project);
                      handleRegenerate(idx);
                    }}
                    className={`p-2 rounded-xl text-left text-xs font-medium transition-all cursor-pointer border flex items-center gap-2.5 ${
                      activeSlide === idx
                        ? 'bg-indigo-950/90 border-indigo-400 text-white shadow-lg shadow-indigo-950/50'
                        : 'bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:text-white hover:border-white/[0.15]'
                    }`}
                  >
                    <img 
                      src={arch.image} 
                      alt={arch.title} 
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                      onError={(e) => handleImageFallback(e, idx)}
                      className="w-9 h-9 rounded-lg object-cover shrink-0 border border-white/10"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-[11px] truncate">{arch.title}</div>
                      <div className="text-[9.5px] text-zinc-400 font-mono truncate">{arch.badge}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Target Project Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase text-zinc-400">Target Project Title</label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                <input 
                  type="text"
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-black/40 text-white border border-white/[0.1] rounded-xl focus:border-indigo-400 outline-none font-mono"
                />
              </div>
            </div>

            {/* Campaign Output Format Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase text-zinc-400">Destination Ad Format</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'instagram', label: 'Instagram' },
                  { id: 'meta', label: 'Meta Ads' },
                  { id: 'whatsapp', label: 'WhatsApp' }
                ].map((fmt) => (
                  <button
                    key={fmt.id}
                    onClick={() => setSelectedFormat(fmt.id as any)}
                    className={`py-2 px-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      selectedFormat === fmt.id
                        ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/30'
                        : 'bg-white/[0.04] text-zinc-400 hover:text-white border border-white/[0.06]'
                    }`}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Generator CTA Trigger Button with Live Progress */}
            <div className="space-y-2">
              <button
                onClick={() => handleRegenerate()}
                disabled={isGenerating}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all transform active:scale-98 cursor-pointer disabled:opacity-75"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-[#D4AF37]" />
                    <span>Synthesizing Creatives...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                    <span>Regenerate 4-Slide Creative Suite</span>
                  </>
                )}
              </button>

              {isGenerating && generationStep && (
                <div className="p-2.5 rounded-lg bg-indigo-950/60 border border-indigo-500/20 text-center animate-pulse">
                  <span className="text-[11px] font-mono text-indigo-300">
                    {generationStep}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Generated Interactive Carousel & Copy Preview */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* The 4-Slide Responsive Carousel Card */}
            <div className="relative aspect-[16/10] sm:aspect-[16/9] bg-[#14141A] rounded-2xl overflow-hidden border border-white/[0.1] shadow-2xl group">
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSlide}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0"
                >
                  {/* Slide Background Image with robust fallback */}
                  <img 
                    src={propertySlides[activeSlide].image} 
                    alt={propertySlides[activeSlide].title}
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                    onError={(e) => handleImageFallback(e, activeSlide)}
                    className="w-full h-full object-cover"
                  />
                  {/* Gradient Lighting Scrim */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                </motion.div>
              </AnimatePresence>

              {/* Top Meta Badges & Slide Indicator */}
              <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-xl border border-white/[0.15] text-[11px] font-mono text-white flex items-center gap-1.5">
                    <span 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: propertySlides[activeSlide].accent }} 
                    />
                    <span>Slide 0{activeSlide + 1} / 04</span>
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-indigo-600/80 backdrop-blur-xl text-[10px] font-bold text-white uppercase tracking-wider">
                    {localizedAdSlide?.badge || propertySlides[activeSlide].tag}
                  </span>
                </div>

                {/* Direct Slide Pip Selector */}
                <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-xl p-1.5 rounded-full border border-white/[0.1]">
                  {propertySlides.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveSlide(idx)}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        activeSlide === idx 
                          ? 'w-6 bg-[#D4AF37]' 
                          : 'w-2 bg-white/40 hover:bg-white/80'
                      }`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>

              {/* Bottom Content Scrim Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7 z-20 space-y-2">
                <motion.h3 
                  key={`title-${activeSlide}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xl sm:text-2xl lg:text-3xl font-serif font-bold text-white leading-tight"
                >
                  {localizedAdSlide?.title || propertySlides[activeSlide].title}
                </motion.h3>

                <motion.p 
                  key={`desc-${activeSlide}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 }}
                  className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-xl"
                >
                  {localizedAdSlide ? `${localizedAdSlide.highlight} • ${localizedAdSlide.subtitle}` : propertySlides[activeSlide].desc}
                </motion.p>

                <div className="pt-2 flex items-center justify-between">
                  <span className="font-mono text-[11px] text-[#D4AF37] font-semibold flex items-center gap-1">
                    <Sparkle className="w-3.5 h-3.5" />
                    <span>{localizedAdSlide?.priceNote || propertySlides[activeSlide].metrics}</span>
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDownloadSlide}
                      className="px-3 py-1.5 rounded-lg bg-black/50 hover:bg-black/80 border border-white/20 backdrop-blur-md text-[11px] font-bold text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Download this creative slide"
                    >
                      <Download className="w-3 h-3 text-[#D4AF37]" />
                      <span>Export Slide</span>
                    </button>

                    {onOpenDemo && (
                      <button
                        onClick={onOpenDemo}
                        className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-md text-[11px] font-bold text-white flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <span>Preview Ad</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Left / Right Quick Carousel Nav Arrows */}
              <button
                onClick={() => setActiveSlide((prev) => (prev === 0 ? propertySlides.length - 1 : prev - 1))}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-black/90 cursor-pointer"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => setActiveSlide((prev) => (prev === propertySlides.length - 1 ? 0 : prev + 1))}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-black/90 cursor-pointer"
                aria-label="Next slide"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

            </div>

            {/* AI Generated Caption Box with 1-Click Copy Feature */}
            <div className="bg-[#0E0E14] border border-white/[0.08] p-4 sm:p-5 rounded-2xl space-y-3 relative shadow-xl">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span className="font-mono text-xs font-semibold text-zinc-200 uppercase tracking-wide">
                    Generated Ad Copy ({selectedFormat.toUpperCase()} • {activeSample.label.toUpperCase()})
                  </span>
                </div>

                <button
                  onClick={handleCopyCaption}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold border border-indigo-500/30 transition-all cursor-pointer"
                >
                  {copiedCaption ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>1-Click Copy Caption</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed font-sans whitespace-pre-line bg-black/40 p-3.5 rounded-xl border border-white/[0.04]">
                {adCaptions[selectedFormat]}
              </p>
            </div>

          </div>

        </div>
      </section>

    </div>
  );
};
