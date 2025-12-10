
import React, { useState, useEffect, useCallback } from 'react';
import { Album, Photo, ViewMode, SubGallery, Client, BrandingSettings } from '../types';
import { AppButton, AppIconButton } from './ui/AppButton';
import { AppCard } from './ui/AppCard';
import { AppBadge } from './ui/AppBadge';
import { AppInput, AppTextarea } from './ui/AppInput';
import { AdminToolbar } from './ui/AdminToolbar';
import { PhotoGrid } from './ui/PhotoGrid';
import { ArrowLeft, Lock, Share2, Settings as SettingsIcon, Trash2, Upload, Heart, CheckSquare, Square, Wand2, LayoutGrid, Grid, Sparkles, Image as ImageIcon, Unlock, Tag, X, KeyRound, Eye, LogOut, Folder, MoveRight, FolderPlus, ScanFace, ChevronRight, Download, CheckCircle2, Globe, PenTool, UserPlus, User, Search, Filter, Plus } from 'lucide-react';
import { curateBestPhotos } from '../services/geminiService';
import { BrandingHeader, BrandingFooter } from './Branding';
import { AccessCodeModal } from './AccessCodeModal';
import { ClientDownloadModal } from './ClientDownloadModal';
import { adjustColor, getThemeStyles } from '../utils/colorUtils';

interface AlbumDetailViewProps {
    album: Album;
    onBack: () => void;
    onUpdateAlbum: (id: string, updates: Partial<Album>) => void;
    onUpdatePhoto: (id: string, updates: Partial<Photo>) => void;
    onDeletePhotos: (ids: string[]) => void;
    onUploadClick: (targetId: string | null) => void;
    onSettingsClick: () => void;
    onShareClick: (subGalleryId?: string | null) => void;
    onPhotoClick: (id: string) => void;
    onAIAnalyzePhoto: (photo: Photo) => void;
    onReorderPhotos: (dragIndex: number, dropIndex: number, contextSubGalleryId: string | null) => void;
    onGenerateStory: (albumId: string, customPrompt?: string, selectedPhotoIds?: string[]) => Promise<void>;
    onScanForPeople: (photoIds: string[]) => void;
    onFaceClick?: (photo: Photo, faceId: string) => void;
    onBulkTagPerson?: (photoIds: string[]) => void;
    isClientView: boolean;
    onToggleClientView: () => void;
    linkedClient?: Client;
}

// Lock Screen Component
const LockScreen: React.FC<{
    albumTitle: string;
    coverUrl: string;
    onUnlock: () => void;
    branding?: BrandingSettings;
}> = ({ albumTitle, coverUrl, onUnlock, branding }) => {
    const [pin, setPin] = useState('');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-500">
            <div className="absolute inset-0 z-0 opacity-20">
                <img src={coverUrl} className="w-full h-full object-cover blur-2xl" alt="" />
            </div>

            <div className="relative z-10 w-full max-w-md p-6 flex flex-col items-center text-center space-y-8">
                {branding?.logoUrl ? (
                    <img src={branding.logoUrl} className="h-16 w-auto object-contain" alt="Logo" />
                ) : (
                    <h2 className="text-2xl font-bold text-white tracking-widest uppercase">{branding?.brandName || 'Gallery'}</h2>
                )}

                <div className="space-y-2">
                    <h1 className="text-3xl font-light text-white">{albumTitle}</h1>
                    <div className="flex items-center justify-center gap-2 text-white/50 text-sm">
                        <Lock className="w-4 h-4" />
                        <span>Private Gallery</span>
                    </div>
                </div>

                <div className="w-full max-w-[280px] space-y-4">
                    <input
                        type="password"
                        placeholder="Enter PIN"
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-center text-white text-lg tracking-[0.5em] placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        autoFocus
                    />
                    <button
                        onClick={onUnlock}
                        disabled={!pin}
                        className="w-full bg-white text-black font-medium py-3 rounded-lg hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        ENTER
                    </button>
                </div>

                <p className="text-white/30 text-xs">
                    Protected by RawBox Secure
                </p>
            </div>
        </div>
    );
};

// Client View Container to isolate styles
const ClientViewContainer: React.FC<{
    children: React.ReactNode;
    branding?: BrandingSettings;
    theme: 'light' | 'dark' | 'auto';
}> = ({ children, branding, theme }) => {
    // Generate styles dynamically
    const primaryColor = branding?.primaryColor || '#000000';
    const fontFamily = branding?.fontFamily || 'inherit';

    const style = {
        '--color-accent-main': primaryColor,
        '--color-accent-hover': adjustColor(primaryColor, -20),
        '--color-accent-light': adjustColor(primaryColor, 180),
        '--color-ring': primaryColor,
        fontFamily: fontFamily,
        // Override Backgrounds based on Theme preference
        ...getThemeStyles(theme)
    } as React.CSSProperties;

    return (
        <div className="min-h-screen bg-background text-foreground" style={style}>
            {children}
        </div>
    );
};

export const AlbumDetailView: React.FC<AlbumDetailViewProps> = ({
    album,
    onBack,
    onUpdateAlbum,
    onUpdatePhoto,
    onDeletePhotos,
    onUploadClick,
    onSettingsClick,
    onShareClick,
    onPhotoClick,
    onAIAnalyzePhoto,
    onReorderPhotos,
    onGenerateStory,
    onScanForPeople,
    onFaceClick,
    onBulkTagPerson,
    isClientView,
    onToggleClientView,
    linkedClient
}) => {
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [photoSearchQuery, setPhotoSearchQuery] = useState('');
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    const [showPickedOnly, setShowPickedOnly] = useState(false);
    const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set());
    const [draggedPhotoIndex, setDraggedPhotoIndex] = useState<number | null>(null);

    const [activeSubGalleryId, setActiveSubGalleryId] = useState<string | null>(null);
    const [isCreatingSubGallery, setIsCreatingSubGallery] = useState(false);
    const [newSubGalleryName, setNewSubGalleryName] = useState('');

    const [isMovingPhotos, setIsMovingPhotos] = useState(false);

    const [storyModalOpen, setStoryModalOpen] = useState(false);

    const [isAlbumUnlocked, setIsAlbumUnlocked] = useState(false);
    const [unlockModalOpen, setUnlockModalOpen] = useState(false);
    const [isClientSelectionMode, setIsClientSelectionMode] = useState(false);
    const [clientSelectedIds, setClientSelectedIds] = useState<Set<string>>(new Set());
    const [clientDownloadModalOpen, setClientDownloadModalOpen] = useState(false);

    useEffect(() => {
        if (isClientView) {
            setIsAlbumUnlocked(!album.settings.isPasswordProtected);
        } else {
            setIsAlbumUnlocked(true);
        }
        setSelectedPhotoIds(new Set());
        setClientSelectedIds(new Set());
        setIsClientSelectionMode(false);
        setShowPickedOnly(false);
        setShowFavoritesOnly(false);
    }, [isClientView, album.settings.isPasswordProtected]);

    const sortedSubGalleries = [...(album.subGalleries || [])].sort((a, b) => a.order - b.order);

    const currentViewIsShared = activeSubGalleryId
        ? !!album.subGalleries?.find(sg => sg.id === activeSubGalleryId)?.isShared
        : !!album.settings.isShared;

    const contextPhotos = album.photos.filter(p => {
        if (p.status !== 'active') return false;
        if (activeSubGalleryId !== null) {
            return p.subGalleryId === activeSubGalleryId;
        }
        return true;
    });

    const totalPhotos = contextPhotos.length;

    const activePhotos = contextPhotos.filter(p => {
        if (isClientView && p.privacy === 'private' && !p.isUnlocked) return false;
        if (showFavoritesOnly && !p.isFavorite) return false;
        if (showPickedOnly && !p.isPicked) return false;
        if (!photoSearchQuery) return true;
        const q = photoSearchQuery.toLowerCase();
        return (
            (p.title?.toLowerCase().includes(q)) ||
            (p.tags?.some(t => t.toLowerCase().includes(q))) ||
            (p.aiTags?.some(t => t.toLowerCase().includes(q)))
        );
    });

    const favoriteCount = activePhotos.filter(p => p.isFavorite).length;
    const favoritePhotos = activePhotos.filter(p => p.isFavorite);
    const regularPhotos = activePhotos.filter(p => !p.isFavorite);

    const isAllSelected = selectedPhotoIds.size === activePhotos.length && activePhotos.length > 0;
    const isClientAllSelected = clientSelectedIds.size === activePhotos.length && activePhotos.length > 0;

    const allTags = activePhotos.flatMap(p => p.tags || []).concat(activePhotos.flatMap(p => p.aiTags || []));
    const tagCounts: Record<string, number> = {};
    allTags.forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1; });
    const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => e[0]);

    const handleSelectAll = () => {
        if (isAllSelected) setSelectedPhotoIds(new Set());
        else setSelectedPhotoIds(new Set(activePhotos.map(p => p.id)));
    };

    const toggleSelection = (photoId: string) => {
        const newSelection = new Set(selectedPhotoIds);
        if (newSelection.has(photoId)) newSelection.delete(photoId);
        else newSelection.add(photoId);
        setSelectedPhotoIds(newSelection);
    };

    // Client Selection Handlers
    const toggleClientSelection = (photoId: string) => {
        const newSet = new Set(clientSelectedIds);
        if (newSet.has(photoId)) newSet.delete(photoId);
        else newSet.add(photoId);
        setClientSelectedIds(newSet);
    };

    const handleClientSelectAll = () => {
        if (isClientAllSelected) setClientSelectedIds(new Set());
        else setClientSelectedIds(new Set(activePhotos.map(p => p.id)));
    };

    const handleClientDownload = useCallback((format: 'original' | 'webp') => {
        // TODO: Implement actual download logic
        console.log(`Downloading ${clientSelectedIds.size} items in ${format} format`);
        setClientSelectedIds(new Set());
        setIsClientSelectionMode(false);
        setClientDownloadModalOpen(false);
    }, [clientSelectedIds.size]);

    // Drag and Drop - Memoized for performance
    const onPhotoDragStart = useCallback((e: React.DragEvent, index: number) => {
        setDraggedPhotoIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('application/json', JSON.stringify({
            type: 'photo',
            id: activePhotos[index].id
        }));
    }, [activePhotos]);

    const onPhotoDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        if (draggedPhotoIndex !== null) {
            onReorderPhotos(draggedPhotoIndex, dropIndex, activeSubGalleryId);
        }
        setDraggedPhotoIndex(null);
    }, [draggedPhotoIndex, activeSubGalleryId, onReorderPhotos]);

    // --- CLIENT VIEW ---
    if (isClientView) {
        if (!isAlbumUnlocked) {
            return (
                <ClientViewContainer branding={album.settings.branding} theme={album.settings.theme}>
                    <LockScreen
                        albumTitle={album.title}
                        coverUrl={album.coverUrl}
                        onUnlock={() => setIsAlbumUnlocked(true)}
                        branding={album.settings.branding}
                    />
                </ClientViewContainer>
            );
        }

        return (
            <ClientViewContainer branding={album.settings.branding} theme={album.settings.theme}>
                <div className="min-h-screen flex flex-col relative animate-in fade-in duration-500">

                    {/* Floating Client Nav */}
                    <div className="sticky top-0 z-40 bg-surface/80 backdrop-blur-md border-b border-border transition-all duration-300">
                        <BrandingHeader branding={album.settings.branding} className="py-3 px-4 shadow-sm" />

                        <div className="flex items-center justify-between px-4 py-2 bg-surface/50 border-t border-border/50">
                            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mask-fade-right max-w-[60%]">
                                <button
                                    onClick={() => setActiveSubGalleryId(null)}
                                    className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeSubGalleryId === null ? 'bg-accent text-white' : 'text-foreground hover:bg-muted'}`}
                                >
                                    All Photos
                                </button>
                                {sortedSubGalleries.map(sg => (
                                    <button
                                        key={sg.id}
                                        onClick={() => setActiveSubGalleryId(sg.id)}
                                        className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeSubGalleryId === sg.id ? 'bg-accent text-white' : 'text-foreground hover:bg-muted'}`}
                                    >
                                        {sg.title}
                                    </button>
                                ))}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                                    className={`p-2 rounded-full transition-colors ${showFavoritesOnly ? 'text-error bg-error/10' : 'text-muted-foreground hover:text-foreground'}`}
                                    aria-label={showFavoritesOnly ? "Show all photos" : "Show favorites only"}
                                    aria-pressed={showFavoritesOnly}
                                    type="button"
                                >
                                    <Heart className={`w-5 h-5 ${showFavoritesOnly ? 'fill-current' : ''}`} aria-hidden="true" />
                                </button>
                                {album.settings.allowDownload && (
                                    <button
                                        onClick={() => setIsClientSelectionMode(!isClientSelectionMode)}
                                        className={`p-2 rounded-full transition-colors ${isClientSelectionMode ? 'text-accent-DEFAULT bg-accent/10' : 'text-muted-foreground hover:text-foreground'}`}
                                        aria-label={isClientSelectionMode ? "Exit selection mode" : "Enter selection mode"}
                                        aria-pressed={isClientSelectionMode}
                                        type="button"
                                    >
                                        <CheckSquare className="w-5 h-5" aria-hidden="true" />
                                    </button>
                                )}
                                <button
                                    onClick={onToggleClientView}
                                    className="p-2 text-muted-foreground hover:text-foreground border-l border-border ml-1 pl-3 flex items-center gap-1 text-xs"
                                    aria-label="Exit client view"
                                    type="button"
                                >
                                    <LogOut className="w-4 h-4" aria-hidden="true" /> Exit
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Client Bulk Actions Bar */}
                    {isClientSelectionMode && (
                        <div className="sticky top-[115px] z-30 bg-accent/5 border-b border-accent/20 px-4 py-2 flex items-center justify-between animate-in slide-in-from-top-2">
                            <div className="flex items-center gap-3">
                                <button onClick={handleClientSelectAll} className="text-xs font-bold text-accent-DEFAULT uppercase tracking-wider hover:underline">
                                    {isClientAllSelected ? 'Deselect All' : 'Select All'}
                                </button>
                                <span className="text-sm font-medium">{clientSelectedIds.size} Selected</span>
                            </div>
                            {clientSelectedIds.size > 0 && (
                                <AppButton size="sm" variant="primary" onClick={() => setClientDownloadModalOpen(true)} leftIcon={Download}>Download</AppButton>
                            )}
                        </div>
                    )}

                    {/* Client Grid */}
                    <div className="flex-1 p-4 md:p-8">
                        <div className="text-center mb-10 mt-4 space-y-2">
                            <h2 className="text-4xl font-light tracking-tight text-foreground">{album.title}</h2>
                            <p className="text-sm text-muted-foreground uppercase tracking-widest">{album.date} • {album.photoCount} Memories</p>
                        </div>

                        <PhotoGrid
                            photos={activePhotos}
                            viewMode="masonry"
                            selectedIds={isClientSelectionMode ? clientSelectedIds : new Set()}
                            onToggleSelection={isClientSelectionMode ? toggleClientSelection : () => { }}
                            onPhotoClick={onPhotoClick}
                            onAIAnalyze={() => { }}
                            onFavorite={(id, isFav) => onUpdatePhoto(id, { isFavorite: isFav })}
                            onPick={(id, isPicked) => onUpdatePhoto(id, { isPicked })}
                            onDownload={album.settings.allowDownload ? (photo) => {
                                const link = document.createElement('a');
                                link.href = photo.url;
                                link.download = photo.title || 'photo';
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                            } : undefined}
                            onEdit={() => { }}
                            onUpdatePhoto={onUpdatePhoto}
                            onTagFace={() => { }}
                            draggedIndex={null} onDragStart={() => { }} onDragOver={() => { }} onDrop={() => { }}
                            draggable={false}
                            branding={album.settings.branding}
                            isClientView={true}
                            selectionEnabled={isClientSelectionMode}
                        />

                        {activePhotos.length === 0 && (
                            <div className="text-center py-20 text-muted-foreground">
                                <p>No photos found in this collection.</p>
                            </div>
                        )}
                    </div>

                    <BrandingFooter branding={album.settings.branding} />

                    {/* Client Download Modal */}
                    <ClientDownloadModal
                        isOpen={clientDownloadModalOpen}
                        onClose={() => setClientDownloadModalOpen(false)}
                        count={clientSelectedIds.size}
                        onConfirm={handleClientDownload}
                    />
                </div>
            </ClientViewContainer>
        );
    }

    // --- ADMIN DASHBOARD LAYOUT (Unchanged logic, just ensure return structure is correct) ---

    return (
        <div className="flex flex-col min-h-full space-y-6 animate-in fade-in duration-300 pb-20 md:pb-0 relative">
            {/* Modals placeholders */}
            <AccessCodeModal isOpen={unlockModalOpen} onClose={() => setUnlockModalOpen(false)} onSuccess={() => { }} targetName="Private Content" />

            {/* Branding Header */}
            <BrandingHeader branding={album.settings.branding} className="-mx-4 md:-mx-8 -mt-4 md:-mt-8 mb-0 rounded-b-xl border-b bg-white" />

            {/* Gallery Title & Meta */}
            <div className="pt-2 pb-4">
                <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 mb-2">
                    <ArrowLeft className="w-4 h-4" /> Back to All Galleries
                </button>
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            {album.title}
                            {activeSubGalleryId && (
                                <>
                                    <span className="text-muted-foreground/50">/</span>
                                    <span className="text-accent-DEFAULT">{album.subGalleries?.find(sg => sg.id === activeSubGalleryId)?.title}</span>
                                </>
                            )}
                        </h1>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <User className="w-3.5 h-3.5" />
                            <span>{album.clientName}</span>
                            <span>•</span>
                            <span>{album.date}</span>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <AppIconButton
                            icon={Heart}
                            aria-label={album.isFavorite ? "Unfavorite Gallery" : "Favorite Gallery"}
                            onClick={() => onUpdateAlbum(album.id, { isFavorite: !album.isFavorite })}
                            variant="outline"
                            className={album.isFavorite ? "text-error border-error/30 bg-error/10 hover:bg-error/20" : ""}
                        />

                        <AppButton variant="outline" size="sm" leftIcon={Eye} onClick={onToggleClientView}>View as Client</AppButton>
                        <AppButton variant="outline" size="sm" leftIcon={ScanFace} onClick={() => onScanForPeople(activePhotos.map(p => p.id))}>Find People</AppButton>
                        <AppButton variant="outline" size="sm" leftIcon={Sparkles} onClick={() => setStoryModalOpen(true)}>AI Story</AppButton>

                        <AppButton
                            variant={currentViewIsShared ? 'primary' : 'secondary'}
                            leftIcon={Globe}
                            onClick={() => onShareClick(activeSubGalleryId)}
                            className={currentViewIsShared ? 'bg-success hover:bg-success/90 text-white' : ''}
                        >
                            {currentViewIsShared ? 'Shared' : 'Share'}
                        </AppButton>

                        <AppIconButton icon={SettingsIcon} aria-label="Settings" onClick={onSettingsClick} variant="outline" />
                        <AppButton variant="outline" leftIcon={Upload} onClick={() => onUploadClick(activeSubGalleryId)}>Upload</AppButton>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="border-b border-border flex items-center gap-6 overflow-x-auto no-scrollbar">
                <button
                    onClick={() => setActiveSubGalleryId(null)}
                    className={`py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${activeSubGalleryId === null ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                >
                    <Folder className="w-4 h-4" /> Root Gallery
                </button>
                {sortedSubGalleries.map(subGallery => (
                    <button
                        key={subGallery.id}
                        onClick={() => setActiveSubGalleryId(subGallery.id)}
                        className={`py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeSubGalleryId === subGallery.id ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                    >
                        {subGallery.title}
                    </button>
                ))}
                <button
                    onClick={() => setIsCreatingSubGallery(true)}
                    className="py-2 text-sm font-medium text-accent-DEFAULT hover:text-accent-hover transition-colors whitespace-nowrap flex items-center gap-1"
                >
                    <Plus className="w-4 h-4" /> New Sub-Gallery
                </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <AppCard padding="sm" className="flex flex-col justify-center h-24 border-l-4 border-l-gray-200">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><ImageIcon className="w-3.5 h-3.5" /> TOTAL ITEMS</span>
                    <span className="text-3xl font-bold">{totalPhotos}</span>
                </AppCard>
                <AppCard padding="sm" className="flex flex-col justify-center h-24 border-l-4 border-l-error/30">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Heart className="w-3.5 h-3.5 text-error" /> FAVORITES</span>
                    <span className="text-3xl font-bold">{favoriteCount}</span>
                </AppCard>
                <AppCard padding="sm" className="flex items-center justify-between h-24 border-l-4 border-l-accent-light/50">
                    <div className="flex flex-col justify-center">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-accent-DEFAULT" /> TOP KEYWORDS</span>
                        <div className="flex gap-1 flex-wrap mt-1">
                            {topTags.length > 0 ? topTags.map(t => <span key={t} className="bg-accent/10 text-accent-DEFAULT text-[10px] px-1.5 py-0.5 rounded font-medium">#{t}</span>) : <span className="text-sm text-muted-foreground italic">None</span>}
                        </div>
                    </div>
                    <AppButton variant="outline" size="sm" onClick={() => setStoryModalOpen(true)} leftIcon={Wand2}>Generate Story</AppButton>
                </AppCard>
            </div>

            {/* Toolbar & Filters */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-1">
                <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Filter items..."
                        className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-1 focus:ring-accent-DEFAULT"
                        value={photoSearchQuery}
                        onChange={(e) => setPhotoSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto no-scrollbar">
                    <div className="flex items-center border border-border rounded-lg overflow-hidden bg-surface" role="group" aria-label="View mode">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 ${viewMode === 'grid' ? 'bg-accent/10 text-accent-DEFAULT' : 'text-muted-foreground hover:bg-muted'}`}
                            aria-label="Grid view"
                            aria-pressed={viewMode === 'grid'}
                            type="button"
                        >
                            <Grid className="w-4 h-4" aria-hidden="true" />
                        </button>
                        <div className="w-px h-4 bg-border" aria-hidden="true" />
                        <button
                            onClick={() => setViewMode('masonry')}
                            className={`p-2 ${viewMode === 'masonry' ? 'bg-accent/10 text-accent-DEFAULT' : 'text-muted-foreground hover:bg-muted'}`}
                            aria-label="Masonry view"
                            aria-pressed={viewMode === 'masonry'}
                            type="button"
                        >
                            <LayoutGrid className="w-4 h-4" aria-hidden="true" />
                        </button>
                    </div>

                    <button
                        onClick={() => setShowPickedOnly(!showPickedOnly)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors whitespace-nowrap ${showPickedOnly ? 'bg-success-soft text-success-DEFAULT border-success-DEFAULT/20' : 'bg-surface border-border text-muted-foreground hover:text-foreground'}`}
                        aria-label={showPickedOnly ? "Show all photos" : "Show picked photos only"}
                        aria-pressed={showPickedOnly}
                        type="button"
                    >
                        <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> Picks
                    </button>

                    <button
                        onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors whitespace-nowrap ${showFavoritesOnly ? 'bg-error/10 text-error border-error/30' : 'bg-surface border-border text-muted-foreground hover:text-foreground'}`}
                        aria-label={showFavoritesOnly ? "Show all photos" : "Show favorites only"}
                        aria-pressed={showFavoritesOnly}
                        type="button"
                    >
                        <Heart className={`w-4 h-4 ${showFavoritesOnly ? 'fill-current' : ''}`} /> Favorites
                    </button>

                    <div className="h-4 w-px bg-border mx-1" />

                    <button
                        onClick={handleSelectAll}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors whitespace-nowrap"
                    >
                        {isAllSelected ? <CheckSquare className="w-4 h-4 text-accent-DEFAULT" /> : <Square className="w-4 h-4" />} Select All
                    </button>
                </div>
            </div>

            {/* Content */}
            {activePhotos.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-border rounded-xl bg-muted/10">
                    <p className="text-muted-foreground">No photos found in this view.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Favorites Section */}
                    {!showFavoritesOnly && favoritePhotos.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Heart className="w-5 h-5 text-foreground fill-black" />
                                <h3 className="text-lg font-bold text-foreground tracking-wide">FAVORITES</h3>
                            </div>
                            <PhotoGrid
                                photos={favoritePhotos}
                                viewMode={viewMode}
                                selectedIds={selectedPhotoIds}
                                onToggleSelection={toggleSelection}
                                onPhotoClick={onPhotoClick}
                                onAIAnalyze={onAIAnalyzePhoto}
                                onFavorite={(id, isFav) => onUpdatePhoto(id, { isFavorite: isFav })}
                                onEdit={() => { }}
                                onUpdatePhoto={onUpdatePhoto}
                                onTagFace={() => { }}
                                draggedIndex={null} onDragStart={() => { }} onDragOver={() => { }} onDrop={() => { }}
                                draggable={false}
                                branding={album.settings.branding}
                            />
                        </div>
                    )}

                    {/* Other Photos */}
                    {(showFavoritesOnly ? favoritePhotos : regularPhotos).length > 0 && (
                        <div className="space-y-4">
                            {!showFavoritesOnly && favoritePhotos.length > 0 && (
                                <div className="flex items-center gap-2 pt-4 border-t border-border">
                                    <ImageIcon className="w-5 h-5 text-muted-foreground" />
                                    <h3 className="text-lg font-bold text-muted-foreground tracking-wide uppercase">Other Photos</h3>
                                </div>
                            )}
                            <PhotoGrid
                                photos={showFavoritesOnly ? favoritePhotos : regularPhotos}
                                viewMode={viewMode}
                                selectedIds={selectedPhotoIds}
                                onToggleSelection={toggleSelection}
                                onPhotoClick={onPhotoClick}
                                onAIAnalyze={onAIAnalyzePhoto}
                                onFavorite={(id, isFav) => onUpdatePhoto(id, { isFavorite: isFav })}
                                onEdit={() => { }}
                                onUpdatePhoto={onUpdatePhoto}
                                onTagFace={() => { }}
                                draggedIndex={draggedPhotoIndex}
                                onDragStart={onPhotoDragStart}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={onPhotoDrop}
                                draggable={!photoSearchQuery && viewMode === 'grid'}
                                branding={album.settings.branding}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
