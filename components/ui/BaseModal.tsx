import React, { useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { AppIconButton } from './AppButton';

export interface BaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
    titleId?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    closeOnOverlayClick?: boolean;
    showCloseButton?: boolean;
    className?: string;
}

const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full mx-4',
};

/**
 * BaseModal - Accessible modal component following WCAG 2.1 AA standards
 * 
 * Features:
 * - Focus trap within modal
 * - Escape key to close
 * - Focus return to trigger element
 * - Non-interactive overlay (click-to-close for mouse users)
 * - Proper ARIA attributes
 * 
 * @example
 * const MyModal = () => {
 *   const [isOpen, setIsOpen] = useState(false);
 *   return (
 *     <BaseModal 
 *       isOpen={isOpen} 
 *       onClose={() => setIsOpen(false)}
 *       title="My Modal"
 *     >
 *       <p>Modal content</p>
 *     </BaseModal>
 *   );
 * };
 */
export const BaseModal: React.FC<BaseModalProps> = ({
    isOpen,
    onClose,
    children,
    title,
    titleId = 'modal-title',
    size = 'md',
    closeOnOverlayClick = true,
    showCloseButton = true,
    className = '',
}) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const previousActiveElement = useRef<HTMLElement | null>(null);

    // Store the element that triggered the modal
    useEffect(() => {
        if (isOpen) {
            previousActiveElement.current = document.activeElement as HTMLElement;
        }
    }, [isOpen]);

    // Focus trap implementation
    useEffect(() => {
        if (!isOpen) return;

        const modal = modalRef.current;
        if (!modal) return;

        const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

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

        // Focus first element when modal opens
        setTimeout(() => firstElement?.focus(), 100);

        return () => modal.removeEventListener('keydown', handleTab);
    }, [isOpen]);

    // Handle close and return focus
    const handleClose = useCallback(() => {
        onClose();
        // Return focus to trigger element
        setTimeout(() => {
            previousActiveElement.current?.focus();
        }, 100);
    }, [onClose]);

    // Escape key handler
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                handleClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, handleClose]);

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

    const handleOverlayClick = () => {
        if (closeOnOverlayClick) {
            handleClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            {/* Overlay - NOT keyboard interactive */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={handleOverlayClick}
                role="presentation"
                aria-hidden="true"
            />

            {/* Modal content */}
            <div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? titleId : undefined}
                className={`
          relative bg-surface w-full ${sizeClasses[size]} rounded-xl shadow-2xl 
          overflow-hidden animate-in zoom-in-95 duration-200
          ${className}
        `}
            >
                {/* Header */}
                {(title || showCloseButton) && (
                    <div className="flex items-center justify-between p-6 border-b border-border">
                        {title && (
                            <h2 id={titleId} className="text-xl font-semibold text-foreground">
                                {title}
                            </h2>
                        )}
                        {showCloseButton && (
                            <AppIconButton
                                icon={X}
                                aria-label="Close modal"
                                onClick={handleClose}
                                variant="ghost"
                                size="sm"
                                className="ml-auto"
                            />
                        )}
                    </div>
                )}

                {/* Content */}
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};
