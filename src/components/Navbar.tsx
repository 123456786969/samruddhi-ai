import React, { useState, useEffect } from 'react';
import { Building2, Sparkles, Menu, X, ArrowRight, Phone, LogIn, LogOut, LayoutDashboard } from 'lucide-react';
import { auth } from '../lib/firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

interface NavbarProps {
  onOpenDemo: () => void;
  onOpenLogin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenDemo, onOpenLogin }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        localStorage.removeItem('demoUser');
        sessionStorage.removeItem('demoUser');
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('otpVerified');
    sessionStorage.removeItem('otpVerified');
    localStorage.removeItem('demoUser');
    sessionStorage.removeItem('demoUser');
    signOut(auth).catch(() => {});
    setUser(null);
  };

  const navLinks = [
    { name: 'Features', href: '/#features' },
    { name: 'How It Works', href: '/#how-it-works' },
    { name: 'ROI Calculator', href: '/#roi-calculator' },
    { name: 'Pricing & Plans', href: '/pricing', badge: 'Save 20%' },
    { name: 'Testimonials', href: '/#testimonials' },
  ];

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled 
          ? 'bg-[#020d0a]/90 backdrop-blur-xl shadow-2xl py-3 border-b border-teal-800/40' 
          : 'bg-[#020d0a]/50 backdrop-blur-md py-5 border-b border-teal-900/30'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Logo */}
          <a 
            href="/" 
            onClick={(e) => {
              e.preventDefault();
              navigate('/');
            }}
            className="flex items-center gap-2.5 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-900 text-white flex items-center justify-center shadow-lg shadow-emerald-900/30 group-hover:scale-105 transition-transform border border-emerald-400/30">
              <Building2 className="w-5 h-5 text-amber-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-white drop-shadow-sm">
                Samruddhi <span className="text-amber-400">AI</span>
              </span>
              <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-400 -mt-1">
                Real Estate Lead Engine
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-4 2xl:gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm font-semibold text-teal-100 hover:text-amber-400 transition-colors relative py-1 group whitespace-nowrap flex items-center gap-1.5"
              >
                <span>{link.name}</span>
                {link.badge && (
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    {link.badge}
                  </span>
                )}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-amber-400 transition-all duration-300 group-hover:w-full"></span>
              </a>
            ))}
          </nav>

          {/* Right Action CTA */}
          <div className="hidden lg:flex items-center gap-2 xl:gap-4">
            <a 
              href="tel:+918884614885" 
              className="hidden 2xl:flex items-center gap-1.5 text-xs font-semibold text-teal-200 hover:text-white transition-colors bg-teal-950/80 px-3 py-1.5 rounded-full border border-teal-800/60"
            >
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              <span>Sales: +91 8884614885</span>
            </a>

            {user ? (
              <>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-teal-100 font-bold text-sm rounded-xl transition-all border border-teal-800/50 flex items-center gap-2 cursor-pointer"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </button>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-teal-100 font-bold text-sm rounded-xl transition-all border border-teal-800/50 flex items-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <button
                onClick={onOpenLogin}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-teal-100 font-bold text-sm rounded-xl transition-all border border-teal-800/50 flex items-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Login</span>
              </button>
            )}

            <button
              onClick={onOpenDemo}
              className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-gray-950 font-extrabold text-sm rounded-xl shadow-lg shadow-amber-400/20 hover:shadow-amber-400/40 transition-all transform hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer"
            >
              <span>Book a Demo</span>
              <Sparkles className="w-4 h-4 text-gray-950" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={onOpenDemo}
              className="px-3.5 py-1.5 bg-amber-400 text-gray-950 font-bold text-xs rounded-lg shadow-sm"
            >
              Book Demo
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-teal-200 hover:text-white hover:bg-teal-900/50 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#031713] border-b border-teal-800/50 px-4 pt-3 pb-6 space-y-3 shadow-2xl animate-fadeIn">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between py-2 text-base font-semibold text-teal-100 hover:text-amber-400 border-b border-teal-900/50"
            >
              <span>{link.name}</span>
              {link.badge && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {link.badge}
                </span>
              )}
            </a>
          ))}
          <div className="pt-2 space-y-2">
            {user ? (
              <>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/dashboard');
                  }}
                  className="w-full py-3 bg-white/5 text-teal-100 font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-md border border-teal-800/50"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleSignOut();
                  }}
                  className="w-full py-3 bg-white/5 text-teal-100 font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-md border border-teal-800/50"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenLogin();
                }}
                className="w-full py-3 bg-white/5 text-teal-100 font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-md border border-teal-800/50"
              >
                <LogIn className="w-4 h-4" />
                <span>Login</span>
              </button>
            )}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenDemo();
              }}
              className="w-full py-3 bg-amber-400 text-gray-950 font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-md"
            >
              <span>Book a Demo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
