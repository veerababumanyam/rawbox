import React from 'react';
import { LucideIcon } from 'lucide-react';
import { AppView } from '../../types';

interface NavItemProps {
    view: AppView;
    icon: LucideIcon;
    label: string;
    currentView: AppView;
    onClick: (view: AppView) => void;
}

export const NavItem: React.FC<NavItemProps> = ({
    view,
    icon: Icon,
    label,
    currentView,
    onClick
}) => {
    const isActive = currentView === view;

    return (
        <button
            type="button"
            onClick={() => onClick(view)}
            aria-current={isActive ? 'page' : undefined}
            className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors w-full
                ${isActive
                    ? 'bg-accent/10 text-accent-DEFAULT'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }
            `}
        >
            <Icon className="w-5 h-5" aria-hidden="true" />
            {label}
        </button>
    );
};
