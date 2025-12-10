
import React, { useState, useRef, useEffect } from 'react';
import { Client, Album, ProfileSocials, ProfileCustomLink } from '../types';
import { AppButton, AppIconButton } from './ui/AppButton';
import { AppCard } from './ui/AppCard';
import { AlbumGrid } from './AlbumGrid';
import { ArrowLeft, Mail, Phone, MapPin, Edit, Trash2, LayoutGrid, Heart, CheckCircle2, User, Globe, Briefcase, Save, X, Upload, Plus, Link as LinkIcon, Instagram, Facebook, Twitter, Linkedin, Youtube, Music, Ghost, Video, MessageCircle, Tag, Languages } from 'lucide-react';
import { AppInput, AppTextarea, AppSelect } from './ui/AppInput';

interface ClientDetailViewProps {
    client: Client;
    linkedAlbums: Album[];
    onBack: () => void;
    onUpdateClient: (id: string, updates: Partial<Client>) => void;
    onDeleteClient: (id: string) => void;
    onAlbumClick: (id: string) => void;
}

// --- CONSTANTS ---

const INDIAN_LANGUAGES = [
    "Assamese", "Bengali", "English", "Gujarati", "Hindi", "Kannada", "Maithili", "Malayalam", "Marathi", "Odia", "Punjabi", "Tamil", "Telugu", "Urdu"
];

const COUNTRIES = [
    { value: 'India', label: 'India' },
    { value: 'United States', label: 'United States' },
    { value: 'United Kingdom', label: 'United Kingdom' },
    { value: 'Australia', label: 'Australia' },
    { value: 'Canada', label: 'Canada' },
    { value: 'UAE', label: 'UAE' },
];

const INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Lakshadweep", "Delhi", "Puducherry", "Ladakh", "Jammu and Kashmir"
];

const POPULAR_TAGS = ["VIP", "Important", "Wedding", "Corporate", "Returning", "Referral", "Family", "Couple", "Influencer"];

const MOCK_CITIES: Record<string, string[]> = {
    "Karnataka": ["Bangalore", "Mysore", "Mangalore", "Hubli", "Belgaum", "Gulbarga", "Davangere", "Bellary"],
    "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Erode", "Vellore"],
    "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad", "Solapur"],
    "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam"],
    "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam"],
    "Delhi": ["New Delhi", "North Delhi", "South Delhi", "East Delhi", "West Delhi"],
    "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool"],
};

const SOCIAL_MEDIA_CONFIG: Record<keyof ProfileSocials, { icon: any; color: string; prefix: string }> = {
    instagram: { icon: Instagram, color: 'text-accent', prefix: 'https://instagram.com/' },
    facebook: { icon: Facebook, color: 'text-primary', prefix: 'https://faceboook.com/' },
    whatsapp: { icon: MessageCircle, color: 'text-success', prefix: 'https://wa.me/' },
    twitter: { icon: Twitter, color: 'text-info', prefix: 'https://twitter.com/' },
    linkedin: { icon: Linkedin, color: 'text-primary', prefix: 'https://linkedin.com/in/' },
    youtube: { icon: Youtube, color: 'text-error', prefix: 'https://youtube.com/' },
    tiktok: { icon: Video, color: 'text-foreground', prefix: 'https://tiktok.com/@' },
    spotify: { icon: Music, color: 'text-success', prefix: 'https://open.spotify.com/user/' },
    snapchat: { icon: Ghost, color: 'text-warning', prefix: 'https://snapchat.com/add/' },
};

// --- COMPONENTS ---

// Helper for multi-select chips
const MultiSelectChips: React.FC<{
    options: string[];
    selected: string[];
    onChange: (selected: string[]) => void;
    allowCustom?: boolean;
    placeholder?: string;
}> = ({ options, selected, onChange, allowCustom = false, placeholder = "Add new..." }) => {
    const [customInput, setCustomInput] = useState("");

    const toggleOption = (option: string) => {
        if (selected.includes(option)) {
            onChange(selected.filter(s => s !== option));
        } else {
            onChange([...selected, option]);
        }
    };

    const handleCustomAdd = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && customInput.trim()) {
            e.preventDefault();
            if (!selected.includes(customInput.trim())) {
                onChange([...selected, customInput.trim()]);
            }
            setCustomInput("");
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
                {selected.map(item => (
                    <span key={item} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent-DEFAULT border border-accent/20">
                        {item}
                        <button type="button" onClick={() => toggleOption(item)} className="hover:text-accent-dark"><X className="w-3 h-3" /></button>
                    </span>
                ))}
            </div>

            <div className="flex flex-wrap gap-2">
                {options.filter(o => !selected.includes(o)).map(option => (
                    <button
                        key={option}
                        type="button"
                        onClick={() => toggleOption(option)}
                        className="px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-transparent hover:border-border hover:bg-surface transition-colors"
                    >
                        + {option}
                    </button>
                ))}
            </div>

            {allowCustom && (
                <div className="relative max-w-xs">
                    <input
                        type="text"
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        onKeyDown={handleCustomAdd}
                        placeholder={placeholder}
                        className="w-full px-3 py-1.5 text-sm bg-surface border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                    <Plus className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
            )}
        </div>
    );
};

export const ClientDetailView: React.FC<ClientDetailViewProps> = ({
    client,
    linkedAlbums,
    onBack,
    onUpdateClient,
    onDeleteClient,
    onAlbumClick
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Edit Form State
    const [editForm, setEditForm] = useState({
        // Identity
        nickname: client.nickname || '',
        firstName: client.firstName,
        lastName: client.lastName,
        displayName: client.displayName,
        contactTitle: client.jobTitle || '',

        // Contact
        email: client.emails[0]?.value || '',
        phone: client.phones[0]?.value || '',
        website: client.websites?.[0]?.value || '',
        avatarUrl: client.avatarUrl || '',

        // Address
        country: client.address?.country || 'India',
        state: client.address?.state || '',
        city: client.address?.city || '',
        line1: client.address?.line1 || client.address?.street || '',
        line2: client.address?.line2 || '',
        postalCode: client.address?.postalCode || '',

        // Other
        languages: client.languages || (client.preferredLanguage ? [client.preferredLanguage] : []),
        tags: client.tags || [],

        // Socials
        socials: {
            instagram: client.socials?.instagram || '',
            facebook: client.socials?.facebook || '',
            whatsapp: client.socials?.whatsapp || '',
            spotify: client.socials?.spotify || '',
            twitter: client.socials?.twitter || '',
            tiktok: client.socials?.tiktok || '',
            linkedin: client.socials?.linkedin || '',
            snapchat: client.socials?.snapchat || '',
            youtube: client.socials?.youtube || '',
        } as ProfileSocials,

        // Custom Links
        customLinks: client.customLinks || [],
    });

    // City Autocomplete State
    const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
    const [showCitySuggestions, setShowCitySuggestions] = useState(false);

    // Handlers
    const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setEditForm({ ...editForm, city: val });

        if (editForm.country === 'India' && editForm.state && MOCK_CITIES[editForm.state]) {
            if (val.length > 0) {
                const matches = MOCK_CITIES[editForm.state].filter(c => c.toLowerCase().startsWith(val.toLowerCase()));
                setCitySuggestions(matches);
                setShowCitySuggestions(true);
            } else {
                setShowCitySuggestions(false);
            }
        } else {
            setShowCitySuggestions(false);
        }
    };

    const selectCity = (city: string) => {
        setEditForm({ ...editForm, city });
        setShowCitySuggestions(false);
    };

    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setEditForm(prev => ({ ...prev, avatarUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        const updates: Partial<Client> = {
            firstName: editForm.firstName,
            lastName: editForm.lastName,
            nickname: editForm.nickname,
            displayName: editForm.displayName || `${editForm.firstName} ${editForm.lastName}`,
            jobTitle: editForm.contactTitle,
            avatarUrl: editForm.avatarUrl,

            emails: [{ type: 'primary', value: editForm.email, isPrimary: true }],
            phones: editForm.phone ? [{ type: 'mobile', value: editForm.phone, isPrimary: true }] : [],
            websites: editForm.website ? [{ type: 'main', value: editForm.website }] : [],

            address: {
                line1: editForm.line1,
                line2: editForm.line2,
                street: editForm.line1, // Backward compatibility
                city: editForm.city,
                state: editForm.state,
                postalCode: editForm.postalCode,
                country: editForm.country,
            },

            languages: editForm.languages,
            preferredLanguage: editForm.languages[0], // First as preferred
            tags: editForm.tags,
            socials: editForm.socials,
            customLinks: editForm.customLinks,
        };

        onUpdateClient(client.id, updates);
        setIsEditing(false);
    };

    // Socials Handlers
    const updateSocials = (key: keyof ProfileSocials, value: string) => {
        let formattedValue = value;
        const config = SOCIAL_MEDIA_CONFIG[key];
        // Auto-prefix if just handle provided
        if (value && !value.startsWith('http') && config) {
            formattedValue = `${config.prefix}${value.replace('@', '')}`;
        }
        setEditForm(prev => ({
            ...prev,
            socials: { ...prev.socials, [key]: formattedValue }
        }));
    };

    // Custom Links Handlers
    const addCustomLink = () => {
        const newLink: ProfileCustomLink = { id: Date.now().toString(), label: '', url: '', logoUrl: '' };
        setEditForm(prev => ({ ...prev, customLinks: [...prev.customLinks, newLink] }));
    };

    const removeCustomLink = (id: string) => {
        setEditForm(prev => ({ ...prev, customLinks: prev.customLinks.filter(l => l.id !== id) }));
    };

    const updateCustomLink = (id: string, field: keyof ProfileCustomLink, value: string) => {
        setEditForm(prev => ({
            ...prev,
            customLinks: prev.customLinks.map(l => l.id === id ? { ...l, [field]: value } : l)
        }));
    };

    const PrimaryEmail = client.emails.find(e => e.isPrimary) || client.emails[0];
    const PrimaryPhone = client.phones.find(p => p.isPrimary) || client.phones[0];

    return (
        <div className="space-y-6 pb-20 md:pb-0 animate-in fade-in slide-in-from-right-4 duration-300">

            {/* Header / Actions */}
            <div className="flex items-center justify-between">
                <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                    <ArrowLeft className="w-4 h-4" /> Back to Clients
                </button>
                {!isEditing && (
                    <div className="flex gap-2">
                        <AppButton variant="outline" size="sm" onClick={() => setIsEditing(true)} leftIcon={Edit}>Edit Profile</AppButton>
                        <AppButton variant="destructive" size="sm" onClick={() => { if (confirm("Delete client?")) onDeleteClient(client.id) }} leftIcon={Trash2}>Delete</AppButton>
                    </div>
                )}
            </div>

            {isEditing ? (
                <AppCard className="space-y-8">
                    {/* Identity Section with Avatar */}
                    <section className="space-y-6">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 border-b border-border pb-2">
                            <User className="w-4 h-4" /> Identity
                        </h3>

                        <div className="flex flex-col md:flex-row gap-6 items-start">
                            {/* Avatar Upload inside Identity */}
                            <div className="flex-shrink-0 mx-auto md:mx-0">
                                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                    <div className="w-32 h-32 rounded-full bg-muted overflow-hidden border-4 border-surface shadow-sm flex items-center justify-center">
                                        {editForm.avatarUrl ? (
                                            <img src={editForm.avatarUrl} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="w-12 h-12 text-muted-foreground" />
                                        )}
                                    </div>
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                                        <Upload className="w-6 h-6 text-white" />
                                    </div>
                                    <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} className="hidden" accept="image/*" />
                                </div>
                                <p className="text-xs text-center text-muted-foreground mt-2">Click to change</p>
                            </div>

                            {/* Name Fields */}
                            <div className="flex-1 w-full space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <AppInput label="First Name" value={editForm.firstName} onChange={e => setEditForm({ ...editForm, firstName: e.target.value })} required />
                                    <AppInput label="Last Name" value={editForm.lastName} onChange={e => setEditForm({ ...editForm, lastName: e.target.value })} required />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <AppInput label="Nick Name" value={editForm.nickname} onChange={e => setEditForm({ ...editForm, nickname: e.target.value })} />
                                    <AppInput label="Client Contact (Title/Role)" value={editForm.contactTitle} onChange={e => setEditForm({ ...editForm, contactTitle: e.target.value })} placeholder="e.g. Lead Coordinator" />
                                </div>
                            </div>
                        </div>

                        {/* Languages */}
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-foreground">Languages</label>
                            <div className="p-3 border border-border rounded-lg bg-surface">
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {editForm.languages.map(lang => (
                                        <span key={lang} className="inline-flex items-center gap-1 px-2 py-1 bg-accent/10 text-accent-DEFAULT rounded text-xs font-medium">
                                            {lang} <button onClick={() => setEditForm({ ...editForm, languages: editForm.languages.filter(l => l !== lang) })}><X className="w-3 h-3" /></button>
                                        </span>
                                    ))}
                                </div>
                                <select
                                    className="w-full text-sm bg-transparent outline-none text-muted-foreground py-1 cursor-pointer"
                                    onChange={(e) => {
                                        if (e.target.value && !editForm.languages.includes(e.target.value)) {
                                            setEditForm({ ...editForm, languages: [...editForm.languages, e.target.value] })
                                        }
                                        e.target.value = "";
                                    }}
                                >
                                    <option value="">+ Add Language</option>
                                    {INDIAN_LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                            </div>
                        </div>
                    </section>

                    {/* Contact Section */}
                    <section className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 border-b border-border pb-2">
                            <Phone className="w-4 h-4" /> Contact Info
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <AppInput label="Email" type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} required leftIcon={Mail} />
                            <AppInput label="Phone" type="tel" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} leftIcon={Phone} />
                            <AppInput label="Website" value={editForm.website} onChange={e => setEditForm({ ...editForm, website: e.target.value })} leftIcon={Globe} />
                        </div>
                    </section>

                    {/* Address Section */}
                    <section className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 border-b border-border pb-2">
                            <MapPin className="w-4 h-4" /> Address
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-foreground">Country</label>
                                <AppSelect
                                    options={COUNTRIES}
                                    value={editForm.country}
                                    onChange={(e) => setEditForm({ ...editForm, country: e.target.value, state: '' })}
                                />
                            </div>

                            {editForm.country === 'India' ? (
                                <div className="space-y-1">
                                    <label className="block text-sm font-medium text-foreground">State</label>
                                    <AppSelect
                                        options={INDIAN_STATES.map(s => ({ label: s, value: s }))}
                                        value={editForm.state}
                                        onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                                        placeholder="Select State"
                                    />
                                </div>
                            ) : (
                                <AppInput label="State / Region" value={editForm.state} onChange={e => setEditForm({ ...editForm, state: e.target.value })} />
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="relative">
                                <AppInput
                                    label="City"
                                    value={editForm.city}
                                    onChange={handleCityChange}
                                    placeholder={editForm.state ? "Type to search..." : "Enter City"}
                                    autoComplete="off"
                                />
                                {showCitySuggestions && (
                                    <div className="absolute top-full left-0 right-0 z-20 bg-surface border border-border rounded-md shadow-lg mt-1 max-h-32 overflow-y-auto">
                                        {citySuggestions.map(city => (
                                            <button
                                                key={city}
                                                type="button"
                                                onClick={() => selectCity(city)}
                                                className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors"
                                            >
                                                {city}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <AppInput label="Postal Code" value={editForm.postalCode} onChange={e => setEditForm({ ...editForm, postalCode: e.target.value })} />
                        </div>

                        <AppInput label="Address Line 1" value={editForm.line1} onChange={e => setEditForm({ ...editForm, line1: e.target.value })} />
                        <AppInput label="Address Line 2" value={editForm.line2} onChange={e => setEditForm({ ...editForm, line2: e.target.value })} />
                    </section>

                    {/* Social Media Section */}
                    <section className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 border-b border-border pb-2">
                            <Globe className="w-4 h-4" /> Social Media
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {(Object.keys(SOCIAL_MEDIA_CONFIG) as Array<keyof ProfileSocials>).map((key) => {
                                const config = SOCIAL_MEDIA_CONFIG[key];
                                return (
                                    <div key={key} className="relative">
                                        <AppInput
                                            leftIcon={config.icon}
                                            placeholder={`${key.charAt(0).toUpperCase() + key.slice(1)} handle/url`}
                                            value={(editForm.socials as any)[key]}
                                            onChange={(e) => updateSocials(key, e.target.value)}
                                            className={`pl-10 ${config.color.replace('text-', 'focus:ring-')}`}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* Custom Links Section */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between border-b border-border pb-2">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <LinkIcon className="w-4 h-4" /> Custom Links
                            </h3>
                            <AppButton size="sm" variant="ghost" leftIcon={Plus} onClick={addCustomLink}>Add URL</AppButton>
                        </div>

                        <div className="space-y-3">
                            {editForm.customLinks.map((link) => (
                                <div key={link.id} className="flex gap-2 items-start bg-muted/20 p-2 rounded-lg">
                                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                                        <AppInput
                                            placeholder="Label (e.g. Portfolio)"
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
                                        className="text-destructive-DEFAULT hover:bg-destructive-soft mt-1"
                                        onClick={() => removeCustomLink(link.id)}
                                    />
                                </div>
                            ))}
                            {editForm.customLinks.length === 0 && <p className="text-xs text-muted-foreground italic">No custom links added.</p>}
                        </div>
                    </section>

                    {/* Tags Section */}
                    <section className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 border-b border-border pb-2">
                            <Tag className="w-4 h-4" /> Tags
                        </h3>
                        <MultiSelectChips
                            options={POPULAR_TAGS}
                            selected={editForm.tags || []}
                            onChange={(tags) => setEditForm({ ...editForm, tags })}
                            allowCustom={true}
                            placeholder="Add custom tag..."
                        />
                    </section>

                    <div className="pt-6 border-t border-border flex justify-end gap-3 sticky bottom-0 bg-surface/95 backdrop-blur-sm py-4 z-10 -mx-6 px-6 -mb-6 rounded-b-xl">
                        <AppButton variant="ghost" onClick={() => setIsEditing(false)}>Cancel</AppButton>
                        <AppButton variant="primary" onClick={handleSave} leftIcon={Save}>Save Client Profile</AppButton>
                    </div>
                </AppCard>
            ) : (
                // View Mode
                <div className="space-y-6">

                    {/* Unified Profile Card */}
                    <AppCard className="relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-accent/10 to-transparent"></div>
                        <div className="relative flex flex-col md:flex-row gap-6 items-center md:items-start pt-8">

                            {/* Avatar */}
                            <div className="flex-shrink-0">
                                <div className="w-32 h-32 rounded-full bg-muted overflow-hidden border-4 border-surface shadow-lg">
                                    {client.avatarUrl ? (
                                        <img src={client.avatarUrl} alt={client.displayName} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
                                            <User className="w-12 h-12" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Info */}
                            <div className="flex-1 text-center md:text-left space-y-2">
                                <div>
                                    <h1 className="text-3xl font-bold text-foreground">{client.displayName}</h1>
                                    {client.nickname && <p className="text-muted-foreground text-lg">"{client.nickname}"</p>}
                                </div>

                                {client.jobTitle && (
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent/10 text-accent-DEFAULT text-sm font-medium">
                                        <Briefcase className="w-3.5 h-3.5" /> {client.jobTitle}
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-2 justify-center md:justify-start mt-2">
                                    {client.tags?.map(tag => (
                                        <span key={tag} className="px-2 py-0.5 bg-muted rounded-md text-xs text-muted-foreground font-medium border border-border">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>

                                {/* Primary Contact Row */}
                                <div className="flex flex-wrap gap-4 justify-center md:justify-start pt-4 text-sm">
                                    {PrimaryEmail && (
                                        <div className="flex items-center gap-2 text-foreground">
                                            <Mail className="w-4 h-4 text-muted-foreground" />
                                            <span>{PrimaryEmail.value}</span>
                                        </div>
                                    )}
                                    {PrimaryPhone && (
                                        <div className="flex items-center gap-2 text-foreground">
                                            <Phone className="w-4 h-4 text-muted-foreground" />
                                            <span>{PrimaryPhone.value}</span>
                                        </div>
                                    )}
                                    {client.websites?.[0] && (
                                        <div className="flex items-center gap-2 text-foreground">
                                            <Globe className="w-4 h-4 text-muted-foreground" />
                                            <a href={client.websites[0].value} target="_blank" rel="noreferrer" className="hover:underline">{client.websites[0].value.replace(/^https?:\/\//, '')}</a>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Quick Stats (Right side on desktop) */}
                            <div className="flex gap-4 md:flex-col md:gap-2 text-center md:text-right md:border-l md:border-border md:pl-6 min-w-[100px]">
                                <div>
                                    <div className="text-2xl font-bold text-foreground">{linkedAlbums.length}</div>
                                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Galleries</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-error">{linkedAlbums.reduce((acc, a) => acc + a.photos.filter(p => p.isFavorite).length, 0)}</div>
                                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Likes</div>
                                </div>
                            </div>
                        </div>
                    </AppCard>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Location & Details */}
                        <AppCard className="space-y-4">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <MapPin className="w-4 h-4" /> Location & Details
                            </h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-start gap-3">
                                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                                    <span className="leading-relaxed">
                                        {[client.address?.line1, client.address?.line2, client.address?.city, client.address?.state, client.address?.postalCode, client.address?.country].filter(Boolean).join(', ') || 'Address not set'}
                                    </span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Languages className="w-4 h-4 text-muted-foreground mt-0.5" />
                                    <span>{client.languages?.join(', ') || client.preferredLanguage || 'English'}</span>
                                </div>
                            </div>
                        </AppCard>

                        {/* Socials & Links */}
                        <AppCard className="space-y-4">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <Globe className="w-4 h-4" /> Connected Accounts
                            </h3>
                            {client.socials && Object.values(client.socials).some(Boolean) ? (
                                <div className="flex flex-wrap gap-3">
                                    {Object.entries(client.socials).map(([key, url]) => {
                                        if (!url) return null;
                                        const config = SOCIAL_MEDIA_CONFIG[key as keyof ProfileSocials];
                                        const Icon = config?.icon || Globe;
                                        return (
                                            <a
                                                key={key}
                                                href={url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className={`p-2.5 rounded-lg bg-surface border border-border hover:border-accent-DEFAULT hover:shadow-sm transition-all text-muted-foreground hover:text-accent-DEFAULT`}
                                                title={key}
                                            >
                                                <Icon className="w-5 h-5" />
                                            </a>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground italic">No social profiles linked.</p>
                            )}

                            {client.customLinks && client.customLinks.length > 0 && (
                                <div className="space-y-2 pt-2">
                                    {client.customLinks.map(link => (
                                        <a key={link.id} href={link.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 hover:bg-muted rounded-lg text-sm text-accent-DEFAULT hover:underline transition-colors">
                                            {link.logoUrl ? <img src={link.logoUrl} className="w-4 h-4 object-contain" alt="" /> : <LinkIcon className="w-4 h-4" />}
                                            {link.label}
                                        </a>
                                    ))}
                                </div>
                            )}
                        </AppCard>
                    </div>

                    {/* Linked Galleries */}
                    <div className="pt-4">
                        <div className="flex items-center gap-2 mb-4">
                            <LayoutGrid className="w-5 h-5 text-accent-DEFAULT" />
                            <h3 className="text-lg font-semibold">Linked Galleries</h3>
                        </div>
                        {linkedAlbums.length === 0 ? (
                            <div className="p-8 text-center bg-muted/20 rounded-xl border border-dashed border-border text-muted-foreground text-sm">
                                No galleries linked to this client yet.
                            </div>
                        ) : (
                            <AlbumGrid albums={linkedAlbums} onAlbumClick={onAlbumClick} />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
