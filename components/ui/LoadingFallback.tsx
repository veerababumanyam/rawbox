import React from 'react';
import { Loader2 } from 'lucide-react';

export interface LoadingFallbackProps {
    message?: string;
    fullScreen?: boolean;
}

/**
 * LoadingFallback Component
 * 
 * Displays a loading spinner while lazy-loaded components are being fetched.
 * Used as Suspense fallback for code-split components.
 */
export const LoadingFallback: React.FC<LoadingFallbackProps> = ({
    message = 'Loading...',
    fullScreen = false,
}) => {
    const containerClass = fullScreen
        ? 'fixed inset-0 flex items-center justify-center bg-background'
        : 'flex items-center justify-center p-8';

    return (
        <div className={containerClass} role="status" aria-live="polite">
            <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-accent animate-spin" aria-hidden="true" />
                <p className="text-sm text-muted-foreground">{message}</p>
                <span className="sr-only">{message}</span>
            </div>
        </div>
    );
};
