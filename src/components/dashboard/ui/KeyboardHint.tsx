import React from 'react';

interface KeyboardHintProps {
  keys: string[] | string;
  className?: string;
}

export const KeyboardHint: React.FC<KeyboardHintProps> = ({ keys, className = '' }) => {
  const keyList = Array.isArray(keys) ? keys : [keys];

  return (
    <span className={`inline-flex items-center gap-1 select-none font-crm-mono text-[11px] font-medium text-[#A1A1AA] ${className}`}>
      {keyList.map((k, idx) => (
        <kbd
          key={idx}
          className="px-1.5 py-0.5 rounded bg-[#1A1A1A] border border-[rgba(255,255,255,0.12)] text-[#F4F4F5] shadow-sm min-w-[18px] text-center leading-none inline-flex items-center justify-center"
        >
          {k}
        </kbd>
      ))}
    </span>
  );
};
