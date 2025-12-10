
import React, { useState, useMemo } from 'react';
import { PageHeader, AdminToolbar } from './ui/AdminToolbar';
import { AppCard } from './ui/AppCard';
import { AppButton, AppIconButton } from './ui/AppButton';
import { Album, Photo } from '../types';
import { CalendarClock, XCircle, Edit, Calendar, AlertTriangle, Clock, Filter, Check, X, ArrowLeft } from 'lucide-react';
import { AppBadge } from './ui/AppBadge';

interface DeletionSchedulesProps {
    albums: Album[];
    onCancelSchedule: (photoId: string) => void;
    onUpdateDate: (photoId: string, newDate: string) => void;
    onBack: () => void;
}

interface ScheduledItem extends Photo {
    originalAlbumName: string;
    daysRemaining: number;
}

export const DeletionSchedules: React.FC<DeletionSchedulesProps> = ({
    albums,
    onCancelSchedule,
    onUpdateDate,
    onBack
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [tempDate, setTempDate] = useState('');
    const [showCriticalOnly, setShowCriticalOnly] = useState(false);

    // Flatten and process scheduled photos
    const scheduledItems: ScheduledItem[] = useMemo(() => {
        return albums.flatMap(album =>
            album.photos
                .filter(p => p.status === 'active' && p.scheduledDeleteAt)
                .map(p => {
                    const date = new Date(p.scheduledDeleteAt!);
                    const today = new Date();
                    const diffTime = date.getTime() - today.getTime();
                    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    return {
                        ...p,
                        originalAlbumName: album.title,
                        daysRemaining
                    };
                })
        ).sort((a, b) => {
            // Sort by nearest deletion date
            return new Date(a.scheduledDeleteAt!).getTime() - new Date(b.scheduledDeleteAt!).getTime();
        });
    }, [albums]);

    const filteredItems = useMemo(() => {
        return scheduledItems.filter(item => {
            const matchesSearch = item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.originalAlbumName.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesFilter = showCriticalOnly ? item.daysRemaining <= 3 : true;
            return matchesSearch && matchesFilter;
        });
    }, [scheduledItems, searchTerm, showCriticalOnly]);

    // Stats Logic
    const stats = useMemo(() => {
        const total = scheduledItems.length;
        const nextDeletion = scheduledItems.length > 0 ? scheduledItems[0].scheduledDeleteAt : null;
        const criticalCount = scheduledItems.filter(i => i.daysRemaining <= 3).length;
        return { total, nextDeletion, criticalCount };
    }, [scheduledItems]);

    const handleEditClick = (item: ScheduledItem) => {
        setEditingId(item.id);
        setTempDate(item.scheduledDeleteAt || '');
    };

    const handleSaveEdit = (id: string) => {
        if (tempDate) {
            onUpdateDate(id, tempDate);
            setEditingId(null);
        }
    };

    const formatDate = (isoString?: string) => {
        if (!isoString) return 'No Date';
        return new Date(isoString).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
        });
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
                        title="Deletion Schedules"
                        subtitle="Manage automated cleanup tasks and photo expiry."
                    />
                </div>

                {/* Insights Grid - Mobile First */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AppCard padding="md" className="relative overflow-hidden border-l-4 border-l-info-DEFAULT">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Total Scheduled</p>
                                <h3 className="text-2xl font-bold text-foreground">{stats.total}</h3>
                                <p className="text-xs text-muted-foreground mt-1">Pending deletion</p>
                            </div>
                            <div className="p-2 bg-info-soft rounded-full">
                                <CalendarClock className="w-5 h-5 text-info-DEFAULT" />
                            </div>
                        </div>
                    </AppCard>

                    <AppCard padding="md" className={`relative overflow-hidden border-l-4 ${stats.criticalCount > 0 ? 'border-l-destructive-DEFAULT' : 'border-l-success-DEFAULT'}`}>
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Expiring Soon</p>
                                <h3 className={`text-2xl font-bold ${stats.criticalCount > 0 ? 'text-destructive-DEFAULT' : 'text-foreground'}`}>
                                    {stats.criticalCount}
                                </h3>
                                <p className="text-xs text-muted-foreground mt-1">Within 3 days</p>
                            </div>
                            <div className={`p-2 rounded-full ${stats.criticalCount > 0 ? 'bg-destructive-soft' : 'bg-success-soft'}`}>
                                <AlertTriangle className={`w-5 h-5 ${stats.criticalCount > 0 ? 'text-destructive-DEFAULT' : 'text-success-DEFAULT'}`} />
                            </div>
                        </div>
                    </AppCard>

                    <AppCard padding="md" className="relative overflow-hidden border-l-4 border-l-warning-DEFAULT sm:col-span-2 lg:col-span-1">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Next Auto-Delete</p>
                                <h3 className="text-xl font-bold text-foreground truncate">
                                    {stats.nextDeletion ? formatDate(stats.nextDeletion) : 'N/A'}
                                </h3>
                                <p className="text-xs text-muted-foreground mt-1">Earliest scheduled date</p>
                            </div>
                            <div className="p-2 bg-warning-soft rounded-full">
                                <Clock className="w-5 h-5 text-warning-DEFAULT" />
                            </div>
                        </div>
                    </AppCard>
                </div>
            </div>

            {/* Toolbar & Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between sticky top-0 z-10 bg-background/95 backdrop-blur py-4 -mx-4 px-4 md:mx-0 md:px-0 md:static md:bg-transparent md:backdrop-filter-none transition-all border-b md:border-none border-border">
                <AdminToolbar
                    searchValue={searchTerm}
                    onSearchChange={setSearchTerm}
                    searchPlaceholder="Search items..."
                    className="w-full md:w-auto flex-1"
                    showSearch={true}
                />

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button
                        onClick={() => setShowCriticalOnly(!showCriticalOnly)}
                        className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border w-full md:w-auto justify-center
                    ${showCriticalOnly
                                ? 'bg-destructive-soft text-destructive-DEFAULT border-destructive-DEFAULT/20'
                                : 'bg-surface text-muted-foreground border-border hover:border-muted-foreground'
                            }
                `}
                    >
                        <Filter className="w-4 h-4" />
                        <span>Critical Only</span>
                        {stats.criticalCount > 0 && (
                            <span className="bg-destructive-DEFAULT text-white text-[10px] px-1.5 rounded-full ml-1">
                                {stats.criticalCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Responsive Grid List */}
            {filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-muted/30 rounded-xl border border-dashed border-border text-center">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                        <CalendarClock className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground">No items found</h3>
                    <p className="text-sm text-muted-foreground max-w-xs mt-1">
                        {searchTerm || showCriticalOnly
                            ? 'Try adjusting your filters.'
                            : 'Scheduled deletions will appear here.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                    {filteredItems.map(item => {
                        const isEditing = editingId === item.id;
                        const isCritical = item.daysRemaining <= 3;

                        return (
                            <AppCard
                                key={item.id}
                                padding="none"
                                className={`group flex flex-row sm:flex-col overflow-hidden transition-all duration-200 hover:shadow-md ${isCritical ? 'ring-1 ring-destructive-DEFAULT' : ''}`}
                            >
                                {/* Mobile: Row Layout | Desktop: Stacked */}

                                {/* Image Section */}
                                <div className="relative w-32 sm:w-full sm:aspect-video shrink-0 bg-muted">
                                    <img
                                        src={item.thumbnailUrl}
                                        alt={item.title}
                                        width={item.width || 300}
                                        height={item.height || 300}
                                        loading="lazy"
                                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                        loading="lazy"
                                    />
                                    {/* Desktop Overlay Badge */}
                                    <div className="absolute top-2 right-2 hidden sm:flex">
                                        <AppBadge intent={isCritical ? 'destructive' : 'warning'} size="sm" className="shadow-sm backdrop-blur-md bg-opacity-90">
                                            {item.daysRemaining} days left
                                        </AppBadge>
                                    </div>
                                </div>

                                {/* Content Section */}
                                <div className="flex-1 p-4 flex flex-col min-w-0">
                                    <div className="mb-2">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-semibold text-sm truncate pr-2 text-foreground" title={item.title}>
                                                {item.title || 'Untitled'}
                                            </h4>
                                            {/* Mobile Badge */}
                                            <div className="sm:hidden shrink-0">
                                                <AppBadge intent={isCritical ? 'destructive' : 'warning'} size="sm" pill={false} className="rounded text-[10px] px-1.5 py-0.5">
                                                    {item.daysRemaining}d
                                                </AppBadge>
                                            </div>
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                                            in {item.originalAlbumName}
                                        </p>
                                    </div>

                                    {/* Actions Area */}
                                    <div className="mt-auto pt-3 border-t border-border/50">
                                        {isEditing ? (
                                            <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-muted-foreground" />
                                                    <span className="text-xs font-medium">New Date:</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="date"
                                                        value={tempDate}
                                                        onChange={(e) => setTempDate(e.target.value)}
                                                        className="flex-1 px-2 py-1.5 text-xs border border-border rounded bg-background focus:ring-2 focus:ring-accent focus:border-transparent outline-none"
                                                        min={new Date().toISOString().split('T')[0]}
                                                    />
                                                    <button onClick={() => handleSaveEdit(item.id)} className="p-1.5 bg-success-soft text-success-DEFAULT rounded hover:bg-success-DEFAULT hover:text-white transition-colors">
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => setEditingId(null)} className="p-1.5 bg-muted text-muted-foreground rounded hover:bg-muted-foreground hover:text-white transition-colors">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Deletes</span>
                                                    <span className={`text-sm font-medium ${isCritical ? 'text-destructive-DEFAULT' : 'text-foreground'}`}>
                                                        {formatDate(item.scheduledDeleteAt)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <AppIconButton
                                                        icon={Edit}
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleEditClick(item)}
                                                        aria-label="Edit Date"
                                                        className="text-muted-foreground hover:text-accent-DEFAULT hover:bg-accent-light"
                                                    />
                                                    <AppIconButton
                                                        icon={XCircle}
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => {
                                                            if (confirm('Cancel auto-deletion for this item?')) {
                                                                onCancelSchedule(item.id);
                                                            }
                                                        }}
                                                        aria-label="Cancel Schedule"
                                                        className="text-muted-foreground hover:text-destructive-DEFAULT hover:bg-destructive-soft"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </AppCard>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
