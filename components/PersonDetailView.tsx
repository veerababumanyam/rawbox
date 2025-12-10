
import React, { useState } from 'react';
import { Person, Photo, ViewMode } from '../types';
import { AppButton, AppIconButton } from './ui/AppButton';
import { AppCard } from './ui/AppCard';
import { AppInput } from './ui/AppInput';
import { PageHeader, AdminToolbar } from './ui/AdminToolbar';
import { PhotoGrid } from './ui/PhotoGrid';
import { ArrowLeft, Save, Edit2, LayoutGrid, Grid, ImagePlus } from 'lucide-react';

interface PersonDetailViewProps {
  person: Person;
  photos: Photo[];
  onBack: () => void;
  onRenamePerson: (id: string, newName: string) => void;
  onCreateAlbum: (person: Person, photos: Photo[]) => void;
  onPhotoClick: (id: string) => void;
}

export const PersonDetailView: React.FC<PersonDetailViewProps> = ({
  person,
  photos,
  onBack,
  onRenamePerson,
  onCreateAlbum,
  onPhotoClick
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(person.name);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const handleSaveName = () => {
    if (newName.trim() && newName !== person.name) {
      onRenamePerson(person.id, newName);
    }
    setIsEditing(false);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0 animate-in fade-in slide-in-from-right-4 duration-300">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Avatar Card */}
        <div className="w-full md:w-auto flex-shrink-0">
             <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-surface shadow-xl overflow-hidden bg-muted mx-auto md:mx-0">
                <img src={person.coverPhotoUrl || person.thumbnailUrl} className="w-full h-full object-cover" alt={person.name} />
             </div>
        </div>

        {/* Info & Actions */}
        <div className="flex-1 w-full space-y-4">
             <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="space-y-2 text-center md:text-left">
                     <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center md:justify-start gap-1">
                        <ArrowLeft className="w-4 h-4" /> Back to People
                    </button>
                    
                    {isEditing ? (
                        <div className="flex items-center gap-2 max-w-xs mx-auto md:mx-0">
                            <AppInput 
                                value={newName} 
                                onChange={(e) => setNewName(e.target.value)}
                                autoFocus
                                className="text-xl font-bold"
                            />
                            <AppIconButton icon={Save} onClick={handleSaveName} aria-label="Save" variant="primary" />
                        </div>
                    ) : (
                        <div className="flex items-center justify-center md:justify-start gap-3 group">
                            <h1 className="text-3xl font-bold tracking-tight text-foreground">{person.name}</h1>
                            <button onClick={() => setIsEditing(true)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-muted rounded-full">
                                <Edit2 className="w-4 h-4 text-muted-foreground" />
                            </button>
                        </div>
                    )}
                    <p className="text-muted-foreground">
                        Found in {photos.length} photos • First seen {person.createdAt ? new Date(person.createdAt).toLocaleDateString() : 'recently'}
                    </p>
                </div>
                
                <div className="flex items-center justify-center gap-3">
                    <AppButton 
                        variant="primary" 
                        size="lg" 
                        leftIcon={ImagePlus} 
                        onClick={() => onCreateAlbum(person, photos)}
                        className="shadow-lg shadow-accent/20"
                    >
                        Create Album
                    </AppButton>
                </div>
             </div>
        </div>
      </div>

      <div className="h-px bg-border my-6" />

      {/* Toolbar */}
      <AdminToolbar 
          searchPlaceholder="Search in this person's photos..."
          showSearch={false} // Can enable later if needed
          actions={
            <div className="flex items-center border border-border rounded-lg overflow-hidden">
                <button onClick={() => setViewMode('grid')} className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-accent/10 text-accent-DEFAULT' : 'hover:bg-muted text-muted-foreground'}`} title="Grid View"><Grid className="w-4 h-4" /></button>
                <div className="w-px h-4 bg-border" />
                <button onClick={() => setViewMode('masonry')} className={`p-2 transition-colors ${viewMode === 'masonry' ? 'bg-accent/10 text-accent-DEFAULT' : 'hover:bg-muted text-muted-foreground'}`} title="Masonry View"><LayoutGrid className="w-4 h-4" /></button>
            </div>
          }
      />

      {/* Grid */}
      <PhotoGrid 
        photos={photos}
        viewMode={viewMode}
        selectedIds={new Set()}
        onToggleSelection={() => {}}
        onPhotoClick={onPhotoClick}
        onAIAnalyze={() => {}}
        draggedIndex={null}
        onDragStart={() => {}}
        onDragOver={() => {}}
        onDrop={() => {}}
        draggable={false}
        onFavorite={() => {}}
        onEdit={() => {}}
        onTagFace={() => {}}
      />

    </div>
  );
};