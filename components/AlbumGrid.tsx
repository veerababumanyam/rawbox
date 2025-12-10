
import React from 'react';
import { AppCard } from './ui/AppCard';
import { StatusBadge } from './ui/AppBadge';
import { Album } from '../types';
import { Calendar, Image, Lock, Globe, Heart } from 'lucide-react';

interface AlbumGridProps {
  albums: Album[];
  onAlbumClick: (albumId: string) => void;
}

export const AlbumGrid: React.FC<AlbumGridProps> = ({ albums, onAlbumClick }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      {albums.map((album) => (
        <AppCard
          key={album.id}
          variant="interactive"
          padding="none"
          onClick={() => onAlbumClick(album.id)}
          className="group overflow-hidden flex flex-col h-full ring-offset-2 focus-within:ring-2 focus-within:ring-ring"
        >
          <div className="relative aspect-[3/2] sm:aspect-[4/3] overflow-hidden bg-surface-hover">
            <img
              src={album.coverUrl}
              alt={album.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute top-3 right-3 flex gap-2">
              <StatusBadge status={album.status} />
              {album.isFavorite && (
                <div className="bg-surface/90 backdrop-blur-md p-1 rounded-md text-error shadow-sm">
                  <Heart className="w-3 h-3 fill-current" />
                </div>
              )}
              {album.settings?.isPasswordProtected && (
                <div className="bg-surface/50 backdrop-blur-md p-1 rounded-md text-foreground">
                  <Lock className="w-3 h-3" />
                </div>
              )}
            </div>
            {/* Mobile Touch Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-surface/80 via-transparent to-transparent opacity-60 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
              <span className="text-foreground text-sm font-medium hidden sm:block">View Gallery</span>
            </div>
            {/* Mobile Title Overlay (Visible only on very small screens if desired, but we stick to below card for clarity) */}
          </div>

          <div className="p-4 md:p-5 flex-1 flex flex-col">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-base font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                {album.title}
              </h3>
            </div>

            <p className="text-sm text-text-tertiary mb-4 line-clamp-1">{album.clientName}</p>

            <div className="mt-auto flex items-center justify-between text-xs text-text-tertiary border-t border-border pt-3">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {album.date}
              </div>
              <div className="flex items-center gap-1.5">
                <Image className="w-3.5 h-3.5" />
                {album.photoCount} items
              </div>
            </div>
          </div>
        </AppCard>
      ))}
    </div>
  );
};
