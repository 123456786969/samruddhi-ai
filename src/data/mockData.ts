import { VoiceSample, PricingPlan, Testimonial, LeadMockData } from '../types';
import { languageSamples } from './languageSamples';

export { languageSamples };

export const VOICE_SAMPLES: VoiceSample[] = languageSamples.map(sample => ({
  id: sample.code,
  language: sample.label,
  flag: sample.flag || '🇮🇳',
  speaker: `Samruddhi AI (${sample.label})`,
  audioDuration: '0:15',
  transcript: sample.transcript,
  translation: 'Automated outbound voice call asking buyer requirements and scheduling weekend site visit.'
}));

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'broker',
    name: 'Broker & Channel Partner',
    tagline: 'Ideal for independent real estate consultants and growing agency teams.',
    monthlyPrice: 14999,
    annualPrice: 11999,
    leadCapacity: 'Up to 750 Leads / Mo',
    features: [
      'WhatsApp AI Engagement Engine (<10s reply)',
      'Multilingual Voice Calls (English & Hindi)',
      'Automated Site Visit Scheduling',
      'Instant SMS/WhatsApp Broker Notifications',
      'Basic CRM & Google Sheets Sync',
      'Email & Chat Support'
    ],
    ctaText: 'Start Free 7-Day Trial'
  },
  {
    id: 'developer',
    name: 'Mid-Size Developer',
    tagline: 'Built for builders managing 2-5 active residential/commercial projects.',
    monthlyPrice: 34999,
    annualPrice: 27999,
    leadCapacity: 'Up to 3,000 Leads / Mo',
    popular: true,
    features: [
      'Everything in Broker Plan',
      'All 5 Regional Languages (EN, HI, KN, TA, TE)',
      'Relentless Drip Follow-up Engine (Up to 14 days)',
      'Ad Performance & Meta/Google Ad Spend ROI Dashboard',
      'Direct CRM Integrations (Salesforce, LeadSquared, Sell.Do)',
      'Custom Voice Avatar & Builder Branding',
      'Dedicated Customer Success Manager'
    ],
    ctaText: 'Claim Growth Plan'
  },
  {
    id: 'enterprise',
    name: 'Enterprise Builder Group',
    tagline: 'For tier-1 builders with multi-city inventory & large sales forces.',
    monthlyPrice: 79999,
    annualPrice: 63999,
    leadCapacity: 'Unlimited Lead Scale',
    features: [
      'Everything in Growth Plan',
      'Custom AI Voice Model Trained on Your Sales Scripts',
      'Multi-Project & Multi-Branch Sales Routing',
      '24/7 Priority SLA & Dedicated Tech Support',
      'Custom API & ERP Integrations (SAP, Salesforce)',
      'On-site Sales Team Training & Onboarding',
      'Guaranteed +35% Site Visit Increase SLA'
    ],
    ctaText: 'Talk to Enterprise Sales'
  }
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: '1',
    name: 'Karthik Narayanan',
    role: 'Vice President - Sales & Marketing',
    company: 'Apex Realty Developers, Bengaluru',
    location: 'Bengaluru',
    quote: 'Before Samruddhi AI, our brokers were taking 4 to 6 hours to call Facebook ad leads. By then, 70% of leads went cold. With Samruddhi AI, WhatsApp engages buyers in 8 seconds and the AI voice assistant books 25+ site visits every single weekend. Our conversion cost plummeted by 38%.',
    metrics: '+44% Increase in Site Visits',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: '2',
    name: 'Priya Sundaram',
    role: 'Managing Director',
    company: 'Southern Heights Housing, Chennai',
    location: 'Chennai',
    quote: 'Having AI voice calls in Tamil and Kannada was a game-changer for our regional NRI and local buyers. The AI qualifies exact budget and possession timeline before sending the lead to our team. No time wasted on non-serious callers.',
    metrics: '0 Min Lead Response Time',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: '3',
    name: 'Sandeep Reddy',
    role: 'Head of Growth & Digital',
    company: 'Capital Crest Infrastructure, Hyderabad',
    location: 'Hyderabad',
    quote: 'We spent over ₹25 Lakhs per month on Meta & Google Ads. Tracking ROI from click to site visit used to be guesswork. Samruddhi AI integrated right into our ad accounts and showed us exactly which ad creative brought qualified buyers to our project site.',
    metrics: '14.8x ROI on Ad Spend',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80'
  }
];

export const MOCK_LIVE_LEADS: LeadMockData[] = [
  {
    id: 'L101',
    name: 'Rajesh Kumar',
    phone: '+91 98860 *****',
    source: 'Meta Ads (Whitefield 3BHK)',
    budget: '₹1.1 - ₹1.4 Cr',
    preferredLocation: 'Whitefield, Bengaluru',
    status: 'Site Visit Scheduled',
    timeAgo: '2 mins ago',
    language: 'English',
    aiAction: 'Booked Site Visit for Sat 11:00 AM'
  },
  {
    id: 'L102',
    name: 'Anish Deshmukh',
    phone: '+91 98201 *****',
    source: 'Google Search (Thane Luxury)',
    budget: '₹1.8 Cr+',
    preferredLocation: 'Thane West, Mumbai',
    status: 'Qualified',
    timeAgo: '4 mins ago',
    language: 'Hindi',
    aiAction: 'WhatsApp Brochure PDF sent & verified budget'
  },
  {
    id: 'L103',
    name: 'Venkat K. Murthy',
    phone: '+91 94440 *****',
    source: 'Instagram Ad (Gachibowli)',
    budget: '₹95L - ₹1.2 Cr',
    preferredLocation: 'Gachibowli, Hyderabad',
    status: 'Hot Lead',
    timeAgo: '7 mins ago',
    language: 'Telugu',
    aiAction: 'AI Voice Call completed: High Intent Buyer'
  },
  {
    id: 'L104',
    name: 'Karthik Subramanian',
    phone: '+91 98402 *****',
    source: 'Facebook Ad (OMR Villa)',
    budget: '₹2.2 Cr',
    preferredLocation: 'OMR, Chennai',
    status: 'In Follow-up',
    timeAgo: '12 mins ago',
    language: 'Tamil',
    aiAction: 'Auto Drip Day 2 sent on WhatsApp'
  }
];

export const WHATSAPP_SIMULATION_CHAT = [
  {
    sender: 'bot',
    time: '10:00 AM',
    text: '👋 Hi Rajesh! Thanks for your interest in Grand Horizon 3 BHK Apartments in Whitefield, Bengaluru.',
    subtext: 'Sent automatically in 6 seconds via Samruddhi AI'
  },
  {
    sender: 'bot',
    time: '10:00 AM',
    text: '📁 Here is the official project brochure PDF, floor plans, and pricing sheet:\n📄 Grand_Horizon_Brochure_2026.pdf (4.2 MB)'
  },
  {
    sender: 'user',
    time: '10:01 AM',
    text: 'Thanks! What is the price range for 3 BHK and possession date?'
  },
  {
    sender: 'bot',
    time: '10:01 AM',
    text: 'Prices start at ₹1.18 Cr onwards (All inclusive). Possession is scheduled for Dec 2026.\n\nAre you looking to visit the sample flat this Saturday at 11:00 AM or Sunday at 4:00 PM?'
  },
  {
    sender: 'user',
    time: '10:02 AM',
    text: 'Saturday 11 AM works for me and my wife.'
  },
  {
    sender: 'bot',
    time: '10:02 AM',
    text: '🎉 Excellent! Your Site Visit is confirmed for Saturday, 11:00 AM.\n\n📍 Location Pin: https://maps.google.com/sample-site\n\nOur Senior Sales Lead, Mr. Vikram (+91 98765 43210), will welcome you at the experience centre.'
  }
];
