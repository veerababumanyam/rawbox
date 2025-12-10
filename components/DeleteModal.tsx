
import React, { useState, useEffect, useRef } from 'react';
import { Trash2, AlertTriangle, Calendar, Clock, ShieldAlert, RefreshCw, CalendarDays } from 'lucide-react';
import { AppButton } from './ui/AppButton';
import { AppToggle } from './ui/AppInput';

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (options: DeleteOptions) => void;
  count: number;
  itemType: 'photo' | 'album';
  retentionDays?: number;
}

export interface DeleteOptions {
  type: 'soft' | 'scheduled' | 'hide';
  date?: string; // ISO date string
}

export const DeleteModal: React.FC<DeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  count,
  itemType,
  retentionDays = 7,
}) => {
  const [deleteType, setDeleteType] = useState<'soft' | 'scheduled'>('soft');
  const [scheduleDate, setScheduleDate] = useState<string>('');
  const [withPublicExpiry, setWithPublicExpiry] = useState(false);
  const [publicExpiryDate, setPublicExpiryDate] = useState<string>('');
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus trap
  useEffect(() => {
    if (!isOpen) return;

    const modal = modalRef.current;
    if (!modal) return;

    const focusableElements = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    };

    modal.addEventListener('keydown', handleTab);
    firstElement?.focus();

    return () => modal.removeEventListener('keydown', handleTab);
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (deleteType === 'soft') {
      onConfirm({ type: 'soft' });
    } else if (deleteType === 'scheduled' && scheduleDate) {
      onConfirm({ type: 'scheduled', date: scheduleDate });
    }
    onClose();
  };

  const setDatePreset = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    setScheduleDate(date.toISOString().split('T')[0]);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Overlay - NOT keyboard interactive */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        role="presentation"
        aria-hidden="true"
      />

      <div
        ref={modalRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
        aria-describedby="delete-modal-description"
        className="relative bg-surface w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
      >
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-destructive-soft flex items-center justify-center shrink-0">
              <Trash2 className="w-6 h-6 text-destructive-DEFAULT" aria-hidden="true" />
            </div>
            <div>
              <h2 id="delete-modal-title" className="text-xl font-semibold text-foreground">
                Delete {count} {itemType}{count > 1 ? 's' : ''}?
              </h2>
              <p id="delete-modal-description" className="text-sm text-muted-foreground">
                Choose how you want to remove {count > 1 ? 'these items' : 'this item'}.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Option 1: Move to Recycle Bin (Soft Delete) */}
            <div
              className={`
                p-4 rounded-lg border cursor-pointer transition-all duration-200
                ${deleteType === 'soft'
                  ? 'border-destructive-DEFAULT bg-destructive-soft/30 ring-1 ring-destructive-DEFAULT/50'
                  : 'border-border hover:bg-muted/50'}
              `}
              onClick={() => setDeleteType('soft')}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center ${deleteType === 'soft' ? 'border-destructive-DEFAULT' : 'border-muted-foreground'}`}>
                  {deleteType === 'soft' && <div className="w-2 h-2 rounded-full bg-destructive-DEFAULT" />}
                </div>
                <div>
                  <span className="block font-medium text-foreground">Move to Recycle Bin</span>
                  <span className="text-xs text-muted-foreground">
                    Items will be moved to the Recycle Bin and permanently deleted after <span className="font-semibold">{retentionDays} days</span>.
                  </span>
                </div>
              </div>
            </div>

            {/* Option 2: Scheduled Delete */}
            <div
              className={`
                p-4 rounded-lg border cursor-pointer transition-all duration-200
                ${deleteType === 'scheduled'
                  ? 'border-accent-DEFAULT bg-accent-light ring-1 ring-accent-DEFAULT/50'
                  : 'border-border hover:bg-muted/50'}
              `}
              onClick={() => setDeleteType('scheduled')}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center ${deleteType === 'scheduled' ? 'border-accent-DEFAULT' : 'border-muted-foreground'}`}>
                  {deleteType === 'scheduled' && <div className="w-2 h-2 rounded-full bg-accent-DEFAULT" />}
                </div>
                <div>
                  <span className="block font-medium text-foreground">Schedule Permanent Deletion</span>
                  <span className="text-xs text-muted-foreground">Keep visible until a specific date, then permanently delete.</span>
                </div>
              </div>

              {deleteType === 'scheduled' && (
                <div className="ml-7 animate-in slide-in-from-top-2 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Select Date:</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:ring-2 focus:ring-accent-DEFAULT focus:outline-none"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); setDatePreset(7); }}
                      className="flex-1 px-2 py-1.5 text-xs font-medium bg-surface border border-border rounded hover:bg-muted transition-colors"
                    >
                      +7 Days
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDatePreset(30); }}
                      className="flex-1 px-2 py-1.5 text-xs font-medium bg-surface border border-border rounded hover:bg-muted transition-colors"
                    >
                      +30 Days
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDatePreset(90); }}
                      className="flex-1 px-2 py-1.5 text-xs font-medium bg-surface border border-border rounded hover:bg-muted transition-colors"
                    >
                      +90 Days
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Public Expiry Toggle (Independent) */}
            <div className="pt-4 border-t border-border opacity-70 hover:opacity-100 transition-opacity">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-warning-DEFAULT" />
                  <span className="text-sm font-medium">Public Visibility</span>
                </div>
                <AppToggle
                  checked={withPublicExpiry}
                  onChange={setWithPublicExpiry}
                  size="sm"
                />
              </div>
              {withPublicExpiry && (
                <div className="pl-6 animate-in slide-in-from-top-2">
                  <p className="text-xs text-muted-foreground mb-2">
                    Hide from public gallery without deleting internally.
                  </p>
                  <input
                    type="date"
                    className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background"
                    value={publicExpiryDate}
                    onChange={(e) => setPublicExpiryDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              )}
            </div>

          </div>
        </div>

        <div className="p-6 bg-muted/20 border-t border-border flex justify-end gap-3">
          <AppButton variant="ghost" onClick={onClose}>Cancel</AppButton>
          <AppButton
            variant={deleteType === 'soft' ? 'destructive' : 'primary'}
            onClick={handleConfirm}
            disabled={deleteType === 'scheduled' && !scheduleDate}
          >
            {deleteType === 'soft' ? 'Move to Recycle Bin' : 'Schedule Delete'}
          </AppButton>
        </div>
      </div>
    </div>
  );
};
