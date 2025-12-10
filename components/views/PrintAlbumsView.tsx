import React from 'react';
import { AlbumDesign } from '../../types';
import { AppButton } from '../ui/AppButton';
import { AppCard } from '../ui/AppCard';
import { AppBadge } from '../ui/AppBadge';
import { AdminToolbar } from '../ui/AdminToolbar';
import { Plus, BookOpen, Book, FileText } from 'lucide-react';

interface DesignWithGallery extends AlbumDesign {
    galleryTitle: string;
    galleryId: string;
    coverUrl?: string;
}

interface PrintAlbumsViewProps {
    designs: DesignWithGallery[];
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onDesignClick: (galleryId: string, designId: string) => void;
    onCreateDesign: () => void;
}

/**
 * Print Albums view component
 * Displays all album designs with search and filtering
 */
export const PrintAlbumsView: React.FC<PrintAlbumsViewProps> = ({
    designs,
    searchQuery,
    onSearchChange,
    onDesignClick,
    onCreateDesign
}) => {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Print Albums</h1>
                    <p className="text-muted-foreground">Design and proof print albums.</p>
                </div>
                <AppButton variant="primary" leftIcon={Plus} onClick={onCreateDesign}>
                    New Album Design
                </AppButton>
            </div>

            <AdminToolbar
                searchValue={searchQuery}
                onSearchChange={onSearchChange}
                searchPlaceholder="Search designs..."
            />

            {designs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 bg-muted/30 rounded-xl border border-dashed border-border text-center">
                    <BookOpen className="w-12 h-12 text-muted-foreground mb-4 opacity-50" aria-hidden="true" />
                    <h3 className="text-lg font-medium text-foreground">No Designs Found</h3>
                    <p className="text-muted-foreground max-w-sm mt-2 mb-6">
                        Create album designs linked to your galleries to see them here.
                    </p>
                    <AppButton variant="secondary" onClick={onCreateDesign}>
                        Create Your First Album
                    </AppButton>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {designs.map(design => (
                        <AppCard
                            key={design.id}
                            variant="interactive"
                            padding="none"
                            onClick={() => onDesignClick(design.galleryId, design.id)}
                            className="group flex flex-col overflow-hidden h-full ring-offset-2 focus-within:ring-2 focus-within:ring-ring"
                        >
                            <div className="relative aspect-[3/2] bg-muted overflow-hidden">
                                <img
                                    src={design.coverUrl}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    alt={`Cover for ${design.name}`}
                                />
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" aria-hidden="true" />

                                {/* Type Badge */}
                                <div className="absolute top-2 left-2">
                                    <div className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1">
                                        <Book className="w-3 h-3" aria-hidden="true" /> {design.specs.name}
                                    </div>
                                </div>

                                {/* Status Badge */}
                                <div className="absolute top-2 right-2">
                                    <AppBadge
                                        intent={design.status === 'proofing' ? 'accent' : design.status === 'locked' ? 'success' : 'default'}
                                        size="sm"
                                        className="shadow-sm"
                                    >
                                        {design.status}
                                    </AppBadge>
                                </div>
                            </div>
                            <div className="p-4 flex-1 flex flex-col">
                                <h3 className="font-semibold text-foreground truncate">{design.name}</h3>
                                <p className="text-xs text-muted-foreground mb-3 truncate flex items-center gap-1">
                                    Linked to <span className="text-accent-DEFAULT">{design.galleryTitle}</span>
                                </p>
                                <div className="mt-auto pt-3 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground">
                                    <span>Edited {new Date(design.lastModified).toLocaleDateString()}</span>
                                    <span className="flex items-center gap-1">
                                        <FileText className="w-3 h-3" aria-hidden="true" /> {design.spreads.length} spreads
                                    </span>
                                </div>
                            </div>
                        </AppCard>
                    ))}
                </div>
            )}
        </div>
    );
};
