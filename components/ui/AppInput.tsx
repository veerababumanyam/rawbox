
import React, { forwardRef, useId } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface AppInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  wrapperClassName?: string;
  premium?: boolean;
}

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-4 py-3 text-base',
};

const iconPadding = {
  sm: 'pl-9',
  md: 'pl-10',
  lg: 'pl-11',
};

const iconSizes = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-5 h-5',
};

const iconPositions = {
  sm: 'left-3 top-1/2 -translate-y-1/2',
  md: 'left-3 top-1/2 -translate-y-1/2',
  lg: 'left-3.5 top-1/2 -translate-y-1/2',
};

export const AppInput = forwardRef<HTMLInputElement, AppInputProps>(({
  label,
  helperText,
  error,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  size = 'md',
  fullWidth = true,
  required,
  disabled,
  premium = false,
  className = '',
  wrapperClassName = '',
  id: providedId,
  ...props
}, ref) => {
  const generatedId = useId();
  const inputId = providedId || generatedId;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;
  const hasError = !!error;

  const inputStyles = `
    ${fullWidth ? 'w-full' : ''}
    ${sizeStyles[size]}
    ${LeftIcon ? iconPadding[size] : ''}
    ${RightIcon ? 'pr-10' : ''}
    border rounded-lg
    bg-surface text-foreground
    placeholder:text-muted-foreground
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:border-transparent
    disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-muted/30
    ${premium
      ? 'border-gold focus:ring-gold focus:shadow-[0_0_20px_var(--color-gold)]'
      : hasError
        ? 'border-error bg-destructive-soft/50 focus:ring-error'
        : 'border-border hover:border-text-tertiary focus:ring-primary'
    }
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${wrapperClassName}`}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-foreground mb-1.5">
          {label} {required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {LeftIcon && (
          <LeftIcon className={`absolute ${iconPositions[size]} ${iconSizes[size]} text-muted-foreground pointer-events-none`} />
        )}
        <input
          ref={ref}
          id={inputId}
          className={inputStyles}
          disabled={disabled}
          required={required}
          aria-required={required}
          aria-invalid={hasError}
          aria-describedby={hasError ? errorId : helperText ? helperId : undefined}
          {...props}
        />
        {RightIcon && (
          <RightIcon className={`absolute right-3 top-1/2 -translate-y-1/2 ${iconSizes[size]} text-muted-foreground pointer-events-none`} />
        )}
      </div>
      {error && <p id={errorId} className="mt-1.5 text-sm text-error" role="alert">{error}</p>}
      {!error && helperText && <p id={helperId} className="mt-1.5 text-sm text-muted-foreground">{helperText}</p>}
    </div>
  );
});
AppInput.displayName = 'AppInput';

export interface AppTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  fullWidth?: boolean;
  wrapperClassName?: string;
}

export const AppTextarea = forwardRef<HTMLTextAreaElement, AppTextareaProps>(({
  label,
  helperText,
  error,
  fullWidth = true,
  required,
  disabled,
  className = '',
  wrapperClassName = '',
  id: providedId,
  rows = 3,
  ...props
}, ref) => {
  const generatedId = useId();
  const textareaId = providedId || generatedId;
  const errorId = `${textareaId}-error`;
  const helperId = `${textareaId}-helper`;
  const hasError = !!error;

  const textareaStyles = `
    ${fullWidth ? 'w-full' : ''}
    px-4 py-2.5 text-sm
    border rounded-lg
    bg-surface text-foreground
    placeholder:text-muted-foreground
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
    disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-muted/30
    resize-y min-h-[80px]
    ${hasError
      ? 'border-error bg-destructive-soft/50 focus:ring-error'
      : 'border-border hover:border-text-tertiary'
    }
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${wrapperClassName}`}>
      {label && <label htmlFor={textareaId} className="block text-sm font-medium text-foreground mb-1.5">{label} {required && <span className="text-error">*</span>}</label>}
      <textarea
        ref={ref}
        id={textareaId}
        className={textareaStyles}
        disabled={disabled}
        required={required}
        rows={rows}
        aria-required={required}
        aria-invalid={hasError}
        aria-describedby={hasError ? errorId : helperText ? helperId : undefined}
        {...props}
      />
      {error && <p id={errorId} className="mt-1.5 text-sm text-error" role="alert">{error}</p>}
      {!error && helperText && <p id={helperId} className="mt-1.5 text-sm text-muted-foreground">{helperText}</p>}
    </div>
  );
});
AppTextarea.displayName = 'AppTextarea';

export interface AppSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  helperText?: string;
  error?: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
  leftIcon?: LucideIcon;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  wrapperClassName?: string;
}

export const AppSelect = forwardRef<HTMLSelectElement, AppSelectProps>(({
  label,
  helperText,
  error,
  options,
  placeholder,
  leftIcon: LeftIcon,
  size = 'md',
  fullWidth = true,
  required,
  disabled,
  className = '',
  wrapperClassName = '',
  id: providedId,
  ...props
}, ref) => {
  const generatedId = useId();
  const selectId = providedId || generatedId;
  const errorId = `${selectId}-error`;
  const helperId = `${selectId}-helper`;
  const hasError = !!error;

  const selectStyles = `
    ${fullWidth ? 'w-full' : ''}
    ${sizeStyles[size]}
    ${LeftIcon ? iconPadding[size] : ''}
    pr-10
    border rounded-lg
    bg-surface text-foreground
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
    disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-muted/30
    appearance-none cursor-pointer
    ${hasError
      ? 'border-error bg-destructive-soft/50 focus:ring-error'
      : 'border-border hover:border-text-tertiary'
    }
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${wrapperClassName}`}>
      {label && <label htmlFor={selectId} className="block text-sm font-medium text-foreground mb-1.5">{label} {required && <span className="text-error">*</span>}</label>}
      <div className="relative">
        {LeftIcon && <LeftIcon className={`absolute ${iconPositions[size]} ${iconSizes[size]} text-muted-foreground pointer-events-none`} />}
        <select
          ref={ref}
          id={selectId}
          className={selectStyles}
          disabled={disabled}
          required={required}
          aria-required={required}
          aria-invalid={hasError}
          aria-describedby={hasError ? errorId : helperText ? helperId : undefined}
          {...props}
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>
          ))}
        </select>
        <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {error && <p id={errorId} className="mt-1.5 text-sm text-error" role="alert">{error}</p>}
      {!error && helperText && <p id={helperId} className="mt-1.5 text-sm text-muted-foreground">{helperText}</p>}
    </div>
  );
});
AppSelect.displayName = 'AppSelect';

export interface AppToggleProps {
  label?: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const toggleSizes = {
  sm: { track: 'w-8 h-4', thumb: 'w-3 h-3', translate: 'translate-x-4' },
  md: { track: 'w-11 h-6', thumb: 'w-4 h-4', translate: 'translate-x-5' },
  lg: { track: 'w-14 h-7', thumb: 'w-5 h-5', translate: 'translate-x-7' },
};

export const AppToggle: React.FC<AppToggleProps> = ({
  label,
  description,
  checked,
  onChange,
  disabled = false,
  size = 'md',
  className = '',
}) => {
  const id = useId();
  const sizes = toggleSizes[size];

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {(label || description) && (
        <div className="flex-1 mr-4">
          {label && <label htmlFor={id} className="block text-sm font-medium text-foreground cursor-pointer">{label}</label>}
          {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
        </div>
      )}
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex items-center rounded-full
          ${sizes.track}
          transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          ${checked ? 'bg-success' : 'bg-border'}
        `}
      >
        <span className={`inline-block rounded-full bg-white shadow-sm ${sizes.thumb} transition-transform duration-200 ${checked ? sizes.translate : 'translate-x-1'}`} />
      </button>
    </div>
  );
};
