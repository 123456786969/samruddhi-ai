import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { db, auth } from '../../lib/firebase';
import { safeFormatDate } from '../../utils';
import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc } from 'firebase/firestore';
import { ArrowLeft, Phone, Mail, MapPin, Building2, Calendar, Edit2, Check, CheckSquare, Plus, Activity as ActivityIcon, MessageSquare, Send, CheckCircle2, AlertCircle, ExternalLink, Sparkles } from 'lucide-react';
import { Lead, Activity, Task, Deal, WhatsAppTemplate } from '../../types';
import { dispatchAutomatedWhatsApp, generateWhatsAppWebLink, DEFAULT_WHATSAPP_TEMPLATES, formatWhatsAppMessage } from '../../services/whatsappService';
import { handleFirestoreError, OperationType } from '../../utils/firestoreErrorHandler';

export const DashboardLeadDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, userData } = useOutletContext<any>();
  
  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick edit state
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editNotes, setEditNotes] = useState('');
  
  // New Activity State
  const [newActivityType, setNewActivityType] = useState<any>('call');
  const [newActivityContent, setNewActivityContent] = useState('');
  const [addingActivity, setAddingActivity] = useState(false);

  // WhatsApp Follow-up State
  const [selectedWhatsAppTplId, setSelectedWhatsAppTplId] = useState('');
  const [customWhatsAppBody, setCustomWhatsAppBody] = useState('');
  const [dispatchingWhatsApp, setDispatchingWhatsApp] = useState(false);
  const [whatsAppSuccessNotice, setWhatsAppSuccessNotice] = useState<string | null>(null);
  const [whatsAppErrorNotice, setWhatsAppErrorNotice] = useState<string | null>(null);

  useEffect(() => {
    if (id && user?.uid && auth.currentUser) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [id, user?.uid]);

  const fetchData = async () => {
    if (!user?.uid || !id || !auth.currentUser) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const uid = auth.currentUser.uid;
      // Lead
      const leadSnap = await getDoc(doc(db, 'leads', id)).catch(err => {
        handleFirestoreError(err, OperationType.GET, `leads/${id}`);
        return null;
      });
      if (leadSnap && leadSnap.exists()) {
        const lData = { id: leadSnap.id, ...leadSnap.data() } as Lead;
        setLead(lData);
        setEditNotes(leadSnap.data().notes || '');
      }

      // Activities
      const actQ = query(
        collection(db, 'activities'),
        where('agent_id', '==', uid),
        where('lead_id', '==', id)
      );
      const actSnap = await getDocs(actQ).catch(err => {
        handleFirestoreError(err, OperationType.LIST, 'activities');
        return { docs: [] };
      });
      const actList = (actSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Activity[])
        .sort((a, b) => (Number(b.created_at) || 0) - (Number(a.created_at) || 0));
      setActivities(actList);

      // Tasks
      const taskQ = query(
        collection(db, 'tasks'),
        where('agent_id', '==', uid),
        where('lead_id', '==', id)
      );
      const taskSnap = await getDocs(taskQ).catch(err => {
        handleFirestoreError(err, OperationType.LIST, 'tasks');
        return { docs: [] };
      });
      const taskList = (taskSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Task[])
        .sort((a, b) => (Number(a.due_date) || 0) - (Number(b.due_date) || 0));
      setTasks(taskList);

      // Deals
      const dealQ = query(
        collection(db, 'deals'),
        where('agent_id', '==', uid),
        where('lead_id', '==', id)
      );
      const dealSnap = await getDocs(dealQ).catch(err => {
        handleFirestoreError(err, OperationType.LIST, 'deals');
        return { docs: [] };
      });
      setDeals(dealSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Deal[]);

      // WhatsApp Templates
      const tQ = query(collection(db, 'whatsapp_templates'), where('agent_id', '==', uid));
      const tSnap = await getDocs(tQ).catch(err => {
        handleFirestoreError(err, OperationType.LIST, 'whatsapp_templates');
        return { docs: [] };
      });
        const tList = tSnap.docs.map(d => ({ id: d.id, ...d.data() })) as WhatsAppTemplate[];
        setTemplates(tList);
        if (tList.length > 0) {
          setSelectedWhatsAppTplId(tList[0].id);
          setCustomWhatsAppBody(tList[0].body);
        }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStage = async (newStage: string) => {
    if (!lead) return;
    try {
      await updateDoc(doc(db, 'leads', lead.id), { stage: newStage });
      setLead({ ...lead, stage: newStage as any });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveNotes = async () => {
    if (!lead) return;
    try {
      await updateDoc(doc(db, 'leads', lead.id), { notes: editNotes });
      setLead({ ...lead, notes: editNotes });
      setIsEditingNotes(false);
    } catch(err) { console.error(err); }
  };

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivityContent.trim() || !lead) return;
    setAddingActivity(true);
    try {
      const act: any = {
        agent_id: user.uid,
        lead_id: lead.id,
        type: newActivityType,
        content: newActivityContent,
        created_at: Date.now()
      };
      await addDoc(collection(db, 'activities'), act);
      await updateDoc(doc(db, 'leads', lead.id), { last_contacted_at: Date.now() });
      setNewActivityContent('');
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setAddingActivity(false);
    }
  };

  const handleSendWhatsAppFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;
    setDispatchingWhatsApp(true);
    setWhatsAppSuccessNotice(null);
    setWhatsAppErrorNotice(null);

    try {
      const selectedTpl = templates.find(t => t.id === selectedWhatsAppTplId);
      const customBody = customWhatsAppBody || selectedTpl?.body || DEFAULT_WHATSAPP_TEMPLATES[0].body;

      const res = await dispatchAutomatedWhatsApp({
        agentId: user.uid,
        leadId: lead.id,
        leadName: lead.name,
        leadPhone: lead.phone,
        agentName: userData?.name || user?.displayName || 'Real Estate Advisor',
        businessName: userData?.businessName || 'Samruddhi Realty',
        agentSlug: userData?.slug || '',
        propertyType: lead.property_type || 'Luxury Homes',
        preferredLocation: lead.preferred_location || 'Prime Metro Hubs',
        budget: lead.budget_max ? `₹${lead.budget_max / 100000} Lakhs` : 'Best Market Price',
        triggerType: selectedTpl?.trigger_event || 'manual_followup',
        customTemplate: customBody,
      });

      if (res.success) {
        setWhatsAppSuccessNotice(`WhatsApp delivered! (ID: ${res.messageId || 'OK'})`);
        fetchData();
        setTimeout(() => setWhatsAppSuccessNotice(null), 4000);
      } else {
        setWhatsAppErrorNotice(res.error || 'Failed to dispatch WhatsApp message. Please verify the phone number.');
      }
    } catch (err: any) {
      console.error(err);
      setWhatsAppErrorNotice('Error dispatching WhatsApp: ' + err?.message);
    } finally {
      setDispatchingWhatsApp(false);
    }
  };

  const handleToggleTask = async (task: Task) => {
    try {
      const newStatus = task.status === 'pending' ? 'done' : 'pending';
      await updateDoc(doc(db, 'tasks', task.id), { status: newStatus });
      setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    } catch (err) { console.error(err); }
  };

  if (loading) return <div className="p-8 text-gray-400">Loading profile...</div>;
  if (!lead) return <div className="p-8 text-red-400">Lead not found.</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <button onClick={() => navigate('/dashboard/leads')} className="text-gray-400 hover:text-white flex items-center gap-2 text-sm font-semibold">
        <ArrowLeft className="w-4 h-4" /> Back to Leads
      </button>

      {/* Header Profile Card */}
      <div className="bg-[#051611] border border-teal-900/50 rounded-2xl p-6 md:p-8">
        <div className="flex flex-col md:flex-row justify-between md:items-start gap-6">
            <div>
                <h1 className="text-3xl font-black text-white mb-2">{lead.name}</h1>
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-300">
                    <span className="flex items-center gap-1.5"><Phone className="w-4 h-4 text-gray-500" /> {lead.phone}</span>
                    {lead.email && <span className="flex items-center gap-1.5"><Mail className="w-4 h-4 text-gray-500" /> {lead.email}</span>}
                    <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-gray-500" /> {lead.preferred_location || 'Any location'}</span>
                    <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4 text-gray-500" /> {lead.property_type || 'Any type'}</span>
                </div>
            </div>
            
            <div className="flex flex-col items-end gap-2">
                <select 
                    value={lead.stage}
                    onChange={(e) => handleUpdateStage(e.target.value)}
                    className="bg-teal-900/40 text-teal-300 font-bold border border-teal-700/50 rounded-xl px-4 py-2 outline-none appearance-none min-w-[140px] cursor-pointer"
                >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Site Visit">Site Visit</option>
                    <option value="Negotiation">Negotiation</option>
                    <option value="Won">Won</option>
                    <option value="Lost">Lost</option>
                </select>
                <div className="text-xs text-gray-500 font-medium text-right">
                    Lead Score: <span className="text-amber-400 font-bold">{lead.score || 0}/100</span><br/>
                    Source: {lead.source}
                </div>
            </div>
        </div>

        <div className="mt-8 pt-6 border-t border-teal-900/30">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-gray-300">Internal Notes</h3>
                {!isEditingNotes ? (
                    <button onClick={() => setIsEditingNotes(true)} className="text-gray-500 hover:text-white p-1"><Edit2 className="w-4 h-4" /></button>
                ) : (
                    <button onClick={handleSaveNotes} className="text-green-500 hover:text-green-400 p-1"><Check className="w-4 h-4" /></button>
                )}
            </div>
            {isEditingNotes ? (
                <textarea 
                    value={editNotes} 
                    onChange={e => setEditNotes(e.target.value)} 
                    className="w-full bg-black/40 border border-teal-700/50 rounded-xl p-3 text-white min-h-[100px]"
                />
            ) : (
                <p className="text-gray-400 text-sm whitespace-pre-wrap">{lead.notes || 'No notes added yet.'}</p>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Activity & Timeline */}
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#051611] border border-teal-900/50 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-6">Log Activity</h2>
                <form onSubmit={handleAddActivity} className="space-y-4">
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {['call', 'whatsapp', 'email', 'note', 'site visit', 'meeting'].map(t => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => setNewActivityType(t)}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize whitespace-nowrap transition-colors ${
                                    newActivityType === t ? 'bg-amber-400 text-black' : 'bg-teal-900/30 text-gray-400 border border-teal-900/50'
                                }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                    <textarea 
                        value={newActivityContent}
                        onChange={e => setNewActivityContent(e.target.value)}
                        placeholder={`Describe the ${newActivityType}...`}
                        required
                        className="w-full bg-black/40 border border-teal-900/50 rounded-xl p-3 text-white text-sm"
                        rows={3}
                    />
                    <div className="flex justify-end">
                        <button type="submit" disabled={addingActivity} className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-6 py-2 rounded-xl text-sm transition-colors disabled:opacity-50">
                            Log {newActivityType}
                        </button>
                    </div>
                </form>

                <div className="mt-8 space-y-4">
                    <h3 className="font-semibold text-gray-300">Activity Timeline</h3>
                    {activities.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">No activity recorded yet.</p>
                    ) : (
                        <div className="relative border-l border-teal-900/50 ml-3 pl-6 space-y-6">
                            {activities.map(act => (
                                <div key={act.id} className="relative">
                                    <div className="absolute -left-[31px] bg-[#051611] p-1 rounded-full border border-teal-700/50 text-teal-400">
                                        <ActivityIcon className="w-3 h-3" />
                                    </div>
                                    <div className="flex justify-between items-baseline mb-1">
                                        <span className="font-semibold text-white capitalize text-sm">{act.type}</span>
                                        <span className="text-xs text-gray-500">{safeFormatDate(act.created_at, { dateStyle: 'medium', timeStyle: 'short'})}</span>
                                    </div>
                                    <p className="text-gray-400 text-sm">{act.content}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Right Column: WhatsApp Action, Tasks & Deals */}
        <div className="space-y-6">
            
            {/* WhatsApp Automated Action Card */}
            <div className="bg-[#041d16] border border-teal-800/80 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-emerald-400" />
                        <span>Automated WhatsApp</span>
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">
                        Live Auto-Pilot
                    </span>
                </div>

                <p className="text-xs text-gray-300 mb-4">
                  Send personalized WhatsApp brochure or follow-up sequence instantly to <strong className="text-white">{lead.name}</strong>.
                </p>

                {whatsAppSuccessNotice && (
                  <div className="p-3 mb-4 rounded-xl bg-emerald-950/90 border border-emerald-700 text-emerald-300 text-xs flex items-center gap-2 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{whatsAppSuccessNotice}</span>
                  </div>
                )}

                {whatsAppErrorNotice && (
                  <div className="p-3 mb-4 rounded-xl bg-red-950/90 border border-red-700 text-red-300 text-xs flex items-center gap-2 font-medium">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{whatsAppErrorNotice}</span>
                  </div>
                )}

                <form onSubmit={handleSendWhatsAppFollowUp} className="space-y-3">
                    <div>
                        <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1">
                          Select Sequence Template
                        </label>
                        <select
                          value={selectedWhatsAppTplId}
                          onChange={e => {
                            setSelectedWhatsAppTplId(e.target.value);
                            const t = templates.find(item => item.id === e.target.value);
                            if (t) setCustomWhatsAppBody(t.body);
                          }}
                          className="w-full bg-black/50 border border-teal-900/80 rounded-xl px-3 py-2 text-xs text-teal-200 outline-none"
                        >
                          {templates.map(t => (
                            <option key={t.id} value={t.id}>
                              {t.title}
                            </option>
                          ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1">
                          Message Body
                        </label>
                        <textarea
                          rows={4}
                          value={customWhatsAppBody}
                          onChange={e => setCustomWhatsAppBody(e.target.value)}
                          className="w-full bg-black/50 border border-teal-900/80 rounded-xl p-3 text-xs text-white outline-none leading-relaxed"
                        />
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="submit"
                        disabled={dispatchingWhatsApp}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold text-xs shadow-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{dispatchingWhatsApp ? 'Sending...' : 'Send WhatsApp'}</span>
                      </button>

                      <a
                        href={generateWhatsAppWebLink(
                          lead.phone,
                          formatWhatsAppMessage(customWhatsAppBody || DEFAULT_WHATSAPP_TEMPLATES[0].body, {
                            lead_name: lead.name,
                            agent_name: userData?.name || user?.displayName || 'Advisor',
                            business_name: userData?.businessName || 'Samruddhi Realty',
                            preferred_location: lead.preferred_location || 'Prime Locations',
                            catalogue_url: `${window.location.origin}/properties/${userData?.slug || 'demo'}`,
                          })
                        )}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2.5 bg-teal-900/50 hover:bg-teal-800 text-teal-200 border border-teal-700/60 rounded-xl transition-colors"
                        title="Open in WhatsApp Web"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                </form>
            </div>

            <div className="bg-[#051611] border border-teal-900/50 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-white">Tasks</h2>
                    <button onClick={() => navigate(`/dashboard/tasks?new=true&leadId=${lead.id}`)} className="text-amber-400 hover:text-amber-300">
                        <Plus className="w-5 h-5" />
                    </button>
                </div>
                {tasks.length === 0 ? (
                    <p className="text-sm text-gray-500">No tasks for this lead.</p>
                ) : (
                    <div className="space-y-3">
                        {tasks.map(task => (
                            <div key={task.id} className="flex gap-3 items-start">
                                <button onClick={() => handleToggleTask(task)} className="mt-0.5 shrink-0">
                                    {task.status === 'done' ? (
                                        <div className="w-5 h-5 rounded bg-teal-600 flex items-center justify-center text-white"><Check className="w-3 h-3" /></div>
                                    ) : (
                                        <div className="w-5 h-5 rounded border border-teal-700/50 hover:border-amber-400"></div>
                                    )}
                                </button>
                                <div className={task.status === 'done' ? 'opacity-50' : ''}>
                                    <p className="text-sm font-semibold text-white">{task.title}</p>
                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {safeFormatDate(task.due_date)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="bg-[#051611] border border-teal-900/50 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-white">Deals</h2>
                    <button className="text-amber-400 hover:text-amber-300">
                        <Plus className="w-5 h-5" />
                    </button>
                </div>
                {deals.length === 0 ? (
                    <p className="text-sm text-gray-500">No active deals.</p>
                ) : (
                    <div className="space-y-3">
                        {deals.map(deal => (
                            <div key={deal.id} className="bg-black/30 border border-teal-900/30 rounded-xl p-3">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-white">
                                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumSignificantDigits: 3 }).format(deal.value)}
                                    </span>
                                    <span className="text-[10px] uppercase font-bold text-teal-400 bg-teal-900/40 px-2 py-0.5 rounded-full">{deal.stage}</span>
                                </div>
                                <p className="text-xs text-gray-500">Expected close: {deal.expected_close_date ? safeFormatDate(deal.expected_close_date) : 'Unknown'}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
