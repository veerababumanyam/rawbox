import React, { useState, useCallback } from 'react';
import {
  ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Inbox,
} from 'lucide-react';
import { AppCard } from './AppCard';
import { AppButton, AppIconButton } from './AppButton';

export type SortOrder = 'asc' | 'desc';

export interface DataTableColumn<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  render?: (row: T, index: number) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
  hideOnMobile?: boolean;
}

export interface DataTablePagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  loading?: boolean;
  pagination?: DataTablePagination;
  onPageChange?: (page: number) => void;
  onSort?: (key: string, order: SortOrder) => void;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  emptyTitle?: string;
  caption?: string;
  className?: string;
}

interface SortState {
  key: string;
  order: SortOrder;
}

export function DataTable<T>({
  data,
  columns,
  loading = false,
  pagination,
  onPageChange,
  onSort,
  onRowClick,
  emptyMessage = 'No data available',
  emptyTitle = 'No data found',
  caption,
  className = '',
}: DataTableProps<T>) {
  const [sortState, setSortState] = useState<SortState | null>(null);

  const handleSort = useCallback((key: string) => {
    const newOrder: SortOrder = sortState?.key === key && sortState.order === 'asc' ? 'desc' : 'asc';
    setSortState({ key, order: newOrder });
    onSort?.(key, newOrder);
  }, [sortState, onSort]);

  const renderSortIcon = (key: string, sortable?: boolean) => {
    if (!sortable) return null;
    if (sortState?.key === key) {
      return sortState.order === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
    }
    return <ChevronsUpDown className="w-4 h-4 opacity-50" />;
  };

  if (loading) {
    return (
      <AppCard padding="none" className={`overflow-hidden ${className}`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/30 border-b border-border">
              <tr>{columns.map((col, idx) => <th key={idx} className="px-4 py-3"><div className="h-4 bg-muted/50 rounded w-20 animate-pulse" /></th>)}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[...Array(5)].map((_, r) => <tr key={r}>{columns.map((_, c) => <td key={c} className="px-4 py-3"><div className="h-4 bg-muted/50 rounded animate-pulse" /></td>)}</tr>)}
            </tbody>
          </table>
        </div>
      </AppCard>
    );
  }

  if (!data || data.length === 0) {
    return (
      <AppCard className={`text-center py-12 ${className}`}>
        <Inbox className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">{emptyTitle}</h3>
        <p className="text-muted-foreground max-w-md mx-auto">{emptyMessage}</p>
      </AppCard>
    );
  }

  return (
    <AppCard padding="none" className={`overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full" role="grid">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead className="bg-muted/30 border-b border-border">
            <tr role="row">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  scope="col"
                  className={`
                    px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide
                    ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'}
                    ${col.sortable ? 'cursor-pointer hover:bg-muted/50 transition-colors select-none' : ''}
                    ${col.hideOnMobile ? 'hidden md:table-cell' : ''}
                  `}
                  style={{ width: col.width }}
                  onClick={col.sortable ? () => handleSort(String(col.key)) : undefined}
                >
                  <div className={`flex items-center gap-1 ${col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : ''}`}>
                    <span>{col.header}</span>
                    {renderSortIcon(String(col.key), col.sortable)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                role="row"
                className={`hover:bg-muted/30 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={(e) => onRowClick?.(row)}
              >
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className={`px-4 py-3 text-sm text-foreground ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'} ${col.hideOnMobile ? 'hidden md:table-cell' : ''}`}>
                    {col.render ? col.render(row, rowIdx) : String((row as any)[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pagination && pagination.pages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-border">
          <div className="text-sm text-muted-foreground">Page {pagination.page} of {pagination.pages}</div>
          <div className="flex items-center gap-1">
            <AppIconButton icon={ChevronLeft} variant="ghost" size="sm" onClick={() => onPageChange?.(pagination.page - 1)} disabled={pagination.page === 1} aria-label="Prev" />
            <AppIconButton icon={ChevronRight} variant="ghost" size="sm" onClick={() => onPageChange?.(pagination.page + 1)} disabled={pagination.page === pagination.pages} aria-label="Next" />
          </div>
        </div>
      )}
    </AppCard>
  );
}