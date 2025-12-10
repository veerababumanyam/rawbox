import { useState, useCallback } from 'react';
import { Photo } from '../types';

/**
 * Custom hook for managing modal state
 * Extracted from App.tsx to reduce component complexity
 */
export const useModalState = () => {
    // Modal open/close states
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isCreateItemModalOpen, setIsCreateItemModalOpen] = useState(false);
    const [isMediaViewerOpen, setIsMediaViewerOpen] = useState(false);
    const [isClientEmailModalOpen, setIsClientEmailModalOpen] = useState(false);
    const [isFaceTagModalOpen, setIsFaceTagModalOpen] = useState(false);

    // Modal context data
    const [mediaViewerItemId, setMediaViewerItemId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<{ type: 'photo' | 'album', ids: string[] } | null>(null);
    const [shareTargetSubGalleryId, setShareTargetSubGalleryId] = useState<string | null>(null);
    const [uploadTargetSubGalleryId, setUploadTargetSubGalleryId] = useState<string | null>(null);
    const [faceTagTarget, setFaceTagTarget] = useState<{ photo: Photo, faceId?: string } | null>(null);

    // Helper functions to open modals with context
    const openUploadModal = useCallback((subGalleryId: string | null = null) => {
        setUploadTargetSubGalleryId(subGalleryId);
        setIsUploadModalOpen(true);
    }, []);

    const openDeleteModal = useCallback((type: 'photo' | 'album', ids: string[]) => {
        setDeleteTarget({ type, ids });
        setIsDeleteModalOpen(true);
    }, []);

    const openShareModal = useCallback((subGalleryId: string | null = null) => {
        setShareTargetSubGalleryId(subGalleryId);
        setIsShareModalOpen(true);
    }, []);

    const openMediaViewer = useCallback((itemId: string) => {
        setMediaViewerItemId(itemId);
        setIsMediaViewerOpen(true);
    }, []);

    const openFaceTagModal = useCallback((photo: Photo, faceId?: string) => {
        setFaceTagTarget({ photo, faceId });
        setIsFaceTagModalOpen(true);
    }, []);

    const closeAllModals = useCallback(() => {
        setIsUploadModalOpen(false);
        setIsDeleteModalOpen(false);
        setIsSettingsModalOpen(false);
        setIsShareModalOpen(false);
        setIsCreateItemModalOpen(false);
        setIsMediaViewerOpen(false);
        setIsClientEmailModalOpen(false);
        setIsFaceTagModalOpen(false);

        // Clear context data
        setMediaViewerItemId(null);
        setDeleteTarget(null);
        setShareTargetSubGalleryId(null);
        setUploadTargetSubGalleryId(null);
        setFaceTagTarget(null);
    }, []);

    return {
        // Modal states
        isUploadModalOpen,
        setIsUploadModalOpen,
        isDeleteModalOpen,
        setIsDeleteModalOpen,
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
        setIsFaceTagModalOpen,

        // Context data
        mediaViewerItemId,
        setMediaViewerItemId,
        deleteTarget,
        setDeleteTarget,
        shareTargetSubGalleryId,
        setShareTargetSubGalleryId,
        uploadTargetSubGalleryId,
        setUploadTargetSubGalleryId,
        faceTagTarget,
        setFaceTagTarget,

        // Helper functions
        openUploadModal,
        openDeleteModal,
        openShareModal,
        openMediaViewer,
        openFaceTagModal,
        closeAllModals
    };
};
