import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { auth, db } from '../../lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  Home,
  Users,
  Trello,
  Building,
  Calendar,
  CheckSquare,
  DollarSign,
  BarChart2,
  Settings,
  LogOut,
  Plus,
  Search,
  Bell,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  MessageSquare,
  Sparkles,
  ExternalLink,
  MoreHorizontal,
  Globe,
} from 'lucide-react';

import { useAgentCollection } from '../../hooks/useAgentCollection';
import { Lead, Task, Visit, Property } from '../../types';
import { ToastProvider } from './ui/Toast';
import { Avatar } from './ui/Avatar';
import { Dropdown } from './ui/Dropdown';
import { Tooltip } from './ui/Tooltip';
import { KeyboardHint } from './ui/KeyboardHint';
import { Skeleton } from './ui/Skeleton';
import { CommandPalette } from './CommandPalette';
import { ShortcutsHelpModal } from './ShortcutsHelpModal';
import { Drawer } from './ui/Drawer';
import { VoiceTopUpModal } from './VoiceTopUpModal';
import { apiFetch } from '../../lib/api';

const SIDEBAR_COLLAPSED_KEY = 'samruddhi_sidebar_collapsed';

export const DashboardLayout: React.FC = () => {
  return (
    <ToastProvider>
      <DashboardInnerLayout />
    </ToastProvider>
  );
};

const DashboardInnerLayout: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    return sessionStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
  });
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();

  // Save sidebar collapsed choice for current session
  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      sessionStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      return next;
    });
  };

  // Strict Firebase Auth Session Check with Demo / Email OTP fallback
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const docRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          } else {
            // If first-time user profile doc doesn't exist yet, bootstrap safely
            const baseData = {
              name: currentUser.displayName || 'Agent',
              email: currentUser.email || '',
              businessName: 'Samruddhi Realty',
              slug: `agent-${currentUser.uid.slice(0, 8)}`,
              createdAt: Date.now(),
            };
            setUserData(baseData);
          }
        } catch (err) {
          console.warn('User profile fetch notice:', err);
        } finally {
          setLoading(false);
        }
        return;
      }

      // Check if user authenticated via Email OTP or Quick Demo Agent
      const storedDemo = localStorage.getItem('demoUser') || sessionStorage.getItem('demoUser');
      const otpVerified = localStorage.getItem('otpVerified') === 'true' || sessionStorage.getItem('otpVerified') === 'true';

      if (storedDemo && otpVerified) {
        try {
          const parsed = JSON.parse(storedDemo);
          setUser(parsed);
          setUserData({
            name: parsed.displayName || 'Demo Real Estate Partner',
            email: parsed.email || 'partner@samruddhi.ai',
            businessName: parsed.businessName || 'Samruddhi Realty Bangalore',
            slug: 'demo-partner',
            createdAt: Date.now(),
          });
          setLoading(false);
          return;
        } catch (e) {
          // Invalid stored demo json
        }
      }

      // Clean up stale or unauthenticated records
      localStorage.removeItem('demoUser');
      sessionStorage.removeItem('demoUser');
      localStorage.removeItem('otpVerified');
      sessionStorage.removeItem('otpVerified');
      localStorage.removeItem('authToken');
      sessionStorage.removeItem('authToken');
      setUser(null);
      setUserData(null);
      setLoading(false);
      navigate('/', { replace: true });
    });

    return () => unsubscribe();
  }, [navigate]);

  // Live real-time collections for live badges and command palette
  const isAuthReady = !!user;
  const { data: leads } = useAgentCollection<Lead>('leads', { skip: !isAuthReady });
  const { data: tasks } = useAgentCollection<Task>('tasks', { skip: !isAuthReady });
  const { data: visits } = useAgentCollection<Visit>('visits', { skip: !isAuthReady });
  const { data: properties } = useAgentCollection<Property>('properties', { skip: !isAuthReady });

  // Plan & Usage Status for usage pill and enforcement
  const [planStatus, setPlanStatus] = useState<any>(null);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);

  const fetchPlanStatus = useCallback(async () => {
    try {
      const res = await apiFetch('/api/billing/status');
      setPlanStatus(res);
    } catch (e) {
      console.warn('Could not retrieve plan status:', e);
    }
  }, []);

  useEffect(() => {
    if (user?.uid) {
      fetchPlanStatus();
    }
  }, [user, fetchPlanStatus]);

  const usagePill = useMemo(() => {
    if (!planStatus) return null;
    const leadsUsed = planStatus.usage?.leads ?? 0;
    const leadsLimit = planStatus.limits?.leadsPerMonth ?? 0;
    const voiceLeft = planStatus.remaining?.voiceMinutes ?? 0;

    const isWarning = leadsLimit > 0 && (leadsUsed >= leadsLimit || voiceLeft <= 10);
    const text =
      leadsLimit > 0
        ? `${leadsUsed}/${leadsLimit} leads • ${voiceLeft}m voice`
        : 'No Plan';

    return { text, isWarning, leadsUsed, leadsLimit, voiceLeft };
  }, [planStatus]);

  // Calculate live badge counts
  const badgeCounts = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayStartTime = todayStart.getTime();

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const todayEndTime = todayEnd.getTime();

    // New leads today
    const newLeadsToday = leads.filter(
      (l) => l.created_at >= todayStartTime || l.stage === 'New'
    ).length;

    // Overdue tasks
    const now = Date.now();
    const overdueTasks = tasks.filter(
      (t) => t.status === 'pending' && t.due_date < now
    ).length;

    // Today's visits
    const todayVisits = visits.filter(
      (v) =>
        v.status !== 'declined' &&
        v.requested_time >= todayStartTime &&
        v.requested_time <= todayEndTime
    ).length;

    return {
      newLeads: newLeadsToday,
      overdueTasks,
      todayVisits,
    };
  }, [leads, tasks, visits]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    let gPressedTimeout: ReturnType<typeof setTimeout> | null = null;
    let isGPressed = false;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if currently typing inside an input/textarea/contenteditable
      const activeEl = document.activeElement;
      const isInput =
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.tagName === 'SELECT' ||
          activeEl.getAttribute('contenteditable') === 'true');

      // Command Palette (⌘K or Ctrl+K) works anywhere
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsPaletteOpen((prev) => !prev);
        return;
      }

      // Esc closes all modals
      if (e.key === 'Escape') {
        setIsPaletteOpen(false);
        setIsShortcutsOpen(false);
        setIsNotificationsOpen(false);
        setIsMobileMoreOpen(false);
        return;
      }

      if (isInput) return;

      // '?' opens shortcuts modal
      if (e.key === '?' && !e.shiftKey) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
        return;
      }

      // '/' focuses search
      if (e.key === '/') {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>(
          'input[type="search"], input[placeholder*="Search"], input[placeholder*="search"]'
        );
        if (searchInput) {
          searchInput.focus();
        } else {
          setIsPaletteOpen(true);
        }
        return;
      }

      // Quick action shortcuts
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        navigate('/dashboard/leads?new=true');
        return;
      }
      if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        navigate('/dashboard/tasks?new=true');
        return;
      }

      // 'G' navigation sequence
      if (e.key.toLowerCase() === 'g') {
        isGPressed = true;
        if (gPressedTimeout) clearTimeout(gPressedTimeout);
        gPressedTimeout = setTimeout(() => {
          isGPressed = false;
        }, 1200);
        return;
      }

      if (isGPressed) {
        const key = e.key.toLowerCase();
        isGPressed = false;
        if (gPressedTimeout) clearTimeout(gPressedTimeout);

        if (key === 'h') navigate('/dashboard');
        else if (key === 'l') navigate('/dashboard/leads');
        else if (key === 'p') navigate('/dashboard/pipeline');
        else if (key === 'v') navigate('/dashboard/visits');
        else if (key === 't') navigate('/dashboard/tasks');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (gPressedTimeout) clearTimeout(gPressedTimeout);
    };
  }, [navigate]);

  const handleSignOut = async () => {
    localStorage.removeItem('otpVerified');
    sessionStorage.removeItem('otpVerified');
    localStorage.removeItem('demoUser');
    sessionStorage.removeItem('demoUser');
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
    try {
      await signOut(auth);
    } catch (e) {}
    navigate('/');
  };

  // Nav item definitions
  const primaryNavItems = [
    { name: 'Home', path: '/dashboard', icon: Home, exact: true },
    {
      name: 'Leads',
      path: '/dashboard/leads',
      icon: Users,
      exact: false,
      badge: badgeCounts.newLeads > 0 ? `${badgeCounts.newLeads}` : undefined,
      badgeVariant: 'gold',
    },
    { name: 'Pipeline', path: '/dashboard/pipeline', icon: Trello, exact: false },
    {
      name: 'Visits',
      path: '/dashboard/visits',
      icon: Calendar,
      exact: false,
      badge: badgeCounts.todayVisits > 0 ? `${badgeCounts.todayVisits}` : undefined,
      badgeVariant: 'info',
    },
    {
      name: 'Tasks',
      path: '/dashboard/tasks',
      icon: CheckSquare,
      exact: false,
      badge: badgeCounts.overdueTasks > 0 ? `${badgeCounts.overdueTasks}` : undefined,
      badgeVariant: 'danger',
    },
    { name: 'Properties', path: '/dashboard/properties', icon: Building, exact: false },
    { name: 'WhatsApp', path: '/dashboard/whatsapp', icon: MessageSquare, exact: false },
    { name: 'Finance', path: '/dashboard/finance', icon: DollarSign, exact: false },
    { name: 'Reports', path: '/dashboard/reports', icon: BarChart2, exact: false },
  ];

  const bottomNavItems = [
    { name: 'Pricing', path: '/dashboard/pricing', icon: Sparkles, exact: false },
    { name: 'Settings', path: '/dashboard/settings', icon: Settings, exact: false },
  ];

  // Resolve current page title
  const pageTitle = useMemo(() => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Overview';
    if (path.startsWith('/dashboard/leads')) return 'Leads Directory';
    if (path.startsWith('/dashboard/pipeline')) return 'Deal Pipeline';
    if (path.startsWith('/dashboard/visits')) return 'Site Visits';
    if (path.startsWith('/dashboard/tasks')) return 'Tasks & Reminders';
    if (path.startsWith('/dashboard/properties')) return 'Properties & Inventory';
    if (path.startsWith('/dashboard/whatsapp')) return 'WhatsApp Automation';
    if (path.startsWith('/dashboard/finance')) return 'Finance & ROI';
    if (path.startsWith('/dashboard/reports')) return 'Analytics & Reports';
    if (path.startsWith('/dashboard/settings')) return 'Settings & Brand';
    if (path.startsWith('/dashboard/pricing')) return 'Pricing & Subscription';
    if (path.startsWith('/dashboard/ai-studio')) return 'Voice & AI Studio';
    return 'Dashboard';
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton variant="circular" width={40} height={40} />
            <div className="space-y-1.5 flex-1">
              <Skeleton variant="text" width="60%" height={16} />
              <Skeleton variant="text" width="40%" height={12} />
            </div>
          </div>
          <Skeleton variant="rectangular" height={160} />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F4F4F5] flex overflow-hidden font-crm-sans antialiased">
      {/* ----------------- DESKTOP SIDEBAR (240px or 64px) ----------------- */}
      <aside
        className={`hidden md:flex flex-col border-r border-[rgba(255,255,255,0.06)] bg-[#111111] transition-all duration-200 z-30 select-none ${
          sidebarCollapsed ? 'w-16' : 'w-60'
        }`}
      >
        {/* Brand Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] shrink-0">
          <Link
            to="/dashboard"
            className="flex items-center gap-2.5 overflow-hidden text-left"
          >
            <div className="w-7 h-7 rounded-[8px] bg-[rgba(212,175,55,0.15)] border border-[rgba(212,175,55,0.3)] flex items-center justify-center text-[#D4AF37] font-bold text-sm shrink-0">
              S
            </div>
            {!sidebarCollapsed && (
              <span className="font-crm-serif font-bold text-base text-[#F4F4F5] tracking-tight truncate">
                Samruddhi <span className="text-[#D4AF37]">AI</span>
              </span>
            )}
          </Link>
          <button
            onClick={toggleSidebar}
            className="p-1 rounded-[6px] text-[#71717A] hover:text-[#F4F4F5] hover:bg-[#1A1A1A] transition-colors focus-gold"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto no-scrollbar">
          {primaryNavItems.map((item) => {
            const isActive = item.exact
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path);

            const badgeBg = {
              gold: 'bg-[rgba(212,175,55,0.15)] text-[#D4AF37] border-[rgba(212,175,55,0.25)]',
              danger: 'bg-[rgba(248,113,113,0.15)] text-[#F87171] border-[rgba(248,113,113,0.25)]',
              info: 'bg-[rgba(96,165,250,0.15)] text-[#60A5FA] border-[rgba(96,165,250,0.25)]',
            }[item.badgeVariant || 'gold'];

            const linkContent = (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center ${
                  sidebarCollapsed ? 'justify-center px-0' : 'justify-between px-3'
                } py-2 rounded-[8px] text-xs font-medium transition-all group focus-gold ${
                  isActive
                    ? 'bg-[#1A1A1A] text-[#D4AF37] border border-[rgba(212,175,55,0.25)]'
                    : 'text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#161616]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <item.icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-[#D4AF37]' : 'text-[#71717A] group-hover:text-[#F4F4F5]'
                    }`}
                  />
                  {!sidebarCollapsed && <span className="truncate">{item.name}</span>}
                </div>

                {!sidebarCollapsed && item.badge && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full font-crm-mono text-[10px] border ${badgeBg}`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );

            if (sidebarCollapsed) {
              return (
                <Tooltip key={item.name} content={item.name} position="right">
                  {linkContent}
                </Tooltip>
              );
            }
            return linkContent;
          })}
        </nav>

        {/* Bottom Section: Settings & User Profile Menu */}
        <div className="p-2 border-t border-[rgba(255,255,255,0.06)] space-y-1 shrink-0">
          {bottomNavItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const linkContent = (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center ${
                  sidebarCollapsed ? 'justify-center px-0' : 'px-3'
                } py-2 rounded-[8px] text-xs font-medium transition-colors focus-gold ${
                  isActive
                    ? 'bg-[#1A1A1A] text-[#D4AF37]'
                    : 'text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#161616]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4 text-[#71717A]" />
                  {!sidebarCollapsed && <span>{item.name}</span>}
                </div>
              </Link>
            );

            if (sidebarCollapsed) {
              return (
                <Tooltip key={item.name} content={item.name} position="right">
                  {linkContent}
                </Tooltip>
              );
            }
            return linkContent;
          })}

          {/* User Profile dropdown */}
          <div className="pt-2 mt-1 border-t border-[rgba(255,255,255,0.04)]">
            <Dropdown
              align={sidebarCollapsed ? 'left' : 'right'}
              trigger={
                <button
                  className={`w-full flex items-center ${
                    sidebarCollapsed ? 'justify-center' : 'justify-between px-2.5'
                  } py-1.5 rounded-[8px] hover:bg-[#1A1A1A] transition-colors focus-gold`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar
                      name={userData?.name || user.displayName || 'Agent'}
                      src={userData?.photo}
                      size="sm"
                    />
                    {!sidebarCollapsed && (
                      <div className="text-left min-w-0 truncate">
                        <p className="text-xs font-semibold text-[#F4F4F5] truncate">
                          {userData?.name || user.displayName || 'Agent'}
                        </p>
                        <p className="text-[10px] text-[#71717A] truncate font-crm-mono">
                          {userData?.businessName || 'Samruddhi Realty'}
                        </p>
                      </div>
                    )}
                  </div>
                  {!sidebarCollapsed && <MoreHorizontal className="w-3.5 h-3.5 text-[#71717A]" />}
                </button>
              }
              items={[
                {
                  id: 'profile-settings',
                  label: 'Account & Brand Settings',
                  icon: <Settings className="w-3.5 h-3.5" />,
                  onClick: () => navigate('/dashboard/settings'),
                },
                ...(userData?.slug
                  ? [
                      {
                        id: 'public-catalogue',
                        label: 'View Public Catalogue',
                        icon: <ExternalLink className="w-3.5 h-3.5" />,
                        onClick: () => window.open(`/properties/${userData.slug}`, '_blank'),
                      },
                    ]
                  : []),
                {
                  id: 'shortcuts-modal',
                  label: 'Keyboard Shortcuts',
                  icon: <HelpCircle className="w-3.5 h-3.5" />,
                  shortcut: '?',
                  onClick: () => setIsShortcutsOpen(true),
                },
                {
                  id: 'sign-out',
                  label: 'Sign Out',
                  icon: <LogOut className="w-3.5 h-3.5" />,
                  danger: true,
                  divider: true,
                  onClick: handleSignOut,
                },
              ]}
            />
          </div>
        </div>
      </aside>

      {/* ----------------- MAIN APP WORKSPACE ----------------- */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-[#0A0A0A]">
        {/* TOP BAR */}
        <header className="h-14 px-4 sm:px-6 border-b border-[rgba(255,255,255,0.06)] bg-[#111111]/80 backdrop-blur-md flex items-center justify-between shrink-0 z-20">
          {/* Left: Mobile Menu Trigger + Page Title */}
          <div className="flex items-center gap-3">
            <h1 className="font-crm-serif text-lg sm:text-xl font-bold text-[#F4F4F5] tracking-tight truncate">
              {pageTitle}
            </h1>
          </div>

          {/* Center / Search: Command Palette Trigger */}
          <div className="flex-1 max-w-md mx-4 hidden sm:block">
            <button
              onClick={() => setIsPaletteOpen(true)}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-[8px] bg-[#202020] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)] text-[#71717A] text-xs transition-colors focus-gold"
            >
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-[#A1A1AA]" />
                <span className="text-[#A1A1AA]">Search or jump to…</span>
              </div>
              <KeyboardHint keys={['⌘', 'K']} />
            </button>
          </div>

          {/* Right: Usage Pill, + New Dropdown, Notifications, Shortcuts, Avatar */}
          <div className="flex items-center gap-2.5">
            {/* Real-time Usage Pill */}
            {usagePill && (
              <button
                onClick={() => navigate('/dashboard/pricing')}
                title="View Plan & Quota Usage"
                className={`hidden md:inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-crm-mono border transition-all cursor-pointer ${
                  usagePill.isWarning
                    ? 'bg-amber-950/40 border-amber-500/50 text-amber-300 hover:bg-amber-950/60'
                    : 'bg-[#1A1A1A] border-[rgba(255,255,255,0.08)] text-gray-300 hover:border-[#D4AF37]/50 hover:text-white'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    usagePill.isWarning ? 'bg-amber-400 animate-pulse' : 'bg-[#D4AF37]'
                  }`}
                />
                <span>{usagePill.text}</span>
              </button>
            )}

            {/* Mobile Search Icon */}
            <button
              onClick={() => setIsPaletteOpen(true)}
              className="sm:hidden p-2 rounded-[8px] text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#1A1A1A] transition-colors focus-gold"
              aria-label="Open search"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* + New Gold Dropdown */}
            <Dropdown
              align="right"
              trigger={
                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#D4AF37] hover:bg-[#E5C358] text-[#0A0A0A] font-semibold text-xs shadow-sm transition-all focus-gold">
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>New</span>
                </button>
              }
              items={[
                {
                  id: 'new-lead',
                  label: 'New Lead',
                  icon: <Users className="w-3.5 h-3.5 text-[#D4AF37]" />,
                  shortcut: 'N',
                  onClick: () => navigate('/dashboard/leads?new=true'),
                },
                {
                  id: 'new-task',
                  label: 'New Task',
                  icon: <CheckSquare className="w-3.5 h-3.5 text-[#D4AF37]" />,
                  shortcut: 'T',
                  onClick: () => navigate('/dashboard/tasks?new=true'),
                },
                {
                  id: 'new-visit',
                  label: 'Schedule Site Visit',
                  icon: <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />,
                  onClick: () => navigate('/dashboard/visits?new=true'),
                },
                {
                  id: 'new-property',
                  label: 'Add Property Listing',
                  icon: <Building className="w-3.5 h-3.5 text-[#D4AF37]" />,
                  onClick: () => navigate('/dashboard/properties?new=true'),
                },
              ]}
            />

            {/* Notifications Bell */}
            <Dropdown
              align="right"
              trigger={
                <button
                  className="relative p-2 rounded-[8px] text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#1A1A1A] transition-colors focus-gold"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {badgeCounts.overdueTasks > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#F87171]" />
                  )}
                </button>
              }
              items={[
                {
                  id: 'notif-1',
                  label:
                    badgeCounts.overdueTasks > 0
                      ? `${badgeCounts.overdueTasks} overdue follow-up tasks`
                      : 'All tasks on schedule',
                  icon: <CheckSquare className="w-3.5 h-3.5 text-[#F87171]" />,
                  onClick: () => navigate('/dashboard/tasks'),
                },
                {
                  id: 'notif-2',
                  label:
                    badgeCounts.todayVisits > 0
                      ? `${badgeCounts.todayVisits} buyer visits scheduled today`
                      : 'No site visits today',
                  icon: <Calendar className="w-3.5 h-3.5 text-[#60A5FA]" />,
                  onClick: () => navigate('/dashboard/visits'),
                },
                {
                  id: 'notif-3',
                  label:
                    badgeCounts.newLeads > 0
                      ? `${badgeCounts.newLeads} active or new leads`
                      : 'No new leads today',
                  icon: <Users className="w-3.5 h-3.5 text-[#D4AF37]" />,
                  onClick: () => navigate('/dashboard/leads'),
                },
              ]}
            />

            {/* Help / Shortcuts Icon */}
            <button
              onClick={() => setIsShortcutsOpen(true)}
              className="p-2 rounded-[8px] text-[#71717A] hover:text-[#F4F4F5] hover:bg-[#1A1A1A] transition-colors focus-gold hidden sm:block"
              aria-label="Keyboard shortcuts"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* SCROLLABLE ROUTE VIEW WITH PAGE TRANSITION */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -4 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="w-full h-full"
            >
              <Outlet
                context={{
                  user,
                  userData,
                  leads,
                  tasks,
                  visits,
                  properties,
                  planStatus,
                  refreshBillingStatus: fetchPlanStatus,
                  openTopUpModal: () => setIsTopUpOpen(true),
                }}
              />
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Global Voice Top-Up Modal */}
        <VoiceTopUpModal
          isOpen={isTopUpOpen}
          onClose={() => setIsTopUpOpen(false)}
          onSuccess={() => fetchPlanStatus()}
          userEmail={user?.email}
          userName={user?.displayName}
        />
      </div>

      {/* ----------------- MOBILE BOTTOM TAB BAR (<768px) ----------------- */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#111111] border-t border-[rgba(255,255,255,0.08)] px-2 py-1 flex items-center justify-around">
        <Link
          to="/dashboard"
          className={`flex flex-col items-center py-1 px-2 rounded-[6px] text-[10px] font-medium transition-colors ${
            location.pathname === '/dashboard'
              ? 'text-[#D4AF37]'
              : 'text-[#A1A1AA] hover:text-[#F4F4F5]'
          }`}
        >
          <Home className="w-4 h-4 mb-0.5" />
          <span>Home</span>
        </Link>

        <Link
          to="/dashboard/leads"
          className={`relative flex flex-col items-center py-1 px-2 rounded-[6px] text-[10px] font-medium transition-colors ${
            location.pathname.startsWith('/dashboard/leads')
              ? 'text-[#D4AF37]'
              : 'text-[#A1A1AA] hover:text-[#F4F4F5]'
          }`}
        >
          <Users className="w-4 h-4 mb-0.5" />
          <span>Leads</span>
          {badgeCounts.newLeads > 0 && (
            <span className="absolute top-1 right-2 w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
          )}
        </Link>

        <Link
          to="/dashboard/pipeline"
          className={`flex flex-col items-center py-1 px-2 rounded-[6px] text-[10px] font-medium transition-colors ${
            location.pathname.startsWith('/dashboard/pipeline')
              ? 'text-[#D4AF37]'
              : 'text-[#A1A1AA] hover:text-[#F4F4F5]'
          }`}
        >
          <Trello className="w-4 h-4 mb-0.5" />
          <span>Pipeline</span>
        </Link>

        <Link
          to="/dashboard/tasks"
          className={`relative flex flex-col items-center py-1 px-2 rounded-[6px] text-[10px] font-medium transition-colors ${
            location.pathname.startsWith('/dashboard/tasks')
              ? 'text-[#D4AF37]'
              : 'text-[#A1A1AA] hover:text-[#F4F4F5]'
          }`}
        >
          <CheckSquare className="w-4 h-4 mb-0.5" />
          <span>Tasks</span>
          {badgeCounts.overdueTasks > 0 && (
            <span className="absolute top-1 right-2 w-1.5 h-1.5 rounded-full bg-[#F87171]" />
          )}
        </Link>

        <button
          onClick={() => setIsMobileMoreOpen(true)}
          className={`flex flex-col items-center py-1 px-2 rounded-[6px] text-[10px] font-medium transition-colors ${
            isMobileMoreOpen ? 'text-[#D4AF37]' : 'text-[#A1A1AA] hover:text-[#F4F4F5]'
          }`}
        >
          <Menu className="w-4 h-4 mb-0.5" />
          <span>More</span>
        </button>
      </nav>

      {/* MOBILE "MORE" DRAWER */}
      <Drawer
        isOpen={isMobileMoreOpen}
        onClose={() => setIsMobileMoreOpen(false)}
        title="More Sections"
        description="Access all CRM capabilities"
        width="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-[8px] bg-[#1A1A1A] border border-[rgba(255,255,255,0.06)]">
            <Avatar
              name={userData?.name || user.displayName || 'Agent'}
              src={userData?.photo}
              size="md"
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#F4F4F5] truncate">
                {userData?.name || user.displayName || 'Agent'}
              </p>
              <p className="text-xs text-[#A1A1AA] truncate">
                {userData?.businessName || 'Samruddhi Realty'}
              </p>
            </div>
          </div>

          <div className="space-y-1">
            {[
              { name: 'Visits & Calendar', path: '/dashboard/visits', icon: Calendar },
              { name: 'Properties & Inventory', path: '/dashboard/properties', icon: Building },
              { name: 'WhatsApp Automation', path: '/dashboard/whatsapp', icon: MessageSquare },
              { name: 'Finance & ROI', path: '/dashboard/finance', icon: DollarSign },
              { name: 'Reports & Analytics', path: '/dashboard/reports', icon: BarChart2 },
              { name: 'Pricing & Plans', path: '/dashboard/pricing', icon: Sparkles },
              { name: 'Settings & Brand', path: '/dashboard/settings', icon: Settings },
            ].map((item) => (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setIsMobileMoreOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-xs font-medium text-[#F4F4F5] hover:bg-[#1A1A1A] transition-colors"
              >
                <item.icon className="w-4 h-4 text-[#D4AF37]" />
                <span>{item.name}</span>
              </Link>
            ))}
          </div>

          {userData?.slug && (
            <div className="pt-2 border-t border-[rgba(255,255,255,0.06)]">
              <a
                href={`/properties/${userData.slug}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between px-3 py-2.5 rounded-[8px] text-xs font-medium text-[#D4AF37] bg-[rgba(212,175,55,0.1)] border border-[rgba(212,175,55,0.2)]"
              >
                <span className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  View Public Catalogue
                </span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          <div className="pt-4 border-t border-[rgba(255,255,255,0.06)]">
            <button
              onClick={() => {
                setIsMobileMoreOpen(false);
                handleSignOut();
              }}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-[8px] text-xs font-medium text-[#F87171] hover:bg-[rgba(248,113,113,0.1)] transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </Drawer>

      {/* COMMAND PALETTE MODAL (⌘K) */}
      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        leads={leads}
        properties={properties}
        onNavigate={(path) => navigate(path)}
        onNewLead={() => navigate('/dashboard/leads?new=true')}
        onNewTask={() => navigate('/dashboard/tasks?new=true')}
        onNewVisit={() => navigate('/dashboard/visits?new=true')}
        onNewProperty={() => navigate('/dashboard/properties?new=true')}
      />

      {/* SHORTCUTS HELP MODAL (?) */}
      <ShortcutsHelpModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
};
