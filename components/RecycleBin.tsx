


import React, { useState, useMemo } from 'react';
import { PageHeader, AdminToolbar } from './ui/AdminToolbar';
import { AppCard } from './ui/AppCard';
import { AppButton } from './ui/AppButton';
import { Album, Photo } from '../types';
import { Trash2, RotateCcw, AlertTriangle, CheckCircle2, Clock, CalendarX, AlertOctagon, Filter, ArrowLeft } from 'lucide-react';
import { AppBadge } from './ui/AppBadge';

interface RecycleBinProps {
    albums: Album[];
    retentionDays: number;
    onRestore: (photoIds: string[]) => void;
    onHardDelete: (photoIds: string[]) => void;
    onBack: () => void;
}

interface DeletedItem extends Photo {
    originalAlbumName: string;
    daysRemaining: number;
}

export const RecycleBin: React.FC<RecycleBinProps> = ({
    albums,
    retentionDays,
    onRestore,
    onHardDelete,
    onBack
}) => {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [showExpiringOnly, setShowExpiringOnly] = useState(false);

    // Flatten and process deleted photos
    const deletedItems: DeletedItem[] = useMemo(() => {
        return albums.flatMap(album =>
            album.photos
                .filter(p => p.status === 'trash')
                .map(p => {
                    const deletedDate = p.deletedAt ? new Date(p.deletedAt) : new Date();
                    const expiryDate = new Date(deletedDate);
                    expiryDate.setDate(deletedDate.getDate() + retentionDays);

                    const daysRemaining = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24));

                    return {
                        ...p,
                        originalAlbumName: album.title,
                        daysRemaining: daysRemaining > 0 ? daysRemaining : 0
                    };
                })
        ).sort((a, b) => a.daysRemaining - b.daysRemaining); // Sort by expiry (soonest first)
    }, [albums, retentionDays]);

    // Filter Logic
    const filteredItems = useMemo(() => {
        return deletedItems.filter(item => {
            const matchesSearch = item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.originalAlbumName.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesFilter = showExpiringOnly ? item.daysRemaining <= 3 : true;
            return matchesSearch && matchesFilter;
        });
    }, [deletedItems, searchTerm, showExpiringOnly]);

    // Stats Logic
    const stats = useMemo(() => {
        const total = deletedItems.length;
        const expiringCount = deletedItems.filter(i => i.daysRemaining <= 3).length;
        const nextDeletionDate = deletedItems.length > 0
            ? new Date(new Date().getTime() + (deletedItems[0].daysRemaining * 24 * 60 * 60 * 1000)).toLocaleDateString()
            : null;
        return { total, expiringCount, nextDeletionDate };
    }, [deletedItems]);

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const handleSelectAll = () => {
        if (selectedIds.size === filteredItems.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredItems.map(i => i.id)));
        }
    };

    return (
        <div className="space-y-6 pb-20 md:pb-0 animate-in fade-in duration-300">

            {/* Header & Stats Dashboard */}
            <div className="flex flex-col gap-6">
                <div>
                    <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 mb-2">
                        <ArrowLeft className="w-4 h-4" /> Back to Settings
                    </button>
                    <PageHeader
                        title="Recycle Bin"
                        subtitle={`Items are permanently removed after ${retentionDays} days.`}
                    />
                </div>

                {/* Insights Grid - Improved visual hierarchy */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <AppCard padding="md" className="flex items-center justify-between border-l-4 border-l-muted-foreground/30 relative overflow-hidden">
                        <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Total Items</p>
                            <h3 className="text-2xl font-bold text-foreground">{stats.total}</h3>
                        </div>
                        <div className="p-3 bg-muted rounded-full opacity-50">
                            <Trash2 className="w-5 h-5" />
                        </div>
                    </AppCard>

                    <AppCard padding="md" className={`flex items-center justify-between border-l-4 ${stats.expiringCount > 0 ? 'border-l-destructive-DEFAULT' : 'border-l-success-DEFAULT'} relative overflow-hidden`}>
                        <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Expiring Soon</p>
                            <div className="flex items-baseline gap-2">
                                <h3 className={`text-2xl font-bold ${stats.expiringCount > 0 ? 'text-destructive-DEFAULT' : 'text-foreground'}`}>
                                    {stats.expiringCount}
                                </h3>
                                {stats.expiringCount > 0 && <span className="text-xs text-muted-foreground">items</span>}
                            </div>
                        </div>
                        <div className={`p-3 rounded-full ${stats.expiringCount > 0 ? 'bg-destructive-soft text-destructive-DEFAULT' : 'bg-success-soft text-success-DEFAULT'}`}>
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                    </AppCard>

                    <AppCard padding="md" className="flex items-center justify-between border-l-4 border-l-warning-DEFAULT relative overflow-hidden">
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Next Cleanup</p>
                            <h3 className="text-lg font-bold text-foreground truncate">
                                {stats.nextDeletionDate || 'N/A'}
                            </h3>
                        </div>
                        <div className="p-3 bg-warning-soft text-warning-DEFAULT rounded-full">
                            <Clock className="w-5 h-5" />
                        </div>
                    </AppCard>
                </div>
            </div>

            {/* Inputs & Actions Toolbar */}
            <div className="sticky top-0 z-20 bg-background/95 backdrop-blur py-4 -mx-4 px-4 md:mx-0 md:px-0 md:bg-transparent md:backdrop-filter-none transition-all flex flex-col gap-3">
                <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                    {/* Search Input */}
                    <div className="flex-1">
                        <AdminToolbar
                            searchValue={searchTerm}
                            onSearchChange={setSearchTerm}
                            searchPlaceholder="Search deleted items..."
                            className="w-full"
                            showSearch={true}
                        />
                    </div>

                    {/* Filter & Select Actions */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowExpiringOnly(!showExpiringOnly)}
                            className={`
                        flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border flex-1 md:flex-none justify-center whitespace-nowrap
                        ${showExpiringOnly
                                    ? 'bg-destructive-soft text-destructive-DEFAULT border-destructive-DEFAULT/20'
                                    : 'bg-surface text-muted-foreground border-border hover:border-muted-foreground'
                                }
                    `}
                        >
                            <Filter className="w-4 h-4" />
                            <span className="hidden sm:inline">Expiring Soon</span>
                            <span className="sm:hidden">Expiring</span>
                            {stats.expiringCount > 0 && !showExpiringOnly && (
                                <span className="flex h-2 w-2 rounded-full bg-destructive-DEFAULT" />
                            )}
                        </button>

                        <AppButton
                            variant={selectedIds.size === filteredItems.length && filteredItems.length > 0 ? "secondary" : "ghost"}
                            size="md"
                            onClick={handleSelectAll}
                            disabled={filteredItems.length === 0}
                            className="whitespace-nowrap"
                        >
                            {selectedIds.size === filteredItems.length && filteredItems.length > 0
                                ? "Deselect All"
                                : "Select All"}
                        </AppButton>
                    </div>
                </div>

                {/* Bulk Actions Context Bar (Appears when items are selected) */}
                {selectedIds.size > 0 && (
                    <div className="flex items-center justify-between gap-3 p-3 bg-accent/5 border border-accent/20 rounded-lg animate-in slide-in-from-top-2 shadow-sm">
                        <div className="flex items-center gap-2 pl-1">
                            <div className="bg-accent-DEFAULT text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                {selectedIds.size}
                            </div>
                            <span className="text-sm font-medium text-foreground">selected</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <AppButton
                                size="sm"
                                variant="primary"
                                leftIcon={RotateCcw}
                                onClick={() => {
                                    onRestore(Array.from(selectedIds));
                                    setSelectedIds(new Set());
                                }}
                            >
                                Restore
                            </AppButton>
                            <AppButton
                                size="sm"
                                variant="destructive"
                                leftIcon={Trash2}
                                onClick={() => {
                                    if (confirm('Permanently delete selected items?')) {
                                        onHardDelete(Array.from(selectedIds));
                                        setSelectedIds(new Set());
                                    }
                                }}
                            >
                                Delete
                            </AppButton>
                        </div>
                    </div>
                )}
            </div>

            {/* Outputs: Hybrid List/Grid */}
            {filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 bg-muted/30 rounded-xl border border-dashed border-border text-center">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                        <CalendarX className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground">No items found</h3>
                    <p className="text-sm text-muted-foreground max-w-xs mt-1">
                        {searchTerm ? 'Adjust filters to find items.' : `Items appear here for ${retentionDays} days.`}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredItems.map(item => {
                        const isSelected = selectedIds.has(item.id);
                        const isCritical = item.daysRemaining <= 3;

                        return (
                            <AppCard
                                key={item.id}
                                padding="none"
                                onClick={() => toggleSelection(item.id)}
                                className={`
                            group flex flex-row sm:flex-col overflow-hidden cursor-pointer transition-all duration-200
                            ${isSelected
                                        ? 'ring-2 ring-accent shadow-md'
                                        : 'hover:shadow-md hover:border-accent/30'
                                    }
                            ${isCritical ? 'border-destructive-DEFAULT/50' : ''}
                        `}
                            >
                                {/* Image Area - Mobile: Left (Small), Desktop: Top (Full) */}
                                <div className="relative w-32 h-32 sm:w-full sm:h-auto sm:aspect-[4/3] shrink-0 bg-muted">
                                    <img
                                        src={item.thumbnailUrl}
                                        alt={item.title}
                                        width={item.width || 300}
                                        height={item.height || 300}
                                        loading="lazy"
                                        className={`w-full h-full object-cover transition-opacity ${isSelected ? 'opacity-90' : ''}`}
                                        loading="lazy"
                                    />

                                    {/* Selection Overlay (Desktop) */}
                                    <div className={`absolute inset-0 bg-accent/20 transition-opacity hidden sm:block ${isSelected ? 'opacity-100' : 'opacity-0'}`} />

                                    {/* Checkbox */}
                                    <div className="absolute top-2 left-2 z-10">
                                        <div className={`
                                    w-5 h-5 rounded border flex items-center justify-center transition-colors shadow-sm
                                    ${isSelected
                                                ? 'bg-accent border-accent text-white'
                                                : 'bg-black/40 border-white/70 text-transparent'
                                            }
                                `}>
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                        </div>
                                    </div>

                                    {/* Expiry Badge (Desktop) */}
                                    <div className="absolute bottom-2 right-2 hidden sm:block">
                                        <AppBadge
                                            size="sm"
                                            intent={isCritical ? 'destructive' : 'warning'}
                                            className="shadow-sm backdrop-blur-md bg-opacity-90"
                                        >
                                            {item.daysRemaining} days left
                                        </AppBadge>
                                    </div>
                                </div>

                                {/* Content Area */}
                                <div className="flex-1 p-3 flex flex-col justify-center sm:justify-start min-w-0">
                                    <div className="mb-1">
                                        <h4 className="text-sm font-medium text-foreground truncate">{item.title || 'Untitled'}</h4>
                                        <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                                            in {item.originalAlbumName}
                                        </p>
                                    </div>

                                    {/* Mobile Expiry Badge */}
                                    <div className="sm:hidden mt-2">
                                        <AppBadge
                                            size="sm"
                                            intent={isCritical ? 'destructive' : 'warning'}
                                        >
                                            {item.daysRemaining}d left
                                        </AppBadge>
                                    </div>

                                    <div className="mt-auto pt-2 sm:border-t border-border flex items-center justify-between text-[10px] text-muted-foreground">
                                        <span>Deleted: {item.deletedAt ? new Date(item.deletedAt).toLocaleDateString() : 'N/A'}</span>
                                    </div>
                                </div>
                            </AppCard>
                        );
                    })}
                </div>
            )}

            {/* Global Action Footer */}
            {deletedItems.length > 0 && (
                <div className="flex justify-center mt-8 pb-8 border-t border-border pt-8">
                    <AppButton
                        variant="outline"
                        className="text-destructive-DEFAULT border-destructive-DEFAULT/30 hover:bg-destructive-soft hover:border-destructive-DEFAULT"
                        leftIcon={AlertOctagon}
                        onClick={() => {
                            if (confirm('Are you sure you want to empty the Recycle Bin? All items will be permanently lost.')) {
                                onHardDelete(deletedItems.map(i => i.id));
                                setSelectedIds(new Set());
                            }
                        }}
                    >
                        Empty Recycle Bin
                    </AppButton>
                </div>
            )}
        </div>
    );
};