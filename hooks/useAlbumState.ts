import { useState, useCallback, useMemo } from 'react';
import { Album, Photo, AlbumDesign, BrandingSettings } from '../types';

/**
 * Custom hook for managing album state and operations
 * Extracted from App.tsx to reduce component complexity
 */
export const useAlbumState = (initialAlbums: Album[] = []) => {
    const [albums, setAlbums] = useState<Album[]>(initialAlbums);
    const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
    const [albumSearchQuery, setAlbumSearchQuery] = useState('');

    // Get active album
    const activeAlbum = useMemo(
        () => albums.find(a => a.id === selectedAlbumId),
        [albums, selectedAlbumId]
    );

    // Filtered albums based on search
    const filteredAlbums = useMemo(() => {
        const q = albumSearchQuery.toLowerCase();
        if (!q) return albums;

        return albums.filter(a =>
            a.title.toLowerCase().includes(q) ||
            a.clientName.toLowerCase().includes(q) ||
            (a.aiStory || '').toLowerCase().includes(q)
        );
    }, [albums, albumSearchQuery]);

    // Update album
    const handleUpdateAlbum = useCallback((id: string, updates: Partial<Album>) => {
        setAlbums(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
    }, []);

    // Update photo within an album
    const handleUpdatePhoto = useCallback((albumId: string, photoId: string, updates: Partial<Photo>) => {
        setAlbums(prev => prev.map(a => {
            if (a.id !== albumId) return a;

            const updatedPhotos = a.photos.map(p =>
                p.id === photoId ? { ...p, ...updates } : p
            );

            return { ...a, photos: updatedPhotos };
        }));
    }, []);

    // Create new album
    const handleCreateAlbum = useCallback((data: { title: string; clientName?: string }, defaultSettings: BrandingSettings) => {
        const newAlbum: Album = {
            id: Date.now().toString(),
            title: data.title,
            clientName: data.clientName || 'Unknown Client',
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
            coverUrl: `https://picsum.photos/id/${Math.floor(Math.random() * 100)}/800/600`,
            photoCount: 0,
            status: 'draft',
            settings: {
                isShared: false,
                isPasswordProtected: false,
                emailRegistration: false,
                allowDownload: true,
                showMetadata: true,
                theme: 'auto',
                focalPointX: 50,
                focalPointY: 50,
                branding: { ...defaultSettings }
            },
            photos: []
        };

        setAlbums(prev => [newAlbum, ...prev]);
        return newAlbum;
    }, []);

    // Delete albums
    const handleDeleteAlbums = useCallback((ids: string[]) => {
        setAlbums(prev => prev.filter(a => !ids.includes(a.id)));

        if (selectedAlbumId && ids.includes(selectedAlbumId)) {
            setSelectedAlbumId(null);
        }
    }, [selectedAlbumId]);

    // Reorder photos within an album
    const handleReorderPhotos = useCallback((
        albumId: string,
        dragIndex: number,
        dropIndex: number,
        contextSubGalleryId: string | null
    ) => {
        setAlbums(prev => prev.map(album => {
            if (album.id !== albumId) return album;

            const originalPhotos = [...album.photos];

            // Filter to get the subset being viewed
            const subsetPhotos = originalPhotos.filter(p => {
                if (p.status !== 'active') return false;
                if (contextSubGalleryId !== null) return p.subGalleryId === contextSubGalleryId;
                return true;
            });

            if (dragIndex < 0 || dragIndex >= subsetPhotos.length ||
                dropIndex < 0 || dropIndex >= subsetPhotos.length ||
                dragIndex === dropIndex) {
                return album;
            }

            // Reorder the subset
            const newSubset = [...subsetPhotos];
            const [movedItem] = newSubset.splice(dragIndex, 1);
            newSubset.splice(dropIndex, 0, movedItem);

            // Map back to main photo array
            const subsetIds = new Set(subsetPhotos.map(p => p.id));
            let subsetIndex = 0;

            const newGlobalPhotos = originalPhotos.map(p => {
                if (subsetIds.has(p.id)) {
                    const item = newSubset[subsetIndex];
                    subsetIndex++;
                    return item;
                }
                return p;
            });

            return { ...album, photos: newGlobalPhotos };
        }));
    }, []);

    // Add design to album
    const handleAddDesign = useCallback((albumId: string, design: AlbumDesign) => {
        setAlbums(prev => prev.map(a =>
            a.id === albumId
                ? { ...a, designs: [...(a.designs || []), design] }
                : a
        ));
    }, []);

    return {
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
        handleCreateAlbum,
        handleDeleteAlbums,
        handleReorderPhotos,
        handleAddDesign
    };
};
