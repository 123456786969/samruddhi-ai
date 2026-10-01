import React from 'react';

export interface AvatarProps {
  name?: string;
  src?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

// Generate deterministic muted palette background based on name
const getMutedColor = (str: string = ''): { bg: string; text: string; border: string } => {
  const colors = [
    { bg: 'bg-[#2E2818]', text: 'text-[#E5C358]', border: 'border-[#D4AF37]/30' }, // Gold tint
    { bg: 'bg-[#1E293B]', text: 'text-[#94A3B8]', border: 'border-[#475569]/40' }, // Slate
    { bg: 'bg-[#142C23]', text: 'text-[#86EFAC]', border: 'border-[#22C55E]/30' }, // Emerald
    { bg: 'bg-[#291B2E]', text: 'text-[#D8B4FE]', border: 'border-[#A855F7]/30' }, // Purple
    { bg: 'bg-[#1E2836]', text: 'text-[#93C5FD]', border: 'border-[#3B82F6]/30' }, // Blue
    { bg: 'bg-[#31221D]', text: 'text-[#FDBA74]', border: 'border-[#F97316]/30' }, // Amber
  ];

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

const getInitials = (name?: string): string => {
  if (!name) return 'A';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const Avatar: React.FC<AvatarProps> = ({
  name = 'User',
  src,
  size = 'md',
  className = '',
}) => {
  const [imageError, setImageError] = React.useState(false);
  const color = getMutedColor(name);

  const sizeStyles = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base font-semibold',
  }[size];

  if (src && !imageError) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setImageError(true)}
        className={`${sizeStyles} rounded-full object-cover border border-[rgba(255,255,255,0.12)] shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeStyles} rounded-full ${color.bg} ${color.text} border ${color.border} flex items-center justify-center font-medium select-none shrink-0 ${className}`}
    >
      {getInitials(name)}
    </div>
  );
};
