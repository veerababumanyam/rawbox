import React from 'react';
import type { LucideIcon } from 'lucide-react';

export type BadgeIntent = 'default' | 'success' | 'warning' | 'destructive' | 'info' | 'accent';

export interface AppBadgeProps {
  children: React.ReactNode;
  intent?: BadgeIntent;
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  className?: string;
  ariaLabel?: string;
  pill?: boolean;
}

const intentStyles: Record<BadgeIntent, string> = {
  default: 'bg-surface-hover text-text-tertiary',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  destructive: 'bg-destructive-soft text-error',
  info: 'bg-info-soft text-info',
  accent: 'bg-accent-light text-accent',
};

const sizeStyles = {
  sm: 'px-1.5 py-0.5 text-[10px] gap-1',
  md: 'px-2 py-0.5 text-xs gap-1.5',
  lg: 'px-3 py-1 text-sm gap-2',
};

const iconSizes = {
  sm: 'w-3 h-3',
  md: 'w-3.5 h-3.5',
  lg: 'w-4 h-4',
};

export const AppBadge: React.FC<AppBadgeProps> = ({
  children,
  intent = 'default',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  className = '',
  ariaLabel,
  pill = true,
}) => {
  const badgeStyles = `
    inline-flex items-center font-medium uppercase tracking-wider
    ${intentStyles[intent]}
    ${sizeStyles[size]}
    ${pill ? 'rounded-full' : 'rounded-md'}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <span className={badgeStyles} aria-label={ariaLabel}>
      {Icon && iconPosition === 'left' && (
        <Icon className={iconSizes[size]} aria-hidden="true" />
      )}
      {children}
      {Icon && iconPosition === 'right' && (
        <Icon className={iconSizes[size]} aria-hidden="true" />
      )}
    </span>
  );
};

export interface StatusBadgeProps {
  status: 'online' | 'offline' | 'published' | 'draft' | 'archived';
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusConfig: Record<StatusBadgeProps['status'], { intent: BadgeIntent; label: string }> = {
  online: { intent: 'success', label: 'Online' },
  offline: { intent: 'default', label: 'Offline' },
  published: { intent: 'success', label: 'Published' },
  draft: { intent: 'warning', label: 'Draft' },
  archived: { intent: 'default', label: 'Archived' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  showLabel = true,
  size = 'sm',
  className = '',
}) => {
  const config = statusConfig[status];

  return (
    <AppBadge
      intent={config.intent}
      size={size}
      className={className}
      ariaLabel={config.label}
    >
      <span
        className={`
          inline-block rounded-full
          ${size === 'sm' ? 'w-1.5 h-1.5' : size === 'md' ? 'w-2 h-2' : 'w-2.5 h-2.5'}
          bg-current opacity-75
        `}
        aria-hidden="true"
      />
      {showLabel && config.label}
    </AppBadge>
  );
};

/**
 * GoldBadge - Premium badge component with gold styling
 * 
 * @example
 * <GoldBadge>Premium</GoldBadge>
 * <GoldBadge>VIP</GoldBadge>
 */
export interface GoldBadgeProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const GoldBadge: React.FC<GoldBadgeProps> = ({
  children,
  className = '',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[10px] gap-1',
    md: 'px-2 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-sm gap-2',
  };

  const iconSizes = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
  };

  return (
    <span
      className={`
        inline-flex items-center font-bold uppercase tracking-wider rounded-md
        bg-gold text-[var(--color-text-primary)]
        shadow-[0_2px_8px_rgba(212,175,55,0.6)]
        ${sizeClasses[size]}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    >
      <span className={iconSizes[size]} aria-hidden="true">★</span>
      {children}
    </span>
  );
};
