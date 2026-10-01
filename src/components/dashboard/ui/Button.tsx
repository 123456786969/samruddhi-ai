import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled = false,
      leftIcon,
      rightIcon,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-[8px] focus-gold select-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';

    const sizeStyles = {
      sm: 'text-xs px-3 py-1.5 gap-1.5 h-8',
      md: 'text-sm px-4 py-2 gap-2 h-10',
    }[size];

    const variantStyles = {
      primary:
        'bg-[#D4AF37] hover:bg-[#E5C358] text-[#0A0A0A] font-semibold shadow-sm hover:shadow-[0_0_15px_rgba(212,175,55,0.3)]',
      secondary:
        'bg-[#1A1A1A] hover:bg-[#202020] text-[#F4F4F5] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)]',
      ghost:
        'bg-transparent hover:bg-[#1A1A1A] text-[#A1A1AA] hover:text-[#F4F4F5]',
      danger:
        'bg-[rgba(248,113,113,0.12)] hover:bg-[rgba(248,113,113,0.2)] text-[#F87171] border border-[rgba(248,113,113,0.3)]',
    }[variant];

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
        {...props}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          leftIcon
        )}
        <span>{children}</span>
        {!loading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
