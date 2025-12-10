import React from 'react';

/**
 * AppCard - Versatile card container component with multiple variants
 * 
 * @example
 * // Basic card
 * <AppCard>
 *   <AppCard.Header>Title</AppCard.Header>
 *   <AppCard.Content>Content here</AppCard.Content>
 * </AppCard>
 * 
 * @example
 * // Interactive card with click handler
 * <AppCard onClick={handleClick} ariaLabel="View details">
 *   Content
 * </AppCard>
 * 
 * @example
 * // Loading state
 * <AppCard loading loadingLines={4} />
 */
export interface AppCardProps {
  /** Content to render inside the card */
  children?: React.ReactNode;
  /** Visual style variant */
  variant?: 'default' | 'interactive' | 'subtle' | 'glass' | 'premium';
  /** Additional CSS classes */
  className?: string;
  /** Click handler - makes card interactive */
  onClick?: () => void;
  /** Accessible label for interactive cards (recommended when onClick is provided) */
  ariaLabel?: string;
  /** Disable hover effects */
  noHover?: boolean;
  /** Internal padding size */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Show loading skeleton */
  loading?: boolean;
  /** Number of skeleton lines when loading */
  loadingLines?: number;
}

const paddingMap = {
  none: '',
  sm: 'p-3',
  md: 'p-4 md:p-5',
  lg: 'p-4 md:p-6 lg:p-8',
} satisfies Record<NonNullable<AppCardProps['padding']>, string>;

const variantStyles = {
  default: 'bg-surface border border-border shadow-sm',
  interactive: 'bg-surface border border-border shadow-sm hover:shadow-md hover:border-primary/30 focus-within:shadow-md focus-within:border-primary/30',
  subtle: 'bg-surface-hover border border-transparent',
  glass: 'glass-card backdrop-blur-md bg-surface/10 border-border/20',
  premium: 'bg-surface border-[3px] border-gold shadow-[0_4px_20px_rgba(212,175,55,0.3)] hover:shadow-[0_6px_30px_rgba(212,175,55,0.5)] relative',
} satisfies Record<NonNullable<AppCardProps['variant']>, string>;

/** Skeleton loading widths for varied appearance */
const SKELETON_WIDTHS = [75, 50, 85, 65, 90] as const;

/**
 * Helper function to build card styles efficiently
 */
const getCardStyles = (
  variant: AppCardProps['variant'],
  padding: AppCardProps['padding'],
  isInteractive: boolean,
  noHover: boolean,
  className?: string
): string => {
  const resolvedVariant = variant ?? 'default';
  const resolvedPadding = padding ?? 'lg';

  const styles: (string | false)[] = [
    'rounded-xl transition-all duration-200',
    variantStyles[resolvedVariant],
    paddingMap[resolvedPadding],
    isInteractive && !noHover && 'cursor-pointer hover:-translate-y-0.5 focus-visible:-translate-y-0.5',
    isInteractive && resolvedVariant === 'premium' && 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2',
    isInteractive && resolvedVariant !== 'premium' && 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
    className,
  ];

  return styles.filter(Boolean).join(' ');
};

const AppCardComponent: React.FC<AppCardProps> = ({
  children,
  variant,
  className = '',
  onClick,
  ariaLabel,
  noHover = false,
  padding,
  loading = false,
  loadingLines = 3,
}) => {
  const isInteractive = !!onClick;

  // Build styles - string concatenation is fast enough without memoization
  const baseStyles = getCardStyles(variant, padding, isInteractive, noHover, className);

  // Development warning for accessibility (only warn once)
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development' && onClick && !ariaLabel) {
      console.warn('AppCard: Consider providing aria-label when onClick is used for better accessibility');
    }
  }, []); // Empty deps - only warn on mount

  if (loading) {
    return (
      <div
        className={`${baseStyles} animate-pulse`}
        aria-busy="true"
        aria-live="polite"
        role="status"
      >
        <div className="space-y-3">
          {Array.from({ length: loadingLines }).map((_, i) => (
            <div
              key={i}
              className="h-4 bg-surface-hover rounded"
              style={{ width: `${SKELETON_WIDTHS[i % SKELETON_WIDTHS.length]}%` }}
            />
          ))}
        </div>
        <span className="sr-only">Loading content...</span>
      </div>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${baseStyles} w-full text-left`}
        aria-label={ariaLabel || 'Interactive card'}
      >
        {children}
      </button>
    );
  }

  // For interactive variant without onClick, focus-within will handle nested interactive elements
  return (
    <div className={baseStyles}>
      {children}
    </div>
  );
};

export interface AppCardHeaderProps {
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

const AppCardHeader: React.FC<AppCardHeaderProps> = ({
  children,
  className = '',
  action,
}) => (
  <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 ${className}`}>
    <div className="text-lg font-semibold text-foreground">{children}</div>
    {action && <div className="self-start sm:self-auto">{action}</div>}
  </div>
);

export interface AppCardContentProps {
  children: React.ReactNode;
  className?: string;
}

const AppCardContent: React.FC<AppCardContentProps> = ({
  children,
  className = '',
}) => (
  <div className={className}>
    {children}
  </div>
);

export interface AppCardFooterProps {
  children: React.ReactNode;
  className?: string;
  border?: boolean;
}

const AppCardFooter: React.FC<AppCardFooterProps> = ({
  children,
  className = '',
  border = true,
}) => (
  <div className={`mt-4 pt-4 ${border ? 'border-t border-border' : ''} ${className}`}>
    {children}
  </div>
);

/**
 * AppCard - Versatile card component with multiple variants
 * 
 * @example
 * // Basic card
 * <AppCard>
 *   <AppCard.Header>Title</AppCard.Header>
 *   <AppCard.Content>Content here</AppCard.Content>
 * </AppCard>
 * 
 * @example
 * // Interactive card with click handler
 * <AppCard onClick={handleClick} variant="interactive">
 *   Content
 * </AppCard>
 * 
 * @example
 * // Loading state
 * <AppCard loading loadingLines={4} />
 */
export const AppCard = Object.assign(AppCardComponent, {
  Header: AppCardHeader,
  Content: AppCardContent,
  Footer: AppCardFooter,
});
