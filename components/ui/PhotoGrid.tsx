
import React, { useState, useRef, useEffect } from 'react';
import { Photo, ViewMode, BrandingSettings } from '../../types';
import { CheckCircle2, Heart, Lock, PlayCircle, Wand2, Edit2, UserPlus, ScanFace, Tag, X, Save, Clock, ChevronDown, Download, Check } from 'lucide-react';
import { WatermarkOverlay } from '../Branding';
import { AppBadge } from './AppBadge';

interface PhotoGridProps {
    photos: Photo[];
    viewMode: ViewMode;
    selectedIds: Set<string>;
    onToggleSelection: (id: string) => void;
    onPhotoClick: (id: string) => void;
    onAIAnalyze: (photo: Photo) => void;
    onFavorite: (id: string, isFavorite: boolean) => void;
    onPick?: (id: string, isPicked: boolean) => void; // New: Client Pick/Proofing
    onDownload?: (photo: Photo) => void; // New: Individual Download
    onEdit: (photo: Photo) => void;
    onUpdatePhoto?: (id: string, updates: Partial<Photo>) => void;
    onTagFace: (photo: Photo) => void;
    onFaceClick?: (photo: Photo, faceId: string) => void;
    draggedIndex: number | null;
    onDragStart: (e: React.DragEvent, index: number) => void;
    onDragOver: (e: React.DragEvent, index: number) => void;
    onDrop: (e: React.DragEvent, index: number) => void;
    draggable?: boolean;
    branding?: BrandingSettings;
    isClientView?: boolean;
    selectionEnabled?: boolean;
}

// --- Inline Edit Form Component ---
const InlineEditForm: React.FC<{
    photo: Photo;
    onSave: (id: string, updates: Partial<Photo>) => void;
    onCancel: () => void;
}> = ({ photo, onSave, onCancel }) => {
    const [title, setTitle] = useState(photo.title || '');
    const [description, setDescription] = useState(photo.description || '');
    const [tags, setTags] = useState((photo.tags || []).join(', '));
    const [privacy, setPrivacy] = useState(photo.privacy || 'public');
    const [allowDownload, setAllowDownload] = useState(photo.allowDownload !== false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea based on content
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [description]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onSave(photo.id, {
            title,
            description,
            tags: tags.split(',').map(t => t.trim()).filter(Boolean),
            privacy,
            allowDownload
        });
    };

    return (
        <div
            className="absolute top-0 left-0 right-0 min-h-full z-[60] bg-surface flex flex-col p-3 rounded-lg shadow-2xl ring-2 ring-accent animate-in fade-in zoom-in-95 duration-200 origin-top"
            style={{ height: 'auto' }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
        >
            <div className="flex items-center justify-between mb-3 border-b border-border pb-2">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Edit2 className="w-3.5 h-3.5 text-accent" /> Quick Edit
                </span>
                <button type="button" onClick={onCancel} className="p-1 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors">
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-3">
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Title</label>
                    <input
                        className="w-full text-sm font-medium bg-muted/30 border border-transparent focus:border-accent focus:ring-0 rounded-md px-2 py-1.5 transition-all placeholder:text-muted-foreground/50"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Untitled Photo"
                        autoFocus
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Description</label>
                    <textarea
                        ref={textareaRef}
                        className="w-full text-xs bg-muted/30 border border-transparent focus:border-accent focus:ring-0 rounded-md px-2 py-1.5 transition-all resize-none placeholder:text-muted-foreground/50 min-h-[60px]"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Add a description..."
                        rows={1}
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Tags</label>
                    <div className="relative">
                        <Tag className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                        <input
                            className="w-full text-xs bg-muted/30 border border-transparent focus:border-accent focus:ring-0 rounded-md pl-7 pr-2 py-1.5 transition-all placeholder:text-muted-foreground/50"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            placeholder="wedding, nature, portrait..."
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-border mt-1">
                    <button
                        type="button"
                        onClick={() => setAllowDownload(!allowDownload)}
                        className={`p-1.5 rounded-md transition-colors border relative ${allowDownload ? 'bg-accent/10 text-accent-DEFAULT border-accent/20' : 'bg-muted text-muted-foreground border-transparent hover:bg-muted/80'}`}
                        title={allowDownload ? "Download Allowed" : "Download Disabled"}
                    >
                        <Download className="w-4 h-4" />
                        {!allowDownload && <div className="absolute inset-0 flex items-center justify-center"><div className="w-3/4 h-0.5 bg-foreground/50 rotate-45" /></div>}
                    </button>

                    <div className="relative flex-1">
                        <select
                            value={privacy}
                            onChange={(e) => setPrivacy(e.target.value as 'public' | 'private')}
                            className="w-full text-xs bg-muted/30 border border-transparent rounded-md py-1.5 pl-2 pr-6 appearance-none focus:ring-1 focus:ring-accent cursor-pointer font-medium text-foreground"
                        >
                            <option value="public">Public</option>
                            <option value="private">Private</option>
                        </select>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                            <ChevronDown className="w-3 h-3" />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-white rounded-md hover:bg-accent-hover transition-colors text-xs font-semibold shadow-sm"
                        title="Save Changes"
                    >
                        <Save className="w-3.5 h-3.5" /> Save
                    </button>
                </div>
            </form>
        </div>
    );
};

const PhotoCard: React.FC<{
    photo: Photo;
    isSelected: boolean;
    isEditing: boolean;
    onToggle: (e: React.MouseEvent | React.KeyboardEvent) => void;
    onClick: () => void;
    onAnalyze: (e: React.MouseEvent) => void;
    onFavorite: (e: React.MouseEvent) => void;
    onPick?: (e: React.MouseEvent) => void;
    onDownload?: (e: React.MouseEvent) => void;
    onEdit: (e: React.MouseEvent) => void;
    onSaveEdit: (id: string, updates: Partial<Photo>) => void;
    onCancelEdit: () => void;
    onTagFace: (e: React.MouseEvent) => void;
    onFaceClick?: (photo: Photo, faceId: string) => void;
    className?: string;
    branding?: BrandingSettings;
    isClientView?: boolean;
    selectionEnabled?: boolean;
}> = ({
    photo,
    isSelected,
    isEditing,
    onToggle,
    onClick,
    onAnalyze,
    onFavorite,
    onPick,
    onDownload,
    onEdit,
    onSaveEdit,
    onCancelEdit,
    onTagFace,
    onFaceClick,
    className = '',
    branding,
    isClientView = false,
    selectionEnabled = false
}) => {
        const [showFaces, setShowFaces] = useState(false);
        const isVideo = photo.type === 'video';
        const isAnalyzing = photo.aiStatus === 'analyzing';
        const isPrivate = photo.privacy === 'private';
        const isScheduled = !!photo.scheduledDeleteAt;
        const hasFaces = photo.faces && photo.faces.length > 0;

        // Check if individual download is allowed for this photo
        const canDownload = photo.allowDownload !== false;

        const handleKeyDown = (e: React.KeyboardEvent) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                onClick();
            }
            if (e.key === ' ') {
                e.preventDefault();
                onToggle(e);
            }
        };

        const toggleFaces = (e: React.MouseEvent) => {
            e.stopPropagation();
            if (!hasFaces) {
                onTagFace(e); // Trigger scan if no faces
            } else {
                setShowFaces(!showFaces);
            }
        };

        return (
            <div
                className={`
                group relative bg-muted transition-all focus:outline-none focus:ring-4 focus:ring-accent/50 
                ${isClientView ? 'rounded-none shadow-none' : 'rounded-lg shadow-sm hover:shadow-md'} 
                ${isSelected ? 'ring-2 ring-accent ring-offset-2' : ''} 
                ${isEditing ? 'overflow-visible z-20' : 'overflow-hidden'} 
                ${className}
            `}
                onClick={!isEditing ? onClick : undefined}
                onKeyDown={!isEditing ? handleKeyDown : undefined}
                role="button"
                tabIndex={0}
                aria-label={`${photo.title || 'Photo'} ${isVideo ? 'Video' : ''} ${isPrivate ? 'Private' : ''} ${isSelected ? 'Selected' : ''}`}
                aria-pressed={isSelected}
            >
                {isEditing ? (
                    <InlineEditForm photo={photo} onSave={onSaveEdit} onCancel={onCancelEdit} />
                ) : (
                    <>
                        {/* Image Container */}
                        <div className={`relative w-full h-full overflow-hidden ${isClientView ? '' : 'rounded-lg'}`}>
                            <img
                                src={photo.thumbnailUrl}
                                alt=""
                                className={`
                                w-full h-full object-cover transition-transform duration-500 
                                ${isAnalyzing ? 'blur-[2px]' : ''}
                                ${isPrivate && !isClientView ? 'opacity-70 blur-[1px]' : ''}
                                group-hover:scale-105
                            `}
                                loading="lazy"
                                decoding="async"
                                width={photo.width}
                                height={photo.height}
                                style={{ aspectRatio: photo.width && photo.height ? `${photo.width}/${photo.height}` : undefined }}
                            />

                            {/* Branding Watermark */}
                            <WatermarkOverlay branding={branding} />

                            {/* Face Overlay Boxes */}
                            {showFaces && photo.faces?.map((face) => (
                                <div
                                    key={face.id}
                                    className="absolute border-2 border-white/80 hover:border-accent hover:bg-accent/20 cursor-pointer shadow-sm rounded-sm transition-all z-20 group/face"
                                    style={{
                                        left: `${face.box.x}%`,
                                        top: `${face.box.y}%`,
                                        width: `${face.box.w}%`,
                                        height: `${face.box.h}%`
                                    }}
                                    title={face.personId || "Unknown Person. Click to tag."}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (onFaceClick) onFaceClick(photo, face.id);
                                    }}
                                >
                                    {face.personId && (
                                        <span className="absolute -top-5 left-0 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded whitespace-nowrap opacity-100 shadow-sm backdrop-blur-sm truncate max-w-[100px]">
                                            {face.personId}
                                        </span>
                                    )}
                                    <div className="absolute top-0 right-0 p-0.5 opacity-0 group-hover/face:opacity-100 bg-accent text-white rounded-bl-sm">
                                        <Tag className="w-2 h-2" />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Status Badges - Admin View Only */}
                        {!isClientView && (
                            <div className="absolute top-2 left-2 z-20 flex flex-col gap-1.5 pointer-events-none pt-9 transition-opacity opacity-100 group-hover:opacity-20">
                                {isPrivate && (
                                    <AppBadge intent="destructive" size="sm" icon={Lock} className="shadow-sm backdrop-blur-md bg-white/90 dark:bg-black/80 border border-white/10">
                                        Private
                                    </AppBadge>
                                )}
                                {photo.isFavorite && (
                                    <AppBadge intent="accent" size="sm" icon={Heart} className="shadow-sm backdrop-blur-md bg-white/90 dark:bg-black/80 border border-white/10">
                                        Favorite
                                    </AppBadge>
                                )}
                                {photo.isPicked && (
                                    <AppBadge intent="success" size="sm" icon={CheckCircle2} className="shadow-sm backdrop-blur-md bg-white/90 dark:bg-black/80 border border-white/10">
                                        Picked
                                    </AppBadge>
                                )}
                                {isScheduled && (
                                    <AppBadge intent="warning" size="sm" icon={Clock} className="shadow-sm backdrop-blur-md bg-white/90 dark:bg-black/80 border border-white/10">
                                        Deleting
                                    </AppBadge>
                                )}
                            </div>
                        )}

                        {/* Private/Locked Badge (Admin View Only - Large Overlay) */}
                        {isPrivate && !isClientView && (
                            <div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-center pointer-events-none z-10">
                                <div className="flex flex-col items-center justify-center gap-2 p-3 bg-black/40 backdrop-blur-sm rounded-xl border border-white/10">
                                    <Lock className="w-8 h-8 text-white drop-shadow-md" />
                                    <span className="text-[10px] font-bold text-white uppercase tracking-widest drop-shadow-md px-2 py-0.5">Private</span>
                                </div>
                            </div>
                        )}

                        {/* Video Indicator */}
                        {isVideo && (
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20 z-20">
                                <PlayCircle className="w-5 h-5 text-white fill-white/20" />
                            </div>
                        )}

                        {/* Top-Right: Client Actions (Favorite & Pick) */}
                        <div className="absolute top-2 right-2 z-30 flex flex-col gap-2">
                            <button
                                onClick={onFavorite}
                                className={`
                                p-2 rounded-full transition-all shadow-sm
                                ${photo.isFavorite
                                        ? 'bg-white text-error hover:bg-error/10'
                                        : 'bg-black/30 text-white hover:bg-black/50 opacity-0 group-hover:opacity-100 focus:opacity-100'
                                    }
                            `}
                                title={photo.isFavorite ? "Unfavorite" : "Favorite"}
                            >
                                <Heart className={`w-4 h-4 ${photo.isFavorite ? 'fill-current' : ''}`} />
                            </button>

                            {/* Client Pick / Selection for Photographer */}
                            {isClientView && onPick && (
                                <button
                                    onClick={onPick}
                                    className={`
                                    p-2 rounded-full transition-all shadow-sm
                                    ${photo.isPicked
                                            ? 'bg-success-DEFAULT text-white hover:bg-success-DEFAULT/90'
                                            : 'bg-black/30 text-white hover:bg-black/50 opacity-0 group-hover:opacity-100 focus:opacity-100'
                                        }
                                `}
                                    title={photo.isPicked ? "Picked (Selection)" : "Pick this photo"}
                                >
                                    <CheckCircle2 className={`w-4 h-4 ${photo.isPicked ? 'fill-current' : ''}`} />
                                </button>
                            )}
                        </div>

                        {/* Bottom-Right: Individual Download (Client View) */}
                        {isClientView && onDownload && canDownload && (
                            <div className="absolute bottom-2 right-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDownload(e); }}
                                    className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-colors shadow-sm"
                                    title="Download"
                                >
                                    <Download className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        {/* Top-Left: Bulk Selection Checkbox (Admin or Client Bulk Mode) */}
                        {(!isClientView || selectionEnabled) && (
                            <button
                                className={`absolute top-2 left-2 z-30 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity focus:opacity-100 focus:outline-none`}
                                onClick={(e) => { e.stopPropagation(); onToggle(e); }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.stopPropagation();
                                        onToggle(e);
                                    }
                                }}
                                aria-label={isSelected ? "Deselect item" : "Select item"}
                                title={isSelected ? "Deselect" : "Select"}
                                tabIndex={0}
                            >
                                <div className={`w-8 h-8 rounded-lg border-2 ${isSelected ? 'bg-accent border-accent text-white' : 'bg-black/20 border-white/70 hover:bg-black/40'} flex items-center justify-center shadow-sm backdrop-blur-sm transition-colors`}>
                                    {isSelected && <Check className="w-5 h-5" />}
                                </div>
                            </button>
                        )}

                        {/* Bottom-Left: Edit & Tag Group (Hidden in Client View) */}
                        {!isClientView && (
                            <div className="absolute bottom-2 left-2 z-30 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
                                <button
                                    onClick={onEdit}
                                    className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-colors"
                                    title="Quick Edit"
                                >
                                    <Edit2 className="w-3.5 h-3.5" />
                                </button>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSaveEdit(photo.id, { allowDownload: photo.allowDownload === false });
                                    }}
                                    className={`p-2 rounded-full backdrop-blur-md transition-colors ${photo.allowDownload === false ? 'bg-error/80 text-white' : 'bg-black/40 hover:bg-black/60 text-white'}`}
                                    title={photo.allowDownload === false ? "Enable Download" : "Disable Download"}
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    {photo.allowDownload === false && <span className="absolute inset-0 flex items-center justify-center"><span className="w-3 h-0.5 bg-white rotate-45"></span></span>}
                                </button>

                                {!isVideo && (
                                    <button
                                        onClick={toggleFaces}
                                        className={`p-2 rounded-full backdrop-blur-md transition-colors ${showFaces ? 'bg-accent text-white' : 'bg-black/40 hover:bg-black/60 text-white'}`}
                                        title={hasFaces ? "Show Detected Faces" : "Scan/Tag Faces"}
                                    >
                                        {showFaces ? <Tag className="w-3.5 h-3.5" /> : (hasFaces ? <UserPlus className="w-3.5 h-3.5" /> : <ScanFace className="w-3.5 h-3.5" />)}
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Bottom-Right: Analysis (Hidden in Client View) */}
                        {!isVideo && !isClientView && (
                            <div className="absolute bottom-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
                                <button
                                    className="h-8 w-8 rounded-full bg-white/90 text-black hover:bg-white flex items-center justify-center shadow-sm focus:outline-none focus:ring-2 focus:ring-accent"
                                    onClick={(e) => { e.stopPropagation(); onAnalyze(e); }}
                                    title="Analyze Metadata"
                                    aria-label="Analyze Metadata"
                                    tabIndex={0}
                                >
                                    <Wand2 className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        {/* Video Duration */}
                        {isVideo && photo.duration && (
                            <div className="absolute bottom-2 right-2 bg-black/60 px-1.5 py-0.5 rounded text-[10px] text-white font-mono backdrop-blur-sm pointer-events-none z-20">
                                {Math.floor(photo.duration / 60)}:{(photo.duration % 60).toString().padStart(2, '0')}
                            </div>
                        )}

                        {/* Hover Interaction Layer */}
                        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                    </>
                )}
            </div>
        );
    };

export const PhotoGrid: React.FC<PhotoGridProps> = ({
    photos,
    viewMode,
    selectedIds,
    onToggleSelection,
    onPhotoClick,
    onAIAnalyze,
    onFavorite,
    onPick,
    onDownload,
    onEdit,
    onUpdatePhoto,
    onTagFace,
    onFaceClick,
    draggedIndex,
    onDragStart,
    onDragOver,
    onDrop,
    draggable = true,
    branding,
    isClientView = false,
    selectionEnabled = false
}) => {
    const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
    const [columnCount, setColumnCount] = useState(3);

    const handleStartEdit = (photo: Photo) => {
        onEdit(photo);
        setEditingPhotoId(photo.id);
    };

    const handleSaveEdit = (id: string, updates: Partial<Photo>) => {
        if (onUpdatePhoto) {
            onUpdatePhoto(id, updates);
        }
        setEditingPhotoId(null);
    };

    // Responsive Masonry Columns
    useEffect(() => {
        if (viewMode !== 'masonry') return;
        const updateColumns = () => {
            const w = window.innerWidth;
            if (w >= 1536) setColumnCount(5); // 2xl
            else if (w >= 1280) setColumnCount(4); // xl
            else if (w >= 1024) setColumnCount(3); // lg
            else if (w >= 640) setColumnCount(2); // sm
            else setColumnCount(1);
        };
        updateColumns();
        window.addEventListener('resize', updateColumns);
        return () => window.removeEventListener('resize', updateColumns);
    }, [viewMode]);

    if (viewMode === 'masonry') {
        const columns: Photo[][] = Array.from({ length: columnCount }, () => []);
        photos.forEach((photo, i) => {
            columns[i % columnCount].push(photo);
        });

        const gridClass = isClientView
            ? 'gap-1 px-0' // Edge-to-edge for client view
            : 'gap-4';

        return (
            <div
                className={`grid ${gridClass}`}
                style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}
                role="grid"
                aria-label="Photo Gallery"
            >
                {Array.from({ length: columnCount }).map((_, colIndex) => (
                    <div key={colIndex} className={`flex flex-col ${gridClass}`}>
                        {columns[colIndex].map((photo) => (
                            <PhotoCard
                                key={photo.id}
                                photo={photo}
                                isSelected={selectedIds.has(photo.id)}
                                isEditing={editingPhotoId === photo.id}
                                onClick={() => onPhotoClick(photo.id)}
                                onToggle={(e) => onToggleSelection(photo.id)}
                                onAnalyze={(e) => onAIAnalyze(photo)}
                                onFavorite={(e) => { e.stopPropagation(); onFavorite(photo.id, !photo.isFavorite); }}
                                onPick={(e) => { e.stopPropagation(); onPick?.(photo.id, !photo.isPicked); }}
                                onDownload={onDownload ? (e) => { e.stopPropagation(); onDownload(photo); } : undefined}
                                onEdit={(e) => { e.stopPropagation(); handleStartEdit(photo); }}
                                onSaveEdit={handleSaveEdit}
                                onCancelEdit={() => setEditingPhotoId(null)}
                                onTagFace={(e) => { e.stopPropagation(); onTagFace(photo); }}
                                onFaceClick={onFaceClick}
                                branding={branding}
                                isClientView={isClientView}
                                selectionEnabled={selectionEnabled}
                            />
                        ))}
                    </div>
                ))}
            </div>
        );
    }

    // Standard Grid
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4" role="grid" aria-label="Photo Gallery">
            {photos.map((photo, index) => (
                <div
                    key={photo.id}
                    draggable={draggable && editingPhotoId === null && !isClientView}
                    onDragStart={(e) => draggable && !isClientView && onDragStart(e, index)}
                    onDragOver={(e) => draggable && !isClientView && onDragOver(e, index)}
                    onDrop={(e) => draggable && !isClientView && onDrop(e, index)}
                    className={draggedIndex === index ? 'opacity-50' : ''}
                    role="gridcell"
                >
                    <PhotoCard
                        photo={photo}
                        isSelected={selectedIds.has(photo.id)}
                        isEditing={editingPhotoId === photo.id}
                        onClick={() => onPhotoClick(photo.id)}
                        onToggle={(e) => onToggleSelection(photo.id)}
                        onAnalyze={(e) => onAIAnalyze(photo)}
                        onFavorite={(e) => { e.stopPropagation(); onFavorite(photo.id, !photo.isFavorite); }}
                        onPick={(e) => { e.stopPropagation(); onPick?.(photo.id, !photo.isPicked); }}
                        onDownload={onDownload ? (e) => { e.stopPropagation(); onDownload(photo); } : undefined}
                        onEdit={(e) => { e.stopPropagation(); handleStartEdit(photo); }}
                        onSaveEdit={handleSaveEdit}
                        onCancelEdit={() => setEditingPhotoId(null)}
                        onTagFace={(e) => { e.stopPropagation(); onTagFace(photo); }}
                        onFaceClick={onFaceClick}
                        className="aspect-[3/4]"
                        branding={branding}
                        isClientView={isClientView}
                        selectionEnabled={selectionEnabled}
                    />
                </div>
            ))}
        </div>
    );
};
