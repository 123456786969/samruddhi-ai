import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Users,
  Building,
  CheckSquare,
  Trello,
  Calendar,
  MessageSquare,
  DollarSign,
  BarChart2,
  Settings,
  Plus,
  ArrowRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Lead, Property } from '../../types';
import { KeyboardHint } from './ui/KeyboardHint';

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  leads?: Lead[];
  properties?: Property[];
  onNavigate: (path: string) => void;
  onNewLead?: () => void;
  onNewTask?: () => void;
  onNewVisit?: () => void;
  onNewProperty?: () => void;
}

interface PaletteItem {
  id: string;
  type: 'action' | 'navigation' | 'lead' | 'property' | 'recent';
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  shortcut?: string;
  onSelect: () => void;
}

const RECENT_ITEMS_KEY = 'samruddhi_recent_palette_actions';

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  leads = [],
  properties = [],
  onNavigate,
  onNewLead,
  onNewTask,
  onNewVisit,
  onNewProperty,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentItems, setRecentItems] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Load recent items from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_ITEMS_KEY);
      if (stored) {
        setRecentItems(JSON.parse(stored));
      }
    } catch (e) {}
  }, [isOpen]);

  const saveRecent = (actionTitle: string) => {
    try {
      const updated = [actionTitle, ...recentItems.filter((i) => i !== actionTitle)].slice(0, 5);
      setRecentItems(updated);
      localStorage.setItem(RECENT_ITEMS_KEY, JSON.stringify(updated));
    } catch (e) {}
  };

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Base navigation and action items
  const baseActions: PaletteItem[] = [
    {
      id: 'action-new-lead',
      type: 'action',
      title: 'New Lead',
      subtitle: 'Create a new CRM lead profile',
      icon: <Plus className="w-4 h-4 text-[#D4AF37]" />,
      shortcut: 'N',
      onSelect: () => {
        saveRecent('New Lead');
        onClose();
        if (onNewLead) onNewLead();
        else onNavigate('/dashboard/leads?new=true');
      },
    },
    {
      id: 'action-new-task',
      type: 'action',
      title: 'New Task',
      subtitle: 'Schedule a follow-up or reminder',
      icon: <CheckSquare className="w-4 h-4 text-[#D4AF37]" />,
      shortcut: 'T',
      onSelect: () => {
        saveRecent('New Task');
        onClose();
        if (onNewTask) onNewTask();
        else onNavigate('/dashboard/tasks?new=true');
      },
    },
    {
      id: 'action-new-visit',
      type: 'action',
      title: 'Schedule Site Visit',
      subtitle: 'Book a buyer property inspection',
      icon: <Calendar className="w-4 h-4 text-[#D4AF37]" />,
      onSelect: () => {
        saveRecent('Schedule Site Visit');
        onClose();
        if (onNewVisit) onNewVisit();
        else onNavigate('/dashboard/visits?new=true');
      },
    },
    {
      id: 'action-new-property',
      type: 'action',
      title: 'New Property Listing',
      subtitle: 'Add unit to your sales inventory',
      icon: <Building className="w-4 h-4 text-[#D4AF37]" />,
      onSelect: () => {
        saveRecent('New Property Listing');
        onClose();
        if (onNewProperty) onNewProperty();
        else onNavigate('/dashboard/properties?new=true');
      },
    },
    {
      id: 'nav-home',
      type: 'navigation',
      title: 'Dashboard Overview',
      subtitle: 'Go to main KPI overview',
      icon: <Sparkles className="w-4 h-4 text-[#A1A1AA]" />,
      shortcut: 'G H',
      onSelect: () => {
        saveRecent('Dashboard Overview');
        onClose();
        onNavigate('/dashboard');
      },
    },
    {
      id: 'nav-leads',
      type: 'navigation',
      title: 'Leads Directory',
      subtitle: 'View, filter & manage all buyer leads',
      icon: <Users className="w-4 h-4 text-[#A1A1AA]" />,
      shortcut: 'G L',
      onSelect: () => {
        saveRecent('Leads Directory');
        onClose();
        onNavigate('/dashboard/leads');
      },
    },
    {
      id: 'nav-pipeline',
      type: 'navigation',
      title: 'Deal Pipeline Kanban',
      subtitle: 'Drag and drop deals across stages',
      icon: <Trello className="w-4 h-4 text-[#A1A1AA]" />,
      shortcut: 'G P',
      onSelect: () => {
        saveRecent('Deal Pipeline Kanban');
        onClose();
        onNavigate('/dashboard/pipeline');
      },
    },
    {
      id: 'nav-visits',
      type: 'navigation',
      title: 'Site Visits & Calendar',
      subtitle: 'Manage upcoming customer site visits',
      icon: <Calendar className="w-4 h-4 text-[#A1A1AA]" />,
      shortcut: 'G V',
      onSelect: () => {
        saveRecent('Site Visits & Calendar');
        onClose();
        onNavigate('/dashboard/visits');
      },
    },
    {
      id: 'nav-tasks',
      type: 'navigation',
      title: 'Tasks & Follow-ups',
      subtitle: 'Pending calls, follow-ups, and reminders',
      icon: <CheckSquare className="w-4 h-4 text-[#A1A1AA]" />,
      shortcut: 'G T',
      onSelect: () => {
        saveRecent('Tasks & Follow-ups');
        onClose();
        onNavigate('/dashboard/tasks');
      },
    },
    {
      id: 'nav-properties',
      type: 'navigation',
      title: 'Properties & Inventory',
      subtitle: 'Manage listings and public catalogue units',
      icon: <Building className="w-4 h-4 text-[#A1A1AA]" />,
      onSelect: () => {
        saveRecent('Properties & Inventory');
        onClose();
        onNavigate('/dashboard/properties');
      },
    },
    {
      id: 'nav-whatsapp',
      type: 'navigation',
      title: 'WhatsApp Automation',
      subtitle: 'Instant alerts, auto-triggers & logs',
      icon: <MessageSquare className="w-4 h-4 text-[#A1A1AA]" />,
      onSelect: () => {
        saveRecent('WhatsApp Automation');
        onClose();
        onNavigate('/dashboard/whatsapp');
      },
    },
    {
      id: 'nav-finance',
      type: 'navigation',
      title: 'Finance & ROI',
      subtitle: 'Expenses, commission forecasts & ad spend',
      icon: <DollarSign className="w-4 h-4 text-[#A1A1AA]" />,
      onSelect: () => {
        saveRecent('Finance & ROI');
        onClose();
        onNavigate('/dashboard/finance');
      },
    },
    {
      id: 'nav-reports',
      type: 'navigation',
      title: 'Analytics & Reports',
      subtitle: 'Lead conversion ratios and performance KPIs',
      icon: <BarChart2 className="w-4 h-4 text-[#A1A1AA]" />,
      onSelect: () => {
        saveRecent('Analytics & Reports');
        onClose();
        onNavigate('/dashboard/reports');
      },
    },
    {
      id: 'nav-settings',
      type: 'navigation',
      title: 'Settings & Profile',
      subtitle: 'Brand name, public catalogue slug & settings',
      icon: <Settings className="w-4 h-4 text-[#A1A1AA]" />,
      onSelect: () => {
        saveRecent('Settings & Profile');
        onClose();
        onNavigate('/dashboard/settings');
      },
    },
  ];

  // Lead search items
  const leadItems: PaletteItem[] = leads.map((lead) => ({
    id: `lead-${lead.id}`,
    type: 'lead',
    title: lead.name,
    subtitle: `${lead.phone} • ${lead.stage} • ${lead.preferred_location || 'Any location'}`,
    icon: <Users className="w-4 h-4 text-[#60A5FA]" />,
    onSelect: () => {
      saveRecent(`Lead: ${lead.name}`);
      onClose();
      onNavigate(`/dashboard/leads/${lead.id}`);
    },
  }));

  // Property search items
  const propertyItems: PaletteItem[] = properties.map((prop) => ({
    id: `prop-${prop.id}`,
    type: 'property',
    title: prop.title,
    subtitle: `${prop.location} • ₹${(prop.price / 100000).toFixed(1)}L • ${prop.bedrooms} BHK`,
    icon: <Building className="w-4 h-4 text-[#E5C358]" />,
    onSelect: () => {
      saveRecent(`Property: ${prop.title}`);
      onClose();
      onNavigate('/dashboard/properties');
    },
  }));

  const allItems = [...baseActions, ...leadItems, ...propertyItems];

  // Filter items based on query
  const cleanQuery = query.toLowerCase().trim();
  let filteredItems: PaletteItem[] = [];

  if (!cleanQuery) {
    // If empty query, prioritize recent items then base actions
    const recentResolved = recentItems
      .map((recTitle) => allItems.find((item) => item.title === recTitle || item.title.includes(recTitle)))
      .filter(Boolean) as PaletteItem[];

    const remaining = baseActions.filter(
      (action) => !recentResolved.some((r) => r.id === action.id)
    );
    filteredItems = [...recentResolved.slice(0, 3), ...remaining];
  } else {
    filteredItems = allItems.filter(
      (item) =>
        item.title.toLowerCase().includes(cleanQuery) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(cleanQuery))
    );
  }

  // Keyboard navigation inside list
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < filteredItems.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : filteredItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].onSelect();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    const activeEl = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#0A0A0A]/85 backdrop-blur-md"
          />

          {/* Centered Modal with glass-panel-gold */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="relative z-10 w-full max-w-xl glass-panel-gold rounded-[16px] shadow-2xl overflow-hidden border border-[rgba(212,175,55,0.25)] flex flex-col"
          >
            {/* Input Header */}
            <div className="flex items-center px-4 py-3.5 border-b border-[rgba(255,255,255,0.06)] bg-[#111111]/80 gap-3">
              <Search className="w-5 h-5 text-[#D4AF37] shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search leads, properties, pages, or actions..."
                className="w-full bg-transparent text-[#F4F4F5] placeholder-[#71717A] text-sm focus:outline-none"
              />
              <KeyboardHint keys="Esc" />
            </div>

            {/* List */}
            <div
              ref={listRef}
              className="max-h-80 overflow-y-auto p-2 space-y-1 divide-y divide-transparent"
            >
              {filteredItems.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#71717A]">
                  No matching leads, properties, or actions found.
                </div>
              ) : (
                filteredItems.map((item, index) => {
                  const isSelected = index === selectedIndex;
                  return (
                    <div
                      key={item.id}
                      data-index={index}
                      onMouseEnter={() => setSelectedIndex(index)}
                      onClick={item.onSelect}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-[8px] cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[#1A1A1A] border border-[rgba(212,175,55,0.3)] text-[#F4F4F5]'
                          : 'text-[#A1A1AA] hover:bg-[#161616]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-[6px] flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-[rgba(212,175,55,0.15)] text-[#D4AF37]'
                              : 'bg-[#202020] text-[#A1A1AA]'
                          }`}
                        >
                          {item.icon}
                        </div>
                        <div className="min-w-0">
                          <p
                            className={`text-xs font-semibold truncate ${
                              isSelected ? 'text-[#F4F4F5]' : 'text-[#D4D4D8]'
                            }`}
                          >
                            {item.title}
                          </p>
                          {item.subtitle && (
                            <p className="text-[11px] text-[#71717A] truncate font-crm-mono">
                              {item.subtitle}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        {item.shortcut && (
                          <KeyboardHint keys={item.shortcut.split(' ')} />
                        )}
                        {isSelected && (
                          <ArrowRight className="w-3.5 h-3.5 text-[#D4AF37]" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-[rgba(255,255,255,0.06)] bg-[#0A0A0A]/90 flex items-center justify-between text-[11px] text-[#71717A]">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <KeyboardHint keys={['↑', '↓']} /> Navigate
                </span>
                <span className="flex items-center gap-1">
                  <KeyboardHint keys="↵" /> Select
                </span>
              </div>
              <span className="text-[#D4AF37] font-crm-mono text-[10px]">
                Samruddhi Quick Command
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
