
import React, { useState, useEffect } from 'react';
import { X, Copy, Check, QrCode, Mail, Facebook, Twitter, Smartphone, Image as ImageIcon, Link as LinkIcon, Lock, Calendar, Shield, Folder, Globe, Eye, EyeOff, Download } from 'lucide-react';
import { AppButton, AppIconButton } from './ui/AppButton';
import { AppInput, AppToggle } from './ui/AppInput';
import { Album, Photo } from '../types';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    album: Album;
    photo?: Photo;
    subGalleryId?: string | null;
    onUpdateAlbum?: (id: string, updates: Partial<Album>) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
    isOpen,
    onClose,
    album,
    photo,
    subGalleryId,
    onUpdateAlbum
}) => {
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<'link' | 'settings'>('link');
    const [isDownloadingQr, setIsDownloadingQr] = useState(false);

    const [isPasswordProtected, setIsPasswordProtected] = useState(album.settings.isPasswordProtected);
    const [password, setPassword] = useState(album.settings.password || '');
    const [expiresAt, setExpiresAt] = useState(album.settings.expiresAt || '');

    const subGallery = subGalleryId ? album.subGalleries?.find(sg => sg.id === subGalleryId) : null;

    const isShared = photo
        ? true
        : subGallery
            ? !!subGallery.isShared
            : !!album.settings.isShared;

    useEffect(() => {
        if (isOpen) {
            setIsPasswordProtected(album.settings.isPasswordProtected);
            setPassword(album.settings.password || '');
            setExpiresAt(album.settings.expiresAt || '');
            setActiveTab('link');
        }
    }, [isOpen, album.settings]);

    const handleUpdateSettings = () => {
        if (onUpdateAlbum) {
            onUpdateAlbum(album.id, {
                settings: {
                    ...album.settings,
                    isPasswordProtected,
                    password,
                    expiresAt: expiresAt || undefined
                }
            });
        }
        setActiveTab('link');
    };

    const handleToggleShare = (checked: boolean) => {
        if (onUpdateAlbum) {
            if (subGallery) {
                const updatedSubs = album.subGalleries?.map(sg => sg.id === subGallery.id ? { ...sg, isShared: checked } : sg);
                onUpdateAlbum(album.id, { subGalleries: updatedSubs });
            } else if (!photo) {
                onUpdateAlbum(album.id, { settings: { ...album.settings, isShared: checked } });
            }
        }
    };

    const baseUrl = album.settings.customDomain
        ? `https://${album.settings.customDomain}`
        : 'https://gallery.RawBox.co';

    let sharePath = `/g/${album.id}`;
    let shareTitle = "Share Gallery";
    let shareDescription = "Share full access to the root gallery and all sub-folders.";

    if (photo) {
        sharePath = `/g/${album.id}/p/${photo.id}`;
        shareTitle = "Share Photo";
        shareDescription = "Share a direct link to this specific image.";
    } else if (subGallery) {
        sharePath = `/g/${album.id}/s/${subGallery.id}`;
        shareTitle = "Share Folder";
        shareDescription = `Share access ONLY to the "${subGallery.title}" folder.`;
    }

    const accessCode = photo?.accessCode;
    let magicLink = `${baseUrl}${sharePath}`;
    if (accessCode) magicLink += `?key=${accessCode}`;

    const displayUrl = magicLink;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(displayUrl)}`;

    if (!isOpen) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(displayUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownloadQr = async () => {
        setIsDownloadingQr(true);
        try {
            const response = await fetch(qrCodeUrl);
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `qrcode-${album.title.replace(/\s+/g, '-').toLowerCase()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Failed to download QR code", error);
        } finally {
            setIsDownloadingQr(false);
        }
    };

    const shareToSocial = (platform: 'facebook' | 'twitter' | 'mail' | 'whatsapp') => {
        let title = '';
        if (photo) {
            title = `Check out this photo: ${photo.title || 'Untitled'}`;
        } else if (subGallery) {
            title = `Check out the "${subGallery.title}" gallery`;
        } else {
            title = `Check out the photo gallery: ${album.title}`;
        }
        const shareText = title + (accessCode ? ` (Access Code: ${accessCode})` : '');
        let url = '';
        switch (platform) {
            case 'facebook': url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(displayUrl)}`; break;
            case 'twitter': url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(displayUrl)}`; break;
            case 'mail': url = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(shareText + '\n' + displayUrl)}`; break;
            case 'whatsapp': url = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + displayUrl)}`; break;
        }
        window.open(url, '_blank', 'width=600,height=400');
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-surface w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${photo ? 'bg-primary/10 text-primary' : subGallery ? 'bg-accent/10 text-accent' : 'bg-accent/10 text-accent-DEFAULT'}`}>
                            {photo ? <ImageIcon className="w-5 h-5" /> : subGallery ? <Folder className="w-5 h-5" /> : <LinkIcon className="w-5 h-5" />}
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold">{shareTitle}</h2>
                            <p className="text-sm text-muted-foreground max-w-xs">{shareDescription}</p>
                        </div>
                    </div>
                    <AppIconButton icon={X} aria-label="Close" onClick={onClose} />
                </div>

                {!photo && isShared && (
                    <div className="flex border-b border-border shrink-0">
                        <button onClick={() => setActiveTab('link')} className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'link' ? 'border-accent-DEFAULT text-accent-DEFAULT' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>Link & Share</button>
                        <button onClick={() => setActiveTab('settings')} className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'settings' ? 'border-accent-DEFAULT text-accent-DEFAULT' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>Access Control</button>
                    </div>
                )}

                <div className="p-6 overflow-y-auto">
                    {!photo && (
                        <div className={`mb-6 ${isShared ? 'bg-accent/5 border-accent/20' : 'bg-muted/30 border-border'} border rounded-lg p-4 transition-colors`}>
                            <AppToggle
                                label={isShared ? "Sharing Enabled" : "Sharing Disabled"}
                                description={isShared ? `This ${subGallery ? 'folder' : 'gallery'} is accessible via link.` : `This ${subGallery ? 'folder' : 'gallery'} is hidden.`}
                                checked={isShared}
                                onChange={handleToggleShare}
                            />
                        </div>
                    )}

                    {activeTab === 'link' && isShared && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">
                                    {subGallery ? `Link to "${subGallery.title}"` : 'Public Link'}
                                </label>
                                <div className="flex gap-2">
                                    <input type="text" readOnly value={displayUrl} className="flex-1 w-full pl-4 pr-4 py-2 text-sm border border-border rounded-lg bg-muted/30 text-muted-foreground focus:outline-none select-all" />
                                    <AppButton variant={copied ? "primary" : "outline"} onClick={handleCopy} leftIcon={copied ? Check : Copy}>{copied ? 'Copied' : 'Copy'}</AppButton>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-6">
                                {/* QR Code */}
                                <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-border shadow-sm flex-1">
                                    <img src={qrCodeUrl} alt="QR Code" className="w-32 h-32 object-contain mb-3" />
                                    <AppButton
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleDownloadQr}
                                        loading={isDownloadingQr}
                                        leftIcon={Download}
                                        className="w-full"
                                    >
                                        Download QR
                                    </AppButton>
                                </div>

                                {/* Social Actions */}
                                <div className="flex-1 space-y-3">
                                    <h3 className="text-sm font-medium text-foreground">Share via</h3>
                                    <button onClick={() => shareToSocial('mail')} className="flex items-center gap-3 w-full px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted/50 transition-colors"><Mail className="w-4 h-4 text-text-secondary" /> Email</button>
                                    <button onClick={() => shareToSocial('whatsapp')} className="flex items-center gap-3 w-full px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted/50 transition-colors"><Smartphone className="w-4 h-4 text-success" /> WhatsApp</button>
                                    <button onClick={() => shareToSocial('facebook')} className="flex items-center gap-3 w-full px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted/50 transition-colors"><Facebook className="w-4 h-4 text-primary" /> Facebook</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'settings' && isShared && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
                            <div className="bg-muted/30 p-4 rounded-lg border border-border space-y-4">
                                <AppToggle label="Password Protection" description="Require a PIN to view." checked={isPasswordProtected} onChange={setIsPasswordProtected} />
                                {isPasswordProtected && (
                                    <AppInput type="text" placeholder="Enter PIN" value={password} onChange={(e) => setPassword(e.target.value)} leftIcon={Lock} />
                                )}
                            </div>
                            <div className="bg-muted/30 p-4 rounded-lg border border-border">
                                <label className="block text-sm font-medium mb-1">Link Expiry Date</label>
                                <input type="date" className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface" value={expiresAt ? expiresAt.split('T')[0] : ''} onChange={(e) => setExpiresAt(e.target.value)} min={new Date().toISOString().split('T')[0]} />
                            </div>
                            <div className="pt-4 flex justify-end gap-3 border-t border-border mt-4">
                                <AppButton variant="ghost" onClick={() => setActiveTab('link')}>Cancel</AppButton>
                                <AppButton variant="primary" onClick={handleUpdateSettings}>Save Settings</AppButton>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
