import React from 'react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-[12px] bg-[#141414] border border-[rgba(255,255,255,0.06)] ${className}`}
    >
      <div className="w-12 h-12 rounded-[10px] bg-[#1A1A1A] border border-[rgba(212,175,55,0.2)] text-[#D4AF37] flex items-center justify-center mb-4 shadow-sm">
        {icon}
      </div>
      <h3 className="font-crm-serif text-lg font-semibold text-[#F4F4F5] tracking-tight">
        {title}
      </h3>
      <p className="text-sm text-[#A1A1AA] max-w-sm mt-1 mb-6 leading-relaxed">
        {description}
      </p>
      <div className="flex items-center gap-3">
        {actionLabel && onAction && (
          <Button variant="primary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
        {secondaryActionLabel && onSecondaryAction && (
          <Button variant="secondary" size="sm" onClick={onSecondaryAction}>
            {secondaryActionLabel}
          </Button>
        )}
      </div>
    </div>
  );
};
