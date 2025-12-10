
import React, { useState, useRef } from 'react';
import { Album, GallerySettings, BrandingSettings, CustomLink, Client, AppSettings } from '../types';
import { AppCard } from './ui/AppCard';
import { AppInput, AppToggle, AppSelect } from './ui/AppInput';
import { AppButton, AppIconButton } from './ui/AppButton';
import { Lock, Calendar, Download, Eye, Save, X, Globe, Mail, Palette, Layout, Shield, Plus, Trash2, Smartphone, MapPin, Type, Megaphone, Link as LinkIcon, Briefcase, User, RefreshCw, Copy, Upload, Check } from 'lucide-react';

interface GallerySettingsModalProps {
    album: Album;
    isOpen: boolean;
    onClose: () => void;
    onSave: (albumId: string, updates: Partial<Album>) => void;
    clients?: Client[]; // List of available clients
    globalSettings?: AppSettings; // Global application settings for defaults
}

type Tab = 'general' | 'access' | 'branding';

const FONTS = [
    { value: 'inherit', label: 'Default System' },
    { value: 'Inter, sans-serif', label: 'Inter (Modern)' },
    { value: 'Playfair Display, serif', label: 'Playfair Display (Elegant)' },
    { value: 'Lato, sans-serif', label: 'Lato (Clean)' },
    { value: 'Montserrat, sans-serif', label: 'Montserrat (Bold)' },
    { value: 'Merriweather, serif', label: 'Merriweather (Classic)' },
];

const WM_POSITIONS = [
    { value: 'center', label: 'Center' },
    { value: 'bottom-right', label: 'Bottom Right' },
    { value: 'bottom-left', label: 'Bottom Left' },
    { value: 'top-right', label: 'Top Right' },
    { value: 'top-left', label: 'Top Left' },
    { value: 'repeat', label: 'Tile Pattern' },
];

export const GallerySettingsModal: React.FC<GallerySettingsModalProps> = ({
    album,
    isOpen,
    onClose,
    onSave,
    clients = [],
    globalSettings
}) => {
    const [activeTab, setActiveTab] = useState<Tab>('general');
    const [title, setTitle] = useState(album.title);
    const [clientId, setClientId] = useState(album.clientId || '');
    const [appliedDefaults, setAppliedDefaults] = useState(false);

    // Settings State
    const [settings, setSettings] = useState<GallerySettings>(album.settings);

    // Initialize branding if undefined
    const [branding, setBranding] = useState<BrandingSettings>(album.settings.branding || {
        brandName: '',
        logoUrl: '',
        tagline: '',
        contactEmail: '',
        phone: '',
        address: '',
        showWatermark: false,
        watermarkOpacity: 0.5,
        watermarkPosition: 'center',
        socialLinks: { website: '', instagram: '', facebook: '', twitter: '', tiktok: '', youtube: '', linkedin: '' },
        customLinks: [],
        primaryColor: '#000000',
        fontFamily: 'inherit'
    });

    const wmLogoRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleSave = () => {
        // If a client is selected, update clientName automatically for display consistency
        let updatedClientName = album.clientName;
        if (clientId) {
            const client = clients.find(c => c.id === clientId);
            if (client) updatedClientName = client.displayName || `${client.firstName} ${client.lastName}`;
        }

        onSave(album.id, {
            title,
            clientId: clientId || undefined,
            clientName: updatedClientName,
            settings: {
                ...settings,
                branding
            }
        });
        onClose();
    };

    const applyStudioDefaults = () => {
        if (!globalSettings) return;

        const { company } = globalSettings.photographerProfile;
        const { galleryDefaults } = globalSettings;

        // Helper to format address object to string
        const formatAddress = (addr: any) => {
            if (!addr) return '';
            return [addr.line1, addr.line2, addr.city, addr.state, addr.postalCode, addr.country].filter(Boolean).join(', ');
        };

        setBranding({
            ...branding,
            // Identity from Company Profile
            brandName: company.name,
            logoUrl: company.logoUrl,
            tagline: company.tagline,
            contactEmail: company.email,
            phone: company.phone,
            address: formatAddress(company.address),

            // Socials from Company Profile
            // Note: company.website is a top-level field, needs to be mapped to socialLinks.website
            socialLinks: {
                ...branding.socialLinks,
                ...company.socials,
                website: company.website
            },

            // Custom Links from Company Profile
            customLinks: company.customLinks.map(link => ({
                id: link.id,
                label: link.label,
                url: link.url,
                logoUrl: link.logoUrl
            })),

            // Theme & Watermark from Gallery Defaults
            primaryColor: galleryDefaults.primaryColor,
            fontFamily: galleryDefaults.fontFamily,
            showWatermark: galleryDefaults.showWatermark,
            watermarkOpacity: galleryDefaults.watermarkOpacity,
            watermarkPosition: galleryDefaults.watermarkPosition,
            watermarkLogoUrl: galleryDefaults.watermarkLogoUrl
        });

        setAppliedDefaults(true);
        setTimeout(() => setAppliedDefaults(false), 2000);
    };

    const handleWatermarkLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setBranding({ ...branding, watermarkLogoUrl: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const addCustomLink = () => {
        const newLink: CustomLink = { id: Date.now().toString(), label: '', url: '' };
        setBranding({
            ...branding,
            customLinks: [...(branding.customLinks || []), newLink]
        });
    };

    const removeCustomLink = (id: string) => {
        setBranding({
            ...branding,
            customLinks: (branding.customLinks || []).filter(l => l.id !== id)
        });
    };

    const updateCustomLink = (id: string, field: keyof CustomLink, value: string) => {
        setBranding({
            ...branding,
            customLinks: (branding.customLinks || []).map(l => l.id === id ? { ...l, [field]: value } : l)
        });
    };

    const renderTabs = () => (
        <div className="flex items-center gap-1 p-2 bg-muted/30 rounded-lg mb-6">
            <button
                onClick={() => setActiveTab('general')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${activeTab === 'general' ? 'bg-surface shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
                <Layout className="w-4 h-4" /> General
            </button>
            <button
                onClick={() => setActiveTab('access')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${activeTab === 'access' ? 'bg-surface shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
                <Shield className="w-4 h-4" /> Access & Privacy
            </button>
            <button
                onClick={() => setActiveTab('branding')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${activeTab === 'branding' ? 'bg-surface shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
                <Palette className="w-4 h-4" /> Branding
            </button>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-surface w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div>
                        <h2 className="text-xl font-semibold">Gallery Settings</h2>
                        <p className="text-sm text-muted-foreground">{title}</p>
                    </div>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {renderTabs()}

                    {/* --- GENERAL TAB --- */}
                    {activeTab === 'general' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <section className="space-y-4">
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Basic Info</h3>
                                <AppInput
                                    label="Gallery Title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />

                                {/* Client Link Selector */}
                                <div>
                                    <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                                        <User className="w-4 h-4 text-muted-foreground" /> Link to Client
                                    </label>
                                    <select
                                        className="w-full px-4 py-2.5 text-sm border border-border rounded-lg bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                        value={clientId}
                                        onChange={(e) => setClientId(e.target.value)}
                                    >
                                        <option value="">-- No Client Linked --</option>
                                        {clients.map(client => (
                                            <option key={client.id} value={client.id}>
                                                {client.displayName || `${client.firstName} ${client.lastName}`} ({client.emails[0]?.value})
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-muted-foreground mt-1">Linking a client enables proofing features and activity tracking.</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="pt-2">
                                        <label className="block text-sm font-medium mb-1">Grid Layout Theme</label>
                                        <AppSelect
                                            options={[
                                                { value: 'auto', label: 'System Default' },
                                                { value: 'light', label: 'Light Mode' },
                                                { value: 'dark', label: 'Dark Mode' },
                                            ]}
                                            value={settings.theme}
                                            onChange={(e) => setSettings({ ...settings, theme: e.target.value as any })}
                                        />
                                    </div>
                                    <div className="pt-2">
                                        <label className="block text-sm font-medium mb-1">Client View Layout</label>
                                        <AppSelect
                                            options={[
                                                { value: 'tabs', label: 'Tabs (Categories)' },
                                                { value: 'continuous', label: 'Continuous Scroll' },
                                            ]}
                                            value={settings.clientLayout || 'tabs'}
                                            onChange={(e) => setSettings({ ...settings, clientLayout: e.target.value as any })}
                                            helperText="How sub-galleries are presented to visitors."
                                        />
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-4 pt-4 border-t border-border">
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Downloads & Metadata</h3>
                                <AppToggle
                                    label="Allow Photo Downloads"
                                    description="Visitors can download full-resolution photos."
                                    checked={settings.allowDownload}
                                    onChange={(checked) => setSettings({ ...settings, allowDownload: checked })}
                                />
                                <AppToggle
                                    label="Show Camera Metadata"
                                    description="Display EXIF data (ISO, Aperture, Shutter Speed)."
                                    checked={settings.showMetadata}
                                    onChange={(checked) => setSettings({ ...settings, showMetadata: checked })}
                                />
                            </section>
                        </div>
                    )}

                    {/* --- ACCESS & PRIVACY TAB --- */}
                    {activeTab === 'access' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <section className="space-y-4">
                                <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
                                    <h3 className="text-sm font-semibold text-accent-DEFAULT flex items-center gap-2 mb-3">
                                        <Globe className="w-4 h-4" /> Domain & URL
                                    </h3>
                                    <AppInput
                                        label="Custom Domain (CNAME)"
                                        placeholder="e.g. photos.yourstudio.com"
                                        value={settings.customDomain || ''}
                                        onChange={(e) => setSettings({ ...settings, customDomain: e.target.value })}
                                        helperText="Map this gallery to your own domain (requires DNS config)."
                                    />
                                </div>
                            </section>

                            <section className="space-y-4 pt-2">
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                    <Lock className="w-4 h-4" /> Security
                                </h3>

                                <AppToggle
                                    label="Password Protection"
                                    description="Require a pin code to view this gallery."
                                    checked={settings.isPasswordProtected}
                                    onChange={(checked) => setSettings({ ...settings, isPasswordProtected: checked })}
                                />

                                {settings.isPasswordProtected && (
                                    <div className="ml-14 animate-in slide-in-from-top-2">
                                        <AppInput
                                            type="password"
                                            placeholder="Enter 4-6 digit PIN"
                                            value={settings.password || ''}
                                            onChange={(e) => setSettings({ ...settings, password: e.target.value })}
                                        />
                                    </div>
                                )}

                                <div className="h-px bg-border my-2" />

                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                    <Mail className="w-4 h-4" /> Visitor Data
                                </h3>
                                <AppToggle
                                    label="Require Email Registration"
                                    description="Visitors must enter their email before viewing photos."
                                    checked={settings.emailRegistration}
                                    onChange={(checked) => setSettings({ ...settings, emailRegistration: checked })}
                                />
                            </section>

                            <section className="pt-2">
                                <label className="block text-sm font-medium mb-1">Gallery Expiry</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="date"
                                        className="flex-1 px-3 py-2 text-sm border border-border rounded-lg bg-surface"
                                        value={settings.expiresAt ? settings.expiresAt.split('T')[0] : ''}
                                        onChange={(e) => setSettings({ ...settings, expiresAt: e.target.value })}
                                    />
                                    <AppButton variant="ghost" size="sm" onClick={() => setSettings({ ...settings, expiresAt: undefined })}>Clear</AppButton>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Gallery will become offline after this date.</p>
                            </section>
                        </div>
                    )}

                    {/* --- BRANDING TAB --- */}
                    {activeTab === 'branding' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            {globalSettings && (
                                <div className="bg-accent/5 p-4 rounded-lg border border-accent/10 flex items-center justify-between transition-colors hover:border-accent/30">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white dark:bg-black/20 rounded-full">
                                            <Briefcase className="w-5 h-5 text-accent-DEFAULT" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold text-foreground">Studio Defaults</h4>
                                            <p className="text-xs text-muted-foreground">
                                                Syncs: <strong>Identity & Contact</strong> (from Company Profile) and <strong>Theme & Watermark</strong> (from Gallery Defaults).
                                            </p>
                                        </div>
                                    </div>
                                    <AppButton
                                        size="sm"
                                        variant={appliedDefaults ? 'secondary' : 'outline'}
                                        onClick={applyStudioDefaults}
                                        leftIcon={appliedDefaults ? Check : Copy}
                                        className={appliedDefaults ? "text-success border-success/20 bg-success/10" : ""}
                                    >
                                        {appliedDefaults ? 'Applied!' : 'Apply'}
                                    </AppButton>
                                </div>
                            )}

                            {/* Theme Customization */}
                            <section className="space-y-4">
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                    <Palette className="w-4 h-4" /> Customizable Theme
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Primary Brand Color</label>
                                        <div className="flex gap-2 items-center">
                                            <input
                                                type="color"
                                                value={branding.primaryColor || '#000000'}
                                                onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                                                className="w-10 h-10 p-0 border border-border rounded-lg cursor-pointer"
                                            />
                                            <AppInput
                                                value={branding.primaryColor || '#000000'}
                                                onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                                                placeholder="#000000"
                                                className="font-mono"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Typography</label>
                                        <AppSelect
                                            options={FONTS}
                                            value={branding.fontFamily || 'inherit'}
                                            onChange={(e) => setBranding({ ...branding, fontFamily: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </section>

                            <div className="h-px bg-border" />

                            <section className="space-y-4">
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                    <Briefcase className="w-4 h-4" /> Visual Identity
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <AppInput
                                        label="Studio / Brand Name"
                                        placeholder="e.g. RawBox Photography"
                                        value={branding.brandName || ''}
                                        onChange={(e) => setBranding({ ...branding, brandName: e.target.value })}
                                        leftIcon={Type}
                                    />
                                    <AppInput
                                        label="Tagline"
                                        placeholder="e.g. Capturing Moments"
                                        value={branding.tagline || ''}
                                        onChange={(e) => setBranding({ ...branding, tagline: e.target.value })}
                                        leftIcon={Megaphone}
                                    />
                                </div>
                                <AppInput
                                    label="Logo URL"
                                    placeholder="https://..."
                                    value={branding.logoUrl || ''}
                                    onChange={(e) => setBranding({ ...branding, logoUrl: e.target.value })}
                                />

                                {/* Watermark Section */}
                                <div className="bg-muted/30 p-4 rounded-lg space-y-4 border border-border">
                                    <AppToggle
                                        label="Apply Watermark"
                                        description="Overlay logo on all photos in the public view."
                                        checked={branding.showWatermark}
                                        onChange={(checked) => setBranding({ ...branding, showWatermark: checked })}
                                    />
                                    {branding.showWatermark && (
                                        <div className="space-y-4 animate-in slide-in-from-top-2 border-t border-border pt-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-medium text-muted-foreground mb-1">Opacity ({Math.round((branding.watermarkOpacity || 0.5) * 100)}%)</label>
                                                    <input
                                                        type="range"
                                                        min="0.1"
                                                        max="1"
                                                        step="0.1"
                                                        className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer"
                                                        value={branding.watermarkOpacity || 0.5}
                                                        onChange={(e) => setBranding({ ...branding, watermarkOpacity: parseFloat(e.target.value) })}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-muted-foreground mb-1">Position</label>
                                                    <AppSelect
                                                        options={WM_POSITIONS}
                                                        value={branding.watermarkPosition || 'center'}
                                                        onChange={(e) => setBranding({ ...branding, watermarkPosition: e.target.value as any })}
                                                        size="sm"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-medium text-muted-foreground mb-2">Custom Watermark Logo (Optional)</label>
                                                <div className="flex gap-3 items-center">
                                                    <div className="w-12 h-12 border border-border bg-white rounded-md flex items-center justify-center overflow-hidden">
                                                        {branding.watermarkLogoUrl || branding.logoUrl ? (
                                                            <img src={branding.watermarkLogoUrl || branding.logoUrl} className="max-w-full max-h-full object-contain" alt="WM" />
                                                        ) : <span className="text-[10px] text-muted-foreground">None</span>}
                                                    </div>
                                                    <AppButton size="sm" variant="secondary" onClick={() => wmLogoRef.current?.click()} leftIcon={Upload}>Upload Specific Logo</AppButton>
                                                    <input type="file" ref={wmLogoRef} className="hidden" accept="image/*" onChange={handleWatermarkLogoUpload} />
                                                </div>
                                                <p className="text-[10px] text-muted-foreground mt-1">If not provided, the main brand logo will be used.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>

                            <section className="space-y-4 pt-4 border-t border-border">
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                    <Smartphone className="w-4 h-4" /> Contact Info
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <AppInput
                                        label="Contact Email"
                                        placeholder="hello@yoursite.com"
                                        value={branding.contactEmail || ''}
                                        onChange={(e) => setBranding({ ...branding, contactEmail: e.target.value })}
                                        leftIcon={Mail}
                                    />
                                    <AppInput
                                        label="Phone Number"
                                        placeholder="+1 (555) 000-0000"
                                        value={branding.phone || ''}
                                        onChange={(e) => setBranding({ ...branding, phone: e.target.value })}
                                        leftIcon={Smartphone}
                                    />
                                </div>
                                <AppInput
                                    label="Studio Address / Region"
                                    placeholder="e.g. New York, NY"
                                    value={branding.address || ''}
                                    onChange={(e) => setBranding({ ...branding, address: e.target.value })}
                                    leftIcon={MapPin}
                                />
                            </section>

                            <section className="space-y-4 pt-4 border-t border-border">
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Social Media</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <AppInput
                                        label="Website"
                                        placeholder="https://..."
                                        value={branding.socialLinks?.website || ''}
                                        onChange={(e) => setBranding({ ...branding, socialLinks: { ...branding.socialLinks, website: e.target.value } })}
                                    />
                                    <AppInput
                                        label="Instagram"
                                        placeholder="@username"
                                        value={branding.socialLinks?.instagram || ''}
                                        onChange={(e) => setBranding({ ...branding, socialLinks: { ...branding.socialLinks, instagram: e.target.value } })}
                                    />
                                    <AppInput
                                        label="Facebook"
                                        placeholder="facebook.com/..."
                                        value={branding.socialLinks?.facebook || ''}
                                        onChange={(e) => setBranding({ ...branding, socialLinks: { ...branding.socialLinks, facebook: e.target.value } })}
                                    />
                                    <AppInput
                                        label="TikTok"
                                        placeholder="@username"
                                        value={branding.socialLinks?.tiktok || ''}
                                        onChange={(e) => setBranding({ ...branding, socialLinks: { ...branding.socialLinks, tiktok: e.target.value } })}
                                    />
                                    <AppInput
                                        label="YouTube"
                                        placeholder="channel url"
                                        value={branding.socialLinks?.youtube || ''}
                                        onChange={(e) => setBranding({ ...branding, socialLinks: { ...branding.socialLinks, youtube: e.target.value } })}
                                    />
                                    <AppInput
                                        label="LinkedIn"
                                        placeholder="profile url"
                                        value={branding.socialLinks?.linkedin || ''}
                                        onChange={(e) => setBranding({ ...branding, socialLinks: { ...branding.socialLinks, linkedin: e.target.value } })}
                                    />
                                </div>
                            </section>

                            <section className="space-y-4 pt-4 border-t border-border">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                        <LinkIcon className="w-4 h-4" /> Deep Links & Custom URLs
                                    </h3>
                                    <AppButton size="sm" variant="ghost" leftIcon={Plus} onClick={addCustomLink}>Add Link</AppButton>
                                </div>

                                {(!branding.customLinks || branding.customLinks.length === 0) && (
                                    <p className="text-xs text-muted-foreground italic">Add links to your portfolio, booking page, or store.</p>
                                )}

                                <div className="space-y-3">
                                    {branding.customLinks?.map((link) => (
                                        <div key={link.id} className="flex gap-2 items-start">
                                            <div className="flex-1 grid grid-cols-3 gap-2">
                                                <AppInput
                                                    placeholder="Label (e.g. Book Now)"
                                                    value={link.label}
                                                    onChange={(e) => updateCustomLink(link.id, 'label', e.target.value)}
                                                    size="sm"
                                                />
                                                <AppInput
                                                    placeholder="URL (https://...)"
                                                    value={link.url}
                                                    onChange={(e) => updateCustomLink(link.id, 'url', e.target.value)}
                                                    size="sm"
                                                />
                                                <AppInput
                                                    placeholder="Logo URL (Optional)"
                                                    value={link.logoUrl || ''}
                                                    onChange={(e) => updateCustomLink(link.id, 'logoUrl', e.target.value)}
                                                    size="sm"
                                                />
                                            </div>
                                            <AppIconButton
                                                icon={Trash2}
                                                aria-label="Remove link"
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive-DEFAULT hover:bg-destructive-soft"
                                                onClick={() => removeCustomLink(link.id)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-border bg-muted/10 flex justify-end gap-3">
                    <AppButton variant="ghost" onClick={onClose}>Cancel</AppButton>
                    <AppButton variant="primary" onClick={handleSave} leftIcon={Save}>Save Settings</AppButton>
                </div>
            </div>
        </div>
    );
};
