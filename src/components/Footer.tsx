import React from 'react';
import { Building2, Mail, Phone, MapPin, Globe, ArrowUpRight } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#010907] text-teal-100 pt-16 pb-12 border-t border-teal-900/80 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-teal-900/60">
          
          {/* Brand & Mission */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-teal-950 text-amber-400 flex items-center justify-center border border-teal-800">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="text-2xl font-black text-white tracking-tight">
                Samruddhi <span className="text-amber-400">AI</span>
              </span>
            </div>

            <p className="text-xs text-teal-200/80 max-w-sm leading-relaxed">
              India's premier AI-powered lead qualification & outbound voice engine built exclusively for real estate developers, brokers, and channel partners.
            </p>

            <div className="space-y-2 text-xs text-teal-200">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#ffb300] shrink-0" />
                <span>Tech Park Tower B, Outer Ring Road, Bengaluru, KA 560103</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#ffb300] shrink-0" />
                <span>sales@samruddhi.ai</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#ffb300] shrink-0" />
                <span>+91 8884614885 / +91 7892054343</span>
              </div>
            </div>
          </div>

          {/* Core Navigation Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Product</h4>
            <ul className="space-y-2 text-xs text-teal-200/80">
              <li><a href="/pricing" className="text-emerald-400 font-bold hover:text-white transition-colors">Pricing & Plans (Save 20%)</a></li>
              <li><a href="/#features" className="hover:text-white transition-colors">WhatsApp Speed Engine</a></li>
              <li><a href="/#features" className="hover:text-white transition-colors">Multilingual AI Voice Calls</a></li>
              <li><a href="/#how-it-works" className="hover:text-white transition-colors">Drip Follow-Up Automations</a></li>
              <li><a href="/#roi-calculator" className="hover:text-white transition-colors">Ad Spend ROI Tracker</a></li>
              <li><a href="/#features" className="hover:text-white transition-colors">CRM Integrations</a></li>
            </ul>
          </div>

          {/* Solutions Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Solutions</h4>
            <ul className="space-y-2 text-xs text-teal-200/80">
              <li><a href="#features" className="hover:text-white transition-colors">For Real Estate Developers</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">For Channel Partners & Brokers</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">For Real Estate Ad Agencies</a></li>
              <li><a href="#testimonials" className="hover:text-white transition-colors">Case Studies & ROI Reports</a></li>
            </ul>
          </div>

          {/* Legal & Compliance Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Legal & Trust</h4>
            <ul className="space-y-2 text-xs text-teal-200/80">
              <li>
                <a 
                  href="https://www.termsfeed.com/live/privacy-policy" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-white transition-colors inline-flex items-center gap-1"
                >
                  <span>Privacy Policy</span>
                  <ArrowUpRight className="w-3 h-3 text-teal-400" />
                </a>
              </li>
              <li>
                <a 
                  href="https://www.termsfeed.com/live/terms-conditions" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-white transition-colors inline-flex items-center gap-1"
                >
                  <span>Terms of Service</span>
                  <ArrowUpRight className="w-3 h-3 text-teal-400" />
                </a>
              </li>
              <li>
                <a 
                  href="https://www.termsfeed.com/live/privacy-policy" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-white transition-colors inline-flex items-center gap-1"
                >
                  <span>Cookies Policy</span>
                  <ArrowUpRight className="w-3 h-3 text-teal-400" />
                </a>
              </li>
              <li>
                <a 
                  href="mailto:support@samruddhi.ai" 
                  className="hover:text-white transition-colors inline-flex items-center gap-1"
                >
                  <span>Contact: support@samruddhi.ai</span>
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* City-Specific Landing Page Links Row */}
        <div className="py-8 border-b border-teal-900/60 space-y-3">
          <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
            City Solutions & Local Real Estate Hubs
          </h4>
          <div className="flex flex-wrap items-center gap-2 text-xs text-teal-200/80">
            {[
              { name: 'Bengaluru', slug: 'bengaluru' },
              { name: 'Mumbai', slug: 'mumbai' },
              { name: 'Delhi NCR', slug: 'delhi-ncr' },
              { name: 'Hyderabad', slug: 'hyderabad' },
              { name: 'Pune', slug: 'pune' },
              { name: 'Chennai', slug: 'chennai' },
              { name: 'Kolkata', slug: 'kolkata' },
              { name: 'Ahmedabad', slug: 'ahmedabad' },
              { name: 'Lucknow', slug: 'lucknow' }
            ].map((city) => (
              <a
                key={city.slug}
                href={`/${city.slug}`}
                onClick={(e) => {
                  e.preventDefault();
                  window.history.pushState({}, '', `/${city.slug}`);
                  window.dispatchEvent(new Event('popstate'));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-3 py-1 rounded-lg bg-teal-950/80 border border-teal-800/80 hover:bg-teal-900 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
              >
                <MapPin className="w-3 h-3 text-amber-400" />
                <span>Samruddhi AI {city.name}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Copyright & Disclaimer Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-teal-300/70">
          <p>© Copyright 2026 Samruddhi AI. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a 
              href="https://www.termsfeed.com/live/privacy-policy" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-white transition-colors inline-flex items-center gap-1"
            >
              <span>Privacy Policy</span>
              <ArrowUpRight className="w-3 h-3 text-teal-400" />
            </a>
            <a 
              href="https://www.termsfeed.com/live/terms-conditions" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-white transition-colors inline-flex items-center gap-1"
            >
              <span>Terms of Service</span>
              <ArrowUpRight className="w-3 h-3 text-teal-400" />
            </a>
            <a 
              href="mailto:sales@samruddhi.ai" 
              className="hover:text-white transition-colors"
            >
              Contact Us
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
};
