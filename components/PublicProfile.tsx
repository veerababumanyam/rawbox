
import React from 'react';
import { PhotographerProfile, ProfileSocials } from '../types';
import { AppCard } from './ui/AppCard';
import {
    Mail, Phone, Globe, MapPin,
    Instagram, Facebook, Twitter, Linkedin, Youtube,
    Music, Ghost, Video, ExternalLink, Download, MessageCircle, Share2,
    Building2, User, Link as LinkIcon, Languages
} from 'lucide-react';
import { AppButton, AppIconButton } from './ui/AppButton';

interface PublicProfileProps {
    profile: PhotographerProfile;
    onClose?: () => void;
}

const SocialIconMap: Record<keyof ProfileSocials, any> = {
    instagram: Instagram,
    facebook: Facebook,
    twitter: Twitter,
    linkedin: Linkedin,
    youtube: Youtube,
    tiktok: Video,
    spotify: Music,
    snapchat: Ghost,
    whatsapp: MessageCircle
};

// SEO Helper: Schema Markup Generator
const SchemaMarkup: React.FC<{ profile: PhotographerProfile; displayBio: string; displayImage: string | undefined; displayName: string }> = ({ profile, displayBio, displayImage, displayName }) => {
    if (!profile.settings.allowIndexing) return null;

    const { personal, company, companyVisibility, personalVisibility } = profile;
    const isCompanyVisible = company.name && companyVisibility.name;
    const isPersonalVisible = personal.firstName && personalVisibility.firstName;

    // Build the schema object dynamically based on visibility
    const schema: any = {
        "@context": "https://schema.org",
        "@type": isCompanyVisible ? "ProfessionalService" : "Person",
        "name": displayName,
        "description": displayBio,
        "image": displayImage,
        "url": `https://RawBox.co/p/${company.slug || 'profile'}`
    };

    if (isCompanyVisible) {
        if (companyVisibility.address?.country) {
            schema.address = {
                "@type": "PostalAddress",
                "streetAddress": companyVisibility.address?.line1 ? company.address.line1 : undefined,
                "addressLocality": companyVisibility.address?.city ? company.address.city : undefined,
                "addressRegion": companyVisibility.address?.state ? company.address.state : undefined,
                "postalCode": companyVisibility.address?.postalCode ? company.address.postalCode : undefined,
                "addressCountry": company.address.country
            };
        }
        if (companyVisibility.phone) schema.telephone = company.phone;
        if (companyVisibility.email) schema.email = company.email;
    } else if (isPersonalVisible) {
        if (personalVisibility.phone) schema.telephone = personal.phone;
        if (personalVisibility.email) schema.email = personal.email;
    }

    // Add SameAs links for social media
    const sameAs = [];
    const socialKeys = ['instagram', 'facebook', 'twitter', 'linkedin', 'youtube'] as const;
    socialKeys.forEach(key => {
        if (isCompanyVisible && companyVisibility.socials?.[key] && company.socials[key]) sameAs.push(company.socials[key]);
        else if (isPersonalVisible && personalVisibility.socials?.[key] && personal.socials[key]) sameAs.push(personal.socials[key]);
    });
    if (sameAs.length > 0) schema.sameAs = sameAs;

    return (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    );
};

export const PublicProfile: React.FC<PublicProfileProps> = ({ profile, onClose }) => {
    const { personal, company, personalVisibility, companyVisibility } = profile;
    const theme = profile.settings.theme?.values;

    // --- Helpers ---

    // Check if a field is visible based on the deep visibility map
    const isVisible = (visMap: any, path: string[]) => {
        let current = visMap;
        for (const key of path) {
            if (current === undefined || current === null) return false;
            current = current[key];
        }
        return current === true;
    };

    // Get preferred value: Company first, then Personal
    const getPreferred = <T,>(
        cVal: T | undefined,
        cPath: string[],
        pVal: T | undefined,
        pPath: string[]
    ): T | undefined => {
        if (cVal && isVisible(companyVisibility, cPath)) return cVal;
        if (pVal && isVisible(personalVisibility, pPath)) return pVal;
        return undefined;
    };

    // Resolve Display Data
    const showCompanyAsPrimary = company.name && isVisible(companyVisibility, ['name']);

    const displayName = showCompanyAsPrimary
        ? company.name
        : (isVisible(personalVisibility, ['firstName']) ? `${personal.firstName} ${personal.lastName}` : 'Photographer');

    let displayBio = "";
    if (showCompanyAsPrimary) {
        if (company.tagline && isVisible(companyVisibility, ['tagline'])) {
            displayBio = company.tagline;
        } else if (isVisible(personalVisibility, ['firstName'])) {
            displayBio = `${personal.firstName} ${personal.lastName}`;
            if (personal.contact && isVisible(personalVisibility, ['contact'])) {
                displayBio += ` • ${personal.contact}`;
            }
        }
    } else {
        const parts = [];
        if (personal.nickname && isVisible(personalVisibility, ['nickname'])) parts.push(`"${personal.nickname}"`);
        if (personal.contact && isVisible(personalVisibility, ['contact'])) parts.push(personal.contact);
        displayBio = parts.join(' • ');
    }

    const displayImage = getPreferred(company.logoUrl, ['logoUrl'], personal.photoUrl, ['photoUrl']);

    const socialKeys = ['instagram', 'facebook', 'twitter', 'linkedin', 'youtube', 'whatsapp', 'tiktok', 'snapchat', 'spotify'] as const;
    const displaySocials = socialKeys.map(key => {
        const url = getPreferred(company.socials[key], ['socials', key], personal.socials[key], ['socials', key]);
        return url ? { key, url } : null;
    }).filter((s): s is { key: typeof socialKeys[number], url: string } => !!s);

    const displayPhone = getPreferred(company.phone, ['phone'], personal.phone, ['phone']);
    const displayEmail = getPreferred(company.email, ['email'], personal.email, ['email']);
    const displayWebsite = getPreferred(company.website, ['website'], personal.website, ['website']);

    const getAddressString = (addr: any, vis: any, section: 'company' | 'personal') => {
        if (!addr) return null;
        const parts = [
            isVisible(vis, ['address', 'line1']) ? addr.line1 : null,
            isVisible(vis, ['address', 'line2']) ? addr.line2 : null,
            isVisible(vis, ['address', 'city']) ? addr.city : null,
            isVisible(vis, ['address', 'state']) ? addr.state : null,
            isVisible(vis, ['address', 'postalCode']) ? addr.postalCode : null,
            isVisible(vis, ['address', 'country']) ? addr.country : null,
        ].filter(Boolean);
        return parts.length > 0 ? parts.join(', ') : null;
    };
    const displayAddress = getAddressString(company.address, companyVisibility, 'company') || getAddressString(personal.address, personalVisibility, 'personal');

    const displayLinks = (company.customLinks?.length && isVisible(companyVisibility, ['customLinks']))
        ? company.customLinks
        : (personal.customLinks?.length && isVisible(personalVisibility, ['customLinks']))
            ? personal.customLinks
            : [];

    const displayLanguages = (company.languages?.length && isVisible(companyVisibility, ['languages']))
        ? company.languages
        : (personal.languages?.length && isVisible(personalVisibility, ['languages']))
            ? personal.languages
            : [];

    const publicSlug = company.slug || (company.name ? company.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : 'profile');
    const publicUrl = `https://RawBox.co/p/${publicSlug}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(publicUrl)}`;

    const downloadVCard = () => {
        const vCardData = `BEGIN:VCARD
VERSION:3.0
FN:${displayName}
${showCompanyAsPrimary ? `ORG:${company.name}` : `ORG:Freelance Photographer`}
${displayPhone ? `TEL;TYPE=CELL:${displayPhone}` : ''}
${displayEmail ? `EMAIL;TYPE=WORK:${displayEmail}` : ''}
${displayWebsite ? `URL:${displayWebsite}` : ''}
${displayAddress ? `ADR;TYPE=WORK:;;${displayAddress};;;;` : ''}
END:VCARD`;

        const blob = new Blob([vCardData], { type: "text/vcard" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${displayName.replace(/\s+/g, '_')}.vcf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const shareProfile = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: displayName,
                    text: `Check out ${displayName}'s profile`,
                    url: publicUrl
                });
            } catch (err) { console.error(err); }
        } else {
            try {
                await navigator.clipboard.writeText(publicUrl);
                alert("Profile link copied to clipboard!");
            } catch (err) {
                alert("Could not copy link.");
            }
        }
    };

    const getSocialUrl = (input: string, platform: string) => {
        if (input.startsWith('http')) return input;
        if (platform === 'instagram') return `https://instagram.com/${input.replace('@', '')}`;
        if (platform === 'twitter') return `https://twitter.com/${input.replace('@', '')}`;
        return input;
    };

    // --- STYLES ---
    const containerStyle = {
        '--pp-bg': theme?.background || '#ffffff',
        '--pp-surface': theme?.surface || '#ffffff',
        '--pp-text-main': theme?.textMain || '#0f172a',
        '--pp-text-muted': theme?.textMuted || '#64748b',
        '--pp-accent': theme?.accent || '#0f172a',
        '--pp-border': theme?.border || '#e2e8f0',
        '--pp-font': theme?.font || 'Inter, sans-serif',
        '--pp-radius': theme?.radius || '0.5rem',
    } as React.CSSProperties;

    return (
        <article
            className="min-h-full w-full flex flex-col items-center relative pb-12 transition-colors duration-300"
            style={containerStyle}
            itemScope
            itemType={showCompanyAsPrimary ? "https://schema.org/ProfessionalService" : "https://schema.org/Person"}
        >
            <div style={{ fontFamily: 'var(--pp-font)', background: 'var(--pp-bg)', color: 'var(--pp-text-main)' }} className="w-full min-h-full flex flex-col items-center">

                <SchemaMarkup
                    profile={profile}
                    displayBio={displayBio}
                    displayImage={displayImage}
                    displayName={displayName}
                />

                {/* Header Background */}
                <div className="w-full h-48 relative overflow-hidden shrink-0">
                    <div
                        className="absolute inset-0 opacity-20"
                        style={{ background: 'var(--pp-accent)' }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--pp-bg)]" />

                    {onClose && (
                        <div className="absolute top-4 right-4 z-20">
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full backdrop-blur-md border border-white/20 text-white bg-black/30 hover:bg-black/50 transition-colors"
                                aria-label="Close Preview"
                            >
                                <ExternalLink className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Main Content */}
                <main className="w-full max-w-md px-5 -mt-24 flex flex-col items-center relative z-10 grow">

                    {/* Profile Image */}
                    <div
                        className="w-40 h-40 border-[6px] overflow-hidden shadow-2xl mb-4 group relative"
                        style={{
                            borderRadius: 'var(--pp-radius)',
                            borderColor: 'var(--pp-bg)',
                            background: 'var(--pp-surface)'
                        }}
                    >
                        {displayImage ? (
                            <img src={displayImage} alt={`${displayName} profile photo`} className="w-full h-full object-cover" itemProp="image" width="200" height="200" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl font-bold" style={{ color: 'var(--pp-text-muted)' }}>
                                {displayName?.[0]?.toUpperCase() || <User className="w-16 h-16" />}
                            </div>
                        )}
                    </div>

                    {/* Identity */}
                    <header className="text-center space-y-2 mb-6 w-full px-2">
                        <h1 className="text-3xl font-bold tracking-tight leading-tight" itemProp="name">
                            {displayName || "Photographer"}
                        </h1>

                        {displayBio && (
                            <p className="font-medium text-sm md:text-base opacity-80" itemProp="description" style={{ color: 'var(--pp-text-muted)' }}>
                                {displayBio}
                            </p>
                        )}
                    </header>

                    {/* Social Icons */}
                    {displaySocials.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-4 mb-8 w-full">
                            {displaySocials.map(({ key, url }) => {
                                const Icon = SocialIconMap[key] || Globe;
                                return (
                                    <a
                                        key={key}
                                        href={getSocialUrl(url, key)}
                                        target="_blank"
                                        rel="noreferrer me"
                                        className="p-3 border rounded-full transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-offset-2"
                                        style={{
                                            background: 'var(--pp-surface)',
                                            borderColor: 'var(--pp-border)',
                                            color: 'var(--pp-text-main)',
                                            '--ring-color': 'var(--pp-accent)'
                                        } as any}
                                        aria-label={key}
                                        itemProp="sameAs"
                                    >
                                        <Icon className="w-5 h-5" />
                                    </a>
                                );
                            })}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-4 w-full mb-8">
                        <button
                            onClick={downloadVCard}
                            className="h-12 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all text-sm font-semibold flex items-center justify-center gap-2"
                            style={{
                                background: 'var(--pp-accent)',
                                color: '#ffffff', // Always white on accent for contrast
                                borderRadius: 'var(--pp-radius)'
                            }}
                        >
                            <Download className="w-4 h-4" /> Save Contact
                        </button>
                        <button
                            onClick={shareProfile}
                            className="h-12 shadow-sm hover:shadow-md transition-all text-sm font-semibold flex items-center justify-center gap-2 border"
                            style={{
                                background: 'var(--pp-surface)',
                                color: 'var(--pp-text-main)',
                                borderColor: 'var(--pp-border)',
                                borderRadius: 'var(--pp-radius)'
                            }}
                        >
                            <Share2 className="w-4 h-4" /> Share Profile
                        </button>
                    </div>

                    {/* Details Stack */}
                    <div className="w-full space-y-4">

                        {/* QR Code */}
                        <div className="flex flex-col items-center pb-2">
                            <div
                                className="p-4 shadow-lg border transform hover:scale-105 transition-transform duration-300 cursor-pointer"
                                style={{
                                    background: '#ffffff', // QR code needs white bg
                                    borderColor: 'var(--pp-border)',
                                    borderRadius: 'var(--pp-radius)'
                                }}
                                onClick={() => window.open(qrCodeUrl, '_blank')}
                            >
                                <img src={qrCodeUrl} alt="QR code to scan profile" className="w-32 h-32 object-contain mix-blend-multiply" width="128" height="128" />
                            </div>
                            <p className="text-[10px] mt-3 uppercase tracking-widest font-bold opacity-60" style={{ color: 'var(--pp-text-muted)' }}>Scan to Connect</p>
                        </div>

                        {/* Custom Links */}
                        {displayLinks.length > 0 && (
                            <nav className="space-y-3" aria-label="Custom Links">
                                {displayLinks.map((link) => (
                                    <a
                                        key={link.id}
                                        href={link.url.startsWith('http') ? link.url : `https://${link.url}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center justify-between w-full p-4 border hover:shadow-md transition-all duration-200 group focus:outline-none focus:ring-2"
                                        style={{
                                            background: 'var(--pp-surface)',
                                            borderColor: 'var(--pp-border)',
                                            color: 'var(--pp-text-main)',
                                            borderRadius: 'var(--pp-radius)',
                                            '--ring-color': 'var(--pp-accent)'
                                        } as any}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg transition-colors opacity-80 group-hover:opacity-100" style={{ background: 'var(--pp-bg)' }}>
                                                <LinkIcon className="w-4 h-4" style={{ color: 'var(--pp-accent)' }} />
                                            </div>
                                            <span className="font-semibold text-sm">{link.label}</span>
                                        </div>
                                        <ExternalLink className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--pp-text-muted)' }} />
                                    </a>
                                ))}
                            </nav>
                        )}

                        {/* Contact Info Card */}
                        {(displayPhone || displayEmail || displayWebsite) && (
                            <div className="border shadow-sm overflow-hidden" style={{ background: 'var(--pp-surface)', borderColor: 'var(--pp-border)', borderRadius: 'var(--pp-radius)' }}>
                                <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--pp-border)', background: 'rgba(0,0,0,0.02)' }}>
                                    <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--pp-text-muted)' }}>Contact Details</h3>
                                </div>
                                <div className="divide-y" style={{ borderColor: 'var(--pp-border)' }}>
                                    {displayPhone && (
                                        <a href={`tel:${displayPhone}`} className="flex items-center gap-4 p-4 hover:opacity-80 transition-opacity group" itemProp="telephone">
                                            <div className="p-2 rounded-lg shrink-0" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#16a34a' }}>
                                                <Phone className="w-5 h-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] uppercase font-semibold mb-0.5 opacity-70" style={{ color: 'var(--pp-text-muted)' }}>Mobile</p>
                                                <p className="text-sm font-medium truncate" style={{ color: 'var(--pp-text-main)' }}>{displayPhone}</p>
                                            </div>
                                        </a>
                                    )}
                                    {displayEmail && (
                                        <a href={`mailto:${displayEmail}`} className="flex items-center gap-4 p-4 hover:opacity-80 transition-opacity group" itemProp="email">
                                            <div className="p-2 rounded-lg shrink-0" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb' }}>
                                                <Mail className="w-5 h-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] uppercase font-semibold mb-0.5 opacity-70" style={{ color: 'var(--pp-text-muted)' }}>Email</p>
                                                <p className="text-sm font-medium truncate" style={{ color: 'var(--pp-text-main)' }}>{displayEmail}</p>
                                            </div>
                                        </a>
                                    )}
                                    {displayWebsite && (
                                        <a href={displayWebsite.startsWith('http') ? displayWebsite : `https://${displayWebsite}`} target="_blank" rel="noreferrer" className="flex items-center gap-4 p-4 hover:opacity-80 transition-opacity group" itemProp="url">
                                            <div className="p-2 rounded-lg shrink-0" style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#9333ea' }}>
                                                <Globe className="w-5 h-5" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[10px] uppercase font-semibold mb-0.5 opacity-70" style={{ color: 'var(--pp-text-muted)' }}>Website</p>
                                                <p className="text-sm font-medium truncate" style={{ color: 'var(--pp-text-main)' }}>{displayWebsite.replace(/^https?:\/\//, '')}</p>
                                            </div>
                                            <ExternalLink className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--pp-text-muted)' }} />
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Languages Card */}
                        {displayLanguages.length > 0 && (
                            <div className="border shadow-sm overflow-hidden" style={{ background: 'var(--pp-surface)', borderColor: 'var(--pp-border)', borderRadius: 'var(--pp-radius)' }}>
                                <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: 'var(--pp-border)', background: 'rgba(0,0,0,0.02)' }}>
                                    <Languages className="w-4 h-4" style={{ color: 'var(--pp-text-muted)' }} />
                                    <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--pp-text-muted)' }}>Languages Spoken</h3>
                                </div>
                                <div className="p-4 flex flex-wrap gap-2">
                                    {displayLanguages.map((lang) => (
                                        <span
                                            key={lang}
                                            className="px-3 py-1 rounded-full text-sm font-medium border"
                                            style={{
                                                background: 'var(--pp-bg)',
                                                color: 'var(--pp-accent)',
                                                borderColor: 'var(--pp-border)'
                                            }}
                                        >
                                            {lang}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Location Card */}
                        {displayAddress && (
                            <div className="border shadow-sm overflow-hidden" style={{ background: 'var(--pp-surface)', borderColor: 'var(--pp-border)', borderRadius: 'var(--pp-radius)' }}>
                                <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--pp-border)', background: 'rgba(0,0,0,0.02)' }}>
                                    <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--pp-text-muted)' }}>Location</h3>
                                </div>
                                <div className="p-4 flex items-start gap-4">
                                    <div className="p-2 rounded-lg shrink-0 mt-0.5" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626' }}>
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <address className="not-italic min-w-0">
                                        <p className="text-[10px] uppercase font-semibold mb-0.5 opacity-70" style={{ color: 'var(--pp-text-muted)' }}>Address</p>
                                        <p className="text-sm font-medium leading-relaxed" style={{ color: 'var(--pp-text-main)' }} itemProp="address">
                                            {displayAddress}
                                        </p>
                                    </address>
                                </div>
                            </div>
                        )}

                    </div>
                </main>

                {/* Footer */}
                <footer className="w-full text-center py-8 text-xs mt-auto opacity-60" style={{ color: 'var(--pp-text-muted)' }}>
                    <p>&copy; {new Date().getFullYear()} {displayName}. All rights reserved.</p>
                </footer>
            </div>
        </article>
    );
};
