
import React, { useState, useEffect, useRef } from 'react';
import { AppSettings, PhotographerProfile, ProfileSocials, ProfileTheme, ThemeStyles, BrandingSettings, Policies, AppLanguage, AppView } from '../types';
import { AppCard } from './ui/AppCard';
import { AppInput, AppToggle, AppSelect, AppTextarea } from './ui/AppInput';
import { AppButton, AppIconButton } from './ui/AppButton';
import { Globe, Building2, Palette, QrCode, ExternalLink, Copy as CopyIcon, Download, Share2, Upload, Megaphone, Mail, Smartphone, MapPin, Check, RotateCcw, ChevronDown, ImageIcon, Save, User, FileText, Plug, EyeOff, Eye, Languages, Link as LinkIcon, Plus, Trash2, X, CheckCircle2, Loader2, AlertCircle, Wand2, Sparkles } from 'lucide-react';
import { generateLegalPolicy } from '../services/geminiService';

// --- Constants ---
const FONTS = [
    { value: 'inherit', label: 'System Default' },
    { value: 'Inter, sans-serif', label: 'Inter (Clean & Modern)' },
    { value: 'Playfair Display, serif', label: 'Playfair (Elegant Serif)' },
    { value: 'Montserrat, sans-serif', label: 'Montserrat (Geometric)' },
    { value: 'Lato, sans-serif', label: 'Lato (Friendly)' },
    { value: 'Merriweather, serif', label: 'Merriweather (Readable)' },
    { value: 'Poppins, sans-serif', label: 'Poppins (Soft)' },
    { value: 'Raleway, sans-serif', label: 'Raleway (Stylish)' },
    { value: 'Lora, serif', label: 'Lora (Contemporary)' },
    { value: 'Open Sans, sans-serif', label: 'Open Sans (Neutral)' },
    { value: 'Roboto Mono, monospace', label: 'Roboto Mono (Tech)' },
];

const COUNTRIES = [
    { value: 'India', label: 'India' },
    { value: 'United States', label: 'United States' },
    { value: 'United Kingdom', label: 'United Kingdom' },
    { value: 'Australia', label: 'Australia' },
    { value: 'Canada', label: 'Canada' },
    { value: 'UAE', label: 'UAE' },
];

const INDIAN_LANGUAGES = [
    "Assamese", "Bengali", "English", "Gujarati", "Hindi", "Kannada", "Maithili", "Malayalam", "Marathi", "Odia", "Punjabi", "Tamil", "Telugu", "Urdu"
];

const WM_POSITIONS = [
    { value: 'center', label: 'Center' },
    { value: 'bottom-right', label: 'Bottom Right' },
    { value: 'bottom-left', label: 'Bottom Left' },
    { value: 'top-right', label: 'Top Right' },
    { value: 'top-left', label: 'Top Left' },
    { value: 'repeat', label: 'Tile Pattern' },
];

const SOCIAL_MEDIA_CONFIG: Record<string, { icon: any; color: string; placeholder: string; label: string }> = {
    instagram: { icon: Globe, color: 'text-accent', placeholder: '@username', label: 'Instagram' },
    facebook: { icon: Globe, color: 'text-primary', placeholder: 'Profile URL', label: 'Facebook' },
    whatsapp: { icon: Globe, color: 'text-success', placeholder: 'Phone Number', label: 'WhatsApp' },
    spotify: { icon: Globe, color: 'text-success', placeholder: 'Profile URL', label: 'Spotify' },
    twitter: { icon: Globe, color: 'text-info', placeholder: 'Handle', label: 'Twitter (X)' },
    tiktok: { icon: Globe, color: 'text-text-primary', placeholder: '@username', label: 'TikTok' },
    linkedin: { icon: Globe, color: 'text-primary', placeholder: 'Profile URL', label: 'LinkedIn' },
    snapchat: { icon: Globe, color: 'text-warning', placeholder: 'Username', label: 'Snapchat' },
    youtube: { icon: Globe, color: 'text-error', placeholder: 'Channel URL', label: 'YouTube' },
};

const THEME_PRESETS: ProfileTheme[] = [
    // Standard / Base
    { id: 'light', name: 'Clean Light', isPreset: true, values: { background: '#ffffff', surface: '#ffffff', textMain: '#0f172a', textMuted: '#64748b', accent: '#0f172a', border: '#e2e8f0', font: 'Inter, sans-serif', radius: '0.5rem' } },
    { id: 'dark', name: 'Modern Dark', isPreset: true, values: { background: '#0f172a', surface: '#1e293b', textMain: '#f8fafc', textMuted: '#94a3b8', accent: '#38bdf8', border: '#334155', font: 'Inter, sans-serif', radius: '0.5rem' } },

    // Elegant / Wedding
    { id: 'elegant', name: 'Elegant Ivory', isPreset: true, values: { background: '#fdfbf7', surface: '#ffffff', textMain: '#44403c', textMuted: '#78716c', accent: '#d4a373', border: '#e7e5e4', font: 'Playfair Display, serif', radius: '0px' } },
    { id: 'rose-gold', name: 'Rose Gold', isPreset: true, values: { background: '#fff1f2', surface: '#ffffff', textMain: '#881337', textMuted: '#be123c', accent: '#fb7185', border: '#ffe4e6', font: 'Lora, serif', radius: '1rem' } },

    // Vibrant / Creative
    { id: 'vibrant', name: 'Vibrant Pop', isPreset: true, values: { background: '#fafafa', surface: '#ffffff', textMain: '#18181b', textMuted: '#52525b', accent: '#8b5cf6', border: '#e4e4e7', font: 'Montserrat, sans-serif', radius: '1rem' } },
    { id: 'sunset', name: 'Sunset Glow', isPreset: true, values: { background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', surface: '#ffffff', textMain: '#431407', textMuted: '#9a3412', accent: '#ea580c', border: '#fed7aa', font: 'Poppins, sans-serif', radius: '1.5rem' } },

    // Professional / Corporate
    { id: 'corporate', name: 'Corporate Blue', isPreset: true, values: { background: '#f8fafc', surface: '#ffffff', textMain: '#0f172a', textMuted: '#475569', accent: '#2563eb', border: '#e2e8f0', font: 'Open Sans, sans-serif', radius: '0.375rem' } },
    { id: 'slate', name: 'Slate & Stone', isPreset: true, values: { background: '#f1f5f9', surface: '#ffffff', textMain: '#1e293b', textMuted: '#64748b', accent: '#475569', border: '#cbd5e1', font: 'Lato, sans-serif', radius: '0.25rem' } },

    // Dark / Moody
    { id: 'midnight', name: 'Midnight Pro', isPreset: true, values: { background: '#020617', surface: '#0f172a', textMain: '#f8fafc', textMuted: '#94a3b8', accent: '#38bdf8', border: '#1e293b', font: 'Inter, sans-serif', radius: '0.75rem' } },
    { id: 'forest', name: 'Deep Forest', isPreset: true, values: { background: '#052e16', surface: '#064e3b', textMain: '#ecfdf5', textMuted: '#6ee7b7', accent: '#34d399', border: '#065f46', font: 'Merriweather, serif', radius: '0.5rem' } },
    { id: 'luxury', name: 'Luxury Gold', isPreset: true, values: { background: '#000000', surface: '#111111', textMain: '#ffffff', textMuted: '#a1a1aa', accent: '#fbbf24', border: '#27272a', font: 'Playfair Display, serif', radius: '0px' } },
    { id: 'charcoal', name: 'Matte Charcoal', isPreset: true, values: { background: '#18181b', surface: '#27272a', textMain: '#fafafa', textMuted: '#a1a1aa', accent: '#e4e4e7', border: '#3f3f46', font: 'Inter, sans-serif', radius: '0.5rem' } },

    // Nature / Soft
    { id: 'sage', name: 'Organic Sage', isPreset: true, values: { background: '#f2fce2', surface: '#ffffff', textMain: '#14532d', textMuted: '#166534', accent: '#4ade80', border: '#dcfce7', font: 'Raleway, sans-serif', radius: '1rem' } },
    { id: 'ocean', name: 'Ocean Breeze', isPreset: true, values: { background: 'linear-gradient(to bottom, #ecfeff, #cffafe)', surface: '#ffffff', textMain: '#0e7490', textMuted: '#155e75', accent: '#06b6d4', border: '#a5f3fc', font: 'Lato, sans-serif', radius: '1.5rem' } },
    { id: 'lavender', name: 'Soft Lavender', isPreset: true, values: { background: '#faf5ff', surface: '#ffffff', textMain: '#581c87', textMuted: '#7e22ce', accent: '#a855f7', border: '#f3e8ff', font: 'Poppins, sans-serif', radius: '1rem' } },
    { id: 'sand', name: 'Desert Sand', isPreset: true, values: { background: '#fffbeb', surface: '#ffffff', textMain: '#78350f', textMuted: '#92400e', accent: '#d97706', border: '#fde68a', font: 'Merriweather, serif', radius: '0.25rem' } },

    // High Energy
    { id: 'cyber', name: 'Cyber Neon', isPreset: true, values: { background: '#09090b', surface: '#18181b', textMain: '#ffffff', textMuted: '#a1a1aa', accent: '#22c55e', border: '#27272a', font: 'Roboto Mono, monospace', radius: '0px' } },
    { id: 'berry', name: 'Wild Berry', isPreset: true, values: { background: '#4a044e', surface: '#701a75', textMain: '#fbcfe8', textMuted: '#e879f9', accent: '#f0abfc', border: '#86198f', font: 'Montserrat, sans-serif', radius: '1rem' } },
    { id: 'teal', name: 'Electric Teal', isPreset: true, values: { background: '#134e4a', surface: '#115e59', textMain: '#ccfbf1', textMuted: '#5eead4', accent: '#2dd4bf', border: '#14b8a6', font: 'Poppins, sans-serif', radius: '0.5rem' } },
    { id: 'royal', name: 'Royal Indigo', isPreset: true, values: { background: '#1e1b4b', surface: '#312e81', textMain: '#e0e7ff', textMuted: '#818cf8', accent: '#6366f1', border: '#3730a3', font: 'Inter, sans-serif', radius: '0.75rem' } },
];

// --- Helper Components ---

const SettingsField: React.FC<{ isVisible: boolean; onToggleVisibility: () => void; children: React.ReactNode }> = ({ isVisible, onToggleVisibility, children }) => (
    <div className="flex gap-2 items-start w-full group relative">
        <div className="flex-1 min-w-0">{children}</div>
        <button
            onClick={onToggleVisibility}
            className={`
                mt-8 p-2.5 rounded-lg transition-all duration-200 border shadow-sm
                ${isVisible
                    ? 'text-success bg-success/10 border-success/30 hover:bg-success/20'
                    : 'text-error bg-error/10 border-error/30 hover:bg-error/20'
                }
                focus:outline-none focus:ring-2 focus:ring-offset-1
            `}
            title={isVisible ? "Visible on public profile" : "Hidden from public profile"}
            type="button"
        >
            {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
    </div>
);

const ThemeColorPicker: React.FC<{ label: string; value: string; onChange: (val: string) => void }> = ({ label, value, onChange }) => (
    <div>
        <label className="block text-xs font-medium text-muted-foreground uppercase mb-1.5">{label}</label>
        <div className="flex gap-2 items-center">
            <div className="relative w-8 h-8 rounded-full border border-border overflow-hidden shadow-sm shrink-0">
                <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] cursor-pointer p-0 border-0" />
            </div>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-20 px-2 py-1 text-xs border border-border rounded-md font-mono bg-surface"
            />
        </div>
    </div>
);

const MobilePreview: React.FC<{ profile: PhotographerProfile; defaults: BrandingSettings }> = ({ profile, defaults }) => {
    const { personal, company, personalVisibility, companyVisibility, settings } = profile;

    // Resolve Theme
    const theme = settings.theme?.values || {
        background: '#ffffff',
        surface: '#ffffff',
        textMain: '#0f172a',
        textMuted: '#64748b',
        accent: defaults.primaryColor || '#000000',
        border: '#e2e8f0',
        font: defaults.fontFamily || 'inherit',
        radius: '0.5rem'
    };

    // Helper to check visibility
    const isVisible = (visMap: any, path: string[]) => {
        let current = visMap;
        for (const key of path) {
            if (current === undefined || current === null) return false;
            current = current[key];
        }
        return current === true;
    };

    // Resolve Display Data (Prioritize Company, then Personal)
    const showCompany = company.name && isVisible(companyVisibility, ['name']);
    const displayName = showCompany ? company.name : `${personal.firstName} ${personal.lastName}`;

    let displayBio = "";
    if (showCompany) {
        displayBio = (company.tagline && isVisible(companyVisibility, ['tagline'])) ? company.tagline : '';
    } else {
        displayBio = [
            personal.nickname && isVisible(personalVisibility, ['nickname']) ? `"${personal.nickname}"` : null,
            personal.contact && isVisible(personalVisibility, ['contact']) ? personal.contact : null
        ].filter(Boolean).join(' • ');
    }

    const displayImage = (showCompany && company.logoUrl && isVisible(companyVisibility, ['logoUrl']))
        ? company.logoUrl
        : (personal.photoUrl && isVisible(personalVisibility, ['photoUrl']))
            ? personal.photoUrl
            : null;

    return (
        <div className="hidden xl:block w-[320px] shrink-0 sticky top-6">
            <div className="relative w-[320px] h-[640px] bg-black rounded-[40px] border-[8px] border-black shadow-2xl overflow-hidden ring-4 ring-offset-2 ring-border/50">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-xl z-20"></div>

                {/* Simulated Screen */}
                <div
                    className="w-full h-full overflow-y-auto no-scrollbar flex flex-col transition-all duration-300"
                    style={{
                        background: theme.background,
                        color: theme.textMain,
                        fontFamily: theme.font
                    }}
                >
                    {/* Header Bg */}
                    <div className="h-32 shrink-0 relative overflow-hidden">
                        <div className="absolute inset-0 opacity-20" style={{ background: theme.accent }} />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10" />
                    </div>

                    {/* Content */}
                    <div className="px-5 -mt-16 flex flex-col items-center flex-1 pb-8">
                        {/* Avatar */}
                        <div
                            className="w-28 h-28 border-[4px] overflow-hidden shadow-lg mb-3 shrink-0 relative z-10"
                            style={{
                                borderRadius: theme.radius,
                                borderColor: theme.background,
                                background: theme.surface
                            }}
                        >
                            {displayImage ? (
                                <img src={displayImage} alt="Studio logo" className="w-full h-full object-cover" width="200" height="200" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-3xl font-bold opacity-30">
                                    <User className="w-12 h-12" />
                                </div>
                            )}
                        </div>

                        {/* Text */}
                        <div className="text-center mb-6 w-full">
                            <h2 className="font-bold text-xl leading-tight mb-1">{displayName || 'Your Name'}</h2>
                            {displayBio && <p className="text-xs opacity-70">{displayBio}</p>}
                        </div>

                        {/* Actions */}
                        <div className="grid grid-cols-2 gap-3 w-full mb-6 shrink-0">
                            <div className="h-10 flex items-center justify-center gap-1.5 text-xs font-bold shadow-md transition-transform active:scale-95" style={{ background: theme.accent, color: '#fff', borderRadius: theme.radius }}>
                                <Download className="w-3 h-3" /> Save
                            </div>
                            <div className="h-10 flex items-center justify-center gap-1.5 text-xs font-bold border shadow-sm transition-transform active:scale-95" style={{ background: theme.surface, borderColor: theme.border, borderRadius: theme.radius }}>
                                <Share2 className="w-3 h-3" /> Share
                            </div>
                        </div>

                        {/* Mock Sections */}
                        <div className="w-full space-y-3">
                            <div className="p-3 border flex items-center gap-3 transition-colors hover:bg-black/5" style={{ background: theme.surface, borderColor: theme.border, borderRadius: theme.radius }}>
                                <div className="w-8 h-8 rounded flex items-center justify-center opacity-10" style={{ background: theme.accent }}><Mail className="w-4 h-4" style={{ color: theme.accent }} /></div>
                                <div className="h-2 w-24 bg-current opacity-10 rounded"></div>
                            </div>
                            <div className="p-3 border flex items-center gap-3 transition-colors hover:bg-black/5" style={{ background: theme.surface, borderColor: theme.border, borderRadius: theme.radius }}>
                                <div className="w-8 h-8 rounded flex items-center justify-center opacity-10" style={{ background: theme.accent }}><Globe className="w-4 h-4" style={{ color: theme.accent }} /></div>
                                <div className="h-2 w-32 bg-current opacity-10 rounded"></div>
                            </div>

                            {/* Grid Mockup */}
                            <div className="grid grid-cols-3 gap-1 pt-4 border-t" style={{ borderColor: theme.border }}>
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <div key={i} className="aspect-square bg-black/5 rounded-sm relative overflow-hidden border border-white/20">
                                        {defaults.showWatermark && (
                                            <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
                                                <span className="text-[6px] font-bold uppercase -rotate-12">{defaults.brandName || displayName}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <p className="text-center text-xs text-muted-foreground mt-4 font-medium">Live Mobile Preview</p>
        </div>
    );
};

// --- Props & Component ---

interface SettingsViewProps {
    settings: AppSettings;
    onUpdateSettings: (s: AppSettings) => void;
    language: AppLanguage;
    onUpdateLanguage: (lang: AppLanguage) => void;
    onNavigate: (view: AppView) => void;
    section: 'public' | 'brand' | 'company' | 'personal' | 'integrations' | 'policies';
    storageConnections: { id: string; name: string }[];
}

export const SettingsView: React.FC<SettingsViewProps> = ({
    settings,
    onUpdateSettings,
    language,
    onUpdateLanguage,
    onNavigate,
    section,
    storageConnections,
}) => {
    const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
    const [isDirty, setIsDirty] = useState(false);
    const [isThemeCustomizing, setIsThemeCustomizing] = useState(false);

    // Slug State
    const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
    const slugTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Policy Generation State
    const [generatingPolicy, setGeneratingPolicy] = useState<string | null>(null);

    const logoInputRef = useRef<HTMLInputElement>(null);
    const wmLogoRef = useRef<HTMLInputElement>(null);
    const avatarInputRef = useRef<HTMLInputElement>(null);

    // Sync local settings when storageConnections changes
    useEffect(() => {
        const newIntegrations = { ...localSettings.integrations };
        newIntegrations.googleDrive = storageConnections.some(conn => conn.id === 'google-drive');
        newIntegrations.dropbox = storageConnections.some(conn => conn.id === 'dropbox');
        setLocalSettings(prev => ({ ...prev, integrations: newIntegrations }));
    }, [storageConnections]);

    // Update Helpers
    const updateLocal = (updater: (prev: AppSettings) => AppSettings) => {
        setLocalSettings(updater);
        setIsDirty(true);
    };

    const handleSave = () => {
        onUpdateSettings(localSettings);
        setIsDirty(false);
    };

    const handleDiscard = () => {
        setLocalSettings(settings);
        setIsDirty(false);
    };

    // Helper to toggle visibility of fields
    const toggleVisibility = (section: 'company' | 'personal', key: string, subKey?: string) => {
        const mapName = section === 'company' ? 'companyVisibility' : 'personalVisibility';
        updateLocal(prev => {
            const profile = prev.photographerProfile;
            const currentMap = profile[mapName] as any;
            const newMap = { ...currentMap };

            if (subKey) {
                if (!newMap[key]) newMap[key] = {};
                newMap[key] = { ...newMap[key], [subKey]: !newMap[key][subKey] };
            } else {
                newMap[key] = !newMap[key];
            }

            return {
                ...prev,
                photographerProfile: {
                    ...profile,
                    [mapName]: newMap
                }
            };
        });
    };

    const getVisibility = (section: 'company' | 'personal', key: string, subKey?: string) => {
        const map = section === 'company' ? localSettings.photographerProfile.companyVisibility : localSettings.photographerProfile.personalVisibility;
        if (subKey) {
            return (map as any)?.[key]?.[subKey] ?? true;
        }
        return (map as any)?.[key] ?? true;
    };

    // Slug Checker
    const handleSlugChange = (val: string) => {
        // Basic formatting
        const newSlug = val.toLowerCase().replace(/[^a-z0-9-]/g, '');

        updateLocal(s => ({ ...s, photographerProfile: { ...s.photographerProfile, company: { ...s.photographerProfile.company, slug: newSlug } } }));

        setSlugStatus('checking');
        if (slugTimeoutRef.current) clearTimeout(slugTimeoutRef.current);

        slugTimeoutRef.current = setTimeout(() => {
            if (newSlug.length < 3) {
                setSlugStatus('invalid');
            } else if (['admin', 'test', 'profile', 'RawBox'].includes(newSlug)) {
                setSlugStatus('taken');
            } else {
                setSlugStatus('available');
            }
        }, 600);
    };

    // Image Upload Helper
    const handleImageUpload = (
        target: 'company' | 'personal' | 'galleryDefaults',
        field: string,
        file: File
    ) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            updateLocal(prev => {
                const newState = { ...prev };
                if (target === 'galleryDefaults') {
                    newState.galleryDefaults = { ...newState.galleryDefaults, [field]: reader.result as string };
                } else if (target === 'company') {
                    newState.photographerProfile.company = { ...newState.photographerProfile.company, [field]: reader.result as string };
                } else if (target === 'personal') {
                    newState.photographerProfile.personal = { ...newState.photographerProfile.personal, [field]: reader.result as string };
                }
                return newState;
            });
        };
        reader.readAsDataURL(file);
    };

    // Policy Generation Helper
    const handleGeneratePolicy = async (field: keyof Policies, title: 'Terms of Service' | 'Privacy Policy' | 'Refund Policy') => {
        const { company } = localSettings.photographerProfile;
        const companyDetails = {
            name: company.name,
            email: company.email,
            phone: company.phone,
            website: company.website,
            address: [company.address?.line1, company.address?.city, company.address?.state, company.address?.country].filter(Boolean).join(', ')
        };

        setGeneratingPolicy(field);
        try {
            const text = await generateLegalPolicy(title, companyDetails);
            updateLocal(s => ({
                ...s,
                policies: { ...s.policies, [field]: text }
            }));
        } catch (e) {
            console.error("Failed to generate policy", e);
        } finally {
            setGeneratingPolicy(null);
        }
    };

    // --------------------------------------------------------------------------------
    // RENDER SECTIONS
    // --------------------------------------------------------------------------------

    // 1. VISIBILITY & SEO
    if (section === 'public') {
        const { settings: profileSettings } = localSettings.photographerProfile;
        const publicUrl = `https://RawBox.co/p/${localSettings.photographerProfile.company.slug || 'profile'}`;
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(publicUrl)}`;

        return (
            <div className="flex flex-col xl:flex-row gap-8 max-w-7xl mx-auto">
                <div className="flex-1 space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold">Visibility & SEO</h2>
                            <p className="text-muted-foreground">Manage your public profile presence and search engine settings.</p>
                        </div>
                        {isDirty && (
                            <div className="flex gap-2">
                                <AppButton variant="ghost" onClick={handleDiscard}>Discard</AppButton>
                                <AppButton variant="primary" onClick={handleSave} leftIcon={Save}>Save Changes</AppButton>
                            </div>
                        )}
                    </div>

                    <AppCard className="overflow-hidden">
                        <AppCard.Header>Digital Visiting Card</AppCard.Header>
                        <AppCard.Content className="space-y-6">
                            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-muted/30 border border-border rounded-xl">
                                <div className="p-3 bg-surface rounded-lg shadow-sm border border-border">
                                    <QrCode className="w-12 h-12 text-foreground" />
                                </div>
                                <div className="text-center sm:text-left">
                                    <h3 className="font-bold text-lg text-foreground">Your Public Hub</h3>
                                    <p className="text-sm text-muted-foreground">This profile aggregates your links, bio, and galleries into one SEO-friendly page.</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <AppToggle
                                    label="Make Profile Public"
                                    description="Allow anyone with the link to view your profile page."
                                    checked={profileSettings.isPublic}
                                    onChange={(c) => updateLocal(s => ({ ...s, photographerProfile: { ...s.photographerProfile, settings: { ...s.photographerProfile.settings, isPublic: c } } }))}
                                />
                                <AppToggle
                                    label="Allow Search Engine Indexing"
                                    description="Let Google find your public profile (sitemap.xml included)."
                                    checked={profileSettings.allowIndexing}
                                    onChange={(c) => updateLocal(s => ({ ...s, photographerProfile: { ...s.photographerProfile, settings: { ...s.photographerProfile.settings, allowIndexing: c } } }))}
                                />
                            </div>

                            <div className="h-px bg-border my-2" />

                            <div className="space-y-4 pt-2">
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-foreground">Public Profile URL</label>
                                    <div className="relative group">
                                        <input
                                            readOnly
                                            value={publicUrl}
                                            className="w-full pl-4 pr-10 py-2.5 bg-muted/30 border border-border rounded-lg text-muted-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent-DEFAULT"
                                        />
                                        <button
                                            onClick={() => navigator.clipboard.writeText(publicUrl)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-accent-DEFAULT"
                                            title="Copy to clipboard"
                                        >
                                            <CopyIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <AppButton variant="outline" onClick={() => window.open(publicUrl, '_blank')} leftIcon={ExternalLink} fullWidth>
                                        Open Live Page
                                    </AppButton>
                                    <AppButton variant="secondary" onClick={() => navigator.clipboard.writeText(publicUrl)} leftIcon={CopyIcon} fullWidth>
                                        Copy Link
                                    </AppButton>
                                </div>
                            </div>

                            <div className="mt-4 p-4 bg-muted/10 rounded-xl border border-border/50 flex flex-col items-center">
                                <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-3">Profile QR Code</h4>
                                <div className="bg-white p-2 rounded-lg shadow-sm border border-border/30 mb-3">
                                    <img src={qrCodeUrl} alt="QR code for profile" className="w-32 h-32 object-contain" width="128" height="128" />
                                </div>
                                <AppButton size="sm" variant="ghost" onClick={() => { }} leftIcon={Download}>Download PNG</AppButton>
                            </div>
                        </AppCard.Content>
                    </AppCard>
                </div>
                <MobilePreview profile={localSettings.photographerProfile} defaults={localSettings.galleryDefaults} />
            </div>
        );
    }

    // 2. BRAND DEFAULTS
    if (section === 'brand') {
        const { galleryDefaults } = localSettings;
        const { settings: profileSettings } = localSettings.photographerProfile;
        const currentTheme = profileSettings.theme || THEME_PRESETS[0];

        return (
            <div className="flex flex-col xl:flex-row gap-8 max-w-7xl mx-auto">
                <div className="flex-1 space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold">Brand Defaults</h2>
                            <p className="text-muted-foreground">Set global themes and gallery defaults.</p>
                        </div>
                        {isDirty && (
                            <div className="flex gap-2">
                                <AppButton variant="ghost" onClick={handleDiscard}>Discard</AppButton>
                                <AppButton variant="primary" onClick={handleSave} leftIcon={Save}>Save Changes</AppButton>
                            </div>
                        )}
                    </div>

                    <AppCard>
                        <AppCard.Header>Global Gallery Theme</AppCard.Header>
                        <AppCard.Content className="space-y-6">
                            <section className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium mb-1.5 text-foreground">Primary Accent Color</label>
                                        <div className="flex gap-3 items-center">
                                            <div className="relative w-10 h-10 overflow-hidden rounded-lg border border-border shadow-sm">
                                                <input
                                                    type="color"
                                                    value={galleryDefaults.primaryColor || '#000000'}
                                                    onChange={(e) => updateLocal(s => ({ ...s, galleryDefaults: { ...s.galleryDefaults, primaryColor: e.target.value } }))}
                                                    className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] cursor-pointer p-0 border-0"
                                                />
                                            </div>
                                            <AppInput
                                                value={galleryDefaults.primaryColor || '#000000'}
                                                onChange={(e) => updateLocal(s => ({ ...s, galleryDefaults: { ...s.galleryDefaults, primaryColor: e.target.value } }))}
                                                placeholder="#000000"
                                                className="font-mono uppercase"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1.5 text-foreground">Typography</label>
                                        <AppSelect
                                            options={FONTS}
                                            value={galleryDefaults.fontFamily || 'inherit'}
                                            onChange={(e) => updateLocal(s => ({ ...s, galleryDefaults: { ...s.galleryDefaults, fontFamily: e.target.value } }))}
                                        />
                                    </div>
                                </div>
                            </section>

                            <div className="h-px bg-border" />

                            <section className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-bold uppercase text-muted-foreground flex items-center gap-2">
                                        <ImageIcon className="w-4 h-4" /> Watermark
                                    </h4>
                                    <AppToggle
                                        checked={galleryDefaults.showWatermark || false}
                                        onChange={(c) => updateLocal(s => ({ ...s, galleryDefaults: { ...s.galleryDefaults, showWatermark: c } }))}
                                        label="Enable by Default"
                                    />
                                </div>

                                {galleryDefaults.showWatermark && (
                                    <div className="bg-muted/30 p-6 rounded-xl border border-border space-y-6 animate-in fade-in">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium mb-2 text-foreground">Opacity ({Math.round((galleryDefaults.watermarkOpacity || 0.5) * 100)}%)</label>
                                                <input
                                                    type="range"
                                                    min="0.1"
                                                    max="1"
                                                    step="0.1"
                                                    className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-accent-DEFAULT"
                                                    value={galleryDefaults.watermarkOpacity || 0.5}
                                                    onChange={(e) => updateLocal(s => ({ ...s, galleryDefaults: { ...s.galleryDefaults, watermarkOpacity: parseFloat(e.target.value) } }))}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1.5 text-foreground">Position</label>
                                                <AppSelect
                                                    options={WM_POSITIONS}
                                                    value={galleryDefaults.watermarkPosition || 'center'}
                                                    onChange={(e) => updateLocal(s => ({ ...s, galleryDefaults: { ...s.galleryDefaults, watermarkPosition: e.target.value as any } }))}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-2 text-foreground">Default Watermark Logo</label>
                                            <div className="flex items-center gap-4">
                                                <div className="w-20 h-20 bg-white border border-border rounded-lg flex items-center justify-center overflow-hidden shrink-0 shadow-sm p-1">
                                                    {galleryDefaults.watermarkLogoUrl ? (
                                                        <img src={galleryDefaults.watermarkLogoUrl} alt="Watermark logo" className="max-w-full max-h-full object-contain" width="80" height="80" />
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">None</span>
                                                    )}
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex gap-2">
                                                        <AppButton size="sm" variant="outline" onClick={() => wmLogoRef.current?.click()} leftIcon={Upload}>Upload Logo</AppButton>
                                                        {galleryDefaults.watermarkLogoUrl && (
                                                            <AppButton size="sm" variant="ghost" onClick={() => updateLocal(s => ({ ...s, galleryDefaults: { ...s.galleryDefaults, watermarkLogoUrl: '' } }))} className="text-destructive-DEFAULT hover:bg-destructive-soft">Remove</AppButton>
                                                        )}
                                                    </div>
                                                    <input type="file" ref={wmLogoRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload('galleryDefaults', 'watermarkLogoUrl', e.target.files[0])} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </section>
                        </AppCard.Content>
                    </AppCard>

                    <AppCard>
                        <AppCard.Header>Public Profile Theme</AppCard.Header>
                        <AppCard.Content className="space-y-6">
                            <p className="text-sm text-muted-foreground -mt-4 mb-4">Choose a visual theme for your public profile page.</p>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                {THEME_PRESETS.map((theme) => {
                                    const isActive = currentTheme.id === theme.id || (currentTheme.id === 'custom' && currentTheme.name === theme.name);
                                    return (
                                        <button
                                            key={theme.id}
                                            onClick={() => updateLocal(s => ({ ...s, photographerProfile: { ...s.photographerProfile, settings: { ...s.photographerProfile.settings, theme } } }))}
                                            className={`
                                              group relative flex flex-col gap-2 p-2 rounded-lg border-2 text-left transition-all focus:outline-none focus:ring-2 focus:ring-accent-DEFAULT
                                              ${isActive ? 'border-accent-DEFAULT bg-accent/5' : 'border-border hover:border-muted-foreground/50'}
                                          `}
                                        >
                                            <div
                                                className="w-full aspect-[4/3] rounded-md shadow-sm border border-black/5 relative overflow-hidden"
                                                style={{ background: theme.values.background }}
                                            >
                                                <div className="absolute top-2 left-2 right-2 h-2 rounded-full opacity-50" style={{ background: theme.values.accent }} />
                                                <div className="absolute top-6 left-2 right-8 h-1.5 rounded-full opacity-30" style={{ background: theme.values.textMain }} />
                                                {isActive && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
                                                        <div className="bg-accent-DEFAULT text-white p-1 rounded-full shadow-lg"><Check className="w-4 h-4" /></div>
                                                    </div>
                                                )}
                                            </div>
                                            <span className={`text-xs font-semibold px-1 truncate w-full ${isActive ? 'text-accent-DEFAULT' : 'text-foreground'}`}>{theme.name}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="pt-4 border-t border-border">
                                <button
                                    onClick={() => setIsThemeCustomizing(!isThemeCustomizing)}
                                    className="flex items-center gap-2 text-sm font-semibold text-accent-DEFAULT hover:text-accent-hover transition-colors focus:outline-none"
                                >
                                    <Palette className="w-4 h-4" /> Customize Theme {isThemeCustomizing ? <ChevronDown className="w-4 h-4 rotate-180" /> : <ChevronDown className="w-4 h-4" />}
                                </button>

                                {isThemeCustomizing && (
                                    <div className="mt-4 p-4 bg-muted/30 border border-border rounded-xl space-y-4 animate-in slide-in-from-top-2">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                            {Object.keys(currentTheme.values).map(key => {
                                                if (['radius'].includes(key)) return null;
                                                if (key === 'font') {
                                                    return (
                                                        <div key={key}>
                                                            <label className="block text-xs font-medium text-muted-foreground uppercase mb-1.5">Font Family</label>
                                                            <AppSelect
                                                                options={FONTS}
                                                                value={(currentTheme.values as any)[key]}
                                                                onChange={(e) => {
                                                                    const newTheme = { ...currentTheme, id: 'custom', isPreset: false, values: { ...currentTheme.values, [key]: e.target.value } };
                                                                    updateLocal(s => ({ ...s, photographerProfile: { ...s.photographerProfile, settings: { ...s.photographerProfile.settings, theme: newTheme } } }));
                                                                }}
                                                            />
                                                        </div>
                                                    );
                                                }
                                                return (
                                                    <ThemeColorPicker
                                                        key={key}
                                                        label={key.replace(/([A-Z])/g, ' $1').trim()}
                                                        value={(currentTheme.values as any)[key]}
                                                        onChange={(v) => {
                                                            const newTheme = { ...currentTheme, id: 'custom', isPreset: false, values: { ...currentTheme.values, [key]: v } };
                                                            updateLocal(s => ({ ...s, photographerProfile: { ...s.photographerProfile, settings: { ...s.photographerProfile.settings, theme: newTheme } } }));
                                                        }}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </AppCard.Content>
                    </AppCard>
                </div>
                <MobilePreview profile={localSettings.photographerProfile} defaults={localSettings.galleryDefaults} />
            </div>
        );
    }

    // 3. COMPANY INFO
    if (section === 'company') {
        const { company } = localSettings.photographerProfile;
        return (
            <div className="flex flex-col xl:flex-row gap-8 max-w-7xl mx-auto">
                <div className="flex-1 space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold">Company Info</h2>
                            <p className="text-muted-foreground">Manage your business identity and public details.</p>
                        </div>
                        {isDirty && (
                            <div className="flex gap-2">
                                <AppButton variant="ghost" onClick={handleDiscard}>Discard</AppButton>
                                <AppButton variant="primary" onClick={handleSave} leftIcon={Save}>Save Changes</AppButton>
                            </div>
                        )}
                    </div>

                    <AppCard>
                        <AppCard.Content className="space-y-6 pt-6">
                            <div className="flex flex-col md:flex-row gap-6 items-start">
                                <div className="w-full md:w-auto flex flex-col items-center gap-3">
                                    <SettingsField isVisible={getVisibility('company', 'logoUrl')} onToggleVisibility={() => toggleVisibility('company', 'logoUrl')}>
                                        <div className="w-32 h-32 rounded-lg bg-muted border-4 border-surface shadow-sm overflow-hidden relative group flex items-center justify-center">
                                            {company.logoUrl ? (
                                                <img src={company.logoUrl} alt="Company logo" className="max-w-full max-h-full object-contain p-2" width="128" height="128" />
                                            ) : (
                                                <Building2 className="w-10 h-10 text-muted-foreground" />
                                            )}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer" onClick={() => logoInputRef.current?.click()}>
                                                <button type="button" className="text-white text-xs font-bold flex items-center gap-1"><Upload className="w-3 h-3" /> Upload</button>
                                            </div>
                                        </div>
                                    </SettingsField>
                                    <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload('company', 'logoUrl', e.target.files[0])} />
                                </div>

                                <div className="flex-1 w-full space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <SettingsField isVisible={getVisibility('company', 'name')} onToggleVisibility={() => toggleVisibility('company', 'name')}>
                                            <AppInput label="Company Name" value={company.name} onChange={(e) => updateLocal(s => ({ ...s, photographerProfile: { ...s.photographerProfile, company: { ...s.photographerProfile.company, name: e.target.value } } }))} required />
                                        </SettingsField>
                                        <SettingsField isVisible={getVisibility('company', 'tagline')} onToggleVisibility={() => toggleVisibility('company', 'tagline')}>
                                            <AppInput label="Tagline" placeholder="e.g. Capturing Moments" value={company.tagline || ''} onChange={(e) => updateLocal(s => ({ ...s, photographerProfile: { ...s.photographerProfile, company: { ...s.photographerProfile.company, tagline: e.target.value } } }))} leftIcon={Megaphone} />
                                        </SettingsField>
                                    </div>

                                    <div className="bg-muted/30 p-4 rounded-lg border border-border">
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="block text-sm font-medium text-foreground">
                                                Public Profile URL (Slug) <span className="text-destructive">*</span>
                                            </label>
                                            {slugStatus === 'available' && <span className="text-xs text-success flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Available</span>}
                                            {slugStatus === 'taken' && <span className="text-xs text-destructive-DEFAULT flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Taken</span>}
                                            {slugStatus === 'invalid' && <span className="text-xs text-muted-foreground">Min 3 characters</span>}
                                            {slugStatus === 'checking' && <span className="text-xs text-muted-foreground flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Checking...</span>}
                                        </div>
                                        <div className="flex items-center">
                                            <span className="bg-muted px-3 py-2 border border-r-0 border-border rounded-l-lg text-muted-foreground text-sm font-mono">RawBox.co/p/</span>
                                            <input
                                                type="text"
                                                value={company.slug || ''}
                                                onChange={(e) => handleSlugChange(e.target.value)}
                                                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-r-lg border border-border bg-surface text-foreground focus:ring-2 focus:ring-accent-DEFAULT sm:text-sm focus:outline-none"
                                                placeholder="my-company"
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1.5">This URL will be used for your public profile and QR code.</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <SettingsField isVisible={getVisibility('company', 'email')} onToggleVisibility={() => toggleVisibility('company', 'email')}>
                                            <AppInput label="Company Email" value={company.email} onChange={(e) => updateLocal(s => ({ ...s, photographerProfile: { ...s.photographerProfile, company: { ...s.photographerProfile.company, email: e.target.value } } }))} leftIcon={Mail} />
                                        </SettingsField>
                                        <SettingsField isVisible={getVisibility('company', 'phone')} onToggleVisibility={() => toggleVisibility('company', 'phone')}>
                                            <AppInput label="Company Phone" value={company.phone} onChange={(e) => updateLocal(s => ({ ...s, photographerProfile: { ...s.photographerProfile, company: { ...s.photographerProfile.company, phone: e.target.value } } }))} leftIcon={Smartphone} />
                                        </SettingsField>
                                    </div>
                                    <SettingsField isVisible={getVisibility('company', 'website')} onToggleVisibility={() => toggleVisibility('company', 'website')}>
                                        <AppInput label="Company Website" value={company.website} onChange={(e) => updateLocal(s => ({ ...s, photographerProfile: { ...s.photographerProfile, company: { ...s.photographerProfile.company, website: e.target.value } } }))} leftIcon={Globe} />
                                    </SettingsField>
                                </div>
                            </div>

                            {/* Address */}
                            <div className="space-y-4 border-t border-border pt-6">
                                <h3 className="text-sm font-bold text-muted-foreground uppercase flex items-center gap-2"><MapPin className="w-4 h-4" /> Office Address</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <SettingsField isVisible={getVisibility('company', 'address', 'country')} onToggleVisibility={() => toggleVisibility('company', 'address', 'country')}>
                                        <AppSelect label="Country" options={COUNTRIES} value={company.address.country} onChange={(e) => updateLocal(s => ({ ...s, photographerProfile: { ...s.photographerProfile, company: { ...s.photographerProfile.company, address: { ...s.photographerProfile.company.address, country: e.target.value } } } }))} />
                                    </SettingsField>
                                    <SettingsField isVisible={getVisibility('company', 'address', 'state')} onToggleVisibility={() => toggleVisibility('company', 'address', 'state')}>
                                        <AppInput label="State / Region" value={company.address.state || ''} onChange={(e) => updateLocal(s => ({ ...s, photographerProfile: { ...s.photographerProfile, company: { ...s.photographerProfile.company, address: { ...s.photographerProfile.company.address, state: e.target.value } } } }))} />
                                    </SettingsField>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <SettingsField isVisible={getVisibility('company', 'address', 'city')} onToggleVisibility={() => toggleVisibility('company', 'address', 'city')}>
                                        <AppInput label="City" value={company.address.city} onChange={(e) => updateLocal(s => ({ ...s, photographerProfile: { ...s.photographerProfile, company: { ...s.photographerProfile.company, address: { ...s.photographerProfile.company.address, city: e.target.value } } } }))} />
                                    </SettingsField>
                                    <SettingsField isVisible={getVisibility('company', 'address', 'postalCode')} onToggleVisibility={() => toggleVisibility('company', 'address', 'postalCode')}>
                                        <AppInput label="Postal Code" value={company.address.postalCode} onChange={(e) => updateLocal(s => ({ ...s, photographerProfile: { ...s.photographerProfile, company: { ...s.photographerProfile.company, address: { ...s.photographerProfile.company.address, postalCode: e.target.value } } } }))} />
                                    </SettingsField>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <SettingsField isVisible={getVisibility('company', 'address', 'line1')} onToggleVisibility={() => toggleVisibility('company', 'address', 'line1')}>
                                        <AppInput label="Address Line 1" value={company.address.line1} onChange={(e) => updateLocal(s => ({ ...s, photographerProfile: { ...s.photographerProfile, company: { ...s.photographerProfile.company, address: { ...s.photographerProfile.company.address, line1: e.target.value } } } }))} />
                                    </SettingsField>
                                    <SettingsField isVisible={getVisibility('company', 'address', 'line2')} onToggleVisibility={() => toggleVisibility('company', 'address', 'line2')}>
                                        <AppInput label="Address Line 2" value={company.address.line2} onChange={(e) => updateLocal(s => ({ ...s, photographerProfile: { ...s.photographerProfile, company: { ...s.photographerProfile.company, address: { ...s.photographerProfile.company.address, line2: e.target.value } } } }))} />
                                    </SettingsField>
                                </div>
                            </div>

                            {/* Languages */}
                            <div className="space-y-4 border-t border-border pt-6">
                                <h3 className="text-sm font-bold text-muted-foreground uppercase flex items-center gap-2"><Languages className="w-4 h-4" /> Company Languages</h3>
                                <SettingsField isVisible={getVisibility('company', 'languages')} onToggleVisibility={() => toggleVisibility('company', 'languages')}>
                                    <div className="p-4 border border-border rounded-lg bg-surface">
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {company.languages?.map(lang => (
                                                <span key={lang} className="inline-flex items-center gap-1 px-2 py-1 bg-accent/10 text-accent-DEFAULT rounded text-xs font-medium">
                                                    {lang}
                                                    <button onClick={() => updateLocal(s => ({ ...s, photographerProfile: { ...s.photographerProfile, company: { ...s.photographerProfile.company, languages: s.photographerProfile.company.languages.filter(l => l !== lang) } } }))}>
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                        <select
                                            className="w-full text-sm bg-transparent outline-none text-muted-foreground py-1 cursor-pointer border-b border-dashed border-border"
                                            onChange={(e) => {
                                                if (e.target.value && !company.languages?.includes(e.target.value)) {
                                                    updateLocal(s => ({ ...s, photographerProfile: { ...s.photographerProfile, company: { ...s.photographerProfile.company, languages: [...(s.photographerProfile.company.languages || []), e.target.value] } } }))
                                                }
                                                e.target.value = "";
                                            }}
                                        >
                                            <option value="">+ Add Language</option>
                                            {INDIAN_LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                                        </select>
                                    </div>
                                </SettingsField>
                            </div>

                            {/* Socials */}
                            <div className="space-y-4 border-t border-border pt-6">
                                <h3 className="text-sm font-bold text-muted-foreground uppercase flex items-center gap-2"><Globe className="w-4 h-4" /> Social Media</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {Object.entries(SOCIAL_MEDIA_CONFIG).map(([key, config]) => (
                                        <SettingsField key={key} isVisible={getVisibility('company', 'socials', key)} onToggleVisibility={() => toggleVisibility('company', 'socials', key)}>
                                            <AppInput
                                                label={config.label}
                                                leftIcon={config.icon}
                                                placeholder={config.placeholder}
                                                value={(company.socials as any)[key] || ''}
                                                onChange={(e) => updateLocal(s => ({ ...s, photographerProfile: { ...s.photographerProfile, company: { ...s.photographerProfile.company, socials: { ...s.photographerProfile.company.socials, [key]: e.target.value } } } }))}
                                                className={config.color.replace('text-', 'focus:ring-')}
                                            />
                                        </SettingsField>
                                    ))}
                                </div>
                            </div>

                            {/* Custom Links */}
                            <div className="space-y-4 pt-4 border-t border-border">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-sm font-bold text-muted-foreground uppercase flex items-center gap-2"><LinkIcon className="w-4 h-4" /> Custom Links</h3>
                                    <AppButton size="sm" variant="ghost" leftIcon={Plus} onClick={() => updateLocal(s => ({ ...s, photographerProfile: { ...s.photographerProfile, company: { ...s.photographerProfile.company, customLinks: [...(s.photographerProfile.company.customLinks || []), { id: Date.now().toString(), label: '', url: '', logoUrl: '' }] } } }))}>Add Link</AppButton>
                                </div>
                                <SettingsField isVisible={getVisibility('company', 'customLinks')} onToggleVisibility={() => toggleVisibility('company', 'customLinks')}>
                                    <div className="space-y-3">
                                        {company.customLinks?.map((link) => (
                                            <div key={link.id} className="flex gap-2 items-start bg-muted/20 p-2 rounded-lg">
                                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                                                    <AppInput
                                                        placeholder="Label (e.g. Portfolio)"
                                                        value={link.label}
                                                        onChange={(e) => updateLocal(s => ({ ...s, photographerProfile: { ...s.photographerProfile, company: { ...s.photographerProfile.company, customLinks: s.photographerProfile.company.customLinks.map(l => l.id === link.id ? { ...l, label: e.target.value } : l) } } }))}
                                                        size="sm"
                                                    />
                                                    <AppInput
                                                        placeholder="URL (https://...)"
                                                        value={link.url}
                                                        onChange={(e) => updateLocal(s => ({ ...s, photographerProfile: { ...s.photographerProfile, company: { ...s.photographerProfile.company, customLinks: s.photographerProfile.company.customLinks.map(l => l.id === link.id ? { ...l, url: e.target.value } : l) } } }))}
                                                        size="sm"
                                                    />
                                                    <AppInput
                                                        placeholder="Logo URL (Optional)"
                                                        value={link.logoUrl || ''}
                                                        onChange={(e) => updateLocal(s => ({ ...s, photographerProfile: { ...s.photographerProfile, company: { ...s.photographerProfile.company, customLinks: s.photographerProfile.company.customLinks.map(l => l.id === link.id ? { ...l, logoUrl: e.target.value } : l) } } }))}
                                                        size="sm"
                                                    />
                                                </div>
                                                <AppIconButton
                                                    icon={Trash2}
                                                    aria-label="Remove link"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-destructive-DEFAULT hover:bg-destructive-soft mt-1"
                                                    onClick={() => updateLocal(s => ({ ...s, photographerProfile: { ...s.photographerProfile, company: { ...s.photographerProfile.company, customLinks: s.photographerProfile.company.customLinks.filter(l => l.id !== link.id) } } }))}
                                                />
                                            </div>
                                        ))}
                                        {(!company.customLinks || company.customLinks.length === 0) && <p className="text-xs text-muted-foreground italic">No custom links added.</p>}
                                    </div>
                                </SettingsField>
                            </div>

                        </AppCard.Content>
                    </AppCard>
                </div>
                <MobilePreview profile={localSettings.photographerProfile} defaults={localSettings.galleryDefaults} />
            </div>
        );
    }

    // 4. PERSONAL INFO
    if (section === 'personal') {
        const { personal } = localSettings.photographerProfile;
        const { address } = personal;

        return (
            <div className="flex flex-col xl:flex-row gap-8 max-w-7xl mx-auto">
                <div className="flex-1 space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold">Personal Information</h2>
                            <p className="text-muted-foreground">Your personal details for the profile bio.</p>
                        </div>
                        {isDirty && (
                            <div className="flex gap-2">
                                <AppButton variant="ghost" onClick={handleDiscard}>Discard</AppButton>
                                <AppButton variant="primary" onClick={handleSave} leftIcon={Save}>Save Changes</AppButton>
                            </div>
                        )}
                    </div>

                    <AppCard>
                        <AppCard.Content className="space-y-8 pt-6">

                            {/* 1. Identity */}
                            <div className="flex flex-col md:flex-row gap-6 items-start">
                                <div className="w-full md:w-auto flex flex-col items-center gap-3">
                                    <SettingsField isVisible={getVisibility('personal', 'photoUrl')} onToggleVisibility={() => toggleVisibility('personal', 'photoUrl')}>
                                        <div className="w-32 h-32 rounded-full bg-muted border-4 border-surface shadow-sm overflow-hidden relative group flex items-center justify-center">
                                            {personal.photoUrl ? (
                                                <img src={personal.photoUrl} alt="Personal profile photo" className="max-w-full max-h-full object-cover" width="128" height="128" />
                                            ) : (
                                                <User className="w-10 h-10 text-muted-foreground" />
                                            )}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                                                <button type="button" className="text-white text-xs font-bold flex items-center gap-1"><Upload className="w-3 h-3" /> Upload</button>
                                            </div>
                                        </div>
                                    </SettingsField>
                                    <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload('personal', 'photoUrl', e.target.files[0])} />
                                    <span className="text-xs text-muted-foreground">Personal Photo</span>
                                </div>

                                <div className="flex-1 w-full space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <SettingsField isVisible={getVisibility('personal', 'firstName')} onToggleVisibility={() => toggleVisibility('personal', 'firstName')}>
                                            <AppInput label="First Name" value={personal.firstName} onChange={(e) => updateLocal(s => ({ ...s, photographerProfile: { ...s.photographerProfile, personal: { ...s.photographerProfile.personal, firstName: e.target.value } } }))} required />
                                        </SettingsField>
                                        <SettingsField isVisible={getVisibility('personal', 'lastName')} onToggleVisibility={() => toggleVisibility('personal', 'lastName')}>
                                            <AppInput label="Last Name" value={personal.lastName} onChange={(e) => updateLocal(s => ({ ...s, photographerProfile: { ...s.photographerProfile, personal: { ...s.photographerProfile.personal, lastName: e.target.value } } }))} required />
                                        </SettingsField>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <SettingsField isVisible={getVisibility('personal', 'nickname')} onToggleVisibility={() => toggleVisibility('personal', 'nickname')}>
                                            <AppInput label="Nickname" value={personal.nickname} onChange={(e) => updateLocal(s => ({ ...s, photographerProfile: { ...s.photographerProfile, personal: { ...s.photographerProfile.personal, nickname: e.target.value } } }))} />
                                        </SettingsField>
                                        <SettingsField isVisible={getVisibility('personal', 'contact')} onToggleVisibility={() => toggleVisibility('personal', 'contact')}>
                                            <AppInput label="Personal Contact (Bio/Role)" value={personal.contact} onChange={(e) => updateLocal(s => ({ ...s, photographerProfile: { ...s.photographerProfile, personal: { ...s.photographerProfile.personal, contact: e.target.value } } }))} placeholder="e.g. Lead Photographer" />
                                        </SettingsField>
                                    </div>
                                </div>
                            </div>

                            {/* 2. Contact */}
                            <div className="space-y-4 pt-4 border-t border-border">
                                <h3 className="text-sm font-bold text-muted-foreground uppercase flex items-center gap-2"><Smartphone className="w-4 h-4" /> Personal Contact Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <SettingsField isVisible={getVisibility('personal', 'email')} onToggleVisibility={() => toggleVisibility('personal', 'email')}>
                                        <AppInput label="Personal Email" value={personal.email} onChange={(e) => updateLocal(s => ({ ...s, photographerProfile: { ...s.photographerProfile, personal: { ...s.photographerProfile.personal, email: e.target.value } } }))} leftIcon={Mail} />
                                    </SettingsField>
                                    <SettingsField isVisible={getVisibility('personal', 'phone')} onToggleVisibility={() => toggleVisibility('personal', 'phone')}>
                                        <AppInput label="Personal Phone" value={personal.phone} onChange={(e) => updateLocal(s => ({ ...s, photographerProfile: { ...s.photographerProfile, personal: { ...s.photographerProfile.personal, phone: e.target.value } } }))} leftIcon={Smartphone} />
                                    </SettingsField>
                                </div>
                                <SettingsField isVisible={getVisibility('personal', 'website')} onToggleVisibility={() => toggleVisibility('personal', 'website')}>
                                    <AppInput label="Personal Website" value={personal.website} onChange={(e) => updateLocal(s => ({ ...s, photographerProfile: { ...s.photographerProfile, personal: { ...s.photographerProfile.personal, website: e.target.value } } }))} leftIcon={Globe} placeholder="https://..." />
                                </SettingsField>
                            </div>

                            {/* 3. Address */}
                            <div className="space-y-4 pt-4 border-t border-border">
                                <h3 className="text-sm font-bold text-muted-foreground uppercase flex items-center gap-2"><MapPin className="w-4 h-4" /> Personal Address</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <SettingsField isVisible={getVisibility('personal', 'address', 'line1')} onToggleVisibility={() => toggleVisibility('personal', 'address', 'line1')}>
                                        <AppInput label="Address Line 1" value={address?.line1 || ''} onChange={(e) => updateLocal(s => ({ ...s, photographerProfile: { ...s.photographerProfile, personal: { ...s.photographerProfile.personal, address: { ...s.photographerProfile.personal.address, line1: e.target.value } } } }))} />
                                    </SettingsField>
                                    <SettingsField isVisible={getVisibility('personal', 'address', 'line2')} onToggleVisibility={() => toggleVisibility('personal', 'address', 'line2')}>
                                        <AppInput label="Address Line 2" value={address?.line2 || ''} onChange={(e) => updateLocal(s => ({ ...s, photographerProfile: { ...s.photographerProfile, personal: { ...s.photographerProfile.personal, address: { ...s.photographerProfile.personal.address, line2: e.target.value } } } }))} />
                                    </SettingsField>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <SettingsField isVisible={getVisibility('personal', 'address', 'country')} onToggleVisibility={() => toggleVisibility('personal', 'address', 'country')}>
                                        <AppSelect label="Country" options={COUNTRIES} value={address?.country || 'India'} onChange={(e) => updateLocal(s => ({ ...s, photographerProfile: { ...s.photographerProfile, personal: { ...s.photographerProfile.personal, address: { ...s.photographerProfile.personal.address, country: e.target.value } } } }))} />
                                    </SettingsField>
                                    <SettingsField isVisible={getVisibility('personal', 'address', 'state')} onToggleVisibility={() => toggleVisibility('personal', 'address', 'state')}>
                                        <AppInput label="State" value={address?.state || ''} onChange={(e) => updateLocal(s => ({ ...s, photographerProfile: { ...s.photographerProfile, personal: { ...s.photographerProfile.personal, address: { ...s.photographerProfile.personal.address, state: e.target.value } } } }))} />
                                    </SettingsField>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <SettingsField isVisible={getVisibility('personal', 'address', 'city')} onToggleVisibility={() => toggleVisibility('personal', 'address', 'city')}>
                                        <AppInput label="City" value={address?.city || ''} onChange={(e) => updateLocal(s => ({ ...s, photographerProfile: { ...s.photographerProfile, personal: { ...s.photographerProfile.personal, address: { ...s.photographerProfile.personal.address, city: e.target.value } } } }))} />
                                    </SettingsField>
                                    <SettingsField isVisible={getVisibility('personal', 'address', 'postalCode')} onToggleVisibility={() => toggleVisibility('personal', 'address', 'postalCode')}>
                                        <AppInput label="Postal Code" value={address?.postalCode || ''} onChange={(e) => updateLocal(s => ({ ...s, photographerProfile: { ...s.photographerProfile, personal: { ...s.photographerProfile.personal, address: { ...s.photographerProfile.personal.address, postalCode: e.target.value } } } }))} />
                                    </SettingsField>
                                </div>
                            </div>

                            {/* 4. Languages */}
                            <div className="space-y-4 pt-4 border-t border-border">
                                <h3 className="text-sm font-bold text-muted-foreground uppercase flex items-center gap-2"><Languages className="w-4 h-4" /> Personal Languages</h3>
                                <div className="p-4 border border-border rounded-lg bg-surface">
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {personal.languages?.map(lang => (
                                            <span key={lang} className="inline-flex items-center gap-1 px-2 py-1 bg-accent/10 text-accent-DEFAULT rounded text-xs font-medium">
                                                {lang}
                                                <button onClick={() => updateLocal(s => ({ ...s, photographerProfile: { ...s.photographerProfile, personal: { ...s.photographerProfile.personal, languages: s.photographerProfile.personal.languages.filter(l => l !== lang) } } }))}>
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                    <select
                                        className="w-full text-sm bg-transparent outline-none text-muted-foreground py-1 cursor-pointer border-b border-dashed border-border"
                                        onChange={(e) => {
                                            if (e.target.value && !personal.languages?.includes(e.target.value)) {
                                                updateLocal(s => ({ ...s, photographerProfile: { ...s.photographerProfile, personal: { ...s.photographerProfile.personal, languages: [...(s.photographerProfile.personal.languages || []), e.target.value] } } }))
                                            }
                                            e.target.value = "";
                                        }}
                                    >
                                        <option value="">+ Add Language</option>
                                        {INDIAN_LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* 5. Social Media */}
                            <div className="space-y-4 pt-4 border-t border-border">
                                <h3 className="text-sm font-bold text-muted-foreground uppercase flex items-center gap-2"><Globe className="w-4 h-4" /> Social Media</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {Object.entries(SOCIAL_MEDIA_CONFIG).map(([key, config]) => (
                                        <div key={key}>
                                            <AppInput
                                                label={config.label}
                                                leftIcon={config.icon}
                                                placeholder={config.placeholder}
                                                value={(personal.socials as any)[key] || ''}
                                                onChange={(e) => updateLocal(s => ({ ...s, photographerProfile: { ...s.photographerProfile, personal: { ...s.photographerProfile.personal, socials: { ...s.photographerProfile.personal.socials, [key]: e.target.value } } } }))}
                                                className={config.color.replace('text-', 'focus:ring-')}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 6. Custom Links */}
                            <div className="space-y-4 pt-4 border-t border-border">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-sm font-bold text-muted-foreground uppercase flex items-center gap-2"><LinkIcon className="w-4 h-4" /> Custom Links</h3>
                                    <AppButton size="sm" variant="ghost" leftIcon={Plus} onClick={() => updateLocal(s => ({ ...s, photographerProfile: { ...s.photographerProfile, personal: { ...s.photographerProfile.personal, customLinks: [...(s.photographerProfile.personal.customLinks || []), { id: Date.now().toString(), label: '', url: '', logoUrl: '' }] } } }))}>Add Link</AppButton>
                                </div>
                                <div className="space-y-3">
                                    {personal.customLinks?.map((link) => (
                                        <div key={link.id} className="flex gap-2 items-start bg-muted/20 p-2 rounded-lg">
                                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                                                <AppInput
                                                    placeholder="Label (e.g. Portfolio)"
                                                    value={link.label}
                                                    onChange={(e) => updateLocal(s => ({ ...s, photographerProfile: { ...s.photographerProfile, personal: { ...s.photographerProfile.personal, customLinks: s.photographerProfile.personal.customLinks.map(l => l.id === link.id ? { ...l, label: e.target.value } : l) } } }))}
                                                    size="sm"
                                                />
                                                <AppInput
                                                    placeholder="URL (https://...)"
                                                    value={link.url}
                                                    onChange={(e) => updateLocal(s => ({ ...s, photographerProfile: { ...s.photographerProfile, personal: { ...s.photographerProfile.personal, customLinks: s.photographerProfile.personal.customLinks.map(l => l.id === link.id ? { ...l, url: e.target.value } : l) } } }))}
                                                    size="sm"
                                                />
                                                <AppInput
                                                    placeholder="Logo URL (Optional)"
                                                    value={link.logoUrl || ''}
                                                    onChange={(e) => updateLocal(s => ({ ...s, photographerProfile: { ...s.photographerProfile, personal: { ...s.photographerProfile.personal, customLinks: s.photographerProfile.personal.customLinks.map(l => l.id === link.id ? { ...l, logoUrl: e.target.value } : l) } } }))}
                                                    size="sm"
                                                />
                                            </div>
                                            <AppIconButton
                                                icon={Trash2}
                                                aria-label="Remove link"
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive-DEFAULT hover:bg-destructive-soft mt-1"
                                                onClick={() => updateLocal(s => ({ ...s, photographerProfile: { ...s.photographerProfile, personal: { ...s.photographerProfile.personal, customLinks: s.photographerProfile.personal.customLinks.filter(l => l.id !== link.id) } } }))}
                                            />
                                        </div>
                                    ))}
                                    {(!personal.customLinks || personal.customLinks.length === 0) && <p className="text-xs text-muted-foreground italic">No custom links added.</p>}
                                </div>
                            </div>

                        </AppCard.Content>
                    </AppCard>
                </div>
                <MobilePreview profile={localSettings.photographerProfile} defaults={localSettings.galleryDefaults} />
            </div>
        );
    }

    // 5. INTEGRATIONS
    if (section === 'integrations') {
        const { integrations } = localSettings;
        const updateInt = (key: keyof typeof integrations, val: boolean) => {
            updateLocal(s => ({ ...s, integrations: { ...s.integrations, [key]: val } }));
        };

        return (
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold">Integrations</h2>
                        <p className="text-muted-foreground">Connect with third-party tools and services.</p>
                    </div>
                    {isDirty && (
                        <div className="flex gap-2">
                            <AppButton variant="ghost" onClick={handleDiscard}>Discard</AppButton>
                            <AppButton variant="primary" onClick={handleSave} leftIcon={Save}>Save Changes</AppButton>
                        </div>
                    )}
                </div>

                <AppCard>
                    <AppCard.Content className="space-y-6 pt-6">
                        <div className="space-y-4">
                            <h3 className="font-semibold flex items-center gap-2 text-sm text-foreground"><Globe className="w-4 h-4" /> Cloud Storage</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <AppToggle label="Google Drive" checked={integrations.googleDrive} onChange={c => {
                                    if (c) window.location.href = '/auth/google-drive';
                                    updateInt('googleDrive', c);
                                }} />
                                <AppToggle label="Dropbox" checked={integrations.dropbox} onChange={c => {
                                    if (c) window.location.href = '/auth/dropbox';
                                    updateInt('dropbox', c);
                                }} />
                            </div>
                        </div>
                        <div className="space-y-4 pt-4 border-t border-border">
                            <h3 className="font-semibold flex items-center gap-2 text-sm text-foreground"><Globe className="w-4 h-4" /> Google Ecosystem</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <AppToggle label="Google Photos" checked={integrations.googlePhotos} onChange={c => updateInt('googlePhotos', c)} />
                                <AppToggle label="Google Calendar" checked={integrations.googleCalendar} onChange={c => updateInt('googleCalendar', c)} />
                            </div>
                        </div>
                        <div className="space-y-4 pt-4 border-t border-border">
                            <h3 className="font-semibold text-sm text-foreground">Payment & Workflow</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <AppToggle label="Stripe Payments" checked={integrations.stripe} onChange={c => updateInt('stripe', c)} />
                                <AppToggle label="Adobe Lightroom" checked={integrations.adobe} onChange={c => updateInt('adobe', c)} />
                                <AppToggle label="Zoom" checked={integrations.zoom} onChange={c => updateInt('zoom', c)} />
                                <AppToggle label="Slack Notifications" checked={integrations.slack} onChange={c => updateInt('slack', c)} />
                            </div>
                        </div>
                    </AppCard.Content>
                </AppCard>
            </div>
        );
    }

    // 6. POLICIES
    if (section === 'policies') {
        const policies = localSettings.policies || {};

        return (
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold">Legal Policies</h2>
                        <p className="text-muted-foreground">Define terms, privacy, and refund policies for your clients.</p>
                    </div>
                    {isDirty && (
                        <div className="flex gap-2">
                            <AppButton variant="ghost" onClick={handleDiscard}>Discard</AppButton>
                            <AppButton variant="primary" onClick={handleSave} leftIcon={Save}>Save Changes</AppButton>
                        </div>
                    )}
                </div>

                <AppCard>
                    <AppCard.Content className="space-y-6 pt-6">
                        <div className="space-y-2">
                            <div className="flex justify-between items-end mb-1">
                                <label className="block text-sm font-medium text-foreground">Terms of Service</label>
                                <AppButton
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleGeneratePolicy('termsOfService', 'Terms of Service')}
                                    disabled={generatingPolicy === 'termsOfService'}
                                    leftIcon={generatingPolicy === 'termsOfService' ? Loader2 : Wand2}
                                    className="text-xs"
                                >
                                    {generatingPolicy === 'termsOfService' ? 'Generating...' : 'Generate with AI'}
                                </AppButton>
                            </div>
                            <AppTextarea
                                rows={6}
                                placeholder="Enter your terms of service here..."
                                value={policies.termsOfService || ''}
                                onChange={(e) => updateLocal(s => ({ ...s, policies: { ...s.policies, termsOfService: e.target.value } }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-end mb-1">
                                <label className="block text-sm font-medium text-foreground">Privacy Policy</label>
                                <AppButton
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleGeneratePolicy('privacyPolicy', 'Privacy Policy')}
                                    disabled={generatingPolicy === 'privacyPolicy'}
                                    leftIcon={generatingPolicy === 'privacyPolicy' ? Loader2 : Wand2}
                                    className="text-xs"
                                >
                                    {generatingPolicy === 'privacyPolicy' ? 'Generating...' : 'Generate with AI'}
                                </AppButton>
                            </div>
                            <AppTextarea
                                rows={6}
                                placeholder="Enter your privacy policy here..."
                                value={policies.privacyPolicy || ''}
                                onChange={(e) => updateLocal(s => ({ ...s, policies: { ...s.policies, privacyPolicy: e.target.value } }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-end mb-1">
                                <label className="block text-sm font-medium text-foreground">Refund Policy</label>
                                <AppButton
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleGeneratePolicy('refundPolicy', 'Refund Policy')}
                                    disabled={generatingPolicy === 'refundPolicy'}
                                    leftIcon={generatingPolicy === 'refundPolicy' ? Loader2 : Wand2}
                                    className="text-xs"
                                >
                                    {generatingPolicy === 'refundPolicy' ? 'Generating...' : 'Generate with AI'}
                                </AppButton>
                            </div>
                            <AppTextarea
                                rows={4}
                                placeholder="Enter your refund policy here..."
                                value={policies.refundPolicy || ''}
                                onChange={(e) => updateLocal(s => ({ ...s, policies: { ...s.policies, refundPolicy: e.target.value } }))}
                            />
                        </div>
                    </AppCard.Content>
                </AppCard>
            </div>
        );
    }

    return null;
};

