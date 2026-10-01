import React from 'react';
import { motion } from 'motion/react';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-1 border-b border-[rgba(255,255,255,0.06)] overflow-x-auto no-scrollbar ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`relative flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium transition-colors whitespace-nowrap focus-gold rounded-t-[6px] ${
              isActive ? 'text-[#D4AF37]' : 'text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#1A1A1A]/50'
            }`}
          >
            {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`px-1.5 py-0.2 rounded-full font-crm-mono text-[10px] ${
                  isActive
                    ? 'bg-[rgba(212,175,55,0.15)] text-[#D4AF37]'
                    : 'bg-[#202020] text-[#71717A]'
                }`}
              >
                {tab.count}
              </span>
            )}
            {isActive && (
              <motion.div
                layoutId="activeTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4AF37]"
                transition={{ duration: 0.15 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};
