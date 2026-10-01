import React from 'react';
import { Modal } from './ui/Modal';
import { KeyboardHint } from './ui/KeyboardHint';

export interface ShortcutsHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsHelpModal: React.FC<ShortcutsHelpModalProps> = ({ isOpen, onClose }) => {
  const shortcutGroups = [
    {
      group: 'General',
      shortcuts: [
        { keys: ['⌘ / Ctrl', 'K'], description: 'Open Command Palette' },
        { keys: ['?'], description: 'Show keyboard shortcuts' },
        { keys: ['Esc'], description: 'Close any modal, drawer, or palette' },
        { keys: ['/'], description: 'Focus search on table & list pages' },
      ],
    },
    {
      group: 'Quick Actions',
      shortcuts: [
        { keys: ['N'], description: 'Create new lead' },
        { keys: ['T'], description: 'Create new follow-up task' },
      ],
    },
    {
      group: 'Navigation (Press G then key)',
      shortcuts: [
        { keys: ['G', 'H'], description: 'Go to Dashboard Home' },
        { keys: ['G', 'L'], description: 'Go to Leads' },
        { keys: ['G', 'P'], description: 'Go to Pipeline' },
        { keys: ['G', 'V'], description: 'Go to Site Visits' },
        { keys: ['G', 'T'], description: 'Go to Tasks' },
      ],
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Keyboard Shortcuts"
      description="Quick navigation and actions for power agents"
      size="md"
    >
      <div className="space-y-6">
        {shortcutGroups.map((grp) => (
          <div key={grp.group} className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">
              {grp.group}
            </h4>
            <div className="divide-y divide-[rgba(255,255,255,0.06)] rounded-[8px] bg-[#1A1A1A] border border-[rgba(255,255,255,0.06)] overflow-hidden">
              {grp.shortcuts.map((sc, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between px-3.5 py-2.5 text-xs text-[#F4F4F5]"
                >
                  <span className="text-[#A1A1AA]">{sc.description}</span>
                  <KeyboardHint keys={sc.keys} />
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="p-3 rounded-[8px] bg-[rgba(212,175,55,0.08)] border border-[rgba(212,175,55,0.2)] text-[11px] text-[#A1A1AA] leading-relaxed">
          <strong className="text-[#D4AF37]">Pro Tip:</strong> Shortcuts are automatically paused
          whenever you are typing inside an input field or text area.
        </div>
      </div>
    </Modal>
  );
};
