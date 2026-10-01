export interface CityData {
  name: string;
  slug: string;
  state: string;
  tagline: string;
  heroHeadline: string;
  heroSubheadline: string;
  stats: {
    activeAgents: string;
    avgResponseTime: string;
    leadsRecovered: string;
    siteVisitIncrease: string;
  };
  microMarkets: string[];
  languagesSupported: string[];
  testimonial: {
    quote: string;
    author: string;
    role: string;
    company: string;
    image: string;
  };
  seo: {
    title: string;
    metaDescription: string;
  };
}

export const CITIES_DATA: Record<string, CityData> = {
  'bengaluru': {
    name: 'Bengaluru',
    slug: 'bengaluru',
    state: 'Karnataka',
    tagline: 'Bengaluru\'s #1 AI Lead Automation Engine for Real Estate',
    heroHeadline: 'Never Lose a Real Estate Lead in Bengaluru Again',
    heroSubheadline: 'Engage IT professionals & home buyers in Sarjapur, Whitefield, and Hebbal automatically on WhatsApp & Voice AI in Kannada, Hindi, and English within 10 seconds.',
    stats: {
      activeAgents: '180+ Developers & Brokers',
      avgResponseTime: '< 8 Seconds',
      leadsRecovered: '14,200+ Meta Ads Leads',
      siteVisitIncrease: '+42% Visits'
    },
    microMarkets: ['Sarjapur Road', 'Whitefield', 'Hebbal', 'Electronic City', 'Indiranagar', 'Yelahanka'],
    languagesSupported: ['Kannada', 'English', 'Hindi', 'Telugu'],
    testimonial: {
      quote: "In Bengaluru's tech corridors, buyers expect instant floorplans and prices on WhatsApp before they even close Facebook. Samruddhi AI increased our site visit bookings by 44% in Whitefield.",
      author: "Karthik Reddy",
      role: "Managing Director",
      company: "Apex Properties Bengaluru",
      image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=300"
    },
    seo: {
      title: "Real Estate AI WhatsApp Automation Bengaluru | Samruddhi AI",
      metaDescription: "Automate real estate lead follow-up in Bengaluru. AI WhatsApp bot & multilingual voice calls in Kannada, Hindi, English for Whitefield, Sarjapur & Hebbal brokers."
    }
  },
  'mumbai': {
    name: 'Mumbai',
    slug: 'mumbai',
    state: 'Maharashtra',
    tagline: 'Mumbai & MMR\'s Premier Real Estate AI Sales Agent',
    heroHeadline: 'Never Lose a Real Estate Lead in Mumbai Again',
    heroSubheadline: 'Instantly qualify high-intent luxury buyers in BKC, Thane, Navi Mumbai, and South Mumbai with automated WhatsApp brochures and AI voice calls in Marathi, Hindi, and English.',
    stats: {
      activeAgents: '240+ Developers & Agency Partners',
      avgResponseTime: '< 6 Seconds',
      leadsRecovered: '22,800+ Ad Leads',
      siteVisitIncrease: '+48% Visits'
    },
    microMarkets: ['Thane West', 'Navi Mumbai', 'BKC & Bandra', 'Kandivali & Borivali', 'South Mumbai', 'Powai'],
    languagesSupported: ['Marathi', 'Hindi', 'English', 'Gujarati'],
    testimonial: {
      quote: "Mumbai homebuyers move fast. If you take 30 minutes to reply on WhatsApp, they've booked a visit with another builder. Samruddhi AI instantly shares PDFs and schedules site visits 24/7.",
      author: "Rajesh S. Mehta",
      role: "Sales Head",
      company: "Skyline Infra MMR",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300"
    },
    seo: {
      title: "Real Estate AI Lead Management Mumbai & Thane | Samruddhi AI",
      metaDescription: "Boost Mumbai property sales with AI WhatsApp automation and Marathi & Hindi voice calls. Convert Meta ad leads in Thane, Navi Mumbai, and BKC into site visits."
    }
  },
  'delhi-ncr': {
    name: 'Delhi NCR',
    slug: 'delhi-ncr',
    state: 'Delhi / Haryana / UP',
    tagline: 'Delhi NCR\'s Highest Converting Real Estate AI Engine',
    heroHeadline: 'Never Lose a Real Estate Lead in Delhi NCR Again',
    heroSubheadline: 'Capture luxury apartment & commercial property leads across Gurugram, Noida, Dwarka Expressway, and Greater Noida with instant WhatsApp responses and natural Hindi voice AI.',
    stats: {
      activeAgents: '210+ Premium Brokers',
      avgResponseTime: '< 7 Seconds',
      leadsRecovered: '18,500+ Qualified Leads',
      siteVisitIncrease: '+45% Visits'
    },
    microMarkets: ['Golf Course Extension', 'Dwarka Expressway', 'Noida Sector 150', 'Greater Noida West', 'Sohna Road', 'New Gurugram'],
    languagesSupported: ['Hindi', 'English', 'Punjabi'],
    testimonial: {
      quote: "For Dwarka Expressway and Golf Course Road listings, lead volumes from Meta ads are massive. Samruddhi AI weeds out fake numbers and schedules site visits for genuine buyers automatically.",
      author: "Anuj Chaudhary",
      role: "Founder & CEO",
      company: "Capital Heights NCR",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300"
    },
    seo: {
      title: "Real Estate AI CRM & WhatsApp Automation Delhi NCR | Samruddhi AI",
      metaDescription: "Automate Gurugram & Noida real estate lead qualification. AI WhatsApp chat and Hindi voice calls for Dwarka Expressway, Golf Course Road & Greater Noida."
    }
  },
  'hyderabad': {
    name: 'Hyderabad',
    slug: 'hyderabad',
    state: 'Telangana',
    tagline: 'Telangana\'s Leading AI Real Estate Sales Infrastructure',
    heroHeadline: 'Never Lose a Real Estate Lead in Hyderabad Again',
    heroSubheadline: 'Engage villa and high-rise buyers in Gachibowli, HITEC City, Kokapet, and Tellapur over WhatsApp & AI voice calls in Telugu, Hindi, and English instantly.',
    stats: {
      activeAgents: '160+ Top Agency Teams',
      avgResponseTime: '< 9 Seconds',
      leadsRecovered: '11,400+ Property Leads',
      siteVisitIncrease: '+41% Visits'
    },
    microMarkets: ['Kokapet', 'Gachibowli', 'Tellapur', 'HITEC City', 'Miyapur', 'Kollur'],
    languagesSupported: ['Telugu', 'English', 'Hindi'],
    testimonial: {
      quote: "With buyers in Kokapet and Gachibowli inquiring during late hours, Samruddhi AI answers questions, sends video walkthroughs, and confirms Sunday site visits while our team sleeps.",
      author: "Venkatesh Rao",
      role: "Partner",
      company: "Deccan Prime Properties",
      image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=300"
    },
    seo: {
      title: "Real Estate AI WhatsApp & Voice Call Automation Hyderabad | Samruddhi AI",
      metaDescription: "Convert Hyderabad real estate leads fast. Telugu & English AI voice calls and automated WhatsApp brochure sharing for Kokapet, Gachibowli & Tellapur."
    }
  },
  'pune': {
    name: 'Pune',
    slug: 'pune',
    state: 'Maharashtra',
    tagline: 'Pune\'s Top-Rated AI Real Estate Lead Qualification Tool',
    heroHeadline: 'Never Lose a Real Estate Lead in Pune Again',
    heroSubheadline: 'Automate WhatsApp inquiries and voice follow-ups in Hinjewadi, Kharadi, Baner, and Wakad in Marathi, Hindi, and English for 3x higher site visit conversion.',
    stats: {
      activeAgents: '150+ Builder Networks',
      avgResponseTime: '< 8 Seconds',
      leadsRecovered: '9,800+ Active Leads',
      siteVisitIncrease: '+39% Visits'
    },
    microMarkets: ['Hinjewadi', 'Kharadi', 'Baner', 'Wakad', 'Hadapsar', 'Bavdhan'],
    languagesSupported: ['Marathi', 'Hindi', 'English'],
    testimonial: {
      quote: "Hinjewadi IT pros respond best to immediate WhatsApp messages with clear pricing and floorplan PDFs. Samruddhi AI delivers that instantly and follows up on voice call.",
      author: "Pooja Deshmukh",
      role: "Director of Marketing",
      company: "Maratha Landmark Developers",
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300"
    },
    seo: {
      title: "Real Estate AI WhatsApp Automation Pune | Samruddhi AI",
      metaDescription: "Scale Pune real estate lead conversion with AI. Automated Marathi and Hindi voice calls & WhatsApp floorplan sharing for Hinjewadi, Kharadi & Baner."
    }
  },
  'chennai': {
    name: 'Chennai',
    slug: 'chennai',
    state: 'Tamil Nadu',
    tagline: 'Tamil Nadu\'s #1 Real Estate AI Sales Companion',
    heroHeadline: 'Never Lose a Real Estate Lead in Chennai Again',
    heroSubheadline: 'Qualify property buyers along OMR, ECR, Anna Nagar, and Velachery in native Tamil and English with instant WhatsApp catalog delivery and voice AI scheduling.',
    stats: {
      activeAgents: '120+ Real Estate Firms',
      avgResponseTime: '< 10 Seconds',
      leadsRecovered: '8,200+ Leads Processed',
      siteVisitIncrease: '+38% Visits'
    },
    microMarkets: ['OMR Tech Corridor', 'ECR Coastal Belt', 'Anna Nagar', 'Velachery', 'Porur', 'Tambaram'],
    languagesSupported: ['Tamil', 'English'],
    testimonial: {
      quote: "Native Tamil voice follow-up made a huge difference for our OMR and Porur residential projects. Buyers feel comfortable discussing budget before scheduling the visit.",
      author: "Senthil Kumar",
      role: "VP Sales",
      company: "Coromandel Living Chennai",
      image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=300"
    },
    seo: {
      title: "Real Estate AI WhatsApp & Tamil Voice Calls Chennai | Samruddhi AI",
      metaDescription: "Automate Chennai property lead follow-up in Tamil & English. Instant WhatsApp pricing and AI voice call scheduling for OMR, ECR, and Anna Nagar brokers."
    }
  },
  'kolkata': {
    name: 'Kolkata',
    slug: 'kolkata',
    state: 'West Bengal',
    tagline: 'Eastern India\'s Premier AI Real Estate Lead Infrastructure',
    heroHeadline: 'Never Lose a Real Estate Lead in Kolkata Again',
    heroSubheadline: 'Engage home seekers in New Town, Rajarhat, EM Bypass, and Salt Lake in Bengali, Hindi, and English on WhatsApp & voice call automatically.',
    stats: {
      activeAgents: '95+ Developer Alliances',
      avgResponseTime: '< 9 Seconds',
      leadsRecovered: '6,400+ Recovered Leads',
      siteVisitIncrease: '+36% Visits'
    },
    microMarkets: ['New Town', 'Rajarhat', 'EM Bypass', 'Salt Lake Sector V', 'Jadavpur', 'Ballygunge'],
    languagesSupported: ['Bengali', 'Hindi', 'English'],
    testimonial: {
      quote: "Samruddhi AI eliminated our biggest weakness: weekend missed calls. Now every Facebook lead gets a polite Bengali/Hindi voice call and instant WhatsApp walkthrough within 10 seconds.",
      author: "Subhabrata Banerjee",
      role: "Principal Broker",
      company: "City Joy Realty Kolkata",
      image: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&q=80&w=300"
    },
    seo: {
      title: "Real Estate AI Lead Management Kolkata | Samruddhi AI",
      metaDescription: "Bengali & Hindi AI voice calls and WhatsApp automation for Kolkata real estate developers in New Town, Rajarhat, and EM Bypass."
    }
  },
  'ahmedabad': {
    name: 'Ahmedabad',
    slug: 'ahmedabad',
    state: 'Gujarat',
    tagline: 'Gujarat\'s Leading Real Estate AI Lead Qualification Engine',
    heroHeadline: 'Never Lose a Real Estate Lead in Ahmedabad Again',
    heroSubheadline: 'Connect with commercial and residential buyers in SG Highway, Bopal, Vaishnodevi, and GIFT City in Gujarati, Hindi, and English automatically.',
    stats: {
      activeAgents: '130+ Builders & Brokers',
      avgResponseTime: '< 8 Seconds',
      leadsRecovered: '9,100+ Ad Leads',
      siteVisitIncrease: '+40% Visits'
    },
    microMarkets: ['SG Highway', 'South Bopal', 'GIFT City Zone', 'Vaishnodevi Circle', 'Prahlad Nagar', 'Thaltej'],
    languagesSupported: ['Gujarati', 'Hindi', 'English'],
    testimonial: {
      quote: "In Ahmedabad, business buyers want exact per-sq-ft rates and clear ROI metrics. Samruddhi AI answers instantly on WhatsApp in Gujarati/English and sets up site visits.",
      author: "Chintan Patel",
      role: "Director",
      company: "Patel Infrastructure Ahmedabad",
      image: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=300"
    },
    seo: {
      title: "Real Estate AI WhatsApp & Gujarati Voice Calls Ahmedabad | Samruddhi AI",
      metaDescription: "Gujarati and Hindi AI voice automation & WhatsApp lead qualification for Ahmedabad real estate brokers on SG Highway, GIFT City & Bopal."
    }
  },
  'lucknow': {
    name: 'Lucknow',
    slug: 'lucknow',
    state: 'Uttar Pradesh',
    tagline: 'Uttar Pradesh\'s Top Real Estate AI Lead Recovery Platform',
    heroHeadline: 'Never Lose a Real Estate Lead in Lucknow Again',
    heroSubheadline: 'Engage township and plot buyers in Gomti Nagar Extension, Amar Shaheed Path, and Vrindavan Yojna with polite Hindi AI voice calls and instant WhatsApp brochures.',
    stats: {
      activeAgents: '85+ Real Estate Promoters',
      avgResponseTime: '< 7 Seconds',
      leadsRecovered: '5,900+ Verified Leads',
      siteVisitIncrease: '+37% Visits'
    },
    microMarkets: ['Gomti Nagar Extension', 'Amar Shaheed Path', 'Sultanpur Road', 'Vrindavan Yojna', 'Faizabad Road', 'Jankipuram'],
    languagesSupported: ['Hindi', 'English'],
    testimonial: {
      quote: "Leads from Facebook ads for Gomti Nagar plots were sitting unattended for days. With Samruddhi AI, our response time dropped to 5 seconds and site visits doubled.",
      author: "Vikas Srivastava",
      role: "Managing Director",
      company: "Avadh Property World",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=300"
    },
    seo: {
      title: "Real Estate AI WhatsApp & Hindi Voice Calls Lucknow | Samruddhi AI",
      metaDescription: "Automate Lucknow real estate sales with Hindi AI voice calls and instant WhatsApp lead qualification for Gomti Nagar Extension, Shaheed Path & Sultanpur Road."
    }
  }
};
