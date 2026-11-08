import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Building2, User, KeyRound, RefreshCw, CheckCircle2, Sparkles, ShieldCheck, Mail, ArrowRight, ExternalLink, AlertTriangle } from 'lucide-react';
import { auth, googleProvider, db } from '../lib/firebase';
import { signInWithPopup, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { seedDemoDataIfEmpty } from '../data/demoSeed';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState<'login' | 'otp' | 'onboarding'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPopupBlocked, setIsPopupBlocked] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);
  
  // Direct Email Login State
  const [directEmail, setDirectEmail] = useState('');
  const [showEmailInput, setShowEmailInput] = useState(false);

  // OTP data
  const [enteredOtp, setEnteredOtp] = useState('');
  const [simulatedOtp, setSimulatedOtp] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  
  // Onboarding data
  const [uid, setUid] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [agency, setAgency] = useState('');
  const [email, setEmail] = useState('');

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      setIsPopupBlocked(false);
      setSimulatedOtp(null);

      // Call signInWithPopup immediately inside user click gesture
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const normalizedEmail = (user.email || `${user.uid}@gmail.com`).trim().toLowerCase();
      
      setUid(user.uid);
      setName(user.displayName || '');
      setEmail(normalizedEmail);
      
      // Call backend to send OTP (backend generates it securely)
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail })
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      // If simulated / dev OTP (only when SMTP is unconfigured)
      if (data.simulated && data.devOtp) {
        setSimulatedOtp(data.devOtp);
        setEnteredOtp(data.devOtp);
      } else {
        setSimulatedOtp(null);
        setEnteredOtp('');
      }
      
      setStep('otp');
    } catch (err: any) {
      const errMsg = String(err?.message || '');
      const errName = String(err?.name || '');
      const errCode = String(err?.code || '');

      const isPatternError =
        errName === 'DOMException' ||
        errName === 'SyntaxError' ||
        errMsg.includes('The string did not match the expected pattern') ||
        errMsg.includes('pattern') ||
        errCode === '12';

      const isPopupBlockedError =
        errCode === 'auth/popup-blocked' ||
        errCode === 'auth/cancelled-popup-request' ||
        isPatternError;

      const isUserClosed = errCode === 'auth/popup-closed-by-user';

      if (isPopupBlockedError || isPatternError) {
        console.warn('[Firebase Auth Notice] Browser popup was blocked or restricted by iframe sandbox:', errMsg || errCode);
        setIsPopupBlocked(true);
        setError('Browser popup was blocked by security settings in this preview frame. Use Quick Demo Agent or Email OTP below.');
      } else if (errCode === 'auth/network-request-failed') {
        setError('Network / Cookie notice: Third-party cookies may be restricted. Try Quick Demo Agent below.');
      } else if (!isUserClosed) {
        console.warn('[Firebase Auth Notice] Sign in encounter:', errMsg || errCode);
        setError('Sign in could not open popup. Please use Quick Demo Agent or Email OTP below.');
      }

      try {
        if (auth.currentUser && step === 'login') {
          await signOut(auth);
        }
      } catch (sErr) {
        // Silent signout catch
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDirectEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = directEmail.trim().toLowerCase();
    if (!cleanEmail) return;

    try {
      setLoading(true);
      setError(null);
      setIsPopupBlocked(false);

      const emailUid = `usr_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 20)}`;
      setUid(emailUid);
      setEmail(cleanEmail);
      setName(cleanEmail.split('@')[0]);

      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail })
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      if (data.simulated && data.devOtp) {
        setSimulatedOtp(data.devOtp);
        setEnteredOtp(data.devOtp);
      } else {
        setSimulatedOtp(null);
        setEnteredOtp('');
      }

      setStep('otp');
    } catch (err: any) {
      console.warn('Direct email OTP notice:', err);
      setError(err.message || 'Failed to send verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleInstantDemoLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      setIsPopupBlocked(false);

      const demoUid = 'usr_demo_partner_blr';
      const demoEmail = 'partner@samruddhi.ai';
      const demoName = 'Demo Real Estate Partner';
      const demoAgency = 'Samruddhi Realty Bangalore';

      setUid(demoUid);
      setEmail(demoEmail);
      setName(demoName);
      setAgency(demoAgency);

      const demoUserData = {
        uid: demoUid,
        email: demoEmail,
        displayName: demoName,
        businessName: demoAgency,
        role: 'agent',
        isDemo: true,
      };

      const serialized = JSON.stringify(demoUserData);
      if (keepLoggedIn) {
        localStorage.setItem('otpVerified', 'true');
        localStorage.setItem('demoUser', serialized);
        localStorage.setItem('authToken', 'demo_token');
      } else {
        sessionStorage.setItem('otpVerified', 'true');
        sessionStorage.setItem('demoUser', serialized);
        sessionStorage.setItem('authToken', 'demo_token');
      }

      // Seed initial demo data for leads, properties, visits, tasks
      seedDemoDataIfEmpty(demoUid);

      // Dispatch real-time admin alert silently
      fetch('/api/admin/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'login',
          email: demoEmail,
          name: demoName,
          companyName: demoAgency,
          details: { loginProvider: 'Quick Demo Agent (Preview)', uid: demoUid }
        })
      }).catch(() => {});

      onSuccess();
      onClose();
    } catch (err: any) {
      console.warn('Instant demo login notice:', err);
      setError('Unable to activate demo agent. Please try Email OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email || resending) return;
    setResending(true);
    setError(null);
    try {
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      });
      const data = await response.json();
      if (data.simulated && data.devOtp) {
        setSimulatedOtp(data.devOtp);
        setEnteredOtp(data.devOtp);
      } else {
        setSimulatedOtp(null);
        setEnteredOtp('');
      }
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (err: any) {
      setError('Failed to resend code: ' + (err.message || 'Unknown error'));
    } finally {
      setResending(false);
    }
  };

  const verifyOtpAndProceed = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOtp = enteredOtp.trim();
    if (!cleanOtp || cleanOtp.length < 6) {
      setError('Please enter a valid 6-digit code.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Call backend to verify OTP
      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email.trim().toLowerCase(), 
          otp: cleanOtp,
          simulatedCode: simulatedOtp || undefined
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Invalid verification code.');
      }
      
      // Mark OTP as verified locally
      if (keepLoggedIn) {
        localStorage.setItem('otpVerified', 'true');
      } else {
        sessionStorage.setItem('otpVerified', 'true');
      }

      // Check if user already exists in Firestore
      if (!uid) throw new Error("No UID found");
      const userDocRef = doc(db, 'users', uid);
      let userDoc;
      try {
        userDoc = await getDoc(userDocRef);
      } catch (fErr) {
        handleFirestoreError(fErr, OperationType.GET, `users/${uid}`);
      }
      
      if (userDoc && userDoc.exists()) {
        const uData = userDoc.data() || {};
        const userName = uData.name || name || 'Real Estate Partner';
        const userCompany = uData.businessName || 'Existing Partner';
        const userPhone = uData.phone || '';

        // Dispatch real-time admin alert to rajubasavanahalli@gmail.com
        fetch('/api/admin/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'login',
            email: (uData.email || email).trim().toLowerCase(),
            name: userName,
            companyName: userCompany,
            phone: userPhone,
            details: { loginProvider: 'Auth & OTP', uid }
          })
        }).catch(err => console.warn('Admin notification notice:', err));

        // Save demo/direct user object if no Firebase Auth popup user
        const userDataToStore = JSON.stringify({
          uid,
          email: (uData.email || email).trim().toLowerCase(),
          displayName: userName,
        });
        if (keepLoggedIn) {
          localStorage.setItem('otpVerified', 'true');
          localStorage.setItem('demoUser', userDataToStore);
          localStorage.setItem('authToken', `demo_token_${uid}`);
        } else {
          sessionStorage.setItem('otpVerified', 'true');
          sessionStorage.setItem('demoUser', userDataToStore);
          sessionStorage.setItem('authToken', `demo_token_${uid}`);
        }

        seedDemoDataIfEmpty(uid);

        onSuccess();
        onClose();
      } else {
        // Needs onboarding
        setStep('onboarding');
      }
    } catch (err: any) {
      console.warn('OTP verify notice:', err);
      setError(err.message || 'An error occurred while verifying.');
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const baseSlug = agency.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const uniqueSuffix = Math.random().toString(36).substring(2, 6);
      const slug = `${baseSlug}-${uniqueSuffix}`;
      const cleanEmail = email.trim().toLowerCase();

      try {
        await setDoc(doc(db, 'users', uid), {
          name,
          businessName: agency,
          slug,
          email: cleanEmail,
          createdAt: serverTimestamp(),
        });

        // Also write public profile for catalogue
        await setDoc(doc(db, 'public_profiles', uid), {
          name,
          businessName: agency,
          photo: '',
          slug,
        }, { merge: true });
      } catch (fErr) {
        handleFirestoreError(fErr, OperationType.WRITE, `users/${uid}`);
      }

      // Dispatch real-time admin alert to rajubasavanahalli@gmail.com
      fetch('/api/admin/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'onboarding',
          email: cleanEmail,
          name,
          companyName: agency,
          details: { slug, uid }
        })
      }).catch(err => console.warn('Admin notification notice:', err));
      
      // Save demo/direct user object
      const userDataToStore = JSON.stringify({
        uid,
        email: cleanEmail,
        displayName: name,
        businessName: agency,
      });
      if (keepLoggedIn) {
        localStorage.setItem('otpVerified', 'true');
        localStorage.setItem('demoUser', userDataToStore);
        localStorage.setItem('authToken', `demo_token_${uid}`);
      } else {
        sessionStorage.setItem('otpVerified', 'true');
        sessionStorage.setItem('demoUser', userDataToStore);
        sessionStorage.setItem('authToken', `demo_token_${uid}`);
      }

      seedDemoDataIfEmpty(uid);

      onSuccess();
      onClose();
    } catch (err: any) {
      console.warn('Onboarding notice:', err);
      setError('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async () => {
    if (step === 'otp' || step === 'onboarding') {
      if (auth.currentUser) {
        await signOut(auth);
      }
      setStep('login');
      setEnteredOtp('');
      setSimulatedOtp(null);
      setError(null);
      setIsPopupBlocked(false);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-[#051611] border border-teal-900/50 shadow-2xl rounded-2xl overflow-hidden p-6 sm:p-8"
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {step === 'login' ? (
              <div className="text-center">
                <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mx-auto mb-3">
                  <Building2 className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Agent Portal</h2>
                <p className="text-gray-400 mb-6 text-sm">Sign in to manage your real estate AI agents and view leads.</p>
                
                {isPopupBlocked && (
                  <div className="bg-amber-500/10 border border-amber-500/40 text-amber-300 p-3.5 rounded-xl text-xs mb-5 text-left space-y-2">
                    <div className="flex items-center gap-2 font-bold text-amber-200">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Browser Popup Blocked</span>
                    </div>
                    <p className="text-gray-300">
                      If running in an iframe or preview, popups may be blocked. You can continue instantly using our Instant Demo Agent:
                    </p>
                    <button
                      type="button"
                      onClick={handleInstantDemoLogin}
                      className="w-full mt-2 py-2 px-3 bg-amber-400 hover:bg-amber-300 text-gray-950 font-bold rounded-lg text-xs flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Enter as Instant Demo Agent</span>
                    </button>
                  </div>
                )}

                {error && !isPopupBlocked && (
                  <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm mb-6">
                    {error}
                  </div>
                )}
                
                <div className="space-y-3">
                  <button
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 font-semibold py-3 px-4 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50 shadow-md cursor-pointer"
                  >
                    <img 
                      src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                      alt="Google" 
                      crossOrigin="anonymous"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="%234285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="%2334A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="%23FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="%23EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>';
                      }}
                      className="w-5 h-5" 
                    />
                    <span>{loading ? 'Connecting...' : 'Continue with Google'}</span>
                  </button>

                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-teal-900/60"></div>
                    <span className="flex-shrink mx-3 text-gray-500 text-xs uppercase tracking-wider font-semibold">Or</span>
                    <div className="flex-grow border-t border-teal-900/60"></div>
                  </div>

                  {!showEmailInput ? (
                    <button
                      type="button"
                      onClick={() => setShowEmailInput(true)}
                      className="w-full py-2.5 px-4 bg-teal-950/60 hover:bg-teal-900/50 text-teal-200 border border-teal-800/60 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <Mail className="w-4 h-4 text-amber-400" />
                      <span>Sign in with Email OTP</span>
                    </button>
                  ) : (
                    <form onSubmit={handleDirectEmailSubmit} className="space-y-2 text-left">
                      <label className="block text-xs font-semibold text-gray-300">Enter your email</label>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          required
                          value={directEmail}
                          onChange={(e) => setDirectEmail(e.target.value)}
                          placeholder="agent@realty.com"
                          className="flex-1 px-3 py-2 bg-black/60 border border-teal-800/70 rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-400"
                        />
                        <button
                          type="submit"
                          disabled={loading || !directEmail.trim()}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all disabled:opacity-50 flex items-center gap-1 shrink-0 cursor-pointer"
                        >
                          <span>Send Code</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </form>
                  )}

                  <button
                    type="button"
                    onClick={handleInstantDemoLogin}
                    disabled={loading}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-900/40 to-teal-900/40 hover:from-emerald-900/70 hover:to-teal-900/70 text-emerald-300 border border-emerald-600/40 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Quick Demo Agent (Instant Access)</span>
                  </button>
                </div>

                <div className="mt-5 flex items-center justify-center">
                  <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer hover:text-gray-300">
                    <input 
                      type="checkbox" 
                      checked={keepLoggedIn} 
                      onChange={(e) => setKeepLoggedIn(e.target.checked)}
                      className="rounded border-teal-900/50 bg-black/50 text-amber-400 focus:ring-amber-400 focus:ring-offset-gray-900 w-4 h-4"
                    />
                    Keep me logged in
                  </label>
                </div>
              </div>
            ) : step === 'otp' ? (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-xl bg-teal-900/60 border border-teal-700/50 text-emerald-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">2-Step Verification</h2>
                    <p className="text-xs text-gray-400">Sent code to <strong className="text-teal-300">{email}</strong></p>
                  </div>
                </div>

                {simulatedOtp && (
                  <div className="bg-emerald-950/70 border border-emerald-600/50 rounded-xl p-3.5 mb-4 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                          <span className="text-emerald-300 font-bold block">One-Click Verification Code:</span>
                          <span className="text-white font-mono text-base tracking-widest font-bold">{simulatedOtp}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEnteredOtp(simulatedOtp)}
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-gray-950 text-xs font-bold rounded-lg transition-colors shadow cursor-pointer"
                      >
                        Auto-Fill
                      </button>
                    </div>
                  </div>
                )}
                
                {error && (
                  <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm mb-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 text-xs sm:text-sm">{error}</div>
                      {(error.toLowerCase().includes('resend') || error.toLowerCase().includes('code')) && (
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          disabled={resending}
                          className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs rounded-lg border border-amber-500/40 shrink-0 cursor-pointer transition-colors flex items-center gap-1"
                        >
                          <RefreshCw className={`w-3 h-3 ${resending ? 'animate-spin' : ''}`} />
                          <span>{resending ? 'Resending...' : 'Resend Code'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {resendSuccess && (
                  <div className="bg-teal-950/80 border border-teal-600 text-teal-200 p-2.5 rounded-lg text-xs mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>A fresh randomized 6-digit verification code has been sent to your email.</span>
                  </div>
                )}
                
                <form onSubmit={verifyOtpAndProceed} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">Enter 6-Digit Code</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                        <KeyRound className="h-5 w-5" />
                      </div>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={enteredOtp}
                        onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                        className="block w-full pl-11 pr-3 py-3 border border-teal-900/80 rounded-xl bg-black/60 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all tracking-widest text-xl font-bold font-mono text-center"
                        placeholder="• • • • • •"
                        autoFocus
                      />
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={loading || enteredOtp.trim().length !== 6}
                    className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 px-4 rounded-xl transition-all disabled:opacity-50 shadow-lg cursor-pointer"
                  >
                    {loading ? 'Verifying Code...' : 'Verify & Continue'}
                  </button>

                  <div className="flex items-center justify-between pt-2 text-xs">
                    <div className="text-gray-400 text-xs flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                      <span>Check your email inbox & spam</span>
                    </div>
                    
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resending}
                      className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                      <span>{resending ? 'Sending...' : 'Resend Code'}</span>
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Complete Profile</h2>
                <p className="text-gray-400 mb-6 text-sm">Just a few more details to set up your account.</p>
                
                {error && (
                  <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm mb-6">
                    {error}
                  </div>
                )}
                
                <form onSubmit={handleOnboardingSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Your Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                        <User className="h-5 w-5" />
                      </div>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border border-teal-900/50 rounded-xl bg-black/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Agency Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <input
                        type="text"
                        required
                        value={agency}
                        onChange={(e) => setAgency(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border border-teal-900/50 rounded-xl bg-black/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                        placeholder="e.g. Samruddhi Realty"
                      />
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={loading || !name.trim() || !agency.trim()}
                    className="w-full mt-6 bg-amber-400 hover:bg-amber-300 text-gray-950 font-bold py-3 px-4 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? 'Saving...' : 'Complete Setup'}
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

