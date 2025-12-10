
import React, { useState, useMemo } from 'react';
import { PageHeader, AdminToolbar } from './ui/AdminToolbar';
import { AppCard } from './ui/AppCard';
import { AppButton } from './ui/AppButton';
import { Person } from '../types';
import { Users, Camera, Sparkles, ChevronRight, UserPlus } from 'lucide-react';

interface PeopleViewProps {
  people: Person[];
  onPersonClick: (personId: string) => void;
}

export const PeopleView: React.FC<PeopleViewProps> = ({ people, onPersonClick }) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter logic
  const filteredPeople = useMemo(() => {
    return people.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [people, searchQuery]);

  // Stats logic
  const stats = useMemo(() => {
    const total = people.length;
    const sorted = [...people].sort((a, b) => b.photoCount - a.photoCount);
    const topPerson = sorted[0];
    const totalFaces = people.reduce((acc, curr) => acc + curr.photoCount, 0);
    return { total, topPerson, totalFaces };
  }, [people]);

  return (
    <div className="space-y-6 pb-20 md:pb-0 animate-in fade-in duration-300">
      {/* Header Section */}
      <div className="flex flex-col gap-4">
        <PageHeader
          title="People & Pets"
          subtitle="AI-detected faces and clusters from your galleries."
        />

        {/* Insights Dashboard - Mobile First Stack */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          <AppCard padding="sm" className="flex flex-col justify-center items-start gap-1">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> Total Detected
            </div>
            <span className="text-2xl font-bold text-foreground">{stats.total}</span>
          </AppCard>

          <AppCard padding="sm" className="flex flex-col justify-center items-start gap-1">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5" /> Total Faces
            </div>
            <span className="text-2xl font-bold text-foreground">{stats.totalFaces}</span>
          </AppCard>

          {stats.topPerson && (
            <AppCard padding="sm" className="col-span-2 md:col-span-1 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted overflow-hidden shrink-0 border border-border">
                <img src={stats.topPerson.thumbnailUrl} className="w-full h-full object-cover" alt={`${stats.topPerson.name} avatar`} width="40" height="40" loading="lazy" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-accent-DEFAULT" /> Top Feature
                </div>
                <span className="font-medium truncate text-foreground">{stats.topPerson.name}</span>
              </div>
            </AppCard>
          )}
        </div>
      </div>

      <AdminToolbar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Find a person by name..."
        className="sticky top-0 z-10 bg-background/95 backdrop-blur py-2 -mx-4 px-4 md:mx-0 md:px-0 md:static md:bg-transparent md:backdrop-filter-none transition-all"
      />

      {filteredPeople.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 md:py-24 bg-muted/30 rounded-xl border border-dashed border-border text-center px-4">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground">
            {searchQuery ? `No results for "${searchQuery}"` : "No people detected yet"}
          </h3>
          <p className="text-muted-foreground max-w-sm mt-1 mb-6 text-sm">
            {searchQuery
              ? "Try adjusting your search terms."
              : "Analyze photos in your albums to automatically detect and group people."
            }
          </p>
          {searchQuery && (
            <AppButton variant="ghost" onClick={() => setSearchQuery('')}>Clear Search</AppButton>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-6">
          {filteredPeople.map((person) => (
            <AppCard
              key={person.id}
              padding="none"
              variant="interactive"
              className="group flex flex-col overflow-hidden h-full ring-offset-2 focus-within:ring-2 focus-within:ring-ring"
              onClick={() => onPersonClick(person.id)}
            >
              <div className="relative aspect-square overflow-hidden bg-muted">
                <img
                  src={person.coverPhotoUrl || person.thumbnailUrl}
                  alt={`${person.name} photo`}
                  width="300"
                  height="300"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                  <span className="text-white text-xs font-medium flex items-center gap-1">
                    View Profile <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
                {/* Count Badge */}
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/10 shadow-sm">
                  {person.photoCount}
                </div>
              </div>

              <div className="p-3 md:p-4 flex-1 flex flex-col justify-center text-center">
                <h3 className="text-sm font-semibold text-foreground group-hover:text-accent-DEFAULT transition-colors truncate">
                  {person.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {person.photoCount === 1 ? '1 Photo' : `${person.photoCount} Photos`}
                </p>
              </div>
            </AppCard>
          ))}
        </div>
      )}
    </div>
  );
};