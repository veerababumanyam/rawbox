import React from 'react';
import { Album } from '../../types';
import { AppButton } from '../ui/AppButton';
import { AdminToolbar } from '../ui/AdminToolbar';
import { AlbumGrid } from '../AlbumGrid';
import { Plus } from 'lucide-react';

interface AlbumsViewProps {
    albums: Album[];
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onAlbumClick: (id: string) => void;
    onCreateAlbum: () => void;
}

/**
 * Albums list view component
 * Displays a grid of all albums with search functionality
 */
export const AlbumsView: React.FC<AlbumsViewProps> = ({
    albums,
    searchQuery,
    onSearchChange,
    onAlbumClick,
    onCreateAlbum
}) => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Galleries</h1>
                    <p className="text-muted-foreground">Manage your client photo collections.</p>
                </div>
                <AppButton leftIcon={Plus} onClick={onCreateAlbum}>
                    New Gallery
                </AppButton>
            </div>

            <AdminToolbar
                searchValue={searchQuery}
                onSearchChange={onSearchChange}
                searchPlaceholder="Search albums..."
            />

            <AlbumGrid albums={albums} onAlbumClick={onAlbumClick} />
        </div>
    );
};
