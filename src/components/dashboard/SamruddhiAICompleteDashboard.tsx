import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, Download, CheckCircle, Sparkles, Image as ImageIcon, 
  Volume2, Globe, WifiOff, HardDrive, Play, Pause, RefreshCw, Layers, Check, Copy, Share2,
  Mic, UserCheck, ShieldCheck, Zap, Sliders
} from 'lucide-react';

interface PhraseItem {
  text: string;
  pitch: number;
  rate: number;
  pauseMs: number;
}

interface LanguageVoiceProfile {
  id: string;
  label: string;
  regionalTag: string;
  native: string;
  accent: string;
  langCode: string;
  emotion: 'warm' | 'enthusiastic' | 'professional' | 'consultative' | 'reassuring';
  phrases: PhraseItem[];
  ttsParams: {
    stability: number;
    similarity_boost: number;
    style_exaggeration: number;
    speech_rate: string;
    breathing_pauses: string;
    tonal_profile: string;
  };
}

export const SamruddhiAICompleteDashboard: React.FC = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('english');
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [activePhraseIndex, setActivePhraseIndex] = useState(-1);
  const [voiceCadenceMode, setVoiceCadenceMode] = useState<'ultra-human' | 'consultative' | 'executive'>('ultra-human');
  const [isVoiceCached, setIsVoiceCached] = useState(true);
  const [downloadProgress, setDownloadProgress] = useState(100);
  const [isDownloadingPack, setIsDownloadingPack] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [visitConfirmed, setVisitConfirmed] = useState(false);

  const speechTimeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const isPlayingRef = useRef(false);

  // Supported Regional & National Languages with organic human phrasing and natural conversational cadences
  const languages: LanguageVoiceProfile[] = [
    { 
      id: 'english', 
      label: 'English (IN)', 
      regionalTag: 'Indian English - Professional Real-Estate Sales Cadence',
      native: "Hello there... Raju here from Samruddhi Realty. Hope you're having a wonderful week... I'm just following up on the WhatsApp brochure we shared earlier. That premium 3BHK layout with the panoramic balcony view... it's genuinely stunning. Would you be free this Saturday... say, around 11:30 AM, for a private site walkthrough? I'd love to personally reserve the prime corner unit for your preview.", 
      accent: 'Indian English Neural (Prosody 1.05 / 0.90)', 
      langCode: 'en-IN',
      emotion: 'warm',
      phrases: [
        { text: "Hello there... Raju here from Samruddhi Realty.", pitch: 1.05, rate: 0.90, pauseMs: 380 },
        { text: "Hope you're having a wonderful week...", pitch: 1.05, rate: 0.90, pauseMs: 320 },
        { text: "I'm just following up on the WhatsApp brochure we shared earlier.", pitch: 1.05, rate: 0.90, pauseMs: 350 },
        { text: "That premium 3BHK layout with the panoramic balcony view... it's genuinely stunning.", pitch: 1.05, rate: 0.90, pauseMs: 420 },
        { text: "Would you be free this Saturday... say, around 11:30 AM, for a private site walkthrough?", pitch: 1.05, rate: 0.90, pauseMs: 380 },
        { text: "I'd love to personally reserve the prime corner unit for your preview.", pitch: 1.05, rate: 0.90, pauseMs: 200 }
      ],
      ttsParams: {
        stability: 0.50,
        similarity_boost: 0.85,
        style_exaggeration: 0.18,
        speech_rate: '0.90x (Calibrated)',
        breathing_pauses: 'Natural conversational pauses & ellipses (320-420ms) with 1.05 pitch & 0.90 rate',
        tonal_profile: 'Professional, consultative Real-Estate sales tone with zero robotic monotone'
      }
    },
    { 
      id: 'kannada', 
      label: 'ಕನ್ನಡ (Kannada)', 
      regionalTag: 'Kannada - Bengaluru Urban Real-Estate Native (Bengaluru Regional Neural v4)',
      native: "ನಮಸ್ಕಾರ ಸರ್... ನಾನು ಸಮೃದ್ಧಿ ರಿಯಾಲ್ಟಿಯಿಂದ ರಾಜು ಮಾತಾಡ್ತಿರೋದು. ನಮ್ಮ ಹೊಸ ಪ್ರೆಸ್ಟೀಜ್ ಪ್ರಾಪರ್ಟಿ ಬ್ರೋಷರ್ ನೋಡಿದ್ರಾ? ಲೊಕೇಶನ್ ಅಂತೂ... ಮೆಟ್ರೋ ಸ್ಟೇಷನ್‌ಗೆ ಜಸ್ಟ್ ಐದೇ ನಿಮಿಷ ವಾಕ್. ಈ ವೀಕೆಂಡ್, ಅಂದ್ರೆ ಶನಿವಾರ ಬೆಳಗ್ಗೆ ಒಂದು ಸಣ್ಣ ಸೈಟ್ ವಿಸಿಟ್ ಪ್ಲಾನ್ ಮಾಡೋಣ್ವಾ ಸರ್? ನಾನು ಖುದ್ದಾಗಿ ನಿಮಗೋಸ್ಕರ ಬೆಸ್ಟ್ 3BHK ಯೂನಿಟ್ ತೋರಿಸ್ತೀನಿ.", 
      accent: 'Bengaluru Regional Neural v4', 
      langCode: 'kn-IN',
      emotion: 'enthusiastic',
      phrases: [
        { text: "ನಮಸ್ಕಾರ ಸರ್... ನಾನು ಸಮೃದ್ಧಿ ರಿಯಾಲ್ಟಿಯಿಂದ ರಾಜು ಮಾತಾಡ್ತಿರೋದು.", pitch: 1.02, rate: 0.94, pauseMs: 280 },
        { text: "ನಮ್ಮ ಹೊಸ ಪ್ರೆಸ್ಟೀಜ್ ಪ್ರಾಪರ್ಟಿ ಬ್ರೋಷರ್ ನೋಡಿದ್ರಾ?", pitch: 1.04, rate: 0.95, pauseMs: 240 },
        { text: "ಲೊಕೇಶನ್ ಅಂತೂ... ಮೆಟ್ರೋ ಸ್ಟೇಷನ್‌ಗೆ ಜಸ್ಟ್ ಐದೇ ನಿಮಿಷ ವಾಕ್.", pitch: 1.0, rate: 0.93, pauseMs: 300 },
        { text: "ಈ ವೀಕೆಂಡ್, ಅಂದ್ರೆ ಶನಿವಾರ ಬೆಳಗ್ಗೆ ಒಂದು ಸಣ್ಣ ಸೈಟ್ ವಿಸಿಟ್ ಪ್ಲಾನ್ ಮಾಡೋಣ್ವಾ ಸರ್?", pitch: 1.05, rate: 0.94, pauseMs: 280 },
        { text: "ನಾನು ಖುದ್ದಾಗಿ ನಿಮಗೋಸ್ಕರ ಬೆಸ್ಟ್ 3BHK ಯೂನಿಟ್ ತೋರಿಸ್ತೀನಿ.", pitch: 0.98, rate: 0.92, pauseMs: 180 }
      ],
      ttsParams: {
        stability: 0.45,
        similarity_boost: 0.80,
        style_exaggeration: 0.15,
        speech_rate: '0.94x',
        breathing_pauses: 'Natural ellipses & comma micro-rests',
        tonal_profile: 'Warm, welcoming, polite Bengaluru urban cadence'
      }
    },
    { 
      id: 'hindi', 
      label: 'हिन्दी (Hindi)', 
      regionalTag: 'Hindi - Metro Conversational Native (Standard Indian Neural)',
      native: "नमस्ते सर! सम्रुद्धी एआई से बात कर रहा हूँ... आशा है आप अच्छे होंगे। आपने जो 3BHK अपार्टमेंट देखा था, सच कहूँ तो उसका लेआउट और बालकनी व्यू बहुत ही शानदार है। इस शनिवार... अगर आप फ्री हैं, तो सुबह ग्यारह बजे एक क्विक साइट विज़िट प्लान कर लें? मैं आपके लिए एक्सक्लूसिव प्री-लॉन्च ऑफर भी रिज़र्व करवा दूँगा।", 
      accent: 'Standard Indian Neural', 
      langCode: 'hi-IN',
      emotion: 'warm',
      phrases: [
        { text: "नमस्ते सर! सम्रुद्धी एआई से बात कर रहा हूँ... आशा है आप अच्छे होंगे।", pitch: 1.02, rate: 0.95, pauseMs: 280 },
        { text: "आपने जो 3BHK अपार्टमेंट देखा था, सच कहूँ तो उसका लेआउट और बालकनी व्यू बहुत ही शानदार है।", pitch: 1.03, rate: 0.94, pauseMs: 300 },
        { text: "इस शनिवार... अगर आप फ्री हैं, तो सुबह ग्यारह बजे एक क्विक साइट विज़िट प्लान कर लें?", pitch: 1.05, rate: 0.95, pauseMs: 260 },
        { text: "मैं आपके लिए एक्सक्लूसिव प्री-लॉन्च ऑफर भी रिज़र्व करवा दूँगा।", pitch: 0.98, rate: 0.93, pauseMs: 180 }
      ],
      ttsParams: {
        stability: 0.45,
        similarity_boost: 0.80,
        style_exaggeration: 0.15,
        speech_rate: '0.96x',
        breathing_pauses: 'Organic breath intervals between benefit anchors',
        tonal_profile: 'Courteous, dynamic pitch modulation, Delhi/Mumbai professional flow'
      }
    },
    { 
      id: 'telugu', 
      label: 'తెలుగు (Telugu)', 
      regionalTag: 'Telugu - Hyderabad Prime Urban (Hyderabad Accent Model)',
      native: "నమస్కారం అండీ! సమృద్ధి రియాల్టీ నుంచి కాల్ చేస్తున్నాను... మీరు చెక్ చేసిన ప్రీమియం గేటెడ్ కమ్యూనిటీ వివరాలు వాట్సాప్‌లో పంపించాను, చూశారా అండీ? ఐటీ కారిడార్‌కి చాలా దగ్గర... క్లబ్‌హౌస్ అమినిటీస్ కూడా వరల్డ్ క్లాస్ ఉన్నాయి. ఈ శనివారం మార్నింగ్ మీ ఫ్యామిలీతో కలిసి సైట్ విజిట్ ప్లాన్ చేద్దామా అండీ? బెస్ట్ ఫేసింగ్ ఫ్లాట్ చూపిస్తాను.", 
      accent: 'Hyderabad Accent Model', 
      langCode: 'te-IN',
      emotion: 'enthusiastic',
      phrases: [
        { text: "నమస్కారం అండీ! సమృద్ధి రియాల్టీ నుంచి కాల్ చేస్తున్నాను...", pitch: 1.02, rate: 0.95, pauseMs: 270 },
        { text: "మీరు చెక్ చేసిన ప్రీమియం గేటెడ్ కమ్యూనిటీ వివరాలు వాట్సాప్‌లో పంపించాను, చూశారా అండీ?", pitch: 1.04, rate: 0.94, pauseMs: 290 },
        { text: "ఐటీ కారిడార్‌కి చాలా దగ్గర... క్లబ్‌హౌస్ అమినిటీస్ కూడా వరల్డ్ క్లాస్ ఉన్నాయి.", pitch: 1.01, rate: 0.94, pauseMs: 310 },
        { text: "ఈ శనివారం మార్నింగ్ మీ ఫ్యామిలీతో కలిసి సైట్ విజిట్ ప్లాన్ చేద్దామా అండీ? బెస్ట్ ఫేసింగ్ ఫ్లాట్ చూపిస్తాను.", pitch: 1.05, rate: 0.93, pauseMs: 200 }
      ],
      ttsParams: {
        stability: 0.45,
        similarity_boost: 0.80,
        style_exaggeration: 0.15,
        speech_rate: '0.95x',
        breathing_pauses: 'Rhythmic breath holds on value propositions',
        tonal_profile: 'High-energy, respectful, engaging Hyderabad urban cadence'
      }
    },
    { 
      id: 'tamil', 
      label: 'தமிழ் (Tamil)', 
      regionalTag: 'Tamil - Chennai Urban Neural (OMR/ECR Professional Flow)',
      native: "வணக்கம் சார்! சம்ருத்தி ரியல் எஸ்டேட்ல இருந்து பேசுறேன்... நீங்க கேட்ட அந்த 3BHK லக்ஸுரி அப்பார்ட்மென்ட் ப்ரோஷர் பார்த்தீங்களா சார்? மெயின் ரோடு கனெக்டிவிட்டி அண்ட் ஸ்கை டெக் View... ரொம்பவே அருமையா இருக்கு. இந்த சனிக்கிழமை காலையில ஒரு நேர்ல சைட் விசிட் வரலாமா சார்? உங்களுக்கு ஏத்த மாதிரி பெஸ்ட் கார்னர் யூனிட்டை நாம புக் பண்ணிடலாம்.", 
      accent: 'Chennai Urban Neural', 
      langCode: 'ta-IN',
      emotion: 'professional',
      phrases: [
        { text: "வணக்கம் சார்! சம்ருத்தி ரியல் எஸ்டேட்ல இருந்து பேசுறேன்...", pitch: 1.03, rate: 0.95, pauseMs: 260 },
        { text: "நீங்க கேட்ட அந்த 3BHK லக்ஸுரி அப்பார்ட்மென்ட் ப்ரோஷர் பார்த்தீங்களா சார்?", pitch: 1.04, rate: 0.95, pauseMs: 280 },
        { text: "மெயின் ரோடு கனெக்டிவிட்டி அண்ட் ஸ்கை டெக் View... ரொம்பவே அருமையா இருக்கு.", pitch: 1.01, rate: 0.94, pauseMs: 300 },
        { text: "இந்த சனிக்கிழமை காலையில ஒரு நேர்ல சைட் விசிட் வரலாமா சார்? உங்களுக்கு ஏத்த மாதிரி பெஸ்ட் கார்னர் யூனிட்டை நாம புக் பண்ணிடலாம்.", pitch: 1.04, rate: 0.93, pauseMs: 200 }
      ],
      ttsParams: {
        stability: 0.45,
        similarity_boost: 0.80,
        style_exaggeration: 0.15,
        speech_rate: '0.95x',
        breathing_pauses: 'Natural mid-sentence colloquial breaks',
        tonal_profile: 'Crisp, courteous, authentic colloquial Chennai pacing'
      }
    },
    { 
      id: 'marathi', 
      label: 'मराठी (Marathi)', 
      regionalTag: 'Marathi - Mumbai/Pune Metro Native (Western Regional Neural)',
      native: "नमस्कार सर! मी समृद्धी रिॲल्टीमधून बोलतोय... आशा आहे आपण मजेत असाल. तुम्ही जो ३ BHK लक्झरी फ्लॅट पाहिला होता, त्याची जागा आणि कनेक्टिव्हिटी खरोखरच खूप छान आहे. या शनिवारी... सकाळी ११ च्या दरम्यान आपण एक छोटी साईٹ व्हिजिट ठेवूया का सर? मी स्वतः उपस्थित राहून तुम्हाला पूर्ण प्रोजेक्ट आणि स्पेशल ऑफर दाखवेन.", 
      accent: 'Mumbai Metro Neural', 
      langCode: 'mr-IN',
      emotion: 'consultative',
      phrases: [
        { text: "नमस्कार सर! मी समृद्धी रिॲल्टीमधून बोलतोय... आशा आहे आपण मजेत असाल.", pitch: 1.02, rate: 0.94, pauseMs: 270 },
        { text: "तुम्ही जो ३ BHK लक्झरी फ्लॅट पाहिला होता, त्याची जागा आणि कनेक्टिव्हिटी खरोखरच खूप छान आहे.", pitch: 1.01, rate: 0.94, pauseMs: 300 },
        { text: "या शनिवारी... सकाळी ११ च्या दरम्यान आपण एक छोटी साईٹ व्हिजिट ठेवूया का सर?", pitch: 1.05, rate: 0.94, pauseMs: 270 },
        { text: "मी स्वतः उपस्थित राहून तुम्हाला पूर्ण प्रोजेक्ट आणि स्पेशल ऑफर दाखवेन.", pitch: 0.99, rate: 0.93, pauseMs: 190 }
      ],
      ttsParams: {
        stability: 0.45,
        similarity_boost: 0.80,
        style_exaggeration: 0.15,
        speech_rate: '0.94x',
        breathing_pauses: 'Reassuring pauses with calm consultative pauses',
        tonal_profile: 'Respectful, trustworthy, polished Pune/Mumbai cadence'
      }
    },
    { 
      id: 'malayalam', 
      label: 'മലയാളം (Malayalam)', 
      regionalTag: 'Malayalam - Kochi Accent Engine (Kerala Urban Refined)',
      native: "നമസ്കാരം സാർ... സമൃദ്ധി റിയൽറ്റിയിൽ നിന്നാണ് സംസാരിക്കുന്നത്. താങ്കൾ അന്വേഷിച്ച ആ ലക്ഷ്വറി 3BHK പ്രോജക്ടിന്റെ ബ്രോഷർ കണ്ടിരുന്നോ? മെട്രോക്കും ഐടി പാർക്കിനും വളരെ അടുത്താണ് ഈ പ്രോപ്പർട്ടി. ഈ ശനിയാഴ്ച രാവിലെ നമുക്കൊരു സൈറ്റ് വിസിറ്റ് പ്ലാൻ ചെയ്താലോ സാർ? ഏറ്റവും മികച്ച യൂണിറ്റുകൾ ഞാൻ നേരിട്ട് കാണിച്ചു തരാം.", 
      accent: 'Kochi Accent Engine', 
      langCode: 'ml-IN',
      emotion: 'reassuring',
      phrases: [
        { text: "നമസ്കാരം സാർ... സമൃദ്ധി റിയൽറ്റിയിൽ നിന്നാണ് സംസാരിക്കുന്നത്.", pitch: 1.02, rate: 0.93, pauseMs: 260 },
        { text: "താങ്കൾ അന്വേഷിച്ച ആ ലക്ഷ്വറി 3BHK പ്രോജക്ടിന്റെ ബ്രോഷർ കണ്ടിരുന്നോ?", pitch: 1.04, rate: 0.94, pauseMs: 280 },
        { text: "മെട്രോക്കും ഐടി പാർക്കിനും വളരെ അടുത്താണ് ഈ പ്രോപ്പർട്ടി.", pitch: 1.0, rate: 0.93, pauseMs: 300 },
        { text: "ഈ ശനിയാഴ്ച രാവിലെ നമുക്കൊരു സൈറ്റ് വിസിറ്റ് പ്ലാൻ ചെയ്താലോ സാർ? ഏറ്റവും മികച്ച യൂണിറ്റുകൾ ഞാൻ നേരിട്ട് കാണിച്ചു തരാം.", pitch: 1.03, rate: 0.92, pauseMs: 200 }
      ],
      ttsParams: {
        stability: 0.45,
        similarity_boost: 0.80,
        style_exaggeration: 0.15,
        speech_rate: '0.93x',
        breathing_pauses: 'Gentle cadence transitions, zero abrupt cuts',
        tonal_profile: 'Calm, respectful, smooth rhythmic Kerala flow'
      }
    }
  ];

  const currentLangData = languages.find(l => l.id === selectedLanguage) || languages[0];

  const slides = [
    { title: "Ultra-Luxury 3BHK Residences", tag: "Prime Location", desc: "Starting ₹1.45 Cr onwards • Vastu Compliant" },
    { title: "World-Class Lifestyle Amenities", tag: "Clubhouse & Sky Deck", desc: "Infinity Pool, Squash Court & 40,000 sq.ft Clubhouse" },
    { title: "Strategic City Connectivity", tag: "5 Mins to Metro", desc: "Close to top IT parks, international schools & hospitals" },
    { title: "Exclusive Pre-Launch Offer", tag: "Limited Time Perk", desc: "Zero Stamp Duty + Flexible Construction Linked Plan" }
  ];

  const stopAllSpeech = () => {
    speechTimeoutsRef.current.forEach(t => clearTimeout(t));
    speechTimeoutsRef.current = [];
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setActivePhraseIndex(-1);
    isPlayingRef.current = false;
  };

  // High-fidelity natural human speech synthesis engine with adaptive phrasing & natural breath intervals
  useEffect(() => {
    if (!isPlayingVoice) {
      stopAllSpeech();
      return;
    }

    isPlayingRef.current = true;
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

    if (!synth) {
      const fallbackTimer = setTimeout(() => {
        setIsPlayingVoice(false);
        setActivePhraseIndex(-1);
      }, 4000);
      speechTimeoutsRef.current.push(fallbackTimer);
      return;
    }

    synth.cancel();

    const voices = synth.getVoices();
    // Prioritize natural Indian English neural/high-quality voices for en-IN
    let bestVoice = voices.find(v => v.lang === currentLangData.langCode);
    if (currentLangData.id === 'english' || currentLangData.langCode === 'en-IN') {
      bestVoice = voices.find(v => (v.lang === 'en-IN' || v.lang === 'en_IN') && (v.name.includes('Neural') || v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('India'))) ||
                  voices.find(v => v.lang === 'en-IN' || v.lang === 'en_IN') ||
                  voices.find(v => v.name.includes('Indian') || v.name.includes('India') || v.name.includes('en-IN')) ||
                  voices.find(v => (v.name.includes('Natural') || v.name.includes('Neural')) && v.lang.startsWith('en')) ||
                  voices.find(v => v.lang.startsWith('en'));
    }

    const phrases = currentLangData.phrases;
    let currentIdx = 0;

    const playNextPhrase = () => {
      if (!isPlayingRef.current || currentIdx >= phrases.length) {
        setIsPlayingVoice(false);
        setActivePhraseIndex(-1);
        return;
      }

      const phrase = phrases[currentIdx];
      setActivePhraseIndex(currentIdx);

      const utterance = new SpeechSynthesisUtterance(phrase.text);
      if (bestVoice) {
        utterance.voice = bestVoice;
      }
      utterance.lang = currentLangData.langCode;

      // Emotion-based dynamic modulation mapping:
      // Dynamically modulates pitch and rate based on the language's configured emotion property
      const emotionModulation: Record<string, { pitchMultiplier: number; rateMultiplier: number }> = {
        warm: { pitchMultiplier: 1.02, rateMultiplier: 0.96 },
        enthusiastic: { pitchMultiplier: 1.08, rateMultiplier: 1.02 },
        professional: { pitchMultiplier: 0.98, rateMultiplier: 0.98 },
        consultative: { pitchMultiplier: 1.00, rateMultiplier: 0.94 },
        reassuring: { pitchMultiplier: 0.97, rateMultiplier: 0.92 }
      };

      const mod = emotionModulation[currentLangData.emotion] || { pitchMultiplier: 1.0, rateMultiplier: 1.0 };
      
      utterance.pitch = Math.max(0.7, Math.min(1.4, phrase.pitch * mod.pitchMultiplier));
      utterance.rate = Math.max(0.7, Math.min(1.3, phrase.rate * mod.rateMultiplier));

      utterance.onend = () => {
        if (!isPlayingRef.current) return;
        currentIdx++;
        if (currentIdx < phrases.length) {
          // Add organic breathing pause between conversational phrases
          const pauseTimer = setTimeout(() => {
            playNextPhrase();
          }, phrase.pauseMs);
          speechTimeoutsRef.current.push(pauseTimer);
        } else {
          setIsPlayingVoice(false);
          setActivePhraseIndex(-1);
        }
      };

      utterance.onerror = () => {
        setIsPlayingVoice(false);
        setActivePhraseIndex(-1);
      };

      synth.speak(utterance);
    };

    // Ensure voices are loaded
    if (voices.length === 0 && synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = () => {
        playNextPhrase();
      };
    } else {
      playNextPhrase();
    }

    return () => {
      stopAllSpeech();
    };
  }, [isPlayingVoice, selectedLanguage]);

  // Simulate local caching storage check
  useEffect(() => {
    const cachedStatus = localStorage.getItem(`samruddhi_voice_${selectedLanguage}`);
    if (cachedStatus === 'downloaded') {
      setIsVoiceCached(true);
      setDownloadProgress(100);
    } else {
      setIsVoiceCached(true);
      setDownloadProgress(100);
    }
  }, [selectedLanguage]);

  const handleDownloadVoicePack = (langId: string) => {
    setIsDownloadingPack(true);
    setDownloadProgress(0);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 25;
      setDownloadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setIsDownloadingPack(false);
        setIsVoiceCached(true);
        localStorage.setItem(`samruddhi_voice_${langId}`, 'downloaded');
      }
    }, 200);
  };

  const handleCopyCaption = () => {
    const caption = `✨ Experience unmatched luxury at Godrej Woodsman! 3BHK designer residences featuring panoramic skyline views & 40+ resort-style amenities. 📍 Prime connectivity. Book your private site preview today! 🏡 #RealEstate #LuxuryLiving #DreamHome (${currentLangData.label.split(' ')[0]})`;
    navigator.clipboard.writeText(caption).catch(() => {});
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2000);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-12 py-4 px-2 sm:px-4 text-zinc-100 font-sans">
      
      {/* GLOBAL HEADER: LOCALIZED VOICE ENGINE CONFIGURATOR */}
      <section className="bg-zinc-900/90 border border-zinc-800/80 rounded-3xl p-6 lg:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              <Globe className="w-4 h-4" /> Multilingual Neural Synthesis & Zero-Data Caching Engine
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold mt-1 tracking-tight">Fluent Regional Voice Configuration</h2>
            <p className="text-zinc-400 text-sm mt-1 max-w-2xl">
              Eliminates flat robotic Text-to-Speech by using organic phrase-segmented breathing intervals, dynamic pitch modulation, and local zero-data caching.
            </p>
          </div>

          {/* Cache Status Badge */}
          <div className="flex items-center gap-3 bg-zinc-950/80 border border-zinc-800 px-4 py-3 rounded-2xl">
            <HardDrive className={`w-5 h-5 ${isVoiceCached ? 'text-emerald-400' : 'text-amber-400'}`} />
            <div className="text-xs">
              <p className="font-semibold text-zinc-200">
                {isVoiceCached ? 'Local Voice Pack Cached (0.0 MB Data Usage)' : 'Cloud Stream Mode Active'}
              </p>
              <p className="text-zinc-400">
                {isVoiceCached ? 'Offline ready via local storage' : 'Requires active internet stream'}
              </p>
            </div>
          </div>
        </div>

        {/* Language Selection Bar */}
        <div className="mt-8 pt-6 border-t border-zinc-800/80">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-3">
            Select Active Conversational Language:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {languages.map((lang) => (
              <button
                key={lang.id}
                onClick={() => {
                  stopAllSpeech();
                  setSelectedLanguage(lang.id);
                  setIsPlayingVoice(false);
                }}
                className={`p-3 rounded-xl text-left border transition-all flex flex-col justify-between cursor-pointer ${
                  selectedLanguage === lang.id
                    ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-lg shadow-emerald-950/50 ring-1 ring-emerald-500/40'
                    : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <span className="text-xs font-bold block">{lang.label.split(' ')[0]}</span>
                <span className="text-[10px] opacity-70 truncate block mt-1">{lang.label.split('(')[1]?.replace(')', '') || ''}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Active Voice Preview & Human Prosody Bar */}
        <div className="mt-6 bg-zinc-950/90 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-4 w-full sm:w-auto">
              <button 
                onClick={() => setIsPlayingVoice(!isPlayingVoice)}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition shadow-lg shrink-0 cursor-pointer ${
                  isPlayingVoice 
                    ? 'bg-amber-500 hover:bg-amber-400 animate-pulse ring-4 ring-amber-500/20' 
                    : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
                title={isPlayingVoice ? "Pause Speech Preview" : "Play Natural Human Voice Sample"}
              >
                {isPlayingVoice ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-white">{currentLangData.label}</span>
                  <span className="bg-zinc-800 text-emerald-400 text-[10px] px-2.5 py-0.5 rounded-full font-mono font-medium">
                    {currentLangData.accent}
                  </span>
                  <span className="bg-indigo-950/60 border border-indigo-700/50 text-indigo-300 text-[10px] px-2 py-0.5 rounded-full font-mono">
                    {currentLangData.regionalTag}
                  </span>
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono font-semibold uppercase tracking-wider ${
                    currentLangData.emotion === 'enthusiastic' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                    currentLangData.emotion === 'warm' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                    currentLangData.emotion === 'professional' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' :
                    currentLangData.emotion === 'consultative' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' :
                    'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}>
                    ✨ Emotion: {currentLangData.emotion}
                  </span>
                </div>
                
                {/* Visual Phrase-By-Phrase Natural Speech Highlighting */}
                <div className="text-xs text-zinc-300 mt-2 leading-relaxed font-normal bg-zinc-900/80 p-3 rounded-xl border border-zinc-800/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-400 font-semibold uppercase text-[10px] flex items-center gap-1.5">
                      <Mic className="w-3 h-3" /> Phrase-Segmented Natural Breath Cadence:
                    </span>
                    {isPlayingVoice && (
                      <span className="text-[10px] text-amber-400 font-mono animate-pulse">
                        Speaking Phrase {activePhraseIndex + 1}/{currentLangData.phrases.length}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    {currentLangData.phrases.map((phrase, idx) => (
                      <span
                        key={idx}
                        className={`transition-all duration-200 px-1.5 py-0.5 rounded ${
                          activePhraseIndex === idx
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-medium'
                            : 'text-zinc-300'
                        }`}
                      >
                        {phrase.text}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end shrink-0">
              {!isVoiceCached ? (
                <button 
                  onClick={() => handleDownloadVoicePack(selectedLanguage)}
                  disabled={isDownloadingPack}
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-medium rounded-xl transition border border-zinc-700 cursor-pointer"
                >
                  <Download className={`w-3.5 h-3.5 ${isDownloadingPack ? 'animate-bounce' : ''}`} />
                  {isDownloadingPack ? `Downloading Pack (${downloadProgress}%)` : 'Download Offline Pack (14MB)'}
                </button>
              ) : (
                <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-3.5 py-2 rounded-xl font-medium">
                  <CheckCircle className="w-3.5 h-3.5" /> Voice Model Cached Locally (0.0 MB Data)
                </div>
              )}
            </div>
          </div>

          {/* TTS Engine Config Parameters Badge Inspector */}
          <div className="pt-3 border-t border-zinc-800/80 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-[11px]">
            <div className="bg-zinc-900/90 border border-zinc-800/70 p-2.5 rounded-xl">
              <span className="text-zinc-400 block text-[10px] uppercase font-mono">Emotion Dynamic</span>
              <span className="font-bold text-amber-300 font-mono text-xs capitalize">{currentLangData.emotion}</span>
              <span className="text-[9px] text-zinc-400 block mt-0.5">Pitch & Rate Modulated</span>
            </div>
            <div className="bg-zinc-900/90 border border-zinc-800/70 p-2.5 rounded-xl">
              <span className="text-zinc-400 block text-[10px] uppercase font-mono">Stability</span>
              <span className="font-bold text-emerald-400 font-mono text-xs">{currentLangData.ttsParams.stability}</span>
              <span className="text-[9px] text-zinc-400 block mt-0.5">Expressive Dynamic Pitch</span>
            </div>
            <div className="bg-zinc-900/90 border border-zinc-800/70 p-2.5 rounded-xl">
              <span className="text-zinc-400 block text-[10px] uppercase font-mono">Similarity Boost</span>
              <span className="font-bold text-indigo-400 font-mono text-xs">{currentLangData.ttsParams.similarity_boost}</span>
              <span className="text-[9px] text-zinc-400 block mt-0.5">High Clarity Match</span>
            </div>
            <div className="bg-zinc-900/90 border border-zinc-800/70 p-2.5 rounded-xl">
              <span className="text-zinc-400 block text-[10px] uppercase font-mono">Speech Rate</span>
              <span className="font-bold text-cyan-400 font-mono text-xs">{currentLangData.ttsParams.speech_rate}</span>
              <span className="text-[9px] text-zinc-400 block mt-0.5">Human Conversational</span>
            </div>
            <div className="bg-zinc-900/90 border border-zinc-800/70 p-2.5 rounded-xl col-span-2">
              <span className="text-zinc-400 block text-[10px] uppercase font-mono">Cadence & Breath Profile</span>
              <span className="font-medium text-zinc-200 truncate block text-[11px] mt-0.5">{currentLangData.ttsParams.tonal_profile}</span>
              <span className="text-[9px] text-emerald-400 block mt-0.5">✓ {currentLangData.ttsParams.breathing_pauses}</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 1: WHATSAPP AI POST-CALL FOLLOW-UP & DEAL CLOSER */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center pt-4">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            Omnichannel Continuity
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            From Voice Call to Instant WhatsApp Closure in <span className="text-emerald-400">{currentLangData.label.split(' ')[0]}</span>
          </h2>
          <p className="text-zinc-400 text-sm leading-relaxed">
            The moment a phone call finishes, Samruddhi AI instantly triggers a localized WhatsApp message in the customer's native language. It dispatches verified PDF e-brochures, exact floor plan mockups, and interactive site-visit booking cards.
          </p>
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3 text-zinc-300 text-sm">
              <CheckCircle className="text-emerald-400 w-5 h-5 shrink-0" /> Native linguistic tone matching prior voice interaction
            </div>
            <div className="flex items-center gap-3 text-zinc-300 text-sm">
              <CheckCircle className="text-emerald-400 w-5 h-5 shrink-0" /> Zero data waste: pre-rendered voice and message scripts
            </div>
            <div className="flex items-center gap-3 text-zinc-300 text-sm">
              <CheckCircle className="text-emerald-400 w-5 h-5 shrink-0" /> 1-Click interactive site visit confirmations & calendar sync
            </div>
          </div>
        </div>

        {/* WhatsApp Mobile Mockup Container */}
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-3xl p-4 sm:p-6 max-w-md mx-auto w-full shadow-2xl relative">
          <div className="bg-emerald-900/90 text-white p-3.5 rounded-2xl flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-base shadow-inner">S</div>
              <div>
                <h4 className="text-sm font-semibold">Samruddhi AI Assistant ({currentLangData.label.split(' ')[0]})</h4>
                <p className="text-[11px] text-emerald-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Online • Cached Neural Link
                </p>
              </div>
            </div>
          </div>

          <div className="bg-zinc-950 p-4 rounded-2xl mt-3 space-y-3.5 text-xs">
            <div className="bg-zinc-900 text-zinc-200 p-3.5 rounded-2xl rounded-tl-none max-w-[88%] border border-zinc-800">
              <p className="font-semibold text-emerald-400 mb-1">Voice Follow-up Transferred:</p>
              "{currentLangData.native}"
            </div>

            {/* PDF Interactive Document Card */}
            <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-2xl max-w-[88%] flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-500/10 rounded-xl border border-red-500/20">
                  <FileText className="text-red-400 w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-white text-xs">Prestige_Falcon_City_Brochure.pdf</p>
                  <p className="text-[10px] text-zinc-400">4.2 MB • Verified PDF</p>
                </div>
              </div>
              <a 
                href="#download" 
                onClick={(e) => { e.preventDefault(); alert('Downloading property brochure e-card...'); }}
                className="text-emerald-400 hover:text-emerald-300 transition"
              >
                <Download className="w-4 h-4 cursor-pointer hover:scale-110 transition" />
              </a>
            </div>

            {/* Quick Action Button Group */}
            <div className="flex flex-col gap-2 pt-1">
              <button 
                onClick={() => setVisitConfirmed(!visitConfirmed)}
                className={`w-full py-2.5 rounded-xl font-medium transition shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
                  visitConfirmed 
                    ? 'bg-emerald-700 text-white shadow-emerald-950/80 border border-emerald-500' 
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50'
                }`}
              >
                <CheckCircle className="w-4 h-4" /> 
                {visitConfirmed ? 'Site Visit Confirmed (Sat 11:30 AM)' : 'Confirm Site Visit (This Saturday, 11:30 AM)'}
              </button>
              <button 
                onClick={() => alert('Calendar reschedule link dispatched to buyer.')}
                className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl transition border border-zinc-800 cursor-pointer"
              >
                📅 Reschedule Date/Time
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: AI MULTI-SLIDE AD & CREATIVE GENERATOR */}
      <section className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 lg:p-12 backdrop-blur-xl shadow-xl">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
            Creative Automation Suite
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">1-Click AI Real Estate Ad & Carousel Generator</h2>
          <p className="text-zinc-400 text-sm mt-2">
            Upload a single property photo and let Samruddhi AI generate multi-slide social media carousels and culturally tailored ad descriptions instantly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          
          {/* Input Configuration Panel */}
          <div className="space-y-4 bg-zinc-900/90 border border-zinc-800 p-6 rounded-2xl shadow-inner">
            <div className="border-2 border-dashed border-zinc-700 hover:border-indigo-500/80 p-6 rounded-2xl text-center cursor-pointer transition bg-zinc-950/40">
              <ImageIcon className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-zinc-200">luxury_apartment_facade.jpg</p>
              <p className="text-xs text-zinc-400 mt-1">Image successfully analyzed by Vision AI</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Target Project Name</label>
              <input 
                type="text" 
                readOnly 
                value="Godrej Woodsman Estate (3BHK Luxury)" 
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white mt-1.5 focus:outline-none" 
              />
            </div>

            <button 
              onClick={() => { 
                setIsGenerating(true); 
                setTimeout(() => setIsGenerating(false), 900); 
              }}
              className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition shadow-lg shadow-indigo-950/50 cursor-pointer"
            >
              <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} /> 
              {isGenerating ? "Synthesizing Ad Slides..." : "Generate 4-Slide Ad & Copy"}
            </button>
          </div>

          {/* Output Display Container */}
          <div className="space-y-4">
            {/* Interactive Carousel Card */}
            <div className="relative aspect-[16/10] bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-800 flex flex-col justify-end p-6 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent z-10" />
              
              {/* Mock Background Image Effect */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-zinc-950 to-zinc-950 opacity-80" />

              <div className="relative z-20 space-y-2">
                <span className="bg-indigo-600 text-white text-[10px] px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider">
                  Slide {activeSlide + 1} of {slides.length} • {slides[activeSlide].tag}
                </span>
                <h3 className="text-lg lg:text-xl font-bold text-white">{slides[activeSlide].title}</h3>
                <p className="text-xs text-zinc-300">{slides[activeSlide].desc}</p>
              </div>

              {/* Navigation Indicators */}
              <div className="absolute top-4 right-4 z-20 flex gap-1.5">
                {slides.map((_, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => setActiveSlide(idx)}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${activeSlide === idx ? 'w-6 bg-indigo-400' : 'w-2 bg-zinc-700'}`} 
                  />
                ))}
              </div>
            </div>

            {/* Generated Caption Box */}
            <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl text-xs space-y-2.5 shadow-inner">
              <div className="flex justify-between items-center text-zinc-400">
                <span className="font-semibold text-zinc-200">AI Generated Caption ({currentLangData.label.split(' ')[0]} / EN)</span>
                <button 
                  onClick={handleCopyCaption}
                  className="text-indigo-400 hover:text-indigo-300 cursor-pointer hover:underline font-medium flex items-center gap-1"
                >
                  {copiedCaption ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCaption ? 'Copied!' : 'Copy Caption'}</span>
                </button>
              </div>
              <p className="text-zinc-300 leading-relaxed font-normal">
                ✨ Experience unmatched luxury at Godrej Woodsman! 3BHK designer residences featuring panoramic skyline views & 40+ resort-style amenities. 📍 Prime connectivity. Book your private site preview today! 🏡 #RealEstate #LuxuryLiving #DreamHome
              </p>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
};

export default SamruddhiAICompleteDashboard;
