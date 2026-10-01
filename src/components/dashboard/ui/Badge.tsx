import React from 'react';
import { LeadStage } from '../../../types';

export type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'gold' | 'neutral';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: StatusVariant;
  stage?: LeadStage | string;
  size?: 'sm' | 'md';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant,
  stage,
  size = 'sm',
  dot = false,
  className = '',
  ...props
}) => {
  let resolvedVariant: StatusVariant = variant || 'neutral';

  if (stage) {
    switch (stage) {
      case 'New':
        resolvedVariant = 'info';
        break;
      case 'Contacted':
        resolvedVariant = 'warning';
        break;
      case 'Qualified':
        resolvedVariant = 'gold';
        break;
      case 'Site Visit':
        resolvedVariant = 'info';
        break;
      case 'Negotiation':
        resolvedVariant = 'warning';
        break;
      case 'Won':
        resolvedVariant = 'success';
        break;
      case 'Lost':
        resolvedVariant = 'danger';
        break;
      default:
        resolvedVariant = 'neutral';
        break;
    }
  }

  const variantStyles: Record<StatusVariant, { bg: string; text: string; border: string; dot: string }> = {
    success: {
      bg: 'bg-[rgba(74,222,128,0.12)]',
      text: 'text-[#4ADE80]',
      border: 'border-[rgba(74,222,128,0.25)]',
      dot: 'bg-[#4ADE80]',
    },
    warning: {
      bg: 'bg-[rgba(251,191,36,0.12)]',
      text: 'text-[#FBBF24]',
      border: 'border-[rgba(251,191,36,0.25)]',
      dot: 'bg-[#FBBF24]',
    },
    danger: {
      bg: 'bg-[rgba(248,113,113,0.12)]',
      text: 'text-[#F87171]',
      border: 'border-[rgba(248,113,113,0.25)]',
      dot: 'bg-[#F87171]',
    },
    info: {
      bg: 'bg-[rgba(96,165,250,0.12)]',
      text: 'text-[#60A5FA]',
      border: 'border-[rgba(96,165,250,0.25)]',
      dot: 'bg-[#60A5FA]',
    },
    gold: {
      bg: 'bg-[rgba(212,175,55,0.12)]',
      text: 'text-[#D4AF37]',
      border: 'border-[rgba(212,175,55,0.28)]',
      dot: 'bg-[#D4AF37]',
    },
    neutral: {
      bg: 'bg-[rgba(255,255,255,0.06)]',
      text: 'text-[#A1A1AA]',
      border: 'border-[rgba(255,255,255,0.1)]',
      dot: 'bg-[#71717A]',
    },
  };

  const style = variantStyles[resolvedVariant];
  const sizeClass = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${style.bg} ${style.text} ${style.border} ${sizeClass} select-none ${className}`}
      {...props}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />}
      {children || stage}
    </span>
  );
};
