import React, { useState, useEffect } from 'react';
import { useOutletContext, Link, useNavigate } from 'react-router-dom';
import { db, auth } from '../../lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import {
  Users,
  Building,
  Calendar,
  DollarSign,
  Activity as ActivityIcon,
  Check,
  Plus,
  Phone,
  Sparkles,
  Globe,
  ArrowRight,
  Clock,
  AlertCircle,
  Zap,
} from 'lucide-react';
import { Lead, Task, Visit, Deal, Activity } from '../../types';
import { safeFormatDate } from '../../utils';
import { handleFirestoreError, OperationType } from '../../utils/firestoreErrorHandler';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Skeleton, SkeletonCard } from './ui/Skeleton';
import { EmptyState } from './ui/EmptyState';

export const DashboardHome: React.FC = () => {
  const { user, userData, planStatus, openTopUpModal } = useOutletContext<any>();
  const navigate = useNavigate();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const leadsUsed = planStatus?.usage?.leads ?? 0;
  const leadsLimit = planStatus?.limits?.leadsPerMonth ?? 0;
  const isLeadLimitExceeded = leadsLimit > 0 && leadsUsed >= leadsLimit;

  const voiceUsed = planStatus?.usage?.voiceMinutes ?? 0;
  const voiceLimit = planStatus?.limits?.voiceMinutesPerMonth ?? 0;
  const voiceRemaining = planStatus?.remaining?.voiceMinutes ?? 0;
  const voiceTopUp = planStatus?.remaining?.voiceTopUp ?? 0;

  const planName = planStatus?.plan?.name || (planStatus?.status === 'active' ? 'Active Plan' : 'Free / No Plan');
  const renewalDate = planStatus?.current_period_end
    ? new Date(planStatus.current_period_end).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'No active renewal';

  useEffect(() => {
    if (!user?.uid || !auth.currentUser) {
      setLoading(false);
      return;
    }
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user?.uid || !auth.currentUser) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const uid = auth.currentUser.uid;

      const [leadsSnap, tasksSnap, visitsSnap, dealsSnap, actSnap] = await Promise.all([
        getDocs(query(collection(db, 'leads'), where('agent_id', '==', uid))).catch((err) => {
          handleFirestoreError(err, OperationType.LIST, 'leads');
          return { docs: [] };
        }),
        getDocs(query(collection(db, 'tasks'), where('agent_id', '==', uid))).catch((err) => {
          handleFirestoreError(err, OperationType.LIST, 'tasks');
          return { docs: [] };
        }),
        getDocs(query(collection(db, 'visits'), where('agent_id', '==', uid))).catch((err) => {
          handleFirestoreError(err, OperationType.LIST, 'visits');
          return { docs: [] };
        }),
        getDocs(query(collection(db, 'deals'), where('agent_id', '==', uid))).catch((err) => {
          handleFirestoreError(err, OperationType.LIST, 'deals');
          return { docs: [] };
        }),
        getDocs(query(collection(db, 'activities'), where('agent_id', '==', uid))).catch((err) => {
          handleFirestoreError(err, OperationType.LIST, 'activities');
          return { docs: [] };
        }),
      ]);

      const leadsList = leadsSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Lead);
      const tasksList = (tasksSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Task)).sort(
        (a, b) => (Number(a.due_date) || 0) - (Number(b.due_date) || 0)
      );
      const visitsList = visitsSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Visit);
      const dealsList = dealsSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Deal);
      const actList = (actSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Activity)).sort(
        (a, b) => (Number(b.created_at) || 0) - (Number(a.created_at) || 0)
      );

      setLeads(leadsList);
      setTasks(tasksList);
      setVisits(visitsList);
      setDeals(dealsList);
      setActivities(actList);
    } catch (err) {
      console.error('Error fetching dashboard summary:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (task: Task) => {
    try {
      const newStatus = task.status === 'pending' ? 'done' : 'pending';
      await updateDoc(doc(db, 'tasks', task.id), { status: newStatus });
      setTasks(tasks.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton variant="text" width="240px" height={32} />
          <Skeleton variant="rectangular" width="140px" height={36} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} lines={2} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <SkeletonCard lines={4} />
            <SkeletonCard lines={4} />
          </div>
          <SkeletonCard lines={6} />
        </div>
      </div>
    );
  }

  const now = Date.now();
  const startOfDay = new Date().setHours(0, 0, 0, 0);
  const endOfDay = new Date().setHours(23, 59, 59, 999);
  const threeDaysAgo = now - 3 * 24 * 60 * 60 * 1000;
  const endOfWeek = now + 7 * 24 * 60 * 60 * 1000;

  // KPIs
  const activeLeads = leads.filter((l) => l.stage !== 'Lost' && l.stage !== 'Won');
  const followUpsToday = tasks.filter(
    (t) => t.status === 'pending' && t.due_date >= startOfDay && t.due_date <= endOfDay
  ).length;
  const visitsThisWeek = visits.filter(
    (v) => v.requested_time >= startOfDay && v.requested_time <= endOfWeek && v.status === 'confirmed'
  ).length;
  const negotiationDeals = deals.filter((d) => d.stage === 'Negotiation').length;

  // Widgets
  const todaysTasks = tasks.filter((t) => t.status === 'pending' && t.due_date <= endOfDay);
  const needsAttention = activeLeads.filter(
    (l) => (l.last_contacted_at || l.created_at) < threeDaysAgo
  );
  const recentActivities = activities.slice(0, 10);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-2">
        <div>
          <p className="text-xs font-crm-mono uppercase tracking-wider text-[#A1A1AA] mb-1">
            {new Intl.DateTimeFormat('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            }).format(new Date())}
          </p>
          <h2 className="font-crm-serif text-2xl sm:text-3xl font-bold text-[#F4F4F5] tracking-tight">
            Welcome back, {userData?.name || user.displayName || 'Agent'}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4 stroke-[2.5]" />}
            onClick={() => navigate('/dashboard/leads?new=true')}
          >
            Add Lead
          </Button>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Building className="w-4 h-4" />}
            onClick={() => navigate('/dashboard/properties?new=true')}
          >
            Add Property
          </Button>
        </div>
      </div>

      {/* Amber Warning Banner if Lead Limit Exceeded */}
      {isLeadLimitExceeded && (
        <div className="rounded-[12px] bg-amber-950/40 border border-amber-500/50 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-200 shadow-lg">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <p className="text-xs sm:text-sm font-medium">
              <strong className="text-amber-300 font-semibold">Lead limit reached for this month.</strong> New leads will be saved, but WhatsApp automation and AI scoring are paused.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/dashboard/pricing')}
            className="shrink-0 text-xs"
          >
            Upgrade Plan
          </Button>
        </div>
      )}

      {/* Usage Card */}
      <Card padded className="border-[rgba(255,255,255,0.08)] bg-[#141414]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Plan Info */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-crm-mono uppercase tracking-wider text-[#D4AF37]">
                Current Quota
              </span>
              <Badge variant={planStatus?.status === 'active' ? 'gold' : 'neutral'} size="sm">
                {planName}
              </Badge>
            </div>
            <h3 className="text-base font-semibold text-white">
              Billing Cycle Usage & Balances
            </h3>
            <p className="text-xs text-gray-400 font-crm-mono">
              Renews on {renewalDate}
            </p>
          </div>

          {/* Progress Bars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 max-w-2xl">
            {/* Leads Bar */}
            <div className="space-y-1.5 bg-[#1A1A1A] p-3 rounded-lg border border-[rgba(255,255,255,0.04)]">
              <div className="flex justify-between text-xs">
                <span className="text-gray-300 font-medium">CRM Leads</span>
                <span className="font-crm-mono text-gray-400">
                  {leadsUsed} / {leadsLimit}
                </span>
              </div>
              <div className="w-full h-2 bg-[#202020] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isLeadLimitExceeded ? 'bg-amber-400' : 'bg-[#D4AF37]'
                  }`}
                  style={{
                    width: `${leadsLimit > 0 ? Math.min(100, Math.round((leadsUsed / leadsLimit) * 100)) : 0}%`,
                  }}
                />
              </div>
              <div className="text-[10px] text-gray-500 flex justify-between">
                <span>{Math.max(0, leadsLimit - leadsUsed)} leads remaining</span>
                {isLeadLimitExceeded && <span className="text-amber-400 font-medium">Automation Paused</span>}
              </div>
            </div>

            {/* Voice Minutes Bar */}
            <div className="space-y-1.5 bg-[#1A1A1A] p-3 rounded-lg border border-[rgba(255,255,255,0.04)]">
              <div className="flex justify-between text-xs">
                <span className="text-gray-300 font-medium">AI Voice Minutes</span>
                <span className="font-crm-mono text-gray-400">
                  {voiceRemaining}m left
                </span>
              </div>
              <div className="w-full h-2 bg-[#202020] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#D4AF37] to-amber-200 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      voiceLimit > 0
                        ? Math.min(100, Math.round((voiceUsed / voiceLimit) * 100))
                        : 0
                    }%`,
                  }}
                />
              </div>
              <div className="text-[10px] text-gray-500 flex justify-between">
                <span>Used: {voiceUsed}m</span>
                <span>Top-up balance: {voiceTopUp}m</span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Zap className="w-3.5 h-3.5 text-[#D4AF37]" />}
              onClick={() => {
                if (openTopUpModal) openTopUpModal();
                else navigate('/dashboard/pricing');
              }}
            >
              Top-up Voice
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/dashboard/pricing')}
            >
              Upgrade Plan
            </Button>
          </div>
        </div>
      </Card>

      {/* AI Voice & Creative Suite Banner */}
      <div className="relative overflow-hidden rounded-[12px] bg-gradient-to-r from-[#141414] via-[#1A1A1A] to-[#141414] border border-[rgba(212,175,55,0.3)] p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-11 h-11 rounded-[10px] bg-[rgba(212,175,55,0.12)] border border-[rgba(212,175,55,0.3)] flex items-center justify-center text-[#D4AF37] shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-crm-mono uppercase tracking-wider text-[#D4AF37]">
                Samruddhi AI Studio
              </span>
              <Badge variant="gold" size="sm">
                Regional Engine
              </Badge>
            </div>
            <h3 className="text-base font-semibold text-[#F4F4F5] mt-0.5">
              Multilingual Voice Agent & Social Property Ads
            </h3>
            <p className="text-xs text-[#A1A1AA]">
              Kannada, Hindi, Telugu, Tamil, Marathi neural synthesis & automated marketing creatives.
            </p>
          </div>
        </div>
        <Link
          to="/dashboard/ai-studio"
          className="relative z-10 px-4 py-2 bg-[#D4AF37] hover:bg-[#E5C358] text-[#0A0A0A] font-semibold text-xs rounded-[8px] transition flex items-center gap-2 shrink-0 shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Launch Studio</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padded={false} className="p-5 relative overflow-hidden">
          <div className="absolute top-4 right-4 text-[#71717A]/20">
            <Users className="w-10 h-10" />
          </div>
          <p className="text-xs font-medium text-[#A1A1AA] uppercase tracking-wider mb-1">
            Active Leads
          </p>
          <p className="font-crm-serif text-3xl font-bold text-[#F4F4F5] tracking-tight">
            {activeLeads.length}
          </p>
        </Card>

        <Card padded={false} className="p-5 relative overflow-hidden">
          <div className="absolute top-4 right-4 text-[#D4AF37]/20">
            <Calendar className="w-10 h-10" />
          </div>
          <p className="text-xs font-medium text-[#A1A1AA] uppercase tracking-wider mb-1">
            Follow-ups Today
          </p>
          <p className="font-crm-serif text-3xl font-bold text-[#D4AF37] tracking-tight">
            {followUpsToday}
          </p>
        </Card>

        <Card padded={false} className="p-5 relative overflow-hidden">
          <div className="absolute top-4 right-4 text-[#60A5FA]/20">
            <Building className="w-10 h-10" />
          </div>
          <p className="text-xs font-medium text-[#A1A1AA] uppercase tracking-wider mb-1">
            Visits This Week
          </p>
          <p className="font-crm-serif text-3xl font-bold text-[#F4F4F5] tracking-tight">
            {visitsThisWeek}
          </p>
        </Card>

        <Card padded={false} className="p-5 relative overflow-hidden">
          <div className="absolute top-4 right-4 text-[#4ADE80]/20">
            <DollarSign className="w-10 h-10" />
          </div>
          <p className="text-xs font-medium text-[#A1A1AA] uppercase tracking-wider mb-1">
            Negotiations
          </p>
          <p className="font-crm-serif text-3xl font-bold text-[#4ADE80] tracking-tight">
            {negotiationDeals}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Tasks & Needs Attention */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Tasks */}
          <Card>
            <CardHeader className="mb-3">
              <div className="flex items-center gap-2">
                <Check className="text-[#D4AF37] w-4 h-4" />
                <CardTitle>Today's Tasks</CardTitle>
              </div>
              <Link
                to="/dashboard/tasks"
                className="text-xs font-medium text-[#D4AF37] hover:underline"
              >
                View All
              </Link>
            </CardHeader>
            {todaysTasks.length === 0 ? (
              <p className="text-xs text-[#71717A] italic py-2">
                You're all caught up for today!
              </p>
            ) : (
              <div className="space-y-2">
                {todaysTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex gap-3 items-center bg-[#1A1A1A] p-3 rounded-[8px] border border-[rgba(255,255,255,0.06)]"
                  >
                    <button
                      onClick={() => handleToggleTask(task)}
                      className="shrink-0 focus-gold rounded-[4px]"
                    >
                      <div className="w-4 h-4 rounded-[4px] border border-[rgba(255,255,255,0.2)] hover:border-[#D4AF37] flex items-center justify-center transition-colors" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[#F4F4F5] truncate">{task.title}</p>
                    </div>
                    {task.lead_id && (
                      <button
                        onClick={() => navigate(`/dashboard/leads/${task.lead_id}`)}
                        className="shrink-0 text-[11px] font-medium text-[#D4AF37] bg-[rgba(212,175,55,0.12)] px-2.5 py-1 rounded-[6px] hover:bg-[rgba(212,175,55,0.2)] transition-colors"
                      >
                        View Lead
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Needs Attention */}
          <Card>
            <CardHeader className="mb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="text-[#F87171] w-4 h-4" />
                <CardTitle className="text-[#F87171]">Needs Attention (Cold Leads)</CardTitle>
              </div>
            </CardHeader>
            {needsAttention.length === 0 ? (
              <p className="text-xs text-[#71717A] italic py-2">
                All active leads have been contacted recently.
              </p>
            ) : (
              <div className="grid gap-2.5">
                {needsAttention.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex justify-between items-center bg-[#1A1A1A] p-3 rounded-[8px] border border-[rgba(255,255,255,0.06)]"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#F4F4F5] truncate">{lead.name}</p>
                      <p className="text-[11px] font-crm-mono text-[#71717A]">
                        Last contact: {safeFormatDate(lead.last_contacted_at || lead.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <a
                        href={`tel:${lead.phone}`}
                        className="w-7 h-7 rounded-[6px] bg-[#202020] flex items-center justify-center text-[#A1A1AA] hover:text-[#4ADE80] transition-colors"
                        aria-label={`Call ${lead.name}`}
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(`/dashboard/leads/${lead.id}`)}
                      >
                        Open
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Recent Activity */}
        <Card className="flex flex-col h-[520px]">
          <CardHeader className="mb-4">
            <div className="flex items-center gap-2">
              <ActivityIcon className="text-[#D4AF37] w-4 h-4" />
              <CardTitle>Recent Activity</CardTitle>
            </div>
          </CardHeader>
          {recentActivities.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-xs text-[#71717A] italic">No activity recorded recently.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 border-l border-[rgba(255,255,255,0.06)] ml-2 pl-4">
              {recentActivities.map((act) => {
                const lead = leads.find((l) => l.id === act.lead_id);
                return (
                  <div
                    key={act.id}
                    className="relative cursor-pointer group"
                    onClick={() => navigate(`/dashboard/leads/${act.lead_id}`)}
                  >
                    <div className="flex justify-between items-baseline mb-0.5">
                      <span className="font-semibold text-xs text-[#F4F4F5] group-hover:text-[#D4AF37] transition-colors truncate">
                        {lead?.name || 'Lead Activity'}
                      </span>
                      <span className="text-[10px] font-crm-mono text-[#71717A] shrink-0 ml-2">
                        {safeFormatDate(act.created_at, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-[#A1A1AA] line-clamp-1">{act.content}</p>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
