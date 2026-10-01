import React, { useState } from 'react';

interface AvatarProps {
  src?: string;
  alt: string;
  name?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  fallbackSeed?: string;
  isFounder?: boolean;
}

export const SafeAvatar: React.FC<AvatarProps> = ({
  src,
  alt,
  name = 'User',
  className = '',
  size = 'md',
  fallbackSeed,
  isFounder = false
}) => {
  const [imgError, setImgError] = useState(false);
  const [loadStage, setLoadStage] = useState<number>(0);

  // Generate initials
  const initials = name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'SA';

  const seed = fallbackSeed || name.toLowerCase().replace(/[^a-z0-9]/g, '');

  // Reliable fallback sources
  const fallbackUrls = [
    src,
    `https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(seed)}&backgroundColor=051419,03251e,064e3b`,
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=064e3b&color=34d399&bold=true&size=256`
  ].filter(Boolean) as string[];

  const currentSrc = fallbackUrls[loadStage] || null;

  const handleImageError = () => {
    if (loadStage < fallbackUrls.length - 1) {
      setLoadStage(prev => prev + 1);
    } else {
      setImgError(true);
    }
  };

  if (imgError || !currentSrc) {
    return (
      <div 
        className={`flex items-center justify-center font-bold text-emerald-300 select-none bg-gradient-to-br from-emerald-950 via-teal-900 to-[#031814] ${className}`}
        aria-label={alt}
      >
        <span className="tracking-wider">{initials}</span>
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={`object-cover ${className}`}
      onError={handleImageError}
      loading="eager"
      referrerPolicy="no-referrer"
    />
  );
};
