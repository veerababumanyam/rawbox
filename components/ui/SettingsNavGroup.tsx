import React from 'react';
import { Settings, ChevronDown, ChevronRight, Globe, Palette, Building2, User, Plug, FileText } from 'lucide-react';
import { NavItem } from './NavItem';
import { AppView } from '../../types';

interface SettingsNavGroupProps {
    isOpen: boolean;
    onToggle: () => void;
    currentView: AppView;
    onNavigate: (view: AppView) => void;
}

const SETTINGS_MENU_ITEMS = [
    { view: 'settings-public' as AppView, icon: Globe, label: 'Visibility & SEO' },
    { view: 'settings-brand' as AppView, icon: Palette, label: 'Brand Defaults' },
    { view: 'settings-company' as AppView, icon: Building2, label: 'Company Info' },
    { view: 'settings-personal' as AppView, icon: User, label: 'Personal Info' },
    { view: 'settings-integrations' as AppView, icon: Plug, label: 'Integrations' },
    { view: 'settings-policies' as AppView, icon: FileText, label: 'Policies' },
] as const;

export const SettingsNavGroup: React.FC<SettingsNavGroupProps> = ({
    isOpen,
    onToggle,
    currentView,
    onNavigate
}) => {
    const isSettingsActive = currentView.startsWith('settings');

    return (
        <div>
            <button
                type="button"
                onClick={onToggle}
                aria-expanded={isOpen}
                aria-controls="settings-submenu"
                className={`flex items-center justify-between gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors w-full
          ${isSettingsActive ? 'text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}
        `}
            >
                <div className="flex items-center gap-3">
                    <Settings className="w-5 h-5" aria-hidden="true" />
                    Settings
                </div>
                {isOpen ? <ChevronDown className="w-4 h-4" aria-hidden="true" /> : <ChevronRight className="w-4 h-4" aria-hidden="true" />}
            </button>

            {isOpen && (
                <div
                    id="settings-submenu"
                    role="group"
                    aria-label="Settings options"
                    className="pl-10 space-y-1 mt-1 animate-in slide-in-from-top-1 duration-200"
                >
                    {SETTINGS_MENU_ITEMS.map(({ view, icon, label }) => (
                        <NavItem
                            key={view}
                            view={view}
                            icon={icon}
                            label={label}
                            currentView={currentView}
                            onClick={onNavigate}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
