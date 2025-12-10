import React, { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginView } from './components/LoginView';
import { Layout } from './components/Layout';
import { PageHeader, AdminToolbar } from './components/ui/AdminToolbar';
import { AppButton, AppIconButton } from './components/ui/AppButton';
import { AppCard } from './components/ui/AppCard';
import { AppBadge, StatusBadge } from './components/ui/AppBadge';
import { AppInput, AppTextarea, AppSelect } from './components/ui/AppInput';
import { SEOHead } from './components/SEOHead';
import { LoadingFallback } from './components/ui/LoadingFallback';

// Lazy load heavy components for better performance
const AlbumsView = lazy(() => import('./components/views/AlbumsView').then(m => ({ default: m.AlbumsView })));
const PrintAlbumsView = lazy(() => import('./components/views/PrintAlbumsView').then(m => ({ default: m.PrintAlbumsView })));
const CreateDesignModal = lazy(() => import('./components/modals/CreateDesignModal').then(m => ({ default: m.CreateDesignModal })));
const UploadModal = lazy(() => import('./components/UploadModal').then(m => ({ default: m.UploadModal })));
const DeleteModal = lazy(() => import('./components/DeleteModal').then(m => ({ default: m.DeleteModal })));
const RecycleBin = lazy(() => import('./components/RecycleBin').then(m => ({ default: m.RecycleBin })));
const DeletionSchedules = lazy(() => import('./components/DeletionSchedules').then(m => ({ default: m.DeletionSchedules })));
const ClientsView = lazy(() => import('./components/ClientsView').then(m => ({ default: m.ClientsView })));
const ClientDetailView = lazy(() => import('./components/ClientDetailView').then(m => ({ default: m.ClientDetailView })));
const PeopleView = lazy(() => import('./components/PeopleView').then(m => ({ default: m.PeopleView })));
const PersonDetailView = lazy(() => import('./components/PersonDetailView').then(m => ({ default: m.PersonDetailView })));
const GallerySettingsModal = lazy(() => import('./components/GallerySettings').then(m => ({ default: m.GallerySettingsModal })));
const ShareModal = lazy(() => import('./components/ShareModal').then(m => ({ default: m.ShareModal })));
const CreateItemModal = lazy(() => import('./components/CreateItemModal').then(m => ({ default: m.CreateItemModal })));
const MediaViewer = lazy(() => import('./components/MediaViewer').then(m => ({ default: m.MediaViewer })));
const SettingsView = lazy(() => import('./components/SettingsView').then(m => ({ default: m.SettingsView })));
const AlbumDetailView = lazy(() => import('./components/AlbumDetailView').then(m => ({ default: m.AlbumDetailView })));
const ClientEmailModal = lazy(() => import('./components/ClientEmailModal').then(m => ({ default: m.ClientEmailModal })));
const ScanProgressToast = lazy(() => import('./components/ui/ScanProgressToast').then(m => ({ default: m.ScanProgressToast })));
const FaceTagModal = lazy(() => import('./components/FaceTagModal').then(m => ({ default: m.FaceTagModal })));
const AlbumDesigner = lazy(() => import('./components/album-design/AlbumDesigner').then(m => ({ default: m.AlbumDesigner })));
const PublicProfile = lazy(() => import('./components/PublicProfile').then(m => ({ default: m.PublicProfile })));

// Import types (not lazy loaded)
import { Album, AppView, Photo, AppSettings, Person, AppLanguage, AlbumDesign, Client, PhotographerProfile } from './types';
import type { DeleteOptions } from './components/DeleteModal';
import { Plus, Upload, X, ArrowLeft, Wand2, Info, Tag, Sparkles, Trash2, CheckCircle2, AlertCircle, Clock, CheckSquare, Square, Save, FolderPlus, Home, Settings as SettingsIcon, GripVertical, Share2, PlayCircle, Video, Eye, Heart, Lock, Image, Download, FileText, Loader2, Palette, Edit2 } from 'lucide-react';
import { analyzePhoto, detectPeople, generateAlbumStory } from './services/geminiService';
import { applyBrandingColors } from './utils/colorUtils';
import { logger } from './utils/logger';
import { useToast } from './hooks/useToast';
import { ToastContainer } from './components/ui/Toast';
import { useAlbumState } from './hooks/useAlbumState';
import { useModalState } from './hooks/useModalState';

function AuthenticatedApp() {
    const [currentView, setCurrentView] = useState<AppView>('albums');
    const { toasts, showToast, removeToast } = useToast();

    // Use album state hook with empty initial data
    const {
        albums,
        setAlbums,
        selectedAlbumId,
        setSelectedAlbumId,
        activeAlbum,
        albumSearchQuery,
        setAlbumSearchQuery,
        filteredAlbums,
        handleUpdateAlbum,
        handleUpdatePhoto,
        handleCreateAlbum: createAlbum,
        handleDeleteAlbums,
        handleReorderPhotos,
        handleAddDesign
    } = useAlbumState([]);

    // Load albums from database on mount
    useEffect(() => {
        const loadAlbums = async () => {
            try {
                const response = await fetch('/api/albums', {
                    credentials: 'include'
                });
                if (response.ok) {
                    const data = await response.json();
                    setAlbums(data);
                } else {
                    logger.warn('Failed to load albums from database');
                }
            } catch (error) {
                logger.error('Error loading albums', error as Error);
                showToast('Failed to load galleries', 'error');
            }
        };
        loadAlbums();
    }, []);

    // Load full album details when an album is selected
    useEffect(() => {
        if (!selectedAlbumId) return;

        const loadAlbumDetails = async () => {
            try {
                const response = await fetch(`/api/albums/${selectedAlbumId}`, {
                    credentials: 'include'
                });
                if (response.ok) {
                    const albumData = await response.json();
                    // Update the album in the albums array with full details
                    setAlbums(albums.map(a => a.id === selectedAlbumId ? albumData : a));
                } else {
                    logger.warn('Failed to load album details');
                }
            } catch (error) {
                logger.error('Error loading album details', error as Error);
            }
        };
        loadAlbumDetails();
    }, [selectedAlbumId]);

    // Use modal state hook
    const {
        isUploadModalOpen,
        setIsUploadModalOpen,
        isDeleteModalOpen,
        isSettingsModalOpen,
        setIsSettingsModalOpen,
        isShareModalOpen,
        setIsShareModalOpen,
        isCreateItemModalOpen,
        setIsCreateItemModalOpen,
        isMediaViewerOpen,
        setIsMediaViewerOpen,
        isClientEmailModalOpen,
        setIsClientEmailModalOpen,
        isFaceTagModalOpen,
        mediaViewerItemId,
        setMediaViewerItemId,
        deleteTarget,
        setDeleteTarget,
        shareTargetSubGalleryId,
        uploadTargetSubGalleryId,
        faceTagTarget,
        setFaceTagTarget,
        openUploadModal,
        openDeleteModal,
        openShareModal,
        openMediaViewer,
        openFaceTagModal
    } = useModalState();

    // Clients and people will be loaded from database
    const [clients, setClients] = useState<Client[]>([]);
    const [people, setPeople] = useState<Person[]>([]);
    const [settings, setSettings] = useState<AppSettings>({ // Default empty settings
        recycleBinRetentionDays: 30,
        studioDetails: { name: '', email: '', phone: '', address: '', website: '', socials: {} },
        photographerProfile: { personal: {}, company: {}, personalVisibility: {}, companyVisibility: {}, settings: { isPublic: false, allowIndexing: false } },
        integrations: { google: false, googleCalendar: false, googleDrive: false, googlePhotos: false, dropbox: false, adobe: false, stripe: false, zoom: false, slack: false },
        galleryDefaults: { brandName: '', tagline: '', showWatermark: false, watermarkOpacity: 0, watermarkPosition: 'center', primaryColor: '#dc2626' },
        policies: { termsOfService: '', privacyPolicy: '', refundPolicy: '' }
    });

    useEffect(() => {
        // Fetch storage providers if backend is available
        const fetchStorageProviders = async () => {
            try {
                const res = await fetch('/api/storage-providers');
                const providers = await res.json();
                setStorageProviders(providers);
            } catch (error) {
                logger.warn('Storage providers API not available', { error });
                setStorageProviders([]);
            }
        };
        fetchStorageProviders();
    }, []);

    // Selection State
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
    const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
    const [storageProviders, setStorageProviders] = useState<{ id: string; name: string }[]>([]);

    // Design State
    const [activeDesignId, setActiveDesignId] = useState<string | null>(null);
    const [searchDesignQuery, setSearchDesignQuery] = useState('');
    const [isCreateDesignModalOpen, setIsCreateDesignModalOpen] = useState(false);
    const [newDesignData, setNewDesignData] = useState({ albumId: '', name: '' });

    // Scanning State
    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState({ total: 0, processed: 0, found: 0 });
    const [scanQueue, setScanQueue] = useState<string[]>([]);

    // Global Settings
    const [language, setLanguage] = useState<AppLanguage>('en');
    const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
    const [isClientViewMode, setIsClientViewMode] = useState(false);

    // Helper to get active client and person
    const activeClient = clients.find(c => c.id === selectedClientId);
    const activePerson = people.find(p => p.id === selectedPersonId);

    // --- Handlers ---

    const handleNavigate = (view: AppView) => {
        setCurrentView(view);
        // Reset selections when navigating to main lists
        if (['albums', 'print-albums', 'clients', 'people'].includes(view)) {
            setSelectedAlbumId(null);
            setSelectedClientId(null);
            setSelectedPersonId(null);
            setActiveDesignId(null);
        }
    };

    const handleAlbumClick = (id: string) => {
        setSelectedAlbumId(id);
        setCurrentView('album-detail');
    };

    const handleDesignClick = (albumId: string, designId: string) => {
        setSelectedAlbumId(albumId);
        setActiveDesignId(designId);
        setCurrentView('design-editor');
    };

    const handleCreateDesign = useCallback(() => {
        if (!newDesignData.albumId || !newDesignData.name) return;

        const targetAlbum = albums.find(a => a.id === newDesignData.albumId);
        if (!targetAlbum) return;

        const newDesign: AlbumDesign = {
            id: `design-${Date.now()}`,
            name: newDesignData.name,
            specs: { id: 'm-10', name: "10x10", width: 10, height: 10, bleed: 0.125, safeZone: 0.5, dpi: 300 },
            spreads: [{ id: `s-${Date.now()}`, order: 0, elements: [], comments: [], status: 'draft', background: '#fff' }],
            globalStyles: { fontFamily: 'Inter', backgroundColor: '#ffffff', spacing: 2 },
            status: 'draft',
            lastModified: new Date().toISOString()
        };

        handleAddDesign(targetAlbum.id, newDesign);
        setIsCreateDesignModalOpen(false);
        setNewDesignData({ albumId: '', name: '' });

        // Auto-open the new design
        handleDesignClick(targetAlbum.id, newDesign.id);
        showToast('Album design created successfully', 'success');
    }, [newDesignData, albums, handleAddDesign, handleDesignClick, showToast]);

    // Aggregated Designs for Print Albums View
    const allDesigns = useMemo(() => {
        return albums.flatMap(album =>
            (album.designs || []).map(design => ({
                ...design,
                galleryTitle: album.title,
                galleryId: album.id,
                coverUrl: album.coverUrl
            }))
        );
    }, [albums]);

    const filteredDesigns = useMemo(() => {
        return allDesigns.filter(d =>
            d.name.toLowerCase().includes(searchDesignQuery.toLowerCase()) ||
            d.galleryTitle.toLowerCase().includes(searchDesignQuery.toLowerCase())
        );
    }, [allDesigns, searchDesignQuery]);

    const handleCreateAlbumWrapper = async (data: { title: string; clientName?: string }) => {
        try {
            const response = await fetch('/api/albums', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: data.title,
                    description: data.clientName || ''
                }),
            });

            if (response.ok) {
                const newAlbum = await response.json();
                setAlbums([...albums, newAlbum]);
                showToast('Gallery created successfully', 'success');
                setIsCreateItemModalOpen(false);
            } else {
                showToast('Failed to create gallery', 'error');
            }
        } catch (error) {
            logger.error('Error creating album', error as Error);
            showToast('Error creating gallery', 'error');
        }
    };

    const handleUpload = async (files: File[], subGalleryIds: string[], storageProvider: string) => {
        if (!selectedAlbumId) return;

        const formData = new FormData();
        files.forEach(file => {
            formData.append('file', file);
        });
        formData.append('albumId', selectedAlbumId);
        formData.append('subGalleryId', subGalleryIds[0] || ''); // For now, send only the first selected sub-gallery ID
        formData.append('provider', storageProvider);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                logger.info('Files uploaded successfully', { albumId: selectedAlbumId, fileCount: files.length });
                showToast(`Successfully uploaded ${files.length} file(s)`, 'success');
                setIsUploadModalOpen(false);
            } else {
                const errorText = await res.text();
                logger.error('Upload failed', new Error(errorText), { albumId: selectedAlbumId });
                showToast('Upload failed. Please try again.', 'error');
            }
        } catch (error) {
            logger.error('Error uploading files', error as Error, { albumId: selectedAlbumId });
            showToast('Error uploading files. Please check your connection.', 'error');
        }
    };

    const handleDelete = (options: DeleteOptions) => {
        if (!deleteTarget) return;

        const { type, ids } = deleteTarget;

        if (type === 'album') {
            handleDeleteAlbums(ids);
            showToast(`Deleted ${ids.length} album(s)`, 'success');
        } else {
            // Photo Deletion
            setAlbums(albums.map(a => {
                // Only affect the active album or all albums if needed
                if (selectedAlbumId && a.id !== selectedAlbumId) return a;

                const updatedPhotos = a.photos.map(p => {
                    if (!ids.includes(p.id)) return p;

                    if (options.type === 'soft') {
                        return { ...p, status: 'trash' as const, deletedAt: new Date().toISOString() };
                    } else if (options.type === 'scheduled' && options.date) {
                        return { ...p, scheduledDeleteAt: options.date };
                    }
                    return p;
                });

                // Hard delete filter if implemented, but soft delete keeps them in array with status='trash'
                return {
                    ...a,
                    photos: updatedPhotos,
                    photoCount: updatedPhotos.filter(p => p.status === 'active').length
                };
            }));

            const deleteType = options.type === 'soft' ? 'moved to trash' :
                options.type === 'scheduled' ? 'scheduled for deletion' : 'deleted';
            showToast(`${ids.length} photo(s) ${deleteType}`, 'success');
        }
        setDeleteTarget(null);
    };

    const handleAIAnalyze = async (albumId: string, photo: Photo) => {
        // Set status to analyzing
        handleUpdatePhoto(albumId, photo.id, { aiStatus: 'analyzing' });

        try {
            const result = await analyzePhoto(photo.url);
            handleUpdatePhoto(albumId, photo.id, {
                aiStatus: 'complete',
                aiDescription: result.description,
                aiTags: result.tags
            });
            showToast('Photo analyzed successfully', 'success');
        } catch (error) {
            logger.error('AI analysis failed', error as Error, { photoId: photo.id, albumId });
            handleUpdatePhoto(albumId, photo.id, { aiStatus: 'failed' });
            showToast('Failed to analyze photo. Please try again.', 'error');
        }
    };

    const handleGenerateStory = async (albumId: string, customPrompt?: string, selectedPhotoIds?: string[]) => {
        const album = albums.find(a => a.id === albumId);
        if (!album) return;

        // Use selected photos or top 5 favorites for context
        const sourcePhotos = selectedPhotoIds && selectedPhotoIds.length > 0
            ? album.photos.filter(p => selectedPhotoIds.includes(p.id))
            : album.photos.filter(p => p.isFavorite).slice(0, 5);

        const contextTags = Array.from(new Set(sourcePhotos.flatMap(p => p.tags || []))) as string[];
        try {
            const story = await generateAlbumStory(album.title, album.clientName, contextTags, customPrompt);
            handleUpdateAlbum(albumId, { aiStory: story });
            showToast('Album story generated successfully', 'success');
        } catch (error) {
            logger.error('Failed to generate album story', error as Error, { albumId });
            showToast('Failed to generate story. Please try again.', 'error');
        }
    };

    // --- Scan Faces ---
    const handleScanFaces = async (photoIds: string[]) => {
        if (!selectedAlbumId) return;
        const album = albums.find(a => a.id === selectedAlbumId);
        if (!album) return;

        setIsScanning(true);
        setScanQueue(photoIds);
        setScanProgress({ total: photoIds.length, processed: 0, found: 0 });

        let found = 0;
        for (let i = 0; i < photoIds.length; i++) {
            const pid = photoIds[i];
            const photo = album.photos.find(p => p.id === pid);
            if (photo && photo.type === 'photo') {
                const { faces } = await detectPeople(photo.url);
                if (faces.length > 0) {
                    found += faces.length;
                    handleUpdatePhoto(album.id, pid, { faces });
                }
            }
            setScanProgress(prev => ({ ...prev, processed: i + 1, found }));
        }
        setIsScanning(false);
    };

    // --- Views Rendering ---

    const renderContent = () => {
        switch (currentView) {
            case 'albums':
                return (
                    <AlbumsView
                        albums={filteredAlbums}
                        searchQuery={albumSearchQuery}
                        onSearchChange={setAlbumSearchQuery}
                        onAlbumClick={handleAlbumClick}
                        onCreateAlbum={() => setIsCreateItemModalOpen(true)}
                    />
                );

            case 'print-albums':
                return (
                    <PrintAlbumsView
                        designs={filteredDesigns}
                        searchQuery={searchDesignQuery}
                        onSearchChange={setSearchDesignQuery}
                        onDesignClick={handleDesignClick}
                        onCreateDesign={() => setIsCreateDesignModalOpen(true)}
                    />
                );

            case 'album-detail':
                return activeAlbum ? (
                    <AlbumDetailView
                        album={activeAlbum}
                        onBack={() => setCurrentView('albums')}
                        onUpdateAlbum={handleUpdateAlbum}
                        onUpdatePhoto={(id, updates) => handleUpdatePhoto(activeAlbum.id, id, updates)}
                        onDeletePhotos={(ids) => setDeleteTarget({ type: 'photo', ids })}
                        onUploadClick={(subGalleryId) => {
                            setUploadTargetSubGalleryId(subGalleryId);
                            setIsUploadModalOpen(true);
                        }}
                        onSettingsClick={() => setIsSettingsModalOpen(true)}
                        onShareClick={(subGalleryId) => {
                            setShareTargetSubGalleryId(subGalleryId || null);
                            setIsShareModalOpen(true);
                        }}
                        onPhotoClick={(id) => {
                            setMediaViewerItemId(id);
                            setIsMediaViewerOpen(true);
                        }}
                        onAIAnalyzePhoto={(photo) => handleAIAnalyze(activeAlbum.id, photo)}
                        onReorderPhotos={handleReorderPhotos}
                        onGenerateStory={handleGenerateStory}
                        onScanForPeople={handleScanFaces}
                        onFaceClick={(photo, faceId) => setFaceTagTarget({ photo, faceId })}
                        onBulkTagPerson={(photoIds) => { /* Bulk tag logic */ }}
                        isClientView={isClientViewMode}
                        onToggleClientView={() => setIsClientViewMode(!isClientViewMode)}
                        linkedClient={activeAlbum.clientId ? clients.find(c => c.id === activeAlbum.clientId) : undefined}
                    />
                ) : null;

            case 'design-editor':
                if (!activeAlbum) return null;
                return (
                    <AlbumDesigner
                        album={activeAlbum}
                        initialDesignId={activeDesignId || undefined}
                        onBack={() => handleNavigate('print-albums')}
                        onUpdateAlbum={handleUpdateAlbum}
                    />
                );

            case 'settings-public':
            case 'settings-brand':
            case 'settings-company':
            case 'settings-personal':
            case 'settings-integrations':
            case 'settings-policies':
                const section = currentView.split('-')[1] as any;
                return (
                    <SettingsView
                        settings={settings}
                        onUpdateSettings={setSettings}
                        language={language}
                        onUpdateLanguage={setLanguage}
                        onNavigate={handleNavigate}
                        section={section}
                        storageConnections={storageProviders}
                    />
                );


            case 'recycle-bin':
                return (
                    <RecycleBin
                        albums={albums}
                        retentionDays={settings.recycleBinRetentionDays}
                        onRestore={(ids) => {
                            setAlbums(albums.map(a => ({
                                ...a,
                                photos: a.photos.map(p => ids.includes(p.id) ? { ...p, status: 'active', deletedAt: undefined } : p)
                            })));
                        }}
                        onHardDelete={(ids) => {
                            setAlbums(albums.map(a => ({
                                ...a,
                                photos: a.photos.filter(p => !ids.includes(p.id))
                            })));
                        }}
                        onBack={() => handleNavigate('settings-public')}
                    />
                );

            case 'schedules':
                return (
                    <DeletionSchedules
                        albums={albums}
                        onCancelSchedule={(id) => {
                            setAlbums(albums.map(a => ({
                                ...a,
                                photos: a.photos.map(p => p.id === id ? { ...p, scheduledDeleteAt: undefined } : p)
                            })));
                        }}
                        onUpdateDate={(id, date) => {
                            setAlbums(albums.map(a => ({
                                ...a,
                                photos: a.photos.map(p => p.id === id ? { ...p, scheduledDeleteAt: date } : p)
                            })));
                        }}
                        onBack={() => handleNavigate('settings-public')}
                    />
                );

            case 'clients':
                return (
                    <ClientsView
                        clients={clients}
                        onClientClick={(id) => { setSelectedClientId(id); setCurrentView('client-detail'); }}
                        onAddClient={(newClient) => {
                            const client: Client = {
                                ...newClient,
                                id: `c-${Date.now()}`,
                                createdAt: new Date().toISOString(),
                                isActive: true,
                                phones: newClient.phones || [],
                                emails: newClient.emails || [],
                            } as Client;
                            setClients([...clients, client]);
                        }}
                    />
                );

            case 'client-detail':
                return activeClient ? (
                    <ClientDetailView
                        client={activeClient}
                        linkedAlbums={albums.filter(a => a.clientId === activeClient.id)}
                        onBack={() => setCurrentView('clients')}
                        onUpdateClient={(id, updates) => setClients(clients.map(c => c.id === id ? { ...c, ...updates } : c))}
                        onDeleteClient={(id) => {
                            setClients(clients.filter(c => c.id !== id));
                            setCurrentView('clients');
                        }}
                        onAlbumClick={handleAlbumClick}
                    />
                ) : null;

            case 'people':
                return (
                    <PeopleView
                        people={people}
                        onPersonClick={(id) => { setSelectedPersonId(id); setCurrentView('person-detail'); }}
                    />
                );

            case 'person-detail':
                // Mock filtering photos containing person
                const personPhotos = albums.flatMap(a => a.photos).filter(p => Math.random() > 0.7);
                return activePerson ? (
                    <PersonDetailView
                        person={activePerson}
                        photos={personPhotos}
                        onBack={() => setCurrentView('people')}
                        onRenamePerson={(id, name) => setPeople(people.map(p => p.id === id ? { ...p, name } : p))}
                        onCreateAlbum={() => { }}
                        onPhotoClick={() => { }}
                    />
                ) : null;

            case 'public-profile':
                return <PublicProfile profile={settings.photographerProfile} onClose={() => setCurrentView('settings-public')} />;

            default:
                return <div>View not found</div>;
        }
    };

    return (
        <Layout currentView={currentView} onNavigate={handleNavigate} isClientView={isClientViewMode}>
            <Suspense fallback={<LoadingFallback fullScreen />}>
                {renderContent()}
            </Suspense>

            {/* Toast Notifications */}
            <ToastContainer toasts={toasts} onClose={removeToast} />

            <CreateItemModal
                isOpen={isCreateItemModalOpen}
                onClose={() => setIsCreateItemModalOpen(false)}
                onConfirm={handleCreateAlbumWrapper}
            />

            {/* Create Design Modal */}
            <CreateDesignModal
                isOpen={isCreateDesignModalOpen}
                onClose={() => setIsCreateDesignModalOpen(false)}
                onConfirm={(albumId, name) => {
                    setNewDesignData({ albumId, name });
                    handleCreateDesign();
                }}
                albums={albums}
            />

            {selectedAlbumId && activeAlbum && (
                <>
                    <UploadModal
                        isOpen={isUploadModalOpen}
                        onClose={() => setIsUploadModalOpen(false)}
                        onUpload={handleUpload}
                        albumTitle={activeAlbum.title}
                        subGalleries={activeAlbum.subGalleries}
                        defaultSubGalleryId={uploadTargetSubGalleryId}
                        storageProviders={storageProviders}
                    />
                    <GallerySettingsModal
                        album={activeAlbum}
                        isOpen={isSettingsModalOpen}
                        onClose={() => setIsSettingsModalOpen(false)}
                        onSave={handleUpdateAlbum}
                        clients={clients}
                        globalSettings={settings}
                    />
                    <ShareModal
                        isOpen={isShareModalOpen}
                        onClose={() => setIsShareModalOpen(false)}
                        album={activeAlbum}
                        subGalleryId={shareTargetSubGalleryId}
                        onUpdateAlbum={handleUpdateAlbum}
                    />
                    {isMediaViewerOpen && mediaViewerItemId && (
                        <MediaViewer
                            items={activeAlbum.photos.filter(p => p.status === 'active' && (!isClientViewMode || p.privacy !== 'private' || p.isUnlocked))}
                            initialItemId={mediaViewerItemId}
                            onClose={() => { setIsMediaViewerOpen(false); setMediaViewerItemId(null); }}
                            onUpdateItem={(id, updates) => handleUpdatePhoto(activeAlbum.id, id, updates)}
                            language={language}
                            onLanguageChange={setLanguage}
                            currentUserEmail={currentUserEmail}
                            onRequireAuth={() => setIsClientEmailModalOpen(true)}
                            onShare={(photo) => { setIsMediaViewerOpen(false); /* Trigger share logic for photo */ }}
                            branding={activeAlbum.settings.branding}
                            bypassLock={!isClientViewMode}
                            allowDownloadGlobal={activeAlbum.settings.allowDownload}
                        />
                    )}
                </>
            )}

            <DeleteModal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={(opts) => handleDelete(opts)}
                count={deleteTarget?.ids.length || 0}
                itemType={deleteTarget?.type || 'photo'}
                retentionDays={settings.recycleBinRetentionDays}
            />

            <ClientEmailModal
                isOpen={isClientEmailModalOpen}
                onClose={() => setIsClientEmailModalOpen(false)}
                onConfirm={setCurrentUserEmail}
            />

            <FaceTagModal
                isOpen={!!faceTagTarget}
                onClose={() => setFaceTagTarget(null)}
                onConfirm={(name) => {
                    if (faceTagTarget && selectedAlbumId) {
                        // Update specific face if clicked, or just add tag to photo
                        // Simulating face update for now
                        console.log(`Tagged ${name} on photo ${faceTagTarget.photo.id}`);
                        setFaceTagTarget(null);
                    }
                }}
                existingPeople={people}
                currentLabel={faceTagTarget?.faceId} // Pre-fill if re-labeling
            />

            <ScanProgressToast
                total={scanProgress.total}
                processed={scanProgress.processed}
                foundCount={scanProgress.found}
                isScanning={isScanning}
                onStop={() => setIsScanning(false)}
                onClose={() => setScanProgress({ total: 0, processed: 0, found: 0 })}
            />

        </Layout>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <AppWithAuth />
        </AuthProvider>
    );
}

function AppWithAuth() {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <LoadingFallback fullScreen />;
    }

    if (!isAuthenticated) {
        return <LoginView />;
    }

    return <AuthenticatedApp />;
}
