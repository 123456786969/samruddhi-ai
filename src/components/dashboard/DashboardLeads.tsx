import React, { useState, useEffect } from 'react';
import { safeFormatDate } from "../../utils";
import { useOutletContext, useNavigate, useSearchParams } from 'react-router-dom';
import { db, auth } from '../../lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { Plus, X, Search, Phone, MapPin, Building2, Calendar, Users, Filter, Tag, MessageSquare, Send, CheckCircle2 } from 'lucide-react';
import { Lead } from '../../types';
import { dispatchAutomatedWhatsApp, generateWhatsAppWebLink } from '../../services/whatsappService';
import { handleFirestoreError, OperationType } from '../../utils/firestoreErrorHandler';
import { apiFetch } from '../../lib/api';

export const DashboardLeads: React.FC = () => {
  const { user, userData } = useOutletContext<any>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(searchParams.get('new') === 'true');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [preferredLocation, setPreferredLocation] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [notes, setNotes] = useState('');
  const [source, setSource] = useState('Walk-in');
  const [autoSendWhatsApp, setAutoSendWhatsApp] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [whatsAppDispatchedNotice, setWhatsAppDispatchedNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid || !auth.currentUser) {
      setLoading(false);
      return;
    }
    fetchLeads();
  }, [user]);

  const fetchLeads = async () => {
    if (!user?.uid || !auth.currentUser) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const q = query(
        collection(db, 'leads'), 
        where('agent_id', '==', auth.currentUser.uid)
      );
      const snap = await getDocs(q);
      const data = (snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Lead[])
        .sort((a, b) => (Number(b.created_at) || 0) - (Number(a.created_at) || 0));
      setLeads(data);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'leads');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim().slice(0, 200);
    const cleanPhone = phone.trim().slice(0, 20);
    if (!cleanName || !cleanPhone || !user?.uid) return;
    
    setSubmitting(true);
    try {
      const payload = {
        name: cleanName,
        phone: cleanPhone,
        budget_min: Number(budgetMin) || 0,
        budget_max: Number(budgetMax) || 0,
        preferred_location: preferredLocation,
        property_type: propertyType,
        notes,
        source,
        stage: 'New',
        tags: [],
      };
      
      const result = await apiFetch<{
        success: boolean;
        leadId: string;
        overLimit: boolean;
        automation_paused: boolean;
        lead: any;
      }>('/api/leads', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      // Trigger Automated WhatsApp Welcome only if plan is active & automation not paused
      if (autoSendWhatsApp && !result.overLimit && !result.automation_paused) {
        try {
          await dispatchAutomatedWhatsApp({
            agentId: user.uid,
            leadId: result.leadId,
            leadName: cleanName,
            leadPhone: cleanPhone,
            agentName: userData?.name || user?.displayName || 'Real Estate Advisor',
            businessName: userData?.businessName || 'Samruddhi Realty',
            agentSlug: userData?.slug || '',
            propertyType: propertyType || 'Premium Residential',
            preferredLocation: preferredLocation || 'Prime Metro Locations',
            budget: budgetMax ? `₹${Number(budgetMax)/100000} L` : undefined,
            triggerType: 'new_lead_instant',
          });
          setWhatsAppDispatchedNotice(`Automated WhatsApp brochure & greeting dispatched to ${cleanName}!`);
          setTimeout(() => setWhatsAppDispatchedNotice(null), 4000);
        } catch (waErr) {
          console.warn('WhatsApp auto-dispatch failed:', waErr);
        }
      } else if (result.overLimit || result.automation_paused) {
        setWhatsAppDispatchedNotice(`Lead saved! Monthly quota reached — WhatsApp automation paused for this lead.`);
        setTimeout(() => setWhatsAppDispatchedNotice(null), 5000);
      }

      setShowAddForm(false);
      resetForm();
      fetchLeads(); // Refresh list
    } catch (err: any) {
      console.error(err);
      // Plan-limit errors (402) are shown by the global "Upgrade / Buy top-up" prompt
      if (err?.status !== 402) alert(err.message || 'Failed to save lead');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setName(''); setPhone(''); setBudgetMin(''); setBudgetMax('');
    setPreferredLocation(''); setPropertyType(''); setNotes('');
    setSource('Walk-in');
    setAutoSendWhatsApp(true);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumSignificantDigits: 3 }).format(val);
  };
  
  const formatDate = (ts: any) => safeFormatDate(ts);

  const filteredLeads = leads.filter(l => {
    const matchesSearch = 
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      l.phone.includes(searchQuery) ||
      (l.preferred_location && l.preferred_location.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStage = stageFilter ? l.stage === stageFilter : true;
    const matchesSource = sourceFilter ? l.source === sourceFilter : true;
    
    return matchesSearch && matchesStage && matchesSource;
  });

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Leads</h1>
          <p className="text-gray-400 mt-1">Manage your contacts and incoming inquiries.</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-amber-400 hover:bg-amber-300 text-gray-950 font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Lead
        </button>
      </div>

      {whatsAppDispatchedNotice && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-950/80 border border-emerald-700/80 text-emerald-300 flex items-center justify-between text-sm shadow-xl">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>{whatsAppDispatchedNotice}</span>
          </div>
          <button 
            onClick={() => navigate('/dashboard/whatsapp')}
            className="text-xs font-bold text-amber-400 hover:underline"
          >
            View in WhatsApp Outbox →
          </button>
        </div>
      )}

      {showAddForm && (
        <div className="mb-8 bg-[#051611] border border-teal-900/50 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">New Lead Entry</h2>
            <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handleAddLead} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Full Name</label>
                <input type="text" required maxLength={200} value={name} onChange={e => setName(e.target.value)} className="w-full bg-black/40 border border-teal-900/50 rounded-xl px-4 py-2.5 text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Phone Number</label>
                <input type="tel" required maxLength={20} value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-black/40 border border-teal-900/50 rounded-xl px-4 py-2.5 text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Budget Min (₹)</label>
                <input type="number" value={budgetMin} onChange={e => setBudgetMin(e.target.value)} className="w-full bg-black/40 border border-teal-900/50 rounded-xl px-4 py-2.5 text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Budget Max (₹)</label>
                <input type="number" value={budgetMax} onChange={e => setBudgetMax(e.target.value)} className="w-full bg-black/40 border border-teal-900/50 rounded-xl px-4 py-2.5 text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Preferred Location</label>
                <input type="text" value={preferredLocation} onChange={e => setPreferredLocation(e.target.value)} className="w-full bg-black/40 border border-teal-900/50 rounded-xl px-4 py-2.5 text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Source</label>
                <select value={source} onChange={e => setSource(e.target.value)} className="w-full bg-black/40 border border-teal-900/50 rounded-xl px-4 py-2.5 text-white">
                  <option value="Walk-in">Walk-in</option>
                  <option value="Website">Website</option>
                  <option value="Referral">Referral</option>
                  <option value="Ad">Ad</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Auto WhatsApp Dispatch Checkbox */}
            <div className="pt-2">
              <label className="inline-flex items-center gap-2.5 cursor-pointer bg-black/30 p-3 rounded-xl border border-teal-900/60 w-full">
                <input
                  type="checkbox"
                  checked={autoSendWhatsApp}
                  onChange={e => setAutoSendWhatsApp(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-400 focus:ring-0 bg-gray-900 border-teal-800"
                />
                <div className="flex items-center gap-2 text-xs">
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span className="text-white font-semibold">Auto-send Instant WhatsApp Greeting & Digital Brochure</span>
                  <span className="text-emerald-400 font-bold">(Auto-Pilot)</span>
                </div>
              </label>
            </div>
            
            <div className="flex justify-end pt-2">
              <button type="submit" disabled={submitting} className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2">
                {submitting ? 'Saving...' : 'Save Lead'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-[#051611] border border-teal-900/50 rounded-t-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
                type="text" 
                placeholder="Search name, phone, location..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-black/40 border border-teal-900/50 rounded-xl pl-10 pr-4 py-2 text-white" 
            />
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
            <select 
                value={stageFilter}
                onChange={e => setStageFilter(e.target.value)}
                className="bg-black/40 border border-teal-900/50 rounded-xl px-3 py-2 text-white text-sm outline-none"
            >
                <option value="">All Stages</option>
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Qualified">Qualified</option>
                <option value="Site Visit">Site Visit</option>
                <option value="Negotiation">Negotiation</option>
                <option value="Won">Won</option>
                <option value="Lost">Lost</option>
            </select>
            <select 
                value={sourceFilter}
                onChange={e => setSourceFilter(e.target.value)}
                className="bg-black/40 border border-teal-900/50 rounded-xl px-3 py-2 text-white text-sm outline-none"
            >
                <option value="">All Sources</option>
                <option value="Walk-in">Walk-in</option>
                <option value="Website">Website</option>
                <option value="Referral">Referral</option>
                <option value="Ad">Ad</option>
            </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#051611] border border-t-0 border-teal-900/50 rounded-b-2xl overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-teal-950/30 text-gray-400">
                    <tr>
                        <th className="px-6 py-4 font-semibold">Name</th>
                        <th className="px-6 py-4 font-semibold">Contact</th>
                        <th className="px-6 py-4 font-semibold">Budget & Loc</th>
                        <th className="px-6 py-4 font-semibold">Stage</th>
                        <th className="px-6 py-4 font-semibold">Score</th>
                        <th className="px-6 py-4 font-semibold">Last Contact</th>
                        <th className="px-6 py-4 font-semibold text-right">Quick Follow-up</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-teal-900/30">
                    {loading ? (
                        <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">Loading...</td></tr>
                    ) : filteredLeads.length === 0 ? (
                        <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">No leads found matching criteria.</td></tr>
                    ) : (
                        filteredLeads.map(lead => {
                            const waLink = generateWhatsAppWebLink(
                              lead.phone, 
                              `Namaste ${lead.name}! I am sharing our latest luxury property catalogue: ${window.location.origin}/properties/${userData?.slug || 'demo'}`
                            );

                            return (
                            <tr 
                                key={lead.id} 
                                className="hover:bg-white/5 transition-colors"
                            >
                                <td 
                                    className="px-6 py-4 cursor-pointer"
                                    onClick={() => navigate(`/dashboard/leads/${lead.id}`)}
                                >
                                    <div className="font-bold text-white">{lead.name}</div>
                                    <div className="text-xs text-gray-500">{lead.source}</div>
                                </td>
                                <td 
                                    className="px-6 py-4 text-gray-300 cursor-pointer"
                                    onClick={() => navigate(`/dashboard/leads/${lead.id}`)}
                                >
                                    <div className="flex items-center gap-1"><Phone className="w-3 h-3 text-gray-500" /> {lead.phone}</div>
                                    {lead.email && <div className="text-xs text-gray-500 mt-0.5">{lead.email}</div>}
                                </td>
                                <td 
                                    className="px-6 py-4 text-gray-300 cursor-pointer"
                                    onClick={() => navigate(`/dashboard/leads/${lead.id}`)}
                                >
                                    <div>{(lead.budget_min || lead.budget_max) ? `${formatCurrency(lead.budget_min || 0)} - ${formatCurrency(lead.budget_max || 0)}` : 'N/A'}</div>
                                    <div className="text-xs text-gray-500 mt-0.5">{lead.preferred_location || 'Any'}</div>
                                </td>
                                <td 
                                    className="px-6 py-4 cursor-pointer"
                                    onClick={() => navigate(`/dashboard/leads/${lead.id}`)}
                                >
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold
                                        ${lead.stage === 'New' ? 'bg-blue-900/30 text-blue-400 border border-blue-800/50' : 
                                        lead.stage === 'Contacted' ? 'bg-purple-900/30 text-purple-400 border border-purple-800/50' :
                                        lead.stage === 'Qualified' ? 'bg-amber-900/30 text-amber-400 border border-amber-800/50' :
                                        lead.stage === 'Won' ? 'bg-green-900/30 text-green-400 border border-green-800/50' :
                                        lead.stage === 'Lost' ? 'bg-red-900/30 text-red-400 border border-red-800/50' :
                                        'bg-teal-900/30 text-teal-400 border border-teal-800/50'}
                                    `}>
                                        {lead.stage}
                                    </span>
                                    {lead.automation_paused && (
                                      <span className="ml-1.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30" title="Monthly lead limit reached — automation paused">
                                        Paused
                                      </span>
                                    )}
                                </td>
                                <td 
                                    className="px-6 py-4 cursor-pointer"
                                    onClick={() => navigate(`/dashboard/leads/${lead.id}`)}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="w-full bg-gray-800 rounded-full h-1.5 max-w-[50px]">
                                            <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: `${Math.min(100, lead.score || 0)}%` }}></div>
                                        </div>
                                        <span className="text-xs font-bold text-gray-300">{lead.score || 0}</span>
                                    </div>
                                </td>
                                <td 
                                    className="px-6 py-4 text-gray-400 text-sm cursor-pointer"
                                    onClick={() => navigate(`/dashboard/leads/${lead.id}`)}
                                >
                                    {formatDate(lead.last_contacted_at || lead.created_at)}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <a
                                            href={waLink}
                                            target="_blank"
                                            rel="noreferrer"
                                            onClick={e => e.stopPropagation()}
                                            className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors"
                                            title="Open WhatsApp Chat"
                                        >
                                            <MessageSquare className="w-3.5 h-3.5" />
                                            <span>WhatsApp</span>
                                        </a>
                                    </div>
                                </td>
                            </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};
