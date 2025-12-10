
import React, { forwardRef } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface AppButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline' | 'link' | 'gold';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

const sizeStyles = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 py-2 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2.5',
  icon: 'h-10 w-10 p-2',
};

const iconSizes = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
  icon: 'w-5 h-5',
};

const variantStyles = {
  primary: `
    bg-primary text-white
    hover:bg-primary-hover hover:shadow-md
    active:scale-[0.98]
    disabled:bg-primary/50 disabled:text-white/80 disabled:cursor-not-allowed disabled:shadow-none
    focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
  `,
  secondary: `
    bg-accent text-white
    hover:bg-accent-hover hover:shadow-md
    active:scale-[0.98]
    disabled:bg-accent/50 disabled:text-white/80 disabled:cursor-not-allowed disabled:shadow-none
    focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2
  `,
  ghost: `
    bg-transparent text-foreground
    hover:bg-surface-hover hover:text-primary
    active:scale-[0.98]
    disabled:opacity-50 disabled:cursor-not-allowed
    focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
  `,
  destructive: `
    bg-destructive text-destructive-foreground
    hover:bg-destructive/90
    active:scale-[0.98]
    disabled:opacity-50 disabled:cursor-not-allowed
    focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2
  `,
  outline: `
    bg-transparent text-foreground border border-border
    hover:bg-primary/5 hover:border-primary hover:text-primary
    active:scale-[0.98]
    disabled:opacity-50 disabled:cursor-not-allowed
    focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
  `,
  link: `
    bg-transparent text-primary underline-offset-4
    hover:underline hover:text-primary-hover
    disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline
    focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm
  `,
  gold: `
    bg-gold text-[var(--color-text-primary)] font-bold
    hover:shadow-[0_0_20px_var(--color-gold)]
    active:scale-[0.98]
    disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
    focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2
  `,
};

export const AppButton = forwardRef<HTMLButtonElement, AppButtonProps>(({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  fullWidth = false,
  children,
  className = '',
  disabled,
  type = 'button',
  ...props
}, ref) => {
  const isDisabled = disabled || loading;

  const buttonStyles = `
    inline-flex items-center justify-center font-medium rounded-lg
    transition-all duration-200 ease-in-out
    outline-none
    ${variantStyles[variant]}
    ${sizeStyles[size]}
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <button
      ref={ref}
      type={type}
      className={buttonStyles}
      disabled={isDisabled}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <>
          <svg
            className={`animate-spin ${iconSizes[size]}`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="sr-only">Loading...</span>
        </>
      ) : (
        <>
          {LeftIcon && <LeftIcon className={iconSizes[size]} aria-hidden="true" />}
          {children}
          {RightIcon && <RightIcon className={iconSizes[size]} aria-hidden="true" />}
        </>
      )}
    </button>
  );
});
AppButton.displayName = 'AppButton';

export interface AppIconButtonProps extends Omit<AppButtonProps, 'leftIcon' | 'rightIcon' | 'children'> {
  icon: LucideIcon;
  'aria-label': string;
}

export const AppIconButton = forwardRef<HTMLButtonElement, AppIconButtonProps>(({
  icon: Icon,
  variant = 'ghost',
  size = 'icon',
  className = '',
  ...props
}, ref) => {
  return (
    <AppButton
      ref={ref}
      variant={variant}
      size={size}
      className={`aspect-square p-0 ${className}`}
      {...props}
    >
      <Icon className={iconSizes[size === 'icon' ? 'md' : size] || iconSizes.md} aria-hidden="true" />
    </AppButton>
  );
});
AppIconButton.displayName = 'AppIconButton';
