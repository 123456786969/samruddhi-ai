export interface ConversationMessage {
  sender: 'bot' | 'user';
  text: string;
  audioSrc?: string;
  emotion?: 'warm' | 'curious' | 'reassuring' | 'excited' | 'professional';
}

export interface LocalizedWhatsAppMessage {
  id: string;
  sender: 'ai' | 'user';
  text?: string;
  isBrochure?: boolean;
  time: string;
  status?: 'sent' | 'delivered' | 'read';
}

export interface LocalizedAdSlide {
  badge: string;
  title: string;
  highlight: string;
  subtitle: string;
  features: string[];
  ctaText: string;
  tagline: string;
  priceNote: string;
}

export interface LanguageSample {
  code: string;
  label: string;
  nativeName: string;
  persona: string;
  personaAvatar: string;
  accent: string;
  emotion: string;
  cadence: string;
  audioSrc: string;
  transcript: string;
  flag?: string;
  conversation: ConversationMessage[];
  whatsappScript: LocalizedWhatsAppMessage[];
  adSlides: LocalizedAdSlide[];
}

export const languageSamples: LanguageSample[] = [
  {
    code: 'en',
    label: 'English',
    nativeName: 'English (Indian)',
    persona: 'Aditi — Bangalore Tech & Luxury Specialist',
    personaAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    accent: 'Urban Indian / Neutral Metros',
    emotion: 'Warm, Empathetic & Persuasive',
    cadence: 'Adaptive 148 WPM (Zero Stutter)',
    audioSrc: '/audio/sample-en.mp3',
    transcript: "Namaste Vikram! This is Samruddhi AI, calling about your enquiry for a 3BHK in Whitefield. I've found 2 prime RERA-approved towers matching your 1.5 Cr budget — would you like to schedule a VIP site visit this Saturday?",
    flag: '🇮🇳 / 🇬🇧',
    conversation: [
      { sender: 'bot', text: "Namaste Vikram! This is Samruddhi AI, calling regarding your recent enquiry for Godrej Woodsman 3BHK in Whitefield.", emotion: 'warm', audioSrc: '/audio/simulator/en_0.mp3' },
      { sender: 'user', text: "Hi, yes! I was looking for a spacious corner unit with good clubhouse amenities around 1.5 Crores.", emotion: 'curious', audioSrc: '/audio/simulator/en_1.mp3' },
      { sender: 'bot', text: "Understood. Tower C has 3 exclusive corner units available with unbroken green facing views. Are you available for a private site preview this Saturday at 11:30 AM?", emotion: 'professional', audioSrc: '/audio/simulator/en_2.mp3' },
      { sender: 'user', text: "Saturday 11:30 AM works nicely for me and my family.", emotion: 'excited', audioSrc: '/audio/simulator/en_3.mp3' },
      { sender: 'bot', text: "Wonderful! Your VIP site visit is reserved for Saturday 11:30 AM. I have immediately shared the RERA brochure and gate pass to your WhatsApp.", emotion: 'reassuring', audioSrc: '/audio/simulator/en_4.mp3' }
    ],
    whatsappScript: [
      { id: 'en-1', sender: 'ai', text: 'Hi **Vikram**! Great speaking with you during our telephone consultation.', time: '09:41 AM', status: 'read' },
      { id: 'en-2', sender: 'ai', text: 'As promised, here is the approved RERA project dossier and floor blueprint for **Godrej Woodsman (3BHK Sky Suite)**.', time: '09:41 AM', status: 'read' },
      { id: 'en-3', sender: 'ai', isBrochure: true, time: '09:41 AM', status: 'read' },
      { id: 'en-4', sender: 'ai', text: 'We have reserved a VIP private preview for you this **Saturday at 11:30 AM**. Would you like our site manager to confirm your slot?', time: '09:41 AM', status: 'read' }
    ],
    adSlides: [
      {
        badge: '⚡ VIP PRE-LAUNCH',
        title: 'GODREJ WOODSMAN',
        highlight: 'Luxury 3 & 4 BHK Sky Condos',
        subtitle: 'Prime IT Corridor, Whitefield Bangalore',
        features: ['100% Vastu Compliant Units', '55,000 Sq.Ft Clubhouse & Olympic Pool', '₹1.52 Cr* All-Inclusive'],
        ctaText: 'Download Brochure & Layouts',
        tagline: 'RERA Approved • Zero Brokerage direct from developer',
        priceNote: 'Starting at ₹1.52 Cr* with 10:90 Flexi Payment Plan'
      },
      {
        badge: '🔥 82% SOLD OUT',
        title: 'CORNER TOWER C',
        highlight: 'Panoramic Green Balconies',
        subtitle: 'Double-Height Living Rooms with Italian Marble',
        features: ['Only 4 Penthouses Left', '2 Dedicated EV Charging Car Parks', '10-Minute Walk to Metro'],
        ctaText: 'Book VIP Site Tour (WhatsApp)',
        tagline: 'Possession Q4 2026 • Top Tier Developer',
        priceNote: 'Pay 10% Now, Nothing Till Superstructure Ready'
      }
    ]
  },
  {
    code: 'kn',
    label: 'ಕನ್ನಡ',
    nativeName: 'ಕನ್ನಡ (Kannada)',
    persona: 'ಅನನ್ಯಾ (Ananya) — Bangalore Native Real Estate Concierge',
    personaAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    accent: 'Bengaluru / Mysuru Fluent & Respectful',
    emotion: 'ಆತ್ಮೀಯ ಮತ್ತು ವೃತ್ತಿಪರ (Warm & Professional)',
    cadence: 'ಅತ್ಯಂತ ಸ್ಪಷ್ಟ 142 WPM (ಕನಿಷ್ಠ ವಿಳಂಬ)',
    audioSrc: '/audio/sample-kn.mp3',
    transcript: "ನಮಸ್ತೆ ವಿಕ್ರಮ್ ಸರ್! ಇದು ಸಮೃದ್ಧಿ AI, ವೈಟ್‌ಫೀಲ್ಡ್‌ನಲ್ಲಿ 3BHK ಮನೆ ವಿಚಾರಣೆ ಬಗ್ಗೆ ಕರೆ ಮಾಡುತ್ತಿದ್ದೇನೆ. ನಿಮ್ಮ ₹1.5 ಕೋಟಿ ಬಜೆಟ್‌ಗೆ ತಕ್ಕಂತೆ 2 ಪ್ರೀಮಿಯಂ RERA ಪ್ರಾಜೆಕ್ಟ್‌ಗಳು ಲಭ್ಯವಿವೆ — ಈ ಶನಿವಾರ ಸೈಟ್ ವಿಸಿಟ್ ನಿಗದಿಪಡಿಸಲಾ?",
    flag: '🇮🇳',
    conversation: [
      { sender: 'bot', text: "ನಮಸ್ತೆ ವಿಕ್ರಮ್ ಸರ್! ಇದು ಸಮೃದ್ಧಿ AI, ವೈಟ್‌ಫೀಲ್ಡ್‌ನ ಗೋದ್ರೆಜ್ ವುಡ್ಸ್‌ಮನ್ 3BHK ಮನೆ ವಿಚಾರಣೆ ಬಗ್ಗೆ ಕರೆ ಮಾಡುತ್ತಿದ್ದೇನೆ.", emotion: 'warm', audioSrc: '/audio/simulator/kn_0.mp3' },
      { sender: 'user', text: "ಹೌದು, ನಾನು ಸುಮಾರು 1.5 ಕೋಟಿ ಬಜೆಟ್‌ನಲ್ಲಿ ಉತ್ತಮ ಕ್ಲಬ್‌ಹೌಸ್ ಇರುವ ಕಾರ್ನರ್ ಫ್ಲ್ಯಾಟ್ ಹುಡುಕುತ್ತಿದ್ದೇನೆ.", emotion: 'curious', audioSrc: '/audio/simulator/kn_1.mp3' },
      { sender: 'bot', text: "ಖಂಡಿತ ಸರ್. ಟವರ್ C ನಲ್ಲಿ ಪ್ರಕೃತಿ ಸೌಂದರ್ಯ ಕಾಣುವ 3 ಕಾರ್ನರ್ ಯೂನಿಟ್‌ಗಳು ಲಭ್ಯವಿವೆ. ಈ ಶನಿವಾರ ಬೆಳಿಗ್ಗೆ 11:30 ಕ್ಕೆ ಸೈಟ್ ವಿಸಿಟ್‌ಗೆ ಬರಲು ಸಾಧ್ಯವೇ?", emotion: 'professional', audioSrc: '/audio/simulator/kn_2.mp3' },
      { sender: 'user', text: "ಹೌದು, ಶನಿವಾರ ಬೆಳಿಗ್ಗೆ 11:30 ಸಮಯ ನಮಗೆ ಸೂಕ್ತವಾಗಿದೆ.", emotion: 'excited', audioSrc: '/audio/simulator/kn_3.mp3' },
      { sender: 'bot', text: "ತುಂಬಾ ಸಂತೋಷ ಸರ್! ನಿಮ್ಮ VIP ಸೈಟ್ ವಿಸಿಟ್ ಬುಕ್ ಮಾಡಲಾಗಿದೆ. RERA ಬ್ರೋಷರ್ ಮತ್ತು ಲೊಕೇಶನ್ ಮ್ಯಾಪ್ ಅನ್ನು ವಾಟ್ಸಾಪ್‌ಗೆ ಕಳುಹಿಸಿದ್ದೇನೆ.", emotion: 'reassuring', audioSrc: '/audio/simulator/kn_4.mp3' }
    ],
    whatsappScript: [
      { id: 'kn-1', sender: 'ai', text: 'ನಮಸ್ತೆ **ವಿಕ್ರಮ್ ಸರ್**! ನಮ್ಮ AI ಫೋನ್ ಸಂಭಾಷಣೆಗೆ ಧನ್ಯವಾದಗಳು.', time: '09:41 AM', status: 'read' },
      { id: 'kn-2', sender: 'ai', text: 'ನಿಮ್ಮ ಕೋರಿಕೆಯಂತೆ **ಗೋದ್ರೆಜ್ ವುಡ್ಸ್‌ಮನ್ (3BHK ಸ್ಕೈ ಸೂಟ್)** ಪ್ರಾಜೆಕ್ಟ್‌ನ RERA ಅನುಮೋದಿತ ಬ್ರೋಷರ್ ಮತ್ತು ಫ್ಲೋರ್ ಪ್ಲಾನ್ ಇಲ್ಲಿದೆ.', time: '09:41 AM', status: 'read' },
      { id: 'kn-3', sender: 'ai', isBrochure: true, time: '09:41 AM', status: 'read' },
      { id: 'kn-4', sender: 'ai', text: 'ಈ **ಶನಿವಾರ ಬೆಳಿಗ್ಗೆ 11:30 ಕ್ಕೆ** ನಿಮ್ಮ VIP ಸೈಟ್ ವಿಸಿಟ್ ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ. ಸೈಟ್ ಮ್ಯಾನೇಜರ್ ಇದನ್ನು ಖಚಿತಪಡಿಸಲೇ?', time: '09:41 AM', status: 'read' }
    ],
    adSlides: [
      {
        badge: '⚡ ನೂತನ ಪ್ರೀ-ಲಾಂಚ್',
        title: 'ಗೋದ್ರೆಜ್ ವುಡ್ಸ್‌ಮನ್',
        highlight: 'ಲಕ್ಸುರಿ 3 ಮತ್ತು 4 BHK ಸ್ಕೈ ಕಾಂಡೋಸ್',
        subtitle: 'ವೈಟ್‌ಫೀಲ್ಡ್ ಐಟಿ ಹಬ್ ಹತ್ತಿರ, ಬೆಂಗಳೂರು',
        features: ['100% ವಾಸ್ತು ಪ್ರಕಾರದ ವಿನ್ಯಾಸ', '55,000 ಚದರ ಅಡಿ ಕ್ಲಬ್‌ಹೌಸ್', '₹1.52 ಕೋಟಿ* ಆರಂಭಿಕ ಬೆಲೆ'],
        ctaText: 'ಬ್ರೋಷರ್ ಮತ್ತು ಪ್ಲಾನ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ',
        tagline: 'RERA ಅನುಮೋದಿತ • ನೇರ ಡೆವಲಪರ್ ಬುಕಿಂಗ್',
        priceNote: '10:90 ಸುಲಭ ಪಾವತಿ ಯೋಜನೆ ಲಭ್ಯ'
      },
      {
        badge: '🔥 ಕೊನೆಯ ಕೆಲವು ಯೂನಿಟ್‌ಗಳು',
        title: 'ಕಾರ್ನರ್ ಟವರ್ C',
        highlight: 'ವಿಶಾಲವಾದ ಗ್ರೀನ್ ಬಾಲ್ಕನಿಗಳು',
        subtitle: 'ಇಟಾಲಿಯನ್ ಮಾರ್ಬಲ್ ಮತ್ತು ಪ್ರೀಮಿಯಂ ಫಿನಿಶ್',
        features: ['ಮೆಟ್ರೋ ನಿಲ್ದಾಣಕ್ಕೆ 5 ನಿಮಿಷ', 'EV ಚಾರ್ಜಿಂಗ್ ಪಾರ್ಕಿಂಗ್', '24/7 ಭದ್ರತೆ'],
        ctaText: 'ವಾಟ್ಸಾಪ್‌ನಲ್ಲಿ ಸೈಟ್ ವಿಸಿಟ್ ಬುಕ್ ಮಾಡಿ',
        tagline: 'ಸ್ವಾಧೀನ 2026 • ವಿಶ್ವಾಸಾರ್ಹ ಡೆವಲಪರ್',
        priceNote: 'ಕೇವಲ 10% ಮುಂಗಡ ನೀಡಿ ನಿಮ್ಮ ಮನೆ ಬುಕ್ ಮಾಡಿ'
      }
    ]
  },
  {
    code: 'ta',
    label: 'தமிழ்',
    nativeName: 'தமிழ் (Tamil)',
    persona: 'காவ்யா (Kavya) — Chennai & Bangalore Luxury Advisor',
    personaAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    accent: 'Contemporary Chennai / Urban Tamil',
    emotion: 'மரியாதையான மற்றும் வேகமான (Polite & Precise)',
    cadence: '146 WPM (இயற்கையான உச்சரிப்பு)',
    audioSrc: '/audio/sample-ta.mp3',
    transcript: "வணக்கம் விக்ரம் சார்! நான் சம்ருத்தி AI, ஒயிட்ஃபீல்டில் உங்கள் 3BHK விசாரிப்பு பற்றி அழைக்கிறேன். உங்கள் ₹1.5 கோடி பட்ஜெட்டுக்கு ஏற்ற 2 சிறந்த RERA திட்டங்கள் உள்ளன — இந்த சனிக்கிழமை சைட் விசிட் புக் செய்யட்டுமா?",
    flag: '🇮🇳',
    conversation: [
      { sender: 'bot', text: "வணக்கம் விக்ரம் சார்! நான் சம்ருத்தி AI, வைட்பீல்டில் கோத்ரேஜ் உட்ஸ்மேன் 3BHK வீடு பற்றி பேசுகிறேன்.", emotion: 'warm', audioSrc: '/audio/simulator/ta_0.mp3' },
      { sender: 'user', text: "வணக்கம், சுமார் 1.5 கோடி பட்ஜெட்டில் நல்ல கிளப்ஹவுஸ் உள்ள கார்னர் அப்பார்ட்மென்ட் பார்க்கிறேன்.", emotion: 'curious', audioSrc: '/audio/simulator/ta_1.mp3' },
      { sender: 'bot', text: "நிச்சயமாக சார். டவர் C-யில் இயற்கை சூழல் அமைந்த 3 கார்னர் வீடுகள் உள்ளன. இந்த சனிக்கிழமை காலை 11:30 மணிக்கு சைட் விசிட் வர முடியுமா?", emotion: 'professional', audioSrc: '/audio/simulator/ta_2.mp3' },
      { sender: 'user', text: "ஆம், சனிக்கிழமை காலை 11:30 மணி எனக்கு வசதியாக இருக்கும்.", emotion: 'excited', audioSrc: '/audio/simulator/ta_3.mp3' },
      { sender: 'bot', text: "அருமை சார்! சனிக்கிழமை காலை 11:30 மணிக்கு உங்கள் VIP சைட் விசிட் புக் செய்யப்பட்டுள்ளது. விவரங்களை வாட்ஸ்அப்பில் அனுப்பியுள்ளேன்.", emotion: 'reassuring', audioSrc: '/audio/simulator/ta_4.mp3' }
    ],
    whatsappScript: [
      { id: 'ta-1', sender: 'ai', text: 'வணக்கம் **விக்ரம் சார்**! எங்கள் AI தொலைபேசி அழைப்பில் பேசியதற்கு நன்றி.', time: '09:41 AM', status: 'read' },
      { id: 'ta-2', sender: 'ai', text: 'நீங்கள் கேட்ட **கோத்ரேஜ் உட்ஸ்மேன் (3BHK ஸ்கை சூட்)** ப்ராஜெக்ட்டின் RERA ப்ரோஷர் மற்றும் வரைபடம் இதோ.', time: '09:41 AM', status: 'read' },
      { id: 'ta-3', sender: 'ai', isBrochure: true, time: '09:41 AM', status: 'read' },
      { id: 'ta-4', sender: 'ai', text: 'இந்த **சனிக்கிழமை காலை 11:30 மணிக்கு** உங்கள் VIP சைட் விசிட் புக் செய்யப்பட்டுள்ளது. இதை உறுதிப்படுத்தட்டுமா?', time: '09:41 AM', status: 'read' }
    ],
    adSlides: [
      {
        badge: '⚡ புதிய பிரீ-லான்ச்',
        title: 'கோத்ரேஜ் உட்ஸ்மேன்',
        highlight: 'லக்சரி 3 & 4 BHK ஸ்கை வீடுகள்',
        subtitle: 'ஒயிட்ஃபீல்ட் ஐடி காரிடார் அருகில்',
        features: ['100% வாஸ்து வடிவமைப்பு', '55,000 சதுர அடி கிளப்ஹவுஸ்', '₹1.52 கோடி* முதல்'],
        ctaText: 'ப்ரோஷர் பதிவிறக்கம் செய்ய',
        tagline: 'RERA அங்கீகாரம் • புரோக்கரேஜ் இல்லை',
        priceNote: '10:90 எளிதான பேமெண்ட் திட்டம்'
      },
      {
        badge: '🔥 80% விற்பனையானது',
        title: 'கார்னர் டவர் C',
        highlight: 'அழகான பால்கனி வியூ',
        subtitle: 'மெட்ரோவுக்கு 5 நிமிடம் நடைபயணம்',
        features: ['பிரீமியம் இத்தாலியன் மார்பிள்', 'EV சார்ஜிங் கார் பார்க்கிங்', '24 மணி நேர பாதுகாப்பு'],
        ctaText: 'வாட்ஸ்அப்பில் சைட் விசிட் பதிவு செய்ய',
        tagline: '2026-ல் ஒப்படைப்பு • முன்னணி பில்டர்',
        priceNote: '10% முன்பணம் மட்டும் செலுத்தவும்'
      }
    ]
  },
  {
    code: 'te',
    label: 'తెలుగు',
    nativeName: 'తెలుగు (Telugu)',
    persona: 'సురేష్ (Suresh) — Hyderabad & Bangalore High-Conversion Advisor',
    personaAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    accent: 'Telangana & Coastal Andhra Fluent',
    emotion: 'ఉత్సాహభరితమైన మరియు వేగవంతమైన (Energetic & Direct)',
    cadence: '150 WPM (ఎలాంటి జాప్యం లేకుండా)',
    audioSrc: '/audio/sample-te.mp3',
    transcript: "నమస్తే విక్రమ్ గారు! ఇది సమృద్ధి AI, వైట్‌ఫీల్డ్‌లో 3BHK ఇళ్ల గురించి మాట్లాడుతున్నాను. మీ ₹1.5 కోట్ల బడ్జెట్‌లో 2 బెస్ట్ RERA ప్రాజెక్ట్స్ ఉన్నాయి — ఈ శనివారం సైట్ విజిట్ బుక్ చేయమంటారా?",
    flag: '🇮🇳',
    conversation: [
      { sender: 'bot', text: "నమస్తే విక్రమ్ గారు! నేను సమృద్ధి AI నుండి కాల్ చేస్తున్నాను, వైట్‌ఫీల్డ్‌లో గోద్రెజ్ వుడ్స్‌మన్ 3BHK వివరాల గురించి.", emotion: 'warm', audioSrc: '/audio/simulator/te_0.mp3' },
      { sender: 'user', text: "నమస్తే, నేను 1.5 కోట్ల బడ్జెట్‌లో మంచి క్లబ్‌హౌస్ ఉన్న కార్నర్ ప్లాట్ చూస్తున్నాను.", emotion: 'curious', audioSrc: '/audio/simulator/te_1.mp3' },
      { sender: 'bot', text: "తప్పకుండా అండీ. టవర్ C లో గ్రీన్ వ్యూ ఉన్న 3 కార్నర్ యూనిట్లు అందుబాటులో ఉన్నాయి. ఈ శనివారం ఉదయం 11:30 కి సైట్ విజిట్‌కి రాగలరా?", emotion: 'professional', audioSrc: '/audio/simulator/te_2.mp3' },
      { sender: 'user', text: "అవును, శనివారం ఉదయం 11:30 మాకు చాలా అనుకూలంగా ఉంటుంది.", emotion: 'excited', audioSrc: '/audio/simulator/te_3.mp3' },
      { sender: 'bot', text: "చాలా సంతోషం అండీ! శనివారం ఉదయం 11:30 కి మీ VIP సైట్ విజిట్ బుక్ చేశాను. RERA బ్రోచర్ వాట్సాప్‌లో పంపించాను.", emotion: 'reassuring', audioSrc: '/audio/simulator/te_4.mp3' }
    ],
    whatsappScript: [
      { id: 'te-1', sender: 'ai', text: 'నమస్తే **విక్రమ్ గారు**! మన AI ఫోన్ సంభాషణకు ధన్యవాదాలు.', time: '09:41 AM', status: 'read' },
      { id: 'te-2', sender: 'ai', text: 'మీరు అడిగిన **గోద్రెజ్ వుడ్స్‌మన్ (3BHK స్కై సూట్)** ప్రాజెక్ట్ RERA బ్రోచర్ మరియు ఫ్లోర్ ప్లాన్ ఇక్కడ ఉంది.', time: '09:41 AM', status: 'read' },
      { id: 'te-3', sender: 'ai', isBrochure: true, time: '09:41 AM', status: 'read' },
      { id: 'te-4', sender: 'ai', text: 'ఈ **శనివారం ఉదయం 11:30 కి** మీ VIP సైట్ విజిట్ రిజర్వ్ చేశాము. సైట్ మేనేజర్ దీనిని కన్ఫర్మ్ చేయవచ్చా?', time: '09:41 AM', status: 'read' }
    ],
    adSlides: [
      {
        badge: '⚡ గ్రాండ్ ప్రీ-లాంచ్',
        title: 'గోద్రెజ్ వుడ్స్‌మన్',
        highlight: 'లగ్జరీ 3 & 4 BHK స్కై కాండోస్',
        subtitle: 'వైట్‌ఫీల్డ్ ఐటీ కారిడార్ దగ్గర',
        features: ['100% వాస్తు నిర్మాణం', '55,000 చ.అ. క్లబ్‌హౌస్', 'ధర ₹1.52 కోట్ల నుండి'],
        ctaText: 'బ్రోచర్ మరియు ప్లాన్స్ డౌన్‌లోడ్ చేయండి',
        tagline: 'RERA ఆమోదం • డైరెక్ట్ డెవలపర్ ఆఫర్',
        priceNote: '10:90 సులభ వాయిదాల పద్ధతి'
      },
      {
        badge: '🔥 కార్నర్ టవర్ C',
        title: 'ప్రీమియం వ్యూస్',
        highlight: 'విశాలమైన గ్రీన్ బాల్కనీలు',
        subtitle: 'మెట్రోకి కేవలం 5 నిమిషాల దూరం',
        features: ['ఇటాలియన్ మార్బుల్ ఫ్లోరింగ్', 'EV చార్జింగ్ కార్ పార్కింగ్', '24/7 సెక్యూరిటీ'],
        ctaText: 'వాట్సాప్‌లో సైట్ విజిట్ బుక్ చేయండి',
        tagline: 'పొసెషన్ 2026 • ప్రఖ్యాత డెవలపర్',
        priceNote: '10% అడ్వాన్స్ చెల్లించి ఇల్లు బుక్ చేసుకోండి'
      }
    ]
  },
  {
    code: 'hi',
    label: 'हिंदी',
    nativeName: 'हिंदी (Hindi)',
    persona: 'पूजा (Pooja) — NCR & Pan-India Elite Closer',
    personaAvatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&auto=format&fit=crop&q=80',
    accent: 'Delhi NCR / Modern Urban Hindi',
    emotion: 'मधुर, स्पष्ट और आत्मविश्वास से भरपूर (Warm & Confident)',
    cadence: 'सहज 145 WPM (बिना किसी रुकावट के)',
    audioSrc: '/audio/sample-hi.mp3',
    transcript: "नमस्ते विक्रम जी! मैं समृद्धि AI से बात कर रही हूँ, व्हाइटफ़ील्ड में 3BHK फ़्लैट की आपकी इन्क्वायरी के संदर्भ में। आपके ₹1.5 करोड़ के बजट में 2 प्राइम RERA प्रोजेक्ट्स उपलब्ध हैं — क्या इस शनिवार साइट विज़िट बुक करें?",
    flag: '🇮🇳',
    conversation: [
      { sender: 'bot', text: "नमस्ते विक्रम जी! मैं समृद्धि AI से बात कर रही हूँ, व्हाइटफ़ील्ड में गोदरेज वुड्समैन 3BHK प्रोजेक्ट के सिलसिले में।", emotion: 'warm', audioSrc: '/audio/simulator/hi_0.mp3' },
      { sender: 'user', text: "हाँ जी, मैं लगभग 1.5 करोड़ के बजट में एक अच्छा कॉर्नर फ्लैट देख रहा हूँ जिसमें बेहतरीन क्लबहाउस हो।", emotion: 'curious', audioSrc: '/audio/simulator/hi_1.mp3' },
      { sender: 'bot', text: "बिल्कुल सर! टावर C में शानदार ग्रीन व्यू वाले 3 कॉर्नर यूनिट्स उपलब्ध हैं। क्या आप इस शनिवार सुबह 11:30 बजे साइट विज़िट के लिए आ सकते हैं?", emotion: 'professional', audioSrc: '/audio/simulator/hi_2.mp3' },
      { sender: 'user', text: "हाँ, शनिवार सुबह 11:30 बजे का समय हमारे लिए बिल्कुल सही रहेगा।", emotion: 'excited', audioSrc: '/audio/simulator/hi_3.mp3' },
      { sender: 'bot', text: "बहुत बढ़िया सर! आपकी VIP साइट विज़िट शनिवार सुबह 11:30 बजे के लिए कन्फ़र्म कर दी गई है। RERA ब्रोशर और गेट पास मैंने आपके व्हाट्सएप पर भेज दिया है।", emotion: 'reassuring', audioSrc: '/audio/simulator/hi_4.mp3' }
    ],
    whatsappScript: [
      { id: 'hi-1', sender: 'ai', text: 'नमस्ते **विक्रम जी**! हमारे AI टेलीफोन परामर्श में बात करने के लिए धन्यवाद।', time: '09:41 AM', status: 'read' },
      { id: 'hi-2', sender: 'ai', text: 'आपके अनुरोध के अनुसार **गोदरेज वुड्समैन (3BHK स्काई सुइट)** का RERA अप्रूव्ड ब्रोशर और फ्लोर प्लान संलग्न है।', time: '09:41 AM', status: 'read' },
      { id: 'hi-3', sender: 'ai', isBrochure: true, time: '09:41 AM', status: 'read' },
      { id: 'hi-4', sender: 'ai', text: 'इस **शनिवार सुबह 11:30 बजे** आपकी VIP साइट विज़िट आरक्षित है। क्या हमारे साइट मैनेजर इसे लॉक कर दें?', time: '09:41 AM', status: 'read' }
    ],
    adSlides: [
      {
        badge: '⚡ प्री-लॉन्च एक्सक्लूसिव',
        title: 'गोदरेज वुड्समैन',
        highlight: 'लक्ज़री 3 और 4 BHK स्काई कोंडोस',
        subtitle: 'व्हाइटफ़ील्ड आईटी हब के समीप, बैंगलोर',
        features: ['100% वास्तु अनुकूल डिजाइन', '55,000 वर्ग फुट का क्लबहाउस', 'शुरुआती कीमत ₹1.52 करोड़*'],
        ctaText: 'ब्रोशर और फ्लोर प्लान डाउनलोड करें',
        tagline: 'RERA अनुमोदित • डायरेक्ट डेवलपर बुकिंग',
        priceNote: '10:90 आसान फ्लेक्सी पेमेंट प्लान उपलब्ध'
      },
      {
        badge: '🔥 कॉर्नर टावर C',
        title: 'पैनोरमिक ग्रीन बालकनी',
        highlight: 'डबल हाइट लिविंग रूम और इटालियन मार्बल',
        subtitle: 'मेट्रो स्टेशन से सिर्फ 5 मिनट की दूरी',
        features: ['केवल 4 प्रीमियम यूनिट्स शेष', 'EV चार्जिंग कार पार्किंग', '24/7 सुरक्षा'],
        ctaText: 'व्हाट्सएप पर साइट विज़िट बुक करें',
        tagline: 'कब्ज़ा 2026 • शीर्ष डेवलपर',
        priceNote: 'मात्र 10% अभी दें, बाकी ढांचा तैयार होने पर'
      }
    ]
  },
  {
    code: 'mr',
    label: 'मराठी',
    nativeName: 'मराठी (Marathi)',
    persona: 'तन्वी (Tanvi) — Mumbai & Pune Prime Real Estate Advisor',
    personaAvatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80',
    accent: 'Pune / Mumbai Fluent & Cultured',
    emotion: 'आदरयुक्त आणि प्रभावी (Respectful & Persuasive)',
    cadence: '144 WPM (अतिशय सुस्पष्ट)',
    audioSrc: '/audio/sample-mr.mp3',
    transcript: "नमस्कार विक्रम जी! मी समृद्धी AI कडून बोलत आहे, व्हाइटफील्ड मधील 3BHK फ्लॅटच्या चौकशीबाबत. आपल्या ₹1.5 कोटी बजेटमध्ये 2 उत्तम RERA प्रोजेक्ट्स उपलब्ध आहेत — या शनिवारी साईट व्हिजिट बुक करायची का?",
    flag: '🇮🇳',
    conversation: [
      { sender: 'bot', text: "नमस्कार विक्रम जी! मी समृद्धी AI कडून बोलत आहे, व्हाइटफील्ड मधील गोदरेज वूड्समन 3BHK फ्लॅटच्या चौकशीबद्दल.", emotion: 'warm', audioSrc: '/audio/simulator/mr_0.mp3' },
      { sender: 'user', text: "हो, मी साधारण 1.5 कोटींच्या बजेटमध्ये चांगला क्लबहाऊस असलेला कॉर्नर फ्लॅट शोधत आहे.", emotion: 'curious', audioSrc: '/audio/simulator/mr_1.mp3' },
      { sender: 'bot', text: "नक्कीच सर. टॉवर C मध्ये सुंदर निसर्गरम्य दृश्य असलेले 3 कॉर्नर फ्लॅट्स उपलब्ध आहेत. आपण या शनिवारी सकाळी 11:30 वाजता साईट व्हिजिटसाठी येऊ शकता का?", emotion: 'professional', audioSrc: '/audio/simulator/mr_2.mp3' },
      { sender: 'user', text: "हो, शनिवारी सकाळी 11:30 वाजता वेळ आम्हाला सोयीची आहे.", emotion: 'excited', audioSrc: '/audio/simulator/mr_3.mp3' },
      { sender: 'bot', text: "खूप छान सर! आपली VIP साईट व्हिजिट शनिवारी सकाळी 11:30 वाजता कन्फर्म झाली आहे. RERA ब्रोशर मी व्हॉट्सॲपवर पाठवले आहे.", emotion: 'reassuring', audioSrc: '/audio/simulator/mr_4.mp3' }
    ],
    whatsappScript: [
      { id: 'mr-1', sender: 'ai', text: 'नमस्कार **विक्रम जी**! आपल्या AI फोन संभाषणाबद्दल धन्यवाद.', time: '09:41 AM', status: 'read' },
      { id: 'mr-2', sender: 'ai', text: 'आपल्या मागणीनुसार **गोदरेज वूड्समन (3BHK स्काय सूट)** चे RERA मान्यताप्राप्त ब्रोशर आणि नकाशा सोबत जोडले आहे.', time: '09:41 AM', status: 'read' },
      { id: 'mr-3', sender: 'ai', isBrochure: true, time: '09:41 AM', status: 'read' },
      { id: 'mr-4', sender: 'ai', text: 'या **शनिवारी सकाळी 11:30 वाजता** आपली VIP साईट व्हिजिट आरक्षित केली आहे. हे कन्फर्म करायचे का?', time: '09:41 AM', status: 'read' }
    ],
    adSlides: [
      {
        badge: '⚡ भव्य प्री-लाँच',
        title: 'गोदरेज वूड्समन',
        highlight: 'लक्झरी 3 आणि 4 BHK स्काय घरे',
        subtitle: 'व्हाइटफील्ड आयटी कॉरिडोअर जवळ',
        features: ['100% वास्तू अनुरूप रचना', '55,000 चौ. फूट क्लबहाऊस', 'किंमत ₹1.52 कोटी* पासून'],
        ctaText: 'ब्रोशर आणि फ्लोअर प्लॅन डाऊनलोड करा',
        tagline: 'RERA मान्यताप्राप्त • थेट बिल्डरकडून बुकिंग',
        priceNote: '10:90 सुलभ पेमेंट योजना उपलब्ध'
      },
      {
        badge: '🔥 कॉर्नर टॉवर C',
        title: 'पॅनोरॅमिक व्ह्यू',
        highlight: 'भव्य ग्रीन बाल्कनी',
        subtitle: 'मेट्रो स्टेशनपासून फक्त 5 मिनिटांवर',
        features: ['इटालियन मार्बल फ्लोअरिंग', 'EV चार्जिंग कार पार्किंग', '24 तास सुरक्षा'],
        ctaText: 'व्हॉट्सॲपवर साईट व्हिजिट बुक करा',
        tagline: 'ताबा 2026 • नामांकित बिल्डर',
        priceNote: 'फक्त 10% ॲडव्हान्स देऊन घर बुक करा'
      }
    ]
  },
  {
    code: 'ml',
    label: 'മലയാളം',
    nativeName: 'മലയാളം (Malayalam)',
    persona: 'ആര്യ (Arya) — Kerala & NRI Luxury Property Specialist',
    personaAvatar: 'https://images.unsplash.com/photo-1548142813-c348350df52b?w=150&auto=format&fit=crop&q=80',
    accent: 'Kochi / Modern NRI Urban Malayalam',
    emotion: 'വിശ്വാസയോഗ്യമായതും ഹൃദ്യവുമായ (Warm & Trustworthy)',
    cadence: '143 WPM (സ്വാഭാവികമായ സംസാരിക്കൽ ശൈലി)',
    audioSrc: '/audio/sample-ml.mp3',
    transcript: "നമസ്തേ വിക്രം സാർ! ഇത് സമൃദ്ധി AI ആണ്, വൈറ്റ്ഫീൽഡിലെ 3BHK ഫ്ലാറ്റ് അന്വേഷണത്തെക്കുറിച്ച് വിളിക്കുകയാണ്. നിങ്ങളുടെ ₹1.5 കോടി ബഡ്ജറ്റിൽ 2 പ്രീമിയം RERA പ്രോപ്പർട്ടികൾ ലഭ്യമാണ് — ഈ ശനിയാഴ്ച സൈറ്റ് വിസിറ്റ് ബുക്ക് ചെയ്യട്ടെ?",
    flag: '🇮🇳',
    conversation: [
      { sender: 'bot', text: "നമസ്തേ വിക്രം സാർ! ഇത് സമൃദ്ധി AI ആണ്, വൈറ്റ്ഫീൽഡിലെ ഗോദ്‌റെജ് വുഡ്‌സ്‌മാൻ 3BHK പ്രോജക്ടിനെക്കുറിച്ച് സംസാരിക്കാൻ വിളിച്ചതാണ്.", emotion: 'warm', audioSrc: '/audio/simulator/ml_0.mp3' },
      { sender: 'user', text: "അതെ, ഏകദേശം 1.5 കോടി ബഡ്ജറ്റിൽ നല്ല ക്ലബ്ബ്ഹൗസ് സൗകര്യങ്ങളുള്ള ഒരു കോർണർ ഫ്ലാറ്റ് നോക്കുകയാണ്.", emotion: 'curious', audioSrc: '/audio/simulator/ml_1.mp3' },
      { sender: 'bot', text: "തീർച്ചയായും സാർ. ടവർ C യിൽ മനോഹരമായ ഗ്രീൻ വ്യൂ ഉള്ള 3 കോർണർ യൂണിറ്റുകൾ ഉണ്ട്. ഈ ശനിയാഴ്ച രാവിലെ 11:30 ന് സൈറ്റ് വിസിറ്റിന് വരാൻ സാധിക്കുമോ?", emotion: 'professional', audioSrc: '/audio/simulator/ml_2.mp3' },
      { sender: 'user', text: "അതെ, ശനിയാഴ്ച രാവിലെ 11:30 ഞങ്ങൾക്ക് സൗകര്യപ്രദമാണ്.", emotion: 'excited', audioSrc: '/audio/simulator/ml_3.mp3' },
      { sender: 'bot', text: "വളരെ സന്തോഷം സാർ! ശനിയാഴ്ച രാവിലെ 11:30 ന് നിങ്ങളുടെ VIP സൈറ്റ് വിസിറ്റ് ബുക്ക് ചെയ്തിട്ടുണ്ട്. RERA ബ്രോഷർ വാട്സ്ആപ്പിൽ അയച്ചിട്ടുണ്ട്.", emotion: 'reassuring', audioSrc: '/audio/simulator/ml_4.mp3' }
    ],
    whatsappScript: [
      { id: 'ml-1', sender: 'ai', text: 'നമസ്തേ **വിക്രം സാർ**! ഞങ്ങളുടെ AI ഫോൺ കോളിൽ സംസാരിച്ചതിന് നന്ദി.', time: '09:41 AM', status: 'read' },
      { id: 'ml-2', sender: 'ai', text: 'നിങ്ങൾ ആവശ്യപ്പെട്ട **ഗോദ്‌റെജ് വുഡ്‌സ്‌മാൻ (3BHK സ്കൈ സ്യൂട്ട്)** RERA അംഗീകൃത ബ്രോഷറും ഫ്ലോർ പ്ലാനും ഇതാ.', time: '09:41 AM', status: 'read' },
      { id: 'ml-3', sender: 'ai', isBrochure: true, time: '09:41 AM', status: 'read' },
      { id: 'ml-4', sender: 'ai', text: 'ഈ **ശനിയാഴ്ച രാവിലെ 11:30 ന്** നിങ്ങളുടെ VIP സൈറ്റ് വിസിറ്റ് ബുക്ക് ചെയ്തിട്ടുണ്ട്. സൈറ്റ് മാനേജർ ഇത് സ്ഥിരീകരിക്കട്ടെ?', time: '09:41 AM', status: 'read' }
    ],
    adSlides: [
      {
        badge: '⚡ പ്രീ-ലോഞ്ച് എക്സ്ക്ലൂസീവ്',
        title: 'ഗോദ്‌റെജ് വുഡ്‌സ്‌മാൻ',
        highlight: 'ആഡംബര 3 & 4 BHK സ്കൈ വീടുകൾ',
        subtitle: 'വൈറ്റ്ഫീൽഡ് ഐടി പാർക്കിന് സമീപം',
        features: ['100% വാസ്തു പ്ലാനിംഗ്', '55,000 ചതുരശ്ര അടി ക്ലബ്ബ്ഹൗസ്', 'വില ₹1.52 കോടി* മുതൽ'],
        ctaText: 'ബ്രോഷറും പ്ലാനും ഡൗൺലോഡ് ചെയ്യുക',
        tagline: 'RERA അംഗീകൃതം • ബ്രോക്കറേജ് ഇല്ല',
        priceNote: '10:90 എളുപ്പമുള്ള പേയ്‌മെന്റ് പ്ലാൻ'
      },
      {
        badge: '🔥 കോർണർ ടവർ C',
        title: 'പനോരമിക് ഗ്രീൻ വ്യൂ',
        highlight: 'വിശാലമായ ബാൽക്കണികൾ',
        subtitle: 'മെട്രോയിലേക്ക് 5 മിനിറ്റ് നടപ്പ് ദൂരം',
        features: ['ഇറ്റാലിയൻ മാർബിൾ ഫിനിഷിംഗ്', 'EV ചാർജിംഗ് കാർ പാർക്കിംഗ്', '24/7 സുരക്ഷ'],
        ctaText: 'വാട്സ്ആപ്പിൽ സൈറ്റ് വിസിറ്റ് ബുക്ക് ചെയ്യുക',
        tagline: 'കൈമാറ്റം 2026 • പ്രമുഖ ബിൽഡർ',
        priceNote: '10% മാത്രം നൽകി നിങ്ങളുടെ വീട് ബുക്ക് ചെയ്യുക'
      }
    ]
  }
];
