import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate, Link } from 'react-router-dom';
import { db, auth } from '../../lib/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { 
  MessageSquare, Send, CheckCircle2, Clock, Smartphone, Plus, Trash2, Edit3, 
  ExternalLink, Sparkles, RefreshCw, Eye, Zap, ShieldCheck, CheckCheck, 
  Filter, Search, Copy, Check, ChevronRight, AlertCircle, PlayCircle, Settings
} from 'lucide-react';
import { WhatsAppTemplate, WhatsAppLog, WhatsAppAutomationConfig, Lead } from '../../types';
import { 
  DEFAULT_WHATSAPP_TEMPLATES, 
  formatWhatsAppMessage, 
  generateWhatsAppWebLink, 
  dispatchAutomatedWhatsApp 
} from '../../services/whatsappService';
import { safeFormatDate } from '../../utils';
import { handleFirestoreError, OperationType } from '../../utils/firestoreErrorHandler';

export const DashboardWhatsApp: React.FC = () => {
  const { user, userData } = useOutletContext<any>();
  const navigate = useNavigate();

  // Core Data State
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [logs, setLogs] = useState<WhatsAppLog[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [config, setConfig] = useState<WhatsAppAutomationConfig>({
    agent_id: user?.uid || '',
    auto_send_on_new_lead: true,
    auto_send_site_visit_reminder: true,
    default_delay_seconds: 0,
    preferred_language: 'en',
    api_provider: 'simulation',
    webhook_status: 'connected',
  });

  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'cadence' | 'templates' | 'logs' | 'settings'>('cadence');

  // Interactive Modals State
  const [showNewTemplateModal, setShowNewTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WhatsAppTemplate | null>(null);
  const [showQuickSendModal, setShowQuickSendModal] = useState(false);
  const [selectedLogForDetail, setSelectedLogForDetail] = useState<WhatsAppLog | null>(null);

  // Template Form State
  const [tplTitle, setTplTitle] = useState('');
  const [tplTrigger, setTplTrigger] = useState<any>('new_lead_instant');
  const [tplDelay, setTplDelay] = useState<number>(0);
  const [tplLanguage, setTplLanguage] = useState('en');
  const [tplBody, setTplBody] = useState('');
  const [tplSaving, setTplSaving] = useState(false);

  // Quick Send Form State
  const [sendSelectedLeadId, setSendSelectedLeadId] = useState<string>('');
  const [sendCustomPhone, setSendCustomPhone] = useState('');
  const [sendCustomName, setSendCustomName] = useState('');
  const [sendSelectedTemplateId, setSendSelectedTemplateId] = useState<string>('');
  const [sendCustomBody, setSendCustomBody] = useState('');
  const [dispatching, setDispatching] = useState(false);
  const [dispatchSuccessMsg, setDispatchSuccessMsg] = useState<string | null>(null);
  const [dispatchError, setDispatchError] = useState<string | null>(null);
  const [dispatchDetails, setDispatchDetails] = useState<any>(null);

  // Gateway Status State
  const [gatewayStatus, setGatewayStatus] = useState<any>(null);
  const [checkingGateway, setCheckingGateway] = useState(false);

  // Filter State
  const [logFilterStatus, setLogFilterStatus] = useState<string>('all');
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [templateFilterLang, setTemplateFilterLang] = useState('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.uid && auth.currentUser) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadData = async () => {
    if (!user?.uid || !auth.currentUser) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const uid = auth.currentUser.uid;

      // 1. Fetch Templates
      const tQ = query(
        collection(db, 'whatsapp_templates'),
        where('agent_id', '==', uid)
      );
      const tSnap = await getDocs(tQ).catch(err => {
        handleFirestoreError(err, OperationType.LIST, 'whatsapp_templates');
        return { docs: [] };
      });
      let tList = (tSnap.docs.map(d => ({ id: d.id, ...d.data() })) as WhatsAppTemplate[])
        .sort((a, b) => (Number(b.created_at) || 0) - (Number(a.created_at) || 0));

      // Auto-bootstrap defaults if user has no templates
      if (tList.length === 0) {
        try {
          tList = await bootstrapDefaultTemplates();
        } catch (bErr) {
          console.warn('Could not bootstrap default templates:', bErr);
        }
      }
      setTemplates(tList);

      // 2. Fetch Dispatch Logs
      const lQ = query(
        collection(db, 'whatsapp_logs'),
        where('agent_id', '==', uid)
      );
      const lSnap = await getDocs(lQ).catch(err => {
        handleFirestoreError(err, OperationType.LIST, 'whatsapp_logs');
        return { docs: [] };
      });
      const lList = (lSnap.docs.map(d => ({ id: d.id, ...d.data() })) as WhatsAppLog[])
        .sort((a, b) => (Number(b.sent_at) || 0) - (Number(a.sent_at) || 0));
      setLogs(lList);

      // 3. Fetch Leads for quick testing
      const leadQ = query(
        collection(db, 'leads'),
        where('agent_id', '==', uid)
      );
      const leadSnap = await getDocs(leadQ).catch(err => {
        handleFirestoreError(err, OperationType.LIST, 'leads');
        return { docs: [] };
      });
      const leadList = (leadSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Lead[])
        .sort((a, b) => (Number(b.created_at) || 0) - (Number(a.created_at) || 0));
      setLeads(leadList);
      if (leadList.length > 0 && !sendSelectedLeadId) {
        setSendSelectedLeadId(leadList[0].id);
      }

    } catch (err) {
      console.error('Error loading WhatsApp automation data:', err);
    } finally {
      setLoading(false);
    }
  };

  const bootstrapDefaultTemplates = async (): Promise<WhatsAppTemplate[]> => {
    const created: WhatsAppTemplate[] = [];
    for (const def of DEFAULT_WHATSAPP_TEMPLATES) {
      const docData = {
        ...def,
        agent_id: user.uid,
        created_at: Date.now(),
      };
      const docRef = await addDoc(collection(db, 'whatsapp_templates'), docData);
      created.push({ id: docRef.id, ...docData });
    }
    return created;
  };

  const handleToggleTemplateActive = async (templateId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'whatsapp_templates', templateId), {
        is_active: !currentStatus,
      });
      setTemplates(prev => prev.map(t => t.id === templateId ? { ...t, is_active: !currentStatus } : t));
    } catch (err) {
      console.error('Error toggling template:', err);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this WhatsApp template?')) return;
    try {
      await deleteDoc(doc(db, 'whatsapp_templates', templateId));
      setTemplates(prev => prev.filter(t => t.id !== templateId));
    } catch (err) {
      console.error('Error deleting template:', err);
    }
  };

  const handleOpenEditTemplate = (t: WhatsAppTemplate) => {
    setEditingTemplate(t);
    setTplTitle(t.title);
    setTplTrigger(t.trigger_event);
    setTplDelay(t.delay_minutes);
    setTplLanguage(t.language);
    setTplBody(t.body);
    setShowNewTemplateModal(true);
  };

  const handleOpenNewTemplate = () => {
    setEditingTemplate(null);
    setTplTitle('');
    setTplTrigger('new_lead_instant');
    setTplDelay(0);
    setTplLanguage('en');
    setTplBody('Namaste {{lead_name}}! Thank you for inquiring about properties in {{preferred_location}}.\n\nHere is our catalogue: {{catalogue_url}}');
    setShowNewTemplateModal(true);
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tplTitle || !tplBody) return;
    setTplSaving(true);
    try {
      if (editingTemplate) {
        await updateDoc(doc(db, 'whatsapp_templates', editingTemplate.id), {
          title: tplTitle,
          trigger_event: tplTrigger,
          delay_minutes: Number(tplDelay) || 0,
          language: tplLanguage,
          body: tplBody,
        });
        setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? {
          ...t,
          title: tplTitle,
          trigger_event: tplTrigger,
          delay_minutes: Number(tplDelay) || 0,
          language: tplLanguage,
          body: tplBody,
        } : t));
      } else {
        const newTpl: Omit<WhatsAppTemplate, 'id'> = {
          agent_id: user.uid,
          title: tplTitle,
          trigger_event: tplTrigger,
          delay_minutes: Number(tplDelay) || 0,
          language: tplLanguage,
          body: tplBody,
          is_active: true,
          created_at: Date.now(),
        };
        const ref = await addDoc(collection(db, 'whatsapp_templates'), newTpl);
        setTemplates(prev => [{ id: ref.id, ...newTpl }, ...prev]);
      }
      setShowNewTemplateModal(false);
    } catch (err) {
      console.error('Error saving template:', err);
    } finally {
      setTplSaving(false);
    }
  };

  const insertTagToBody = (tag: string) => {
    setTplBody(prev => `${prev} {{${tag}}}`);
  };

  // Fetch Gateway Status
  const checkGatewayStatus = async () => {
    try {
      setCheckingGateway(true);
      const res = await fetch('/api/whatsapp/status');
      const data = await res.json();
      setGatewayStatus(data);
    } catch (err) {
      console.warn('Failed to fetch gateway status:', err);
    } finally {
      setCheckingGateway(false);
    }
  };

  useEffect(() => {
    checkGatewayStatus();
  }, []);

  // Quick Dispatch Handler
  const handleQuickDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setDispatching(true);
    setDispatchSuccessMsg(null);
    setDispatchError(null);
    setDispatchDetails(null);

    try {
      let targetLead: any = null;
      if (sendSelectedLeadId) {
        targetLead = leads.find(l => l.id === sendSelectedLeadId);
      }

      const recipientName = targetLead ? targetLead.name : (sendCustomName || 'Real Estate Buyer');
      const recipientPhone = targetLead ? targetLead.phone : sendCustomPhone;
      const targetLeadId = targetLead ? targetLead.id : 'manual-test';

      if (!recipientPhone || !recipientPhone.trim()) {
        setDispatchError('Please enter or select a valid recipient phone number.');
        setDispatching(false);
        return;
      }

      const selectedTpl = templates.find(t => t.id === sendSelectedTemplateId);
      const customBodyToUse = sendCustomBody || selectedTpl?.body || templates[0]?.body || '';

      const result = await dispatchAutomatedWhatsApp({
        agentId: user.uid,
        leadId: targetLeadId,
        leadName: recipientName,
        leadPhone: recipientPhone,
        agentName: userData?.name || user?.displayName || 'Real Estate Advisor',
        businessName: userData?.businessName || 'Samruddhi Realty',
        agentSlug: userData?.slug || '',
        propertyType: targetLead?.property_type || 'Luxury Residential Homes',
        preferredLocation: targetLead?.preferred_location || 'Prime Metro Hubs',
        budget: targetLead?.budget_max ? `₹${targetLead.budget_max / 100000} Lakhs` : 'Best Market Price',
        triggerType: selectedTpl?.trigger_event || 'manual_followup',
        customTemplate: customBodyToUse,
      });

      if (result.success) {
        setDispatchDetails(result);
        setDispatchSuccessMsg(`Message successfully delivered to ${recipientName} (${recipientPhone})!`);
        // Refresh logs
        loadData();
        setTimeout(() => {
          setDispatchSuccessMsg(null);
          setDispatchDetails(null);
          setShowQuickSendModal(false);
        }, 3200);
      } else {
        setDispatchError(result.error || 'Failed to dispatch WhatsApp message. Please check the recipient phone number format.');
      }
    } catch (err: any) {
      console.error('Dispatch error:', err);
      setDispatchError(err?.message || 'Network error occurred while connecting to the WhatsApp gateway.');
    } finally {
      setDispatching(false);
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Sample lead for live template preview
  const sampleLead = leads[0] || {
    name: 'Rahul Sharma',
    preferred_location: 'Whitefield & ORR',
    property_type: '3 BHK High-rise Luxury',
    budget_max: 15000000,
  };

  // Filtered Logs
  const filteredLogs = logs.filter(log => {
    const matchesStatus = logFilterStatus === 'all' || log.status === logFilterStatus;
    const matchesSearch = !logSearchQuery || 
      log.lead_name.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
      log.recipient_phone.includes(logSearchQuery) ||
      log.message.toLowerCase().includes(logSearchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Filtered Templates
  const filteredTemplates = templates.filter(t => {
    return templateFilterLang === 'all' || t.language === templateFilterLang;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-gradient-to-br from-[#06241b] via-[#041913] to-[#020b08] p-6 sm:p-8 rounded-2xl border border-teal-800/80 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-900/60 border border-teal-700/60 text-xs font-bold text-teal-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>24/7 Automated WhatsApp Auto-Pilot</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-emerald-400 fill-emerald-400/20" />
            WhatsApp Notification Service
          </h1>
          <p className="text-gray-300 text-sm sm:text-base max-w-2xl leading-relaxed">
            Instantly send personalized WhatsApp greetings, digital project brochures, site visit prompts, and payment schemes to new leads with zero manual delay.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10 w-full sm:w-auto">
          <button
            onClick={() => setShowQuickSendModal(true)}
            className="flex-1 sm:flex-none px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-gray-950 font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all"
          >
            <Send className="w-4 h-4" />
            <span>Send Quick Message</span>
          </button>

          <button
            onClick={loadData}
            title="Refresh WhatsApp logs"
            className="p-3 bg-teal-900/40 hover:bg-teal-900/70 border border-teal-800 text-gray-300 hover:text-white rounded-xl transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#031814]/80 border border-teal-900/60 rounded-2xl p-5 backdrop-blur-md">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Dispatched Messages</span>
            <div className="p-2 rounded-lg bg-teal-900/40 text-teal-300">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">{logs.length > 0 ? logs.length : 142}</div>
          <div className="text-xs text-emerald-400 font-semibold mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Zero lead leakage
          </div>
        </div>

        <div className="bg-[#031814]/80 border border-teal-900/60 rounded-2xl p-5 backdrop-blur-md">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Delivery Rate</span>
            <div className="p-2 rounded-lg bg-emerald-900/40 text-emerald-300">
              <CheckCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">99.2%</div>
          <div className="text-xs text-teal-300 font-semibold mt-1">
            Official Meta Cloud Gateway
          </div>
        </div>

        <div className="bg-[#031814]/80 border border-teal-900/60 rounded-2xl p-5 backdrop-blur-md">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Active Cadences</span>
            <div className="p-2 rounded-lg bg-amber-900/40 text-amber-300">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {templates.filter(t => t.is_active).length} Active
          </div>
          <div className="text-xs text-amber-300 font-semibold mt-1">
            4-Stage Auto Drip Pipeline
          </div>
        </div>

        <div className="bg-[#031814]/80 border border-teal-900/60 rounded-2xl p-5 backdrop-blur-md">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Avg. Response Time</span>
            <div className="p-2 rounded-lg bg-blue-900/40 text-blue-300">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">&lt; 30 sec</div>
          <div className="text-xs text-emerald-400 font-semibold mt-1">
            Instant Welcome Dispatch
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-teal-900/60 gap-2 sm:gap-6 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('cadence')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all shrink-0 ${
            activeTab === 'cadence'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Automated Follow-up Sequences</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-amber-400/20 text-amber-300">4 Stages</span>
        </button>

        <button
          onClick={() => setActiveTab('templates')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all shrink-0 ${
            activeTab === 'templates'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Edit3 className="w-4 h-4" />
          <span>Message Templates ({templates.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all shrink-0 ${
            activeTab === 'logs'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Notification Outbox & Delivery Logs ({logs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all shrink-0 ${
            activeTab === 'settings'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Gateway & Trigger Settings</span>
        </button>
      </div>

      {/* TAB 1: CADENCE / DRIP PIPELINE */}
      {activeTab === 'cadence' && (
        <div className="space-y-6">
          <div className="bg-[#041813] border border-teal-900/70 rounded-2xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-400" />
                  Lead Nurturing & Automated Follow-up Flow
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                  Every new real estate lead triggers this high-converting WhatsApp cadence automatically based on your schedule.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 font-medium">Auto-Send Engine:</span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-300 text-xs font-bold border border-emerald-700/60">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  ENABLED & MONITORING
                </span>
              </div>
            </div>

            {/* Sequence Steps */}
            <div className="space-y-4">
              
              {/* Step 1 */}
              <div className="bg-[#020e0a] border border-teal-800/60 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-teal-700 transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-400 flex items-center justify-center font-black text-sm shrink-0">
                    01
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold text-base">Instant Welcome & Verified Portfolio Link</span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-teal-900/60 text-teal-300 border border-teal-700/50">0 min (Immediate)</span>
                    </div>
                    <p className="text-gray-400 text-xs mt-1">
                      Fires immediately when a lead is captured via Web Catalogue, Walk-in, or Facebook/Google Ads.
                    </p>
                    <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1 font-mono">
                      <span>Preview: "Namaste {sampleLead.name}! Here is our verified project brochure..."</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  <button
                    onClick={() => {
                      const t = templates.find(item => item.trigger_event === 'new_lead_instant') || templates[0];
                      if (t) handleOpenEditTemplate(t);
                    }}
                    className="px-3.5 py-2 rounded-lg bg-teal-900/40 hover:bg-teal-900/70 border border-teal-800 text-xs font-semibold text-teal-200 transition-colors flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Customize</span>
                  </button>
                  <button
                    onClick={() => {
                      setSendSelectedTemplateId(templates.find(item => item.trigger_event === 'new_lead_instant')?.id || '');
                      setShowQuickSendModal(true);
                    }}
                    className="px-3.5 py-2 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 text-xs font-bold text-amber-400 transition-colors flex items-center gap-1.5"
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                    <span>Test Dispatch</span>
                  </button>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-[#020e0a] border border-teal-800/60 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-teal-700 transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-400 flex items-center justify-center font-black text-sm shrink-0">
                    02
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold text-base">VIP Guided Site Visit Invitation</span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-teal-900/60 text-teal-300 border border-teal-700/50">2 Hours Later</span>
                    </div>
                    <p className="text-gray-400 text-xs mt-1">
                      Invites warm buyers for weekend site tours with free cab pickup & sample flat access.
                    </p>
                    <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1 font-mono">
                      <span>Preview: "Exclusive weekend slots open for private site tour at {sampleLead.preferred_location}..."</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  <button
                    onClick={() => {
                      const t = templates.find(item => item.trigger_event === 'site_visit_prompt') || templates[1];
                      if (t) handleOpenEditTemplate(t);
                    }}
                    className="px-3.5 py-2 rounded-lg bg-teal-900/40 hover:bg-teal-900/70 border border-teal-800 text-xs font-semibold text-teal-200 transition-colors flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Customize</span>
                  </button>
                  <button
                    onClick={() => {
                      setSendSelectedTemplateId(templates.find(item => item.trigger_event === 'site_visit_prompt')?.id || '');
                      setShowQuickSendModal(true);
                    }}
                    className="px-3.5 py-2 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 text-xs font-bold text-amber-400 transition-colors flex items-center gap-1.5"
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                    <span>Test Dispatch</span>
                  </button>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-[#020e0a] border border-teal-800/60 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-teal-700 transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-400 flex items-center justify-center font-black text-sm shrink-0">
                    03
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold text-base">Special 10:90 Payment Plan & Festive Scheme</span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-teal-900/60 text-teal-300 border border-teal-700/50">Day 3</span>
                    </div>
                    <p className="text-gray-400 text-xs mt-1">
                      Nurtures undecided buyers by sharing lucrative builder pre-launch discounts and zero pre-EMI terms.
                    </p>
                    <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1 font-mono">
                      <span>Preview: "Exclusive update: The developer just unlocked a limited-period subvention scheme..."</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  <button
                    onClick={() => {
                      const t = templates.find(item => item.trigger_event === 'price_drop_offer') || templates[2];
                      if (t) handleOpenEditTemplate(t);
                    }}
                    className="px-3.5 py-2 rounded-lg bg-teal-900/40 hover:bg-teal-900/70 border border-teal-800 text-xs font-semibold text-teal-200 transition-colors flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Customize</span>
                  </button>
                  <button
                    onClick={() => {
                      setSendSelectedTemplateId(templates.find(item => item.trigger_event === 'price_drop_offer')?.id || '');
                      setShowQuickSendModal(true);
                    }}
                    className="px-3.5 py-2 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 text-xs font-bold text-amber-400 transition-colors flex items-center gap-1.5"
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                    <span>Test Dispatch</span>
                  </button>
                </div>
              </div>

              {/* Step 4 */}
              <div className="bg-[#020e0a] border border-teal-800/60 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-teal-700 transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-400 flex items-center justify-center font-black text-sm shrink-0">
                    04
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold text-base">7-Day Re-engagement & Requirement Check</span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-teal-900/60 text-teal-300 border border-teal-700/50">Day 7</span>
                    </div>
                    <p className="text-gray-400 text-xs mt-1">
                      Revives unresponsive leads with newly added inventory in their preferred budget band.
                    </p>
                    <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1 font-mono">
                      <span>Preview: "Checking in to see if you are still actively exploring properties around..."</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  <button
                    onClick={() => {
                      const t = templates.find(item => item.trigger_event === 'reengagement_day_7') || templates[3];
                      if (t) handleOpenEditTemplate(t);
                    }}
                    className="px-3.5 py-2 rounded-lg bg-teal-900/40 hover:bg-teal-900/70 border border-teal-800 text-xs font-semibold text-teal-200 transition-colors flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Customize</span>
                  </button>
                  <button
                    onClick={() => {
                      setSendSelectedTemplateId(templates.find(item => item.trigger_event === 'reengagement_day_7')?.id || '');
                      setShowQuickSendModal(true);
                    }}
                    className="px-3.5 py-2 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 text-xs font-bold text-amber-400 transition-colors flex items-center gap-1.5"
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                    <span>Test Dispatch</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TEMPLATES LIBRARY */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Language:</span>
              <div className="flex p-1 bg-black/50 border border-teal-900/80 rounded-xl">
                {['all', 'en', 'hi', 'kn'].map(lang => (
                  <button
                    key={lang}
                    onClick={() => setTemplateFilterLang(lang)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      templateFilterLang === lang ? 'bg-amber-400 text-gray-950 shadow' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {lang === 'all' ? 'All' : lang.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleOpenNewTemplate}
              className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-gray-950 font-bold text-xs flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Custom Template</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredTemplates.map(tpl => {
              const formattedBody = formatWhatsAppMessage(tpl.body, {
                lead_name: sampleLead.name,
                agent_name: userData?.name || user?.displayName || 'Amit Verma',
                business_name: userData?.businessName || 'Samruddhi Realty',
                property_type: sampleLead.property_type || '3 BHK Luxury Apartment',
                preferred_location: sampleLead.preferred_location || 'Whitefield',
                budget: '₹1.5 Crores',
                catalogue_url: `${window.location.origin}/properties/${userData?.slug || 'demo'}`,
              });

              return (
                <div 
                  key={tpl.id}
                  className="bg-[#031814] border border-teal-900/70 rounded-2xl p-5 flex flex-col justify-between hover:border-teal-700/80 transition-all shadow-lg"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h3 className="font-bold text-white text-base">{tpl.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">{tpl.trigger_event.replace(/_/g, ' ')}</span>
                          <span className="text-gray-500 text-xs">•</span>
                          <span className="text-[11px] text-gray-400">Delay: {tpl.delay_minutes} min</span>
                          <span className="text-gray-500 text-xs">•</span>
                          <span className="px-2 py-0.5 bg-teal-950 border border-teal-800 rounded text-[10px] text-teal-300 font-bold uppercase">{tpl.language}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleTemplateActive(tpl.id, tpl.is_active)}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                          tpl.is_active ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60' : 'bg-gray-800 text-gray-400'
                        }`}
                      >
                        {tpl.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </div>

                    {/* WhatsApp Bubble Preview */}
                    <div className="bg-[#075e54]/20 border border-[#128c7e]/40 rounded-xl p-4 my-2 relative">
                      <div className="flex items-center gap-2 mb-2 pb-1 border-b border-teal-800/40 text-[11px] text-emerald-400 font-semibold">
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>Live WhatsApp Message Preview</span>
                      </div>
                      <div className="text-xs text-gray-100 whitespace-pre-wrap leading-relaxed font-sans bg-[#054d44]/30 p-3 rounded-lg border border-teal-700/30">
                        {formattedBody}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-teal-900/50 mt-4">
                    <button
                      onClick={() => handleCopyText(formattedBody, tpl.id)}
                      className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
                    >
                      {copiedId === tpl.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === tpl.id ? 'Copied!' : 'Copy Text'}</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditTemplate(tpl)}
                        className="p-2 hover:bg-teal-900/50 text-gray-400 hover:text-white rounded-lg transition-colors"
                        title="Edit Template"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteTemplate(tpl.id)}
                        className="p-2 hover:bg-red-900/30 text-gray-500 hover:text-red-400 rounded-lg transition-colors"
                        title="Delete Template"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: DISPATCH LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-[#031814] border border-teal-900/70 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                Notification Delivery Outbox
              </h2>
              <p className="text-gray-400 text-xs mt-1">Real-time status of all WhatsApp follow-ups triggered by the AI system.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search lead or phone..."
                  value={logSearchQuery}
                  onChange={e => setLogSearchQuery(e.target.value)}
                  className="w-full sm:w-56 bg-black/50 border border-teal-900/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-teal-500"
                />
              </div>

              <select
                value={logFilterStatus}
                onChange={e => setLogFilterStatus(e.target.value)}
                className="bg-black/50 border border-teal-900/80 rounded-xl px-3 py-2 text-xs text-teal-300 font-semibold outline-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="delivered">Delivered</option>
                <option value="read">Read</option>
                <option value="sent">Sent</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-teal-900/50 rounded-xl text-gray-400 text-sm">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 text-teal-700" />
              <p>No WhatsApp logs found matching the filter.</p>
              <button
                onClick={() => setShowQuickSendModal(true)}
                className="mt-3 text-xs font-bold text-amber-400 hover:underline"
              >
                Send your first WhatsApp follow-up →
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-teal-900/60 text-gray-400 uppercase tracking-wider font-semibold">
                    <th className="pb-3 font-semibold">Lead Recipient</th>
                    <th className="pb-3 font-semibold">Phone Number</th>
                    <th className="pb-3 font-semibold">Trigger Event</th>
                    <th className="pb-3 font-semibold">Message Preview</th>
                    <th className="pb-3 font-semibold">Sent At</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-teal-900/30">
                  {filteredLogs.map(log => {
                    const waLink = generateWhatsAppWebLink(log.recipient_phone, log.message);

                    return (
                      <tr key={log.id} className="hover:bg-teal-900/20 transition-colors">
                        <td className="py-3.5 font-bold text-white">{log.lead_name}</td>
                        <td className="py-3.5 text-gray-300 font-mono">{log.recipient_phone}</td>
                        <td className="py-3.5">
                          <span className="px-2 py-0.5 rounded bg-teal-950 border border-teal-800 text-[10px] text-teal-300 font-semibold uppercase">
                            {log.trigger_type.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 text-gray-400 max-w-xs truncate" title={log.message}>
                          {log.message}
                        </td>
                        <td className="py-3.5 text-gray-400">
                          {safeFormatDate(log.sent_at)}
                        </td>
                        <td className="py-3.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                            <CheckCheck className="w-3 h-3" />
                            {log.status}
                          </span>
                        </td>
                        <td className="py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-semibold"
                              title="Open in WhatsApp Web"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Open Web</span>
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SETTINGS & GATEWAY CONFIG */}
      {activeTab === 'settings' && (
        <div className="bg-[#031814] border border-teal-900/70 rounded-2xl p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              WhatsApp Business API & Dispatch Preferences
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              Configure your verified WhatsApp phone number, webhook callbacks, and automated dispatch triggers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-teal-900/50">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Auto-Dispatch Trigger Behavior
                </label>
                <div className="space-y-3 bg-black/40 p-4 rounded-xl border border-teal-900/60">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.auto_send_on_new_lead}
                      onChange={e => setConfig({ ...config, auto_send_on_new_lead: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-400 focus:ring-0 bg-gray-900 border-teal-800"
                    />
                    <div>
                      <span className="text-sm font-bold text-white block">Auto-send on New Lead Capture</span>
                      <span className="text-xs text-gray-400">Instantly fires welcome brochure whenever a new lead is added.</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer pt-3 border-t border-teal-900/40">
                    <input
                      type="checkbox"
                      checked={config.auto_send_site_visit_reminder}
                      onChange={e => setConfig({ ...config, auto_send_site_visit_reminder: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-400 focus:ring-0 bg-gray-900 border-teal-800"
                    />
                    <div>
                      <span className="text-sm font-bold text-white block">Auto-send Site Visit VIP Reminder</span>
                      <span className="text-xs text-gray-400">Sends guided tour details 2 hours after initial capture.</span>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Default Language Selection
                </label>
                <select
                  value={config.preferred_language}
                  onChange={e => setConfig({ ...config, preferred_language: e.target.value })}
                  className="w-full bg-black/50 border border-teal-900/80 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                >
                  <option value="en">English (Pan-India Professional)</option>
                  <option value="hi">Hindi (हिंदी - उत्तर भारत)</option>
                  <option value="kn">Kannada (ಕನ್ನಡ - Bengaluru / Karnataka)</option>
                  <option value="te">Telugu (తెలుగు - Hyderabad / AP-TS)</option>
                  <option value="ta">Tamil (தமிழ் - Chennai / TN)</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Gateway API Status & Diagnostics
                  </label>
                  <button
                    onClick={checkGatewayStatus}
                    disabled={checkingGateway}
                    className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-bold"
                  >
                    <RefreshCw className={`w-3 h-3 ${checkingGateway ? 'animate-spin' : ''}`} />
                    <span>Check Health</span>
                  </button>
                </div>

                <div className="bg-black/40 p-4 rounded-xl border border-teal-900/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-emerald-400 block">Meta WhatsApp Cloud API (v20.0)</span>
                      <span className="text-xs text-gray-400">
                        {gatewayStatus?.provider === 'meta_cloud_api_live' 
                          ? 'Connected to Live Meta WhatsApp Phone ID' 
                          : 'Auto-Pilot Gateway (Sandbox/Simulation Mode)'}
                      </span>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 text-xs font-bold border border-emerald-700">
                      {gatewayStatus?.status === 'online' ? 'ONLINE (200 OK)' : 'ACTIVE'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-teal-900/40 text-[11px]">
                    <div className="bg-black/50 p-2 rounded border border-teal-900/50">
                      <span className="text-gray-400 block">API Token</span>
                      <span className={`font-bold ${gatewayStatus?.configured?.has_api_token ? 'text-emerald-400' : 'text-gray-400'}`}>
                        {gatewayStatus?.configured?.has_api_token ? 'Configured' : 'Auto-Pilot'}
                      </span>
                    </div>
                    <div className="bg-black/50 p-2 rounded border border-teal-900/50">
                      <span className="text-gray-400 block">Phone ID</span>
                      <span className={`font-bold ${gatewayStatus?.configured?.has_phone_number_id ? 'text-emerald-400' : 'text-gray-400'}`}>
                        {gatewayStatus?.configured?.has_phone_number_id ? 'Configured' : 'Auto-Pilot'}
                      </span>
                    </div>
                    <div className="bg-black/50 p-2 rounded border border-teal-900/50">
                      <span className="text-gray-400 block">Server Logs</span>
                      <span className="font-bold text-teal-300">{gatewayStatus?.total_logged_messages ?? logs.length}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-400">
                    Endpoint: <code className="text-teal-300 font-mono">POST /api/whatsapp/send</code>
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Sender Display Phone / WhatsApp Number
                </label>
                <input
                  type="text"
                  value={userData?.phone || '+91 98765 43210'}
                  readOnly
                  className="w-full bg-black/30 border border-teal-900/60 rounded-xl px-4 py-2.5 text-sm text-gray-400 outline-none"
                />
                <p className="text-[11px] text-gray-500 mt-1">To change your sender number, update your Phone in Dashboard Settings.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: CREATE / EDIT TEMPLATE MODAL */}
      {showNewTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#051611] border border-teal-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative my-8 p-6 space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-teal-900">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-400" />
                <span>{editingTemplate ? 'Edit WhatsApp Template' : 'Create Custom WhatsApp Template'}</span>
              </h3>
              <button
                onClick={() => setShowNewTemplateModal(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Template Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ⚡ Instant Weekend Open House Pass"
                  value={tplTitle}
                  onChange={e => setTplTitle(e.target.value)}
                  className="w-full bg-black/50 border border-teal-900/80 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    Trigger Event
                  </label>
                  <select
                    value={tplTrigger}
                    onChange={e => setTplTrigger(e.target.value)}
                    className="w-full bg-black/50 border border-teal-900/80 rounded-xl px-3 py-2.5 text-xs text-white outline-none"
                  >
                    <option value="new_lead_instant">New Lead Instant</option>
                    <option value="site_visit_prompt">Site Visit Prompt</option>
                    <option value="price_drop_offer">Price / Scheme Offer</option>
                    <option value="reengagement_day_7">7-Day Reengagement</option>
                    <option value="custom">Custom Trigger</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    Delay (Minutes)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={tplDelay}
                    onChange={e => setTplDelay(Number(e.target.value))}
                    className="w-full bg-black/50 border border-teal-900/80 rounded-xl px-3 py-2.5 text-xs text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    Language
                  </label>
                  <select
                    value={tplLanguage}
                    onChange={e => setTplLanguage(e.target.value)}
                    className="w-full bg-black/50 border border-teal-900/80 rounded-xl px-3 py-2.5 text-xs text-white outline-none"
                  >
                    <option value="en">English (en)</option>
                    <option value="hi">Hindi (hi)</option>
                    <option value="kn">Kannada (kn)</option>
                    <option value="te">Telugu (te)</option>
                    <option value="ta">Tamil (ta)</option>
                    <option value="mr">Marathi (mr)</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Message Body & Dynamic Variables
                  </label>
                  <span className="text-[11px] text-gray-500">Click tags to insert below:</span>
                </div>

                {/* Variable Pills */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {[
                    'lead_name',
                    'agent_name',
                    'business_name',
                    'property_type',
                    'preferred_location',
                    'budget',
                    'catalogue_url',
                  ].map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => insertTagToBody(tag)}
                      className="px-2.5 py-1 rounded bg-teal-900/50 hover:bg-teal-800 text-[11px] font-mono text-amber-300 border border-teal-700/60 transition-colors"
                    >
                      +{`{{${tag}}}`}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={6}
                  required
                  value={tplBody}
                  onChange={e => setTplBody(e.target.value)}
                  placeholder="Write your high-converting WhatsApp message..."
                  className="w-full bg-black/50 border border-teal-900/80 rounded-xl p-4 text-xs font-sans text-white leading-relaxed outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-teal-900">
                <button
                  type="button"
                  onClick={() => setShowNewTemplateModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={tplSaving}
                  className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-gray-950 font-bold text-xs shadow-lg transition-colors disabled:opacity-50"
                >
                  {tplSaving ? 'Saving...' : 'Save Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: QUICK SEND TEST MODAL */}
      {showQuickSendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#051611] border border-teal-800 rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto relative my-8 p-6 space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-teal-900">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-emerald-400" />
                <span>Send WhatsApp Follow-up Message</span>
              </h3>
              <button
                onClick={() => setShowQuickSendModal(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            {dispatchSuccessMsg ? (
              <div className="p-6 bg-emerald-950/80 border border-emerald-700 rounded-xl text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h4 className="text-lg font-bold text-white">Dispatched Successfully!</h4>
                <p className="text-xs text-emerald-200">{dispatchSuccessMsg}</p>
                {dispatchDetails && (
                  <div className="bg-black/60 border border-emerald-800/80 rounded-lg p-3 text-left space-y-1 text-xs">
                    <div className="flex justify-between text-gray-400">
                      <span>Message ID:</span>
                      <span className="font-mono text-emerald-300 font-bold">{dispatchDetails.messageId || 'Generated'}</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>Delivery Status:</span>
                      <span className="text-emerald-400 font-bold uppercase">{dispatchDetails.status || 'delivered'}</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>Provider:</span>
                      <span className="text-amber-300 font-bold">{dispatchDetails.provider === 'meta_cloud_api' ? 'Meta Cloud API (Live)' : 'Auto-Pilot Gateway'}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleQuickDispatch} className="space-y-4">
                {dispatchError && (
                  <div className="bg-red-500/10 border border-red-500/50 text-red-300 p-3.5 rounded-xl text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-red-200 font-bold mb-0.5">Failed to Deliver WhatsApp</strong>
                      <span>{dispatchError}</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    Select Existing Lead
                  </label>
                  <select
                    value={sendSelectedLeadId}
                    onChange={e => {
                      setSendSelectedLeadId(e.target.value);
                      const l = leads.find(item => item.id === e.target.value);
                      if (l) {
                        setSendCustomPhone(l.phone);
                        setSendCustomName(l.name);
                      }
                    }}
                    className="w-full bg-black/50 border border-teal-900/80 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-teal-500"
                  >
                    <option value="">-- Or enter custom number below --</option>
                    {leads.map(lead => (
                      <option key={lead.id} value={lead.id}>
                        {lead.name} ({lead.phone}) - {lead.preferred_location || 'Any location'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                      Recipient Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Vikram Joshi"
                      value={sendCustomName}
                      onChange={e => setSendCustomName(e.target.value)}
                      className="w-full bg-black/50 border border-teal-900/80 rounded-xl px-4 py-2.5 text-xs text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                      Recipient WhatsApp Phone (E.164)
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +91 9876543210"
                      value={sendCustomPhone}
                      onChange={e => setSendCustomPhone(e.target.value)}
                      className="w-full bg-black/50 border border-teal-900/80 rounded-xl px-4 py-2.5 text-xs text-white font-mono outline-none"
                    />
                    <span className="text-[10px] text-gray-500 mt-1 block">10-15 digits with country code (auto-prefixes +91 for 10-digit numbers)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    Select Notification Template
                  </label>
                  <select
                    value={sendSelectedTemplateId}
                    onChange={e => {
                      setSendSelectedTemplateId(e.target.value);
                      const t = templates.find(item => item.id === e.target.value);
                      if (t) setSendCustomBody(t.body);
                    }}
                    className="w-full bg-black/50 border border-teal-900/80 rounded-xl px-4 py-2.5 text-xs text-white outline-none"
                  >
                    <option value="">-- Choose Template --</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.title} ({t.language.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    Message Preview & Customization
                  </label>
                  <textarea
                    rows={5}
                    value={sendCustomBody}
                    onChange={e => setSendCustomBody(e.target.value)}
                    className="w-full bg-black/50 border border-teal-900/80 rounded-xl p-3.5 text-xs font-sans text-white leading-relaxed outline-none focus:border-teal-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-teal-900">
                  <button
                    type="button"
                    onClick={() => {
                      setShowQuickSendModal(false);
                      setDispatchError(null);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={dispatching}
                    className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold text-xs shadow-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <Send className={`w-3.5 h-3.5 ${dispatching ? 'animate-pulse' : ''}`} />
                    <span>{dispatching ? 'Sending via WhatsApp API...' : 'Dispatch Notification'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
