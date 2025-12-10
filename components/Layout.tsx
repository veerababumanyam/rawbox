
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Sun, Moon, LayoutGrid, LogOut, Menu, X, Users, BookOpen,
  Settings, ChevronDown, ChevronRight, Globe, Palette,
  Building2, User, Plug, FileText
} from 'lucide-react';
import { AppIconButton } from './ui/AppButton';
import { SkipToContent } from './ui/SkipToContent';
import { NavItem } from './ui/NavItem';
import { SettingsNavGroup } from './ui/SettingsNavGroup';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../contexts/AuthContext';
import { AppView } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  isClientView?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onNavigate, isClientView = false }) => {
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Auto-open settings if current view is a settings sub-view
  useEffect(() => {
    if (currentView.startsWith('settings-')) {
      setIsSettingsOpen(true);
    }
  }, [currentView]);

  // Close sidebar and return focus to trigger button
  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
    // Return focus to menu button on mobile
    if (window.innerWidth < 1024) {
      setTimeout(() => menuButtonRef.current?.focus(), 100);
    }
  }, []);

  // Handle Escape key to close sidebar
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSidebarOpen) {
        closeSidebar();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isSidebarOpen, closeSidebar]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isSidebarOpen]);

  // Focus trap for mobile sidebar
  useEffect(() => {
    if (!isSidebarOpen || window.innerWidth >= 1024) return;

    const sidebar = sidebarRef.current;
    if (!sidebar) return;

    const focusableElements = sidebar.querySelectorAll(
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

    sidebar.addEventListener('keydown', handleTab);
    firstElement?.focus();

    return () => sidebar.removeEventListener('keydown', handleTab);
  }, [isSidebarOpen]);

  // Memoized navigation handler with focus return
  const handleNavigation = useCallback((view: AppView) => {
    onNavigate(view);
    closeSidebar();
  }, [onNavigate, closeSidebar]);

  if (isClientView) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
        <SkipToContent />
        <main id="main-content" className="flex-1 w-full mx-auto animate-in fade-in duration-500">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <SkipToContent />

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={closeSidebar}
          role="presentation"
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        role="navigation"
        aria-label="Main navigation"
        aria-modal={isSidebarOpen ? "true" : undefined}
        className={`
          fixed lg:static inset-y-0 left-0 z-50 w-64 bg-surface border-r border-border transform transition-transform duration-200 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-border flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img
                src="/android-chrome-192x192.png"
                alt="RawBox Logo"
                className="w-10 h-10"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                RawBox
              </h1>
            </div>
            <button
              type="button"
              onClick={closeSidebar}
              aria-label="Close navigation menu"
              className="lg:hidden text-text-tertiary hover:text-foreground transition-colors"
            >
              <X className="w-6 h-6" aria-hidden="true" />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
            <NavItem view="albums" icon={LayoutGrid} label="Galleries" currentView={currentView} onClick={handleNavigation} />
            <NavItem view="print-albums" icon={BookOpen} label="Print Albums" currentView={currentView} onClick={handleNavigation} />
            <NavItem view="clients" icon={Users} label="Clients" currentView={currentView} onClick={handleNavigation} />
            <NavItem view="people" icon={Users} label="People & Pets" currentView={currentView} onClick={handleNavigation} />

            <div className="pt-4 pb-2">
              <span className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">System</span>
            </div>

            {/* Settings Group */}
            <SettingsNavGroup
              isOpen={isSettingsOpen}
              onToggle={() => setIsSettingsOpen(!isSettingsOpen)}
              currentView={currentView}
              onNavigate={handleNavigation}
            />
          </nav>

          <div className="p-4 border-t border-border">
            {/* User Information */}
            {user && (
              <div className="px-4 py-3 mb-3 bg-surface rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-accent/10 rounded-full">
                    <User className="w-5 h-5 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {user.displayName || user.username}
                    </p>
                    <p className="text-xs text-text-tertiary truncate">
                      {user.role}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between px-4 py-2" role="group" aria-labelledby="theme-label">
              <span className="text-sm text-text-tertiary" id="theme-label">Theme</span>
              <AppIconButton
                icon={isDark ? Sun : Moon}
                aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
                aria-describedby="theme-label"
                onClick={toggleTheme}
                size="sm"
              />
            </div>
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-error hover:bg-surface-hover rounded-lg w-full mt-2 transition-colors"
            >
              <LogOut className="w-5 h-5" aria-hidden="true" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Mobile Header */}
        <div className="lg:hidden p-4 border-b border-border bg-surface flex items-center justify-between sticky top-0 z-30">
          <AppIconButton
            ref={menuButtonRef}
            icon={Menu}
            aria-label="Open navigation menu"
            aria-expanded={isSidebarOpen}
            onClick={() => setSidebarOpen(true)}
          />
          <div className="flex items-center gap-2">
            <img
              src="/favicon-32x32.png"
              alt=""
              className="w-6 h-6"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <span className="font-semibold text-foreground">RawBox</span>
          </div>
          <div className="w-10" /> {/* Spacer */}
        </div>

        <div
          id="main-content"
          role="region"
          aria-label="Main content"
          className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 scroll-smooth bg-background"
        >
          {children}
        </div>
      </main>
    </div>
  );
};
