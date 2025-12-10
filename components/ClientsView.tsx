
import React, { useState, useMemo, useRef } from 'react';
import { PageHeader, AdminToolbar } from './ui/AdminToolbar';
import { AppCard } from './ui/AppCard';
import { AppButton } from './ui/AppButton';
import { Client } from '../types';
import { Users, Plus, Mail, Phone, User, MapPin, Globe, Briefcase, Tag, Hash, Facebook, Instagram, Twitter, Linkedin, Youtube, Music, Ghost, Video, MessageCircle, Upload, X } from 'lucide-react';
import { AppInput, AppTextarea, AppSelect } from './ui/AppInput';
import { ImageCropper } from './ui/ImageCropper';

interface ClientsViewProps {
    clients: Client[];
    onClientClick: (clientId: string) => void;
    onAddClient: (client: Partial<Client>) => void;
}

// --- Constants ---
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

// Mock City Data for Autocomplete Simulation
const MOCK_CITIES: Record<string, string[]> = {
    "Karnataka": ["Bangalore", "Mysore", "Mangalore", "Hubli", "Belgaum", "Gulbarga", "Davangere", "Bellary"],
    "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Erode", "Vellore"],
    "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad", "Solapur"],
    "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam"],
    "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam"],
    "Delhi": ["New Delhi", "North Delhi", "South Delhi", "East Delhi", "West Delhi"],
    "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool"],
};

const SOCIAL_INPUTS = [
    { key: 'instagram', icon: Instagram, placeholder: '@username', label: 'Instagram' },
    { key: 'facebook', icon: Facebook, placeholder: 'Profile URL', label: 'Facebook' },
    { key: 'twitter', icon: Twitter, placeholder: 'Handle', label: 'X / Twitter' },
    { key: 'whatsapp', icon: MessageCircle, placeholder: 'Phone number', label: 'WhatsApp' },
    { key: 'linkedin', icon: Linkedin, placeholder: 'Profile URL', label: 'LinkedIn' },
    { key: 'youtube', icon: Youtube, placeholder: 'Channel URL', label: 'YouTube' },
    { key: 'tiktok', icon: Video, placeholder: '@username', label: 'TikTok' },
    { key: 'snapchat', icon: Ghost, placeholder: 'Username', label: 'Snapchat' },
    { key: 'spotify', icon: Music, placeholder: 'Profile URL', label: 'Spotify' },
];

export const ClientsView: React.FC<ClientsViewProps> = ({ clients, onClientClick, onAddClient }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Comprehensive New Client Form State
    const [newClient, setNewClient] = useState({
        // Identity
        firstName: '',
        lastName: '',
        nickname: '',
        jobTitle: '',
        company: '',
        avatarUrl: '',

        // Contact
        email: '',
        phone: '',
        website: '',

        // Address
        line1: '',
        line2: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India',

        // Socials
        instagram: '', facebook: '', twitter: '',
        whatsapp: '', linkedin: '', youtube: '', tiktok: '', snapchat: '', spotify: '',

        // Meta
        tags: '',
        notes: ''
    });

    // Avatar Upload State
    const [tempAvatarSrc, setTempAvatarSrc] = useState<string | null>(null);
    const [isCropping, setIsCropping] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // City Autocomplete State
    const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
    const [showCitySuggestions, setShowCitySuggestions] = useState(false);

    // Handle City Input for Autocomplete
    const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setNewClient({ ...newClient, city: val });

        if (newClient.country === 'India' && newClient.state && MOCK_CITIES[newClient.state]) {
            if (val.length > 0) {
                const matches = MOCK_CITIES[newClient.state].filter(c => c.toLowerCase().startsWith(val.toLowerCase()));
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
        setNewClient({ ...newClient, city });
        setShowCitySuggestions(false);
    };

    const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = () => {
                setTempAvatarSrc(reader.result as string);
                setIsCropping(true);
            };
            reader.readAsDataURL(file);
        }
        // Reset input so same file can be selected again if needed
        e.target.value = '';
    };

    const handleCropComplete = (croppedBase64: string) => {
        setNewClient({ ...newClient, avatarUrl: croppedBase64 });
        setIsCropping(false);
        setTempAvatarSrc(null);
    };

    const filteredClients = useMemo(() => {
        return clients.filter(c =>
            c.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (c.emails[0]?.value || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (c.nickname || '').toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [clients, searchQuery]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const clientPayload: Partial<Client> = {
            firstName: newClient.firstName,
            lastName: newClient.lastName,
            nickname: newClient.nickname,
            displayName: newClient.nickname
                ? `${newClient.firstName} "${newClient.nickname}" ${newClient.lastName}`
                : `${newClient.firstName} ${newClient.lastName}`,

            organization: newClient.company,
            jobTitle: newClient.jobTitle,
            avatarUrl: newClient.avatarUrl,

            emails: [{ type: 'personal', value: newClient.email, isPrimary: true }],
            phones: newClient.phone ? [{ type: 'mobile', value: newClient.phone, isPrimary: true }] : [],
            websites: newClient.website ? [{ type: 'main', value: newClient.website }] : [],

            address: {
                line1: newClient.line1,
                line2: newClient.line2,
                street: newClient.line1, // Compat
                city: newClient.city,
                state: newClient.state,
                postalCode: newClient.postalCode,
                country: newClient.country,
                timeZone: newClient.country === 'India' ? 'Asia/Kolkata' : undefined
            },

            socials: {
                instagram: newClient.instagram ? `https://instagram.com/${newClient.instagram.replace('@', '')}` : '',
                facebook: newClient.facebook,
                twitter: newClient.twitter,
                whatsapp: newClient.whatsapp,
                linkedin: newClient.linkedin,
                youtube: newClient.youtube,
                tiktok: newClient.tiktok,
                snapchat: newClient.snapchat,
                spotify: newClient.spotify
            },

            tags: newClient.tags.split(',').map(t => t.trim()).filter(Boolean),
            notes: newClient.notes
        };

        onAddClient(clientPayload);
        setIsAddModalOpen(false);

        // Reset
        setNewClient({
            firstName: '', lastName: '', nickname: '', jobTitle: '', company: '', avatarUrl: '',
            email: '', phone: '', website: '',
            line1: '', line2: '', city: '', state: '', postalCode: '', country: 'India',
            instagram: '', facebook: '', twitter: '', whatsapp: '', linkedin: '', youtube: '', tiktok: '', snapchat: '', spotify: '',
            tags: '', notes: ''
        });
    };

    return (
        <div className="space-y-6 pb-20 md:pb-0 animate-in fade-in duration-300">
            <PageHeader
                title="Clients"
                subtitle="Manage client profiles and relationships."
                actions={
                    <AppButton variant="primary" leftIcon={Plus} onClick={() => setIsAddModalOpen(true)}>Add Client</AppButton>
                }
            />

            <AdminToolbar
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Search by name, email, or nickname..."
            />

            {filteredClients.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-muted/30 rounded-xl border border-dashed border-border text-center">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                        <Users className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground">No Clients Found</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-sm mb-6">
                        {searchQuery ? "Try adjusting your search terms." : "Add your first client to get started."}
                    </p>
                    {!searchQuery && (
                        <AppButton variant="primary" onClick={() => setIsAddModalOpen(true)}>Add Client</AppButton>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredClients.map(client => (
                        <AppCard
                            key={client.id}
                            variant="interactive"
                            padding="md"
                            onClick={() => onClientClick(client.id)}
                            className="flex flex-col gap-4 group h-full"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-muted overflow-hidden border border-border flex items-center justify-center shrink-0">
                                        {client.avatarUrl ? (
                                            <img src={client.avatarUrl} alt={`${client.displayName} avatar`} className="w-full h-full object-cover" loading="lazy" width="48" height="48" />
                                        ) : (
                                            <User className="w-6 h-6 text-muted-foreground" />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-semibold text-foreground group-hover:text-accent-DEFAULT transition-colors truncate">
                                            {client.displayName}
                                        </h3>
                                        {(client.jobTitle || client.organization) ? (
                                            <p className="text-xs text-muted-foreground truncate">
                                                {client.jobTitle} {client.jobTitle && client.organization ? 'at' : ''} {client.organization}
                                            </p>
                                        ) : (
                                            <p className="text-xs text-muted-foreground italic">No title</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5 flex-1">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Mail className="w-3.5 h-3.5 shrink-0" />
                                    <span className="truncate">{client.emails[0]?.value}</span>
                                </div>
                                {client.phones[0] && (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Phone className="w-3.5 h-3.5 shrink-0" />
                                        <span className="truncate">{client.phones[0].value}</span>
                                    </div>
                                )}
                                {client.tags && client.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {client.tags.slice(0, 3).map(t => (
                                            <span key={t} className="px-1.5 py-0.5 bg-muted rounded text-[10px] text-muted-foreground border border-border">
                                                #{t}
                                            </span>
                                        ))}
                                        {client.tags.length > 3 && <span className="text-[10px] text-muted-foreground">+{client.tags.length - 3}</span>}
                                    </div>
                                )}
                            </div>

                            <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground mt-auto">
                                <span>Added {new Date(client.createdAt).toLocaleDateString()}</span>
                                <span className={`w-2 h-2 rounded-full ${client.isActive ? 'bg-success-DEFAULT' : 'bg-muted-foreground'}`} />
                            </div>
                        </AppCard>
                    ))}
                </div>
            )}

            {/* Add Client Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
                    <div className="relative bg-surface w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-border flex justify-between items-center bg-muted/10">
                            <div>
                                <h2 className="text-xl font-semibold">Add New Client</h2>
                                <p className="text-sm text-muted-foreground">Create a comprehensive profile to link with galleries.</p>
                            </div>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-muted-foreground hover:text-foreground p-1 hover:bg-muted rounded-full transition-colors"><Users className="w-6 h-6" /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">

                            {/* Identity Section */}
                            <section className="space-y-4">
                                <h3 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2 border-b border-border pb-2">
                                    <User className="w-3.5 h-3.5" /> Identity & Role
                                </h3>

                                <div className="flex flex-col sm:flex-row gap-6">
                                    {/* Avatar Upload */}
                                    <div className="flex-shrink-0 flex flex-col items-center">
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-24 h-24 rounded-full bg-muted border-2 border-dashed border-muted-foreground/30 hover:border-accent-DEFAULT cursor-pointer flex items-center justify-center overflow-hidden relative group transition-colors"
                                        >
                                            {newClient.avatarUrl ? (
                                                <img src={newClient.avatarUrl} alt="Client avatar preview" className="w-full h-full object-cover" width="96" height="96" />
                                            ) : (
                                                <div className="flex flex-col items-center gap-1 text-muted-foreground group-hover:text-accent-DEFAULT">
                                                    <Upload className="w-6 h-6" />
                                                    <span className="text-[9px] font-bold uppercase">Upload</span>
                                                </div>
                                            )}
                                            {newClient.avatarUrl && (
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <span className="text-[10px] text-white font-bold uppercase">Change</span>
                                                </div>
                                            )}
                                        </div>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleAvatarSelect}
                                        />
                                        <span className="text-[10px] text-muted-foreground mt-2">Client Photo</span>
                                    </div>

                                    <div className="flex-1 space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <AppInput label="First Name" value={newClient.firstName} onChange={e => setNewClient({ ...newClient, firstName: e.target.value })} required autoFocus />
                                            <AppInput label="Last Name" value={newClient.lastName} onChange={e => setNewClient({ ...newClient, lastName: e.target.value })} required />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <AppInput label="Nickname" value={newClient.nickname} onChange={e => setNewClient({ ...newClient, nickname: e.target.value })} placeholder="e.g. Sunny" />
                                            <AppInput label="Job Title / Role" value={newClient.jobTitle} onChange={e => setNewClient({ ...newClient, jobTitle: e.target.value })} placeholder="e.g. Bride" leftIcon={Briefcase} />
                                        </div>
                                        <AppInput label="Company / Organization" value={newClient.company} onChange={e => setNewClient({ ...newClient, company: e.target.value })} />
                                    </div>
                                </div>
                            </section>

                            {/* Contact Section */}
                            <section className="space-y-4">
                                <h3 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2 border-b border-border pb-2">
                                    <Phone className="w-3.5 h-3.5" /> Contact Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <AppInput label="Email Address" type="email" value={newClient.email} onChange={e => setNewClient({ ...newClient, email: e.target.value })} required leftIcon={Mail} />
                                    <AppInput label="Phone Number" type="tel" value={newClient.phone} onChange={e => setNewClient({ ...newClient, phone: e.target.value })} leftIcon={Phone} />
                                </div>
                                <AppInput label="Website" value={newClient.website} onChange={e => setNewClient({ ...newClient, website: e.target.value })} placeholder="https://..." leftIcon={Globe} />
                            </section>

                            {/* Address Section */}
                            <section className="space-y-4">
                                <h3 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2 border-b border-border pb-2">
                                    <MapPin className="w-3.5 h-3.5" /> Location
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <AppSelect
                                        label="Country"
                                        options={COUNTRIES}
                                        value={newClient.country}
                                        onChange={(e) => setNewClient({ ...newClient, country: e.target.value, state: '' })}
                                    />

                                    {newClient.country === 'India' ? (
                                        <div className="space-y-1">
                                            <label className="block text-sm font-medium text-foreground">State</label>
                                            <AppSelect
                                                options={INDIAN_STATES.map(s => ({ label: s, value: s }))}
                                                value={newClient.state}
                                                onChange={(e) => setNewClient({ ...newClient, state: e.target.value })}
                                                placeholder="Select State"
                                            />
                                        </div>
                                    ) : (
                                        <AppInput label="State / Region" value={newClient.state} onChange={e => setNewClient({ ...newClient, state: e.target.value })} />
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="relative">
                                        <AppInput
                                            label="City"
                                            value={newClient.city}
                                            onChange={handleCityChange}
                                            placeholder={newClient.state ? "Type to search..." : "Enter City"}
                                            autoComplete="off"
                                        />
                                        {showCitySuggestions && (
                                            <div className="absolute top-full left-0 right-0 z-10 bg-surface border border-border rounded-md shadow-lg mt-1 max-h-32 overflow-y-auto">
                                                {citySuggestions.map(city => (
                                                    <button
                                                        key={city}
                                                        type="button"
                                                        onClick={() => selectCity(city)}
                                                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                                                    >
                                                        {city}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <AppInput label="Postal Code" value={newClient.postalCode} onChange={e => setNewClient({ ...newClient, postalCode: e.target.value })} />
                                </div>

                                <AppInput label="Address Line 1" value={newClient.line1} onChange={e => setNewClient({ ...newClient, line1: e.target.value })} />
                                <AppInput label="Address Line 2" value={newClient.line2} onChange={e => setNewClient({ ...newClient, line2: e.target.value })} />
                            </section>

                            {/* Socials Section */}
                            <section className="space-y-4">
                                <h3 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2 border-b border-border pb-2">
                                    <Globe className="w-3.5 h-3.5" /> Social Media
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {SOCIAL_INPUTS.map((social) => (
                                        <AppInput
                                            key={social.key}
                                            leftIcon={social.icon}
                                            placeholder={social.placeholder}
                                            value={(newClient as any)[social.key]}
                                            onChange={e => setNewClient({ ...newClient, [social.key]: e.target.value })}
                                        />
                                    ))}
                                </div>
                            </section>

                            {/* Meta Section */}
                            <section className="space-y-4">
                                <h3 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2 border-b border-border pb-2">
                                    <Hash className="w-3.5 h-3.5" /> Metadata
                                </h3>
                                <AppInput label="Tags (comma separated)" value={newClient.tags} onChange={e => setNewClient({ ...newClient, tags: e.target.value })} placeholder="e.g. VIP, Wedding, Referral" leftIcon={Tag} />
                                <AppTextarea label="Internal Notes" value={newClient.notes} onChange={e => setNewClient({ ...newClient, notes: e.target.value })} placeholder="Private notes about this client..." />
                            </section>

                            <div className="pt-4 flex justify-end gap-3 border-t border-border mt-8">
                                <AppButton variant="ghost" type="button" onClick={() => setIsAddModalOpen(false)}>Cancel</AppButton>
                                <AppButton variant="primary" type="submit">Create Client Profile</AppButton>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Crop Modal */}
            {isCropping && tempAvatarSrc && (
                <ImageCropper
                    imageSrc={tempAvatarSrc}
                    onCrop={handleCropComplete}
                    onCancel={() => { setIsCropping(false); setTempAvatarSrc(null); }}
                    aspectRatio={1}
                />
            )}
        </div>
    );
};
