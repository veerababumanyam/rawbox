import React from 'react';
import { Search, X } from 'lucide-react';

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  showClear?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  autoFocus?: boolean;
}

const sizeStyles = {
  sm: 'pl-8 pr-8 py-1.5 text-xs',
  md: 'pl-10 pr-10 py-2 text-sm',
  lg: 'pl-11 pr-11 py-2.5 text-base',
};

const iconSizeStyles = {
  sm: 'w-3.5 h-3.5 left-2.5',
  md: 'w-4 h-4 left-3',
  lg: 'w-5 h-5 left-3',
};

const clearSizeStyles = {
  sm: 'w-3.5 h-3.5 right-2.5',
  md: 'w-4 h-4 right-3',
  lg: 'w-5 h-5 right-3',
};

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  ariaLabel,
  showClear = true,
  className = '',
  size = 'md',
  disabled = false,
  autoFocus = false,
}) => {
  const handleClear = () => onChange('');
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value);

  return (
    <div className={`relative ${className}`}>
      <Search className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none ${iconSizeStyles[size]}`} aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        aria-label={ariaLabel || placeholder.replace('...', '')}
        className={`
          w-full border border-border rounded-md bg-surface text-foreground
          placeholder:text-muted-foreground
          focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors
          ${sizeStyles[size]}
        `}
      />
      {showClear && value && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className={`
            absolute top-1/2 -translate-y-1/2 text-muted-foreground
            hover:text-foreground focus:outline-none focus:text-foreground
            transition-colors
            ${clearSizeStyles[size]}
          `}
        >
          <X className="w-full h-full" aria-hidden="true" />
        </button>
      )}
    </div>
  );
};
