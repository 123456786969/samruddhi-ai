import React, { useState } from 'react';
import { X, CheckCircle, Calendar, Sparkles, Building2, Phone, Mail, User, ShieldCheck, Briefcase, BarChart3 } from 'lucide-react';
import { DemoFormData } from '../types';

interface BookDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefilledLeads?: number;
}

export const BookDemoModal: React.FC<BookDemoModalProps> = ({ isOpen, onClose, prefilledLeads }) => {
  const [formData, setFormData] = useState<DemoFormData>({
    fullName: '',
    companyName: '',
    email: '',
    phone: '',
    monthlyLeads: prefilledLeads ? `${prefilledLeads} leads/month` : '200 - 500 leads',
    preferredTime: 'Tomorrow Morning (10:00 AM)',
    role: 'Builder / Developer'
  });

  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Dispatch real-time admin alert to rajubasavanahalli@gmail.com
    fetch('/api/admin/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'demo_booking',
        email: formData.email.trim().toLowerCase(),
        name: formData.fullName,
        companyName: formData.companyName,
        phone: formData.phone,
        details: {
          role: formData.role,
          monthlyLeads: formData.monthlyLeads,
          preferredSlot: formData.preferredTime
        }
      })
    }).catch(err => console.warn('Admin notification notice:', err));

    setSubmitted(true);
  };

  const handleReset = () => {
    setSubmitted(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-lg bg-[#0E0E12] rounded-2xl shadow-2xl overflow-hidden border border-white/[0.1] text-[#F4F4F5] flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="bg-[#14141A] text-white p-5 sm:p-6 relative border-b border-white/[0.08] shrink-0">
          <button 
            onClick={onClose}
            className="absolute top-5 right-5 text-zinc-400 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] p-2 rounded-full transition-colors border border-white/[0.08]"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] text-xs font-semibold mb-2 border border-[#D4AF37]/30">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>1-on-1 Personalized Live Demo</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F4F4F5]">
            Transform Your Real Estate Sales
          </h3>
          <p className="text-zinc-400 text-xs sm:text-sm mt-1">
            See how Samruddhi AI can automate your WhatsApp & Voice call lead qualification in 15 minutes.
          </p>
        </div>

        {submitted ? (
          <div className="p-6 sm:p-8 text-center space-y-4 overflow-y-auto">
            <div className="w-16 h-16 bg-[#181820] border border-[#D4AF37]/40 text-[#D4AF37] rounded-full flex items-center justify-center mx-auto shadow-lg shadow-[#D4AF37]/10">
              <CheckCircle className="w-9 h-9" />
            </div>
            <h4 className="text-2xl font-bold text-[#F4F4F5]">Demo Scheduled!</h4>
            <p className="text-zinc-300 text-sm max-w-sm mx-auto">
              Thank you, <strong className="text-white">{formData.fullName}</strong>. Our senior real estate AI specialist will call you at <strong className="text-[#D4AF37]">{formData.phone}</strong> at your chosen slot.
            </p>

            <div className="bg-[#14141A] p-4 rounded-xl text-left border border-white/[0.08] text-xs space-y-2.5">
              <div className="flex justify-between text-zinc-400">
                <span className="font-semibold">Company:</span>
                <span className="text-white font-medium">{formData.companyName}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span className="font-semibold">Role:</span>
                <span className="text-white font-medium">{formData.role}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span className="font-semibold">Slot:</span>
                <span className="text-[#D4AF37] font-bold">{formData.preferredTime}</span>
              </div>
            </div>

            <div className="pt-3">
              <button
                onClick={handleReset}
                className="w-full py-3 bg-[#D4AF37] text-black font-bold rounded-xl hover:bg-[#E5C158] transition-colors"
              >
                Back to Site
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Full Name *
              </label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-zinc-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Vikram Sharma"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-[#14141A] text-white border border-white/[0.1] rounded-xl focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-colors"
                />
              </div>
            </div>

            {/* Company Name & Role */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Company / Project Name *
                </label>
                <div className="relative flex items-center">
                  <Building2 className="w-4 h-4 text-zinc-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="e.g. Apex Realty Developers"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-[#14141A] text-white border border-white/[0.1] rounded-xl focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Your Role *
                </label>
                <div className="relative flex items-center">
                  <Briefcase className="w-4 h-4 text-zinc-400 absolute left-3.5 pointer-events-none" />
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-[#14141A] text-white border border-white/[0.1] rounded-xl focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-colors appearance-none cursor-pointer"
                  >
                    <option value="Builder / Developer" className="bg-[#14141A] text-white">Builder / Developer</option>
                    <option value="Channel Partner / Broker" className="bg-[#14141A] text-white">Channel Partner / Broker</option>
                    <option value="Marketing Agency" className="bg-[#14141A] text-white">Marketing Agency</option>
                    <option value="Other" className="bg-[#14141A] text-white">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Business Email *
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="vikram@company.com"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-[#14141A] text-white border border-white/[0.1] rounded-xl focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  WhatsApp Mobile No. *
                </label>
                <div className="relative flex items-center">
                  <Phone className="w-4 h-4 text-zinc-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-[#14141A] text-white border border-white/[0.1] rounded-xl focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Monthly Leads & Preferred Slot */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Monthly Lead Volume
                </label>
                <div className="relative flex items-center">
                  <BarChart3 className="w-4 h-4 text-zinc-400 absolute left-3.5 pointer-events-none" />
                  <select
                    value={formData.monthlyLeads}
                    onChange={(e) => setFormData({ ...formData, monthlyLeads: e.target.value })}
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-[#14141A] text-white border border-white/[0.1] rounded-xl focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-colors appearance-none cursor-pointer"
                  >
                    <option value="Under 100 leads" className="bg-[#14141A] text-white">Under 100 leads / mo</option>
                    <option value="100 - 500 leads" className="bg-[#14141A] text-white">100 - 500 leads / mo</option>
                    <option value="500 - 2,000 leads" className="bg-[#14141A] text-white">500 - 2,000 leads / mo</option>
                    <option value="2,000+ leads" className="bg-[#14141A] text-white">2,000+ leads / mo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Preferred Demo Slot
                </label>
                <div className="relative flex items-center">
                  <Calendar className="w-4 h-4 text-zinc-400 absolute left-3.5 pointer-events-none shrink-0" />
                  <select
                    value={formData.preferredTime}
                    onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-[#14141A] text-white border border-white/[0.1] rounded-xl focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-colors appearance-none cursor-pointer"
                  >
                    <option value="Today Afternoon (3:00 PM)" className="bg-[#14141A] text-white">Today Afternoon (3:00 PM)</option>
                    <option value="Tomorrow Morning (10:00 AM)" className="bg-[#14141A] text-white">Tomorrow Morning (10:00 AM)</option>
                    <option value="Tomorrow Afternoon (2:30 PM)" className="bg-[#14141A] text-white">Tomorrow Afternoon (2:30 PM)</option>
                    <option value="This Saturday (11:00 AM)" className="bg-[#14141A] text-white">This Saturday (11:00 AM)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3.5 bg-[#D4AF37] hover:bg-[#E5C158] text-black font-extrabold text-sm sm:text-base rounded-xl shadow-lg shadow-[#D4AF37]/20 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Confirm My Free 15-Min Live Demo</span>
                <Sparkles className="w-4 h-4 text-black" />
              </button>
            </div>

            <div className="flex flex-col items-center justify-center gap-1 text-xs text-zinc-400 pt-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                <span>Zero obligation. No credit card required. 100% Confidential.</span>
              </div>
              <p className="text-[11px] text-zinc-500">
                By submitting, you agree to our{' '}
                <a 
                  href="https://www.termsfeed.com/live/privacy-policy" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-[#D4AF37] underline hover:text-[#E5C158] font-medium"
                >
                  Privacy Policy
                </a>.
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

