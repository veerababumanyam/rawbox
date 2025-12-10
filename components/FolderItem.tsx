import React from 'react';
import { SubGallery } from '../types';
import { Folder as FolderIcon, MoreVertical } from 'lucide-react';

interface FolderItemProps {
  folder: SubGallery;
  onClick: () => void;
  onEdit?: () => void;
}

export const FolderItem: React.FC<FolderItemProps> = ({ folder, onClick, onEdit }) => {
  return (
    <div
      className="group relative flex flex-col items-center cursor-pointer p-4 hover:bg-muted/50 rounded-xl transition-colors border border-transparent hover:border-border"
      onClick={onClick}
    >
      <div className="relative w-full aspect-[4/3] mb-3">
        {/* Folder Visual Stack */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-2 bg-accent/20 rounded-t-lg" />
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[85%] h-2 bg-accent/40 rounded-t-lg" />
        <div className="absolute inset-0 top-4 bg-accent/10 border-2 border-accent/20 rounded-lg flex items-center justify-center group-hover:bg-accent/20 transition-colors overflow-hidden">
          {folder.coverUrl ? (
            <img src={folder.coverUrl} alt={`${folder.title} folder cover`} className="w-full h-full object-cover" loading="lazy" width="200" height="200" />
          ) : (
            <FolderIcon className="w-12 h-12 text-accent-DEFAULT" strokeWidth={1.5} />
          )}
        </div>
      </div>

      <div className="w-full text-center">
        <h3 className="font-medium text-foreground truncate px-2">{folder.title}</h3>
        <p className="text-xs text-muted-foreground">Folder</p>
      </div>
    </div>
  );
};