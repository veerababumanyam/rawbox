import React from 'react';
import { SearchInput } from './SearchInput';

export interface FilterOption {
  value: string;
  label: string;
}

export interface ToolbarFilter {
  id: string;
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}

export interface AdminToolbarProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: ToolbarFilter[];
  actions?: React.ReactNode;
  className?: string;
  showSearch?: boolean;
  children?: React.ReactNode;
}

export const AdminToolbar: React.FC<AdminToolbarProps> = ({
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  filters = [],
  actions,
  className = '',
  showSearch = true,
  children,
}) => {
  return (
    <div
      role="toolbar"
      aria-label="List controls"
      className={`flex flex-col md:flex-row md:items-center gap-3 md:gap-4 ${className}`}
    >
      {showSearch && onSearchChange && (
        <SearchInput
          value={searchValue}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
          className="w-full md:max-w-xs lg:max-w-sm"
        />
      )}

      {filters.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {filters.map((filter) => (
            <div key={filter.id} className="relative flex-1 sm:flex-none">
              <label htmlFor={filter.id} className="sr-only">{filter.label}</label>
              <select
                id={filter.id}
                value={filter.value}
                onChange={(e) => filter.onChange(e.target.value)}
                className="
                  w-full sm:w-auto px-3 py-2 text-sm
                  border border-border rounded-md bg-surface text-foreground
                  focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
                  cursor-pointer transition-colors
                "
                aria-label={filter.label}
              >
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      {children && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar max-w-full">
          {children}
        </div>
      )}

      {actions && <div className="hidden md:block flex-grow" />}
      {actions && (
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 no-scrollbar">
          {actions}
        </div>
      )}
    </div>
  );
};

export interface PageHeaderProps {
  breadcrumb?: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
  headingId?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  breadcrumb,
  title,
  subtitle,
  actions,
  className = '',
  headingId,
}) => {
  return (
    <header className={`flex flex-col md:flex-row md:items-start md:justify-between gap-4 ${className}`}>
      <div className="space-y-1">
        {breadcrumb && (
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{breadcrumb}</p>
        )}
        <h1 id={headingId} className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground max-w-2xl">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
          {actions}
        </div>
      )}
    </header>
  );
};