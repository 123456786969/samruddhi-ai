import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { db, auth } from '../../lib/firebase';
import { doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { User, Settings as SettingsIcon, Crown, Check, AlertCircle, Loader2 } from 'lucide-react';
import { apiFetch, getAuthHeaders } from '../../lib/api';

export const DashboardSettings: React.FC = () => {
  const { user, userData } = useOutletContext<any>();
  
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [slug, setSlug] = useState('');
  const [photo, setPhoto] = useState('');
  
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Admin Founding Partner Controls
  const [isAdmin, setIsAdmin] = useState(false);
  const [targetEmail, setTargetEmail] = useState('');
  const [foundingStatus, setFoundingStatus] = useState<boolean>(true);
  const [adminSaving, setAdminSaving] = useState(false);
  const [adminMessage, setAdminMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    async function checkAdminStatus() {
      try {
        const res = await apiFetch<{ isAdmin: boolean; email: string }>('/api/admin/me');
        if (res?.isAdmin) {
          setIsAdmin(true);
        }
      } catch (err) {
        setIsAdmin(false);
      }
    }
    if (user?.uid) {
      checkAdminStatus();
    }
  }, [user]);

  const handleToggleFoundingPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEmail.trim()) return;
    setAdminSaving(true);
    setAdminMessage(null);
    try {
      const res = await apiFetch<{ success: boolean; email: string; founding_partner: boolean }>('/api/admin/founding-partner', {
        method: 'POST',
        body: JSON.stringify({
          email: targetEmail.trim(),
          enabled: foundingStatus,
        }),
      });
      if (res.success) {
        setAdminMessage({
          text: `Successfully ${foundingStatus ? 'granted 40% Founding Partner status for 12 months to' : 'revoked Founding Partner status from'} ${res.email}!`,
          type: 'success',
        });
      }
    } catch (err: any) {
      setAdminMessage({
        text: err?.message || 'Failed to update founding partner status',
        type: 'error',
      });
    } finally {
      setAdminSaving(false);
    }
  };

  useEffect(() => {
    if (userData) {
      setName(userData.name || user.displayName || '');
      setBusinessName(userData.businessName || '');
      setPhone(userData.phone || '');
      setSlug(userData.slug || '');
      setPhoto(userData.photo || '');
    } else {
        setName(user.displayName || '');
    }
  }, [userData, user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid || !auth.currentUser) return;
    setSaving(true);
    setSuccess(false);
    try {
      const uid = auth.currentUser.uid;
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      
      const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');
      const payload = {
          name,
          businessName,
          phone,
          slug: cleanSlug,
          photo
      };

      if (docSnap.exists()) {
          await updateDoc(docRef, payload);
      } else {
          await setDoc(docRef, { ...payload, email: auth.currentUser.email || user.email });
      }

      // Also write public fields to public_profiles/{userId} for the public catalogue
      await setDoc(doc(db, 'public_profiles', uid), {
        name,
        businessName,
        photo,
        slug: cleanSlug,
      }, { merge: true });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-teal-500" /> Settings
        </h1>
        <p className="text-gray-400 mt-1">Manage your profile and public catalogue settings.</p>
      </div>

      <div className="bg-[#051611] border border-teal-900/50 rounded-2xl p-6 md:p-8">
        <form onSubmit={handleSave} className="space-y-6">
            <div className="flex items-center gap-6 pb-6 border-b border-teal-900/30">
                <div className="w-20 h-20 rounded-full bg-teal-900/50 flex items-center justify-center text-teal-300 font-bold text-2xl border border-teal-700/50 overflow-hidden shrink-0">
                    {photo ? (
                        <img src={photo} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <User className="w-8 h-8" />
                    )}
                </div>
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-400 mb-1">Profile Photo URL</label>
                    <input 
                        type="url" 
                        value={photo} 
                        onChange={e => setPhoto(e.target.value)} 
                        placeholder="https://example.com/photo.jpg"
                        className="w-full bg-black/40 border border-teal-900/50 rounded-xl px-4 py-2.5 text-white" 
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Your Name</label>
                    <input 
                        type="text" 
                        required
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        className="w-full bg-black/40 border border-teal-900/50 rounded-xl px-4 py-2.5 text-white" 
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Phone Number</label>
                    <input 
                        type="tel" 
                        value={phone} 
                        onChange={e => setPhone(e.target.value)} 
                        className="w-full bg-black/40 border border-teal-900/50 rounded-xl px-4 py-2.5 text-white" 
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Business Name</label>
                    <input 
                        type="text" 
                        value={businessName} 
                        onChange={e => setBusinessName(e.target.value)} 
                        placeholder="e.g. Samruddhi Realty"
                        className="w-full bg-black/40 border border-teal-900/50 rounded-xl px-4 py-2.5 text-white" 
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Catalogue URL Slug</label>
                    <div className="flex bg-black/40 border border-teal-900/50 rounded-xl overflow-hidden focus-within:border-teal-500">
                        <span className="px-3 py-2.5 bg-teal-950/30 text-gray-500 text-sm border-r border-teal-900/50 flex-shrink-0">
                            /properties/
                        </span>
                        <input 
                            type="text" 
                            value={slug} 
                            onChange={e => setSlug(e.target.value)} 
                            placeholder="john-doe"
                            className="w-full bg-transparent px-3 py-2.5 text-white outline-none" 
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-6 border-t border-teal-900/30 items-center gap-4">
                {success && <span className="text-green-400 font-semibold text-sm">Settings saved!</span>}
                <button type="submit" disabled={saving} className="bg-amber-400 hover:bg-amber-300 text-black font-bold px-8 py-3 rounded-xl transition-colors disabled:opacity-50">
                    {saving ? 'Saving...' : 'Save Settings'}
                </button>
            </div>
        </form>
      </div>

      {/* Admin Founding Partner Management Section */}
      {isAdmin && (
        <div className="bg-[#141414] border border-[#D4AF37]/40 rounded-2xl p-6 md:p-8 space-y-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between pb-4 border-b border-[rgba(255,255,255,0.08)]">
            <div>
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-[#D4AF37]" />
                <h2 className="text-xl font-bold text-white font-serif tracking-tight">
                  Admin: Founding Partner Privileges
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40">
                  Admin Only
                </span>
              </div>
              <p className="text-sm text-gray-400 mt-1 font-crm-sans">
                Grant or revoke 40% discount locked for 12 months for select VIP agency partners and founding brokers.
              </p>
            </div>
          </div>

          <form onSubmit={handleToggleFoundingPartner} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Partner User Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="broker@agency.com"
                  value={targetEmail}
                  onChange={(e) => setTargetEmail(e.target.value)}
                  className="w-full bg-[#202020] border border-[rgba(255,255,255,0.12)] rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Action
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={foundingStatus ? 'enable' : 'disable'}
                    onChange={(e) => setFoundingStatus(e.target.value === 'enable')}
                    className="flex-1 bg-[#202020] border border-[rgba(255,255,255,0.12)] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-[#D4AF37] text-sm"
                  >
                    <option value="enable">Grant 40% (12 Mos)</option>
                    <option value="disable">Revoke Status</option>
                  </select>

                  <button
                    type="submit"
                    disabled={adminSaving || !targetEmail.trim()}
                    className="px-5 py-2.5 bg-[#D4AF37] hover:bg-[#b8952b] text-black font-semibold text-sm rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-lg shadow-[#D4AF37]/20"
                  >
                    {adminSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                  </button>
                </div>
              </div>
            </div>

            {adminMessage && (
              <div
                className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                  adminMessage.type === 'success'
                    ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-300'
                    : 'bg-red-950/40 border border-red-500/40 text-red-300'
                }`}
              >
                {adminMessage.type === 'success' ? (
                  <Check className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{adminMessage.text}</span>
              </div>
            )}
          </form>
        </div>
      )}

      {/* Admin Notification Settings & Real-Time Alert Center */}
      <div className="bg-[#051611] border border-teal-900/50 rounded-2xl p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-teal-900/30">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-amber-400">🔔</span> Real-Time Admin Lead & Login Alerts
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Receive automatic Gmail notifications whenever a new partner or prospect logs into Samruddhi AI.
            </p>
          </div>
          <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold rounded-full flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-black/40 border border-teal-900/40 rounded-xl space-y-1">
            <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Admin Recipient Email</div>
            <div className="text-white font-mono text-sm font-medium text-amber-300 break-all">
              rajubasavanahalli@gmail.com
            </div>
            <div className="text-xs text-teal-400/80 pt-1">
              Configured for instant login alerts & lead prospect follow-ups
            </div>
          </div>

          <div className="p-4 bg-black/40 border border-teal-900/40 rounded-xl space-y-1">
            <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Instant Lead Actions</div>
            <div className="text-white text-sm">
              One-click <span className="text-amber-300 font-semibold">Direct Gmail Reply</span> button included in every notification to discuss plans.
            </div>
          </div>
        </div>

        <div className="p-4 bg-teal-950/20 border border-teal-800/40 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-white">Test Real-Time Alert Dispatch</div>
            <div className="text-xs text-gray-400">
              Send a test notification payload to verify that alerts dispatch to rajubasavanahalli@gmail.com.
            </div>
          </div>
          <button
            type="button"
            onClick={async () => {
              try {
                const res = await fetch('/api/admin/notify', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
                  body: JSON.stringify({
                    type: 'login',
                    email: user.email || 'partner-lead@realty.com',
                    name: name || user.displayName || 'Test Broker Partner',
                    companyName: businessName || 'Apex Realty Group',
                    phone: phone || '+91 98765 43210',
                    details: { triggeredFrom: 'Settings Test Button', timestamp: Date.now() }
                  })
                });
                const data = await res.json();
                if (data.success) {
                  alert('✅ Real-time alert dispatched! Check the server logs and your inbox.');
                }
              } catch (err: any) {
                alert('Notification error: ' + err.message);
              }
            }}
            className="px-4 py-2 bg-teal-800/50 hover:bg-teal-700/50 text-teal-200 border border-teal-600/50 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
          >
            Dispatch Test Alert
          </button>
        </div>
      </div>
    </div>
  );
};
