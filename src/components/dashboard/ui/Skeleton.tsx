import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'rectangular' | 'circular' | 'text';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rectangular',
  width,
  height,
  className = '',
  style,
  ...props
}) => {
  const variantClasses = {
    rectangular: 'rounded-[8px]',
    circular: 'rounded-full',
    text: 'rounded-[4px] h-4 w-full',
  }[variant];

  return (
    <div
      className={`animate-pulse bg-[#1A1A1A] border border-[rgba(255,255,255,0.04)] ${variantClasses} ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        ...style,
      }}
      {...props}
    />
  );
};

export const SkeletonCard: React.FC<{ lines?: number; className?: string }> = ({
  lines = 3,
  className = '',
}) => {
  return (
    <div className={`p-5 rounded-[12px] bg-[#141414] border border-[rgba(255,255,255,0.06)] space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <Skeleton variant="text" width="40%" height={20} />
        <Skeleton variant="circular" width={28} height={28} />
      </div>
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} variant="text" width={i === lines - 1 ? '60%' : '100%'} height={14} />
        ))}
      </div>
    </div>
  );
};

export const SkeletonTable: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 5,
}) => {
  return (
    <div className="w-full rounded-[12px] bg-[#141414] border border-[rgba(255,255,255,0.06)] overflow-hidden">
      {/* Table Header */}
      <div className="flex items-center p-4 border-b border-[rgba(255,255,255,0.06)] bg-[#111111] gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} variant="text" height={16} className="flex-1" />
        ))}
      </div>
      {/* Table Rows */}
      <div className="divide-y divide-[rgba(255,255,255,0.04)]">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center p-4 gap-4">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} variant="text" height={14} className="flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
