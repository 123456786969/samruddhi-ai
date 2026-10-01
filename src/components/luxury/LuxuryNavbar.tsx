import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Menu, X, ArrowUpRight, ShieldCheck, ChevronRight } from 'lucide-react';

interface LuxuryNavbarProps {
  onOpenDemo: () => void;
  onOpenLogin: () => void;
}

export const LuxuryNavbar: React.FC<LuxuryNavbarProps> = ({ onOpenDemo, onOpenLogin }) => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Voice Engine', href: '#voice-simulator' },
    { name: 'Architecture', href: '#features' },
    { name: 'Specifications', href: '#engine-room' },
    { name: 'ROI Model', href: '#roi' },
    { name: 'Pricing', href: '/pricing' }
  ];

  const handleNavClick = (href: string) => {
    setMobileMenuOpen(false);
    if (href.startsWith('#')) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate(href);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-[#0A0A0A]/75 backdrop-blur-2xl border-b border-white/[0.06] py-3.5 shadow-2xl shadow-black/80'
            : 'bg-transparent py-6 border-b border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-10 flex items-center justify-between">
          {/* Brand Logotype */}
          <div 
            onClick={() => {
              navigate('/');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#D4AF37] to-[#F5E086] p-[1px] transition-transform duration-500 group-hover:scale-105">
              <div className="w-full h-full rounded-full bg-[#0A0A0A] flex items-center justify-center">
                <span className="font-serif text-[#D4AF37] text-sm font-bold tracking-tighter">S</span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-lg md:text-xl font-bold tracking-tight text-[#F4F4F5] group-hover:text-white transition-colors">
                Samruddhi<span className="text-[#D4AF37] italic ml-1">AI</span>
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#A1A1AA] -mt-1 hidden sm:block">
                Autonomous Realty
              </span>
            </div>
          </div>

          {/* Desktop Minimal Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] px-6 py-2 rounded-full">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => handleNavClick(link.href)}
                className="text-xs uppercase tracking-widest text-[#A1A1AA] hover:text-[#F4F4F5] transition-colors duration-300 font-medium relative group"
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-[#D4AF37] transition-all duration-300 group-hover:w-full" />
              </button>
            ))}
          </nav>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center gap-4">
            <button
              onClick={onOpenLogin}
              className="text-xs uppercase tracking-widest text-[#A1A1AA] hover:text-[#F4F4F5] px-4 py-2 rounded-full transition-colors font-medium hover:bg-white/[0.04]"
            >
              Sign In
            </button>
            
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onOpenDemo}
              className="relative group overflow-hidden bg-gradient-to-r from-[#D4AF37] to-[#E5C358] text-[#0A0A0A] px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-[#D4AF37]/20 transition-all"
            >
              <span>Book Walkthrough</span>
              <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </motion.button>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-full bg-white/[0.05] border border-white/[0.1] text-[#F4F4F5] hover:bg-white/[0.1] transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </motion.header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-2xl pt-24 px-6 md:hidden flex flex-col justify-between pb-10"
          >
            <div className="flex flex-col gap-5 pt-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#D4AF37] mb-2">
                [ Navigation Index ]
              </div>
              {navLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => handleNavClick(link.href)}
                  className="flex items-center justify-between text-left font-serif text-2xl text-[#F4F4F5] hover:text-[#D4AF37] py-2 border-b border-white/[0.06] transition-colors"
                >
                  <span>{link.name}</span>
                  <ChevronRight className="w-4 h-4 text-[#A1A1AA]" />
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3 pt-6 border-t border-white/[0.08]">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenLogin();
                }}
                className="w-full py-3.5 rounded-xl bg-white/[0.05] border border-white/[0.1] text-xs uppercase tracking-widest text-[#F4F4F5] font-semibold"
              >
                Access Partner Terminal
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenDemo();
                }}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C358] text-[#0A0A0A] text-xs uppercase tracking-widest font-bold shadow-lg shadow-[#D4AF37]/20"
              >
                Schedule Private Walkthrough
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
