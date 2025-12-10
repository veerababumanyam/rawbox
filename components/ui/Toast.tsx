import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { Toast as ToastType } from '../../hooks/useToast';

interface ToastProps {
    toast: ToastType;
    onClose: (id: string) => void;
}

const iconMap = {
    success: CheckCircle2,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info
};

const colorMap = {
    success: 'bg-success-soft border-success-DEFAULT/20 text-success-DEFAULT',
    error: 'bg-destructive-soft border-destructive-DEFAULT/20 text-destructive-DEFAULT',
    warning: 'bg-warning-soft border-warning-DEFAULT/20 text-warning-DEFAULT',
    info: 'bg-accent/10 border-accent-DEFAULT/20 text-accent-DEFAULT'
};

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
    const Icon = iconMap[toast.type];
    const colorClass = colorMap[toast.type];

    return (
        <div
            role="alert"
            aria-live="assertive"
            className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg backdrop-blur-sm animate-in slide-in-from-top-2 ${colorClass}`}
        >
            <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
            <button
                onClick={() => onClose(toast.id)}
                className="flex-shrink-0 hover:opacity-70 transition-opacity"
                aria-label="Close notification"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};

interface ToastContainerProps {
    toasts: ToastType[];
    onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
    if (toasts.length === 0) return null;

    return (
        <div
            className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-md w-full pointer-events-none"
            aria-live="polite"
            aria-atomic="false"
        >
            {toasts.map(toast => (
                <div key={toast.id} className="pointer-events-auto">
                    <Toast toast={toast} onClose={onClose} />
                </div>
            ))}
        </div>
    );
};
