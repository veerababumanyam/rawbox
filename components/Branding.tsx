import React from 'react';
import { BrandingSettings } from '../types';
import { Instagram, Facebook, Twitter, Globe, Mail, Phone, MapPin, Linkedin, Youtube, ExternalLink, Video } from 'lucide-react';
import { AppButton } from './ui/AppButton';

// --- Icons Map ---
const SocialIcons: Record<string, any> = {
  instagram: Instagram,
  facebook: Facebook,
  twitter: Twitter,
  website: Globe,
  linkedin: Linkedin,
  youtube: Youtube,
  tiktok: Video, // Using Video icon as placeholder for TikTok
};

interface BrandingProps {
  branding?: BrandingSettings;
  className?: string;
  actions?: React.ReactNode;
}

export const BrandingHeader: React.FC<BrandingProps> = ({ branding, className = '', actions }) => {
  if (!branding) return null;

  const hasSocials = branding.socialLinks && Object.values(branding.socialLinks).some(Boolean);
  const primaryColor = branding.primaryColor || 'currentColor';
  const fontFamily = branding.fontFamily || 'inherit';

  return (
    <header 
        className={`flex flex-col md:flex-row items-center justify-between gap-4 py-6 px-4 md:px-8 border-b border-border/50 bg-surface/90 backdrop-blur-sm ${className}`}
        style={{ fontFamily }}
    >
      {/* Brand Identity */}
      <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
        {branding.logoUrl && (
          <img 
            src={branding.logoUrl} 
            alt={branding.brandName || 'Logo'} 
            className="h-12 w-auto object-contain max-w-[150px]"
          />
        )}
        <div>
          {branding.brandName && (
            <h1 className="text-xl font-bold tracking-tight text-foreground leading-tight" style={{ color: primaryColor !== 'currentColor' ? primaryColor : undefined }}>
              {branding.brandName}
            </h1>
          )}
          {branding.tagline && (
            <p className="text-sm text-muted-foreground font-medium">
              {branding.tagline}
            </p>
          )}
        </div>
      </div>

      {/* Actions & Links */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        
        {/* Action Elements Injected from Parent (e.g. Navigation Tabs) - Now First */}
        {actions && (
            <div className="flex items-center gap-2">
                {actions}
            </div>
        )}
        
        {/* Custom Links (Header) */}
        {branding.customLinks && branding.customLinks.length > 0 && (
           <div className={`flex gap-2 ${actions ? 'pl-2 border-l border-border/50' : ''}`}>
             {branding.customLinks.slice(0, 2).map(link => (
               <AppButton 
                  key={link.id} 
                  variant="outline" 
                  size="sm" 
                  onClick={() => window.open(link.url, '_blank')}
                  rightIcon={ExternalLink}
               >
                 {link.label}
               </AppButton>
             ))}
           </div>
        )}
        
        {/* Social Icons - Now Last (Extreme Right) */}
        {hasSocials && (
           <div className={`flex items-center gap-2 ${(actions || (branding.customLinks && branding.customLinks.length > 0)) ? 'pl-2 border-l border-border/50' : ''}`}>
              {Object.entries(branding.socialLinks || {}).map(([platform, url]) => {
                  if (!url || typeof url !== 'string') return null;
                  const Icon = SocialIcons[platform] || Globe;
                  return (
                      <a 
                        key={platform} 
                        href={url.startsWith('http') ? url : `https://${url}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-2 text-muted-foreground hover:text-accent-DEFAULT hover:bg-accent/10 rounded-full transition-colors"
                        aria-label={platform}
                      >
                          <Icon className="w-5 h-5" />
                      </a>
                  );
              })}
           </div>
        )}
      </div>
    </header>
  );
};

export const BrandingFooter: React.FC<BrandingProps> = ({ branding, className = '' }) => {
  if (!branding) return null;
  const primaryColor = branding.primaryColor || 'currentColor';
  const fontFamily = branding.fontFamily || 'inherit';

  return (
    <footer className={`mt-auto py-12 px-4 border-t border-border bg-muted/20 ${className}`} style={{ fontFamily }}>
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
            
            {/* Contact Info */}
            <div className="space-y-3">
                <h4 className="font-semibold text-foreground" style={{ color: primaryColor !== 'currentColor' ? primaryColor : undefined }}>{branding.brandName || 'Contact Us'}</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                    {branding.address && (
                        <p className="flex items-center justify-center md:justify-start gap-2">
                            <MapPin className="w-4 h-4" /> {branding.address}
                        </p>
                    )}
                    {branding.contactEmail && (
                        <a href={`mailto:${branding.contactEmail}`} className="flex items-center justify-center md:justify-start gap-2 hover:text-accent-DEFAULT">
                             <Mail className="w-4 h-4" /> {branding.contactEmail}
                        </a>
                    )}
                    {branding.phone && (
                        <a href={`tel:${branding.phone}`} className="flex items-center justify-center md:justify-start gap-2 hover:text-accent-DEFAULT">
                             <Phone className="w-4 h-4" /> {branding.phone}
                        </a>
                    )}
                </div>
            </div>

            {/* Deep Links / Custom Links */}
            {branding.customLinks && branding.customLinks.length > 0 && (
                <div className="flex flex-col gap-2">
                    <h4 className="font-semibold text-foreground text-sm">Links</h4>
                    <div className="flex flex-wrap justify-center md:justify-end gap-x-4 gap-y-2">
                        {branding.customLinks.map(link => (
                            <a 
                                key={link.id} 
                                href={link.url} 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-sm text-muted-foreground hover:text-accent-DEFAULT underline-offset-4 hover:underline"
                            >
                                {link.label}
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
        
        <div className="mt-8 pt-8 border-t border-border/50 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} {branding.brandName || 'Photography Studio'}. All rights reserved. 
            <span className="mx-2">•</span>
            Powered by RawBox
        </div>
    </footer>
  );
};

export const WatermarkOverlay: React.FC<BrandingProps> = ({ branding }) => {
    if (!branding || !branding.showWatermark) return null;
    
    const opacity = branding.watermarkOpacity ?? 0.5;
    const position = branding.watermarkPosition || 'center';
    const logoSrc = branding.watermarkLogoUrl || branding.logoUrl;

    const baseStyle: React.CSSProperties = {
        position: 'absolute',
        opacity,
        pointerEvents: 'none',
        zIndex: 10,
        mixBlendMode: 'overlay'
    };

    // Position Styles
    let posStyle: React.CSSProperties = {};
    switch (position) {
        case 'center':
            posStyle = { inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' };
            break;
        case 'top-left':
            posStyle = { top: '5%', left: '5%' };
            break;
        case 'top-right':
            posStyle = { top: '5%', right: '5%' };
            break;
        case 'bottom-left':
            posStyle = { bottom: '5%', left: '5%' };
            break;
        case 'bottom-right':
            posStyle = { bottom: '5%', right: '5%' };
            break;
        case 'repeat':
            // Handled specially below
            break;
    }

    if (position === 'repeat') {
        return (
            <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden" style={{ opacity }}>
                <div 
                    className="w-[200%] h-[200%] flex flex-wrap content-start -ml-[50%] -mt-[50%] transform rotate-12"
                >
                    {Array.from({ length: 20 }).map((_, i) => (
                        <div key={i} className="flex items-center justify-center w-1/4 h-1/4 p-8">
                             {logoSrc ? (
                                <img src={logoSrc} alt="Watermark" className="max-w-full max-h-full object-contain opacity-50 grayscale contrast-125" />
                             ) : (
                                <span className="text-white/50 text-xl font-bold uppercase tracking-widest whitespace-nowrap px-4 py-2 border-2 border-white/20">
                                    {branding.brandName || 'Copyright'}
                                </span>
                             )}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div style={{ ...baseStyle, ...posStyle }}>
            {logoSrc ? (
                <img 
                    src={logoSrc} 
                    alt="Watermark" 
                    className={`${position === 'center' ? 'w-1/3 h-auto max-h-[30%]' : 'h-12 w-auto'} object-contain grayscale contrast-125`} 
                />
            ) : branding.brandName ? (
                <div className={`${position === 'center' ? 'text-xl md:text-4xl px-6 py-2 border-4 border-white/30' : 'text-sm px-3 py-1 border border-white/30'} font-bold uppercase tracking-widest whitespace-nowrap text-white/50`}>
                    {branding.brandName}
                </div>
            ) : null}
        </div>
    );
};