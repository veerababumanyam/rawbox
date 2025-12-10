import React, { useState, useEffect } from 'react';
import { AppCard } from './ui/AppCard';
import { AppInput } from './ui/AppInput';
import { AppButton } from './ui/AppButton';
import { Person } from '../types';
import { User, X, Check } from 'lucide-react';

interface FaceTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string) => void;
  currentLabel?: string;
  existingPeople: Person[];
}

export const FaceTagModal: React.FC<FaceTagModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentLabel,
  existingPeople
}) => {
  const [name, setName] = useState(currentLabel || '');
  const [suggestions, setSuggestions] = useState<Person[]>([]);

  useEffect(() => {
    setName(currentLabel || '');
  }, [currentLabel, isOpen]);

  useEffect(() => {
      if (!name.trim()) {
          setSuggestions([]);
          return;
      }
      const lower = name.toLowerCase();
      setSuggestions(existingPeople.filter(p => p.name.toLowerCase().includes(lower) && p.name.toLowerCase() !== lower));
  }, [name, existingPeople]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) onConfirm(name);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
       <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
       <div className="relative w-full max-w-sm animate-in zoom-in-95 duration-200">
          <AppCard className="shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <User className="w-5 h-5 text-accent-DEFAULT" /> Tag Person
                  </h3>
                  <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                  <AppInput 
                      label="Who is this?"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter name..."
                      autoFocus
                  />
                  
                  {suggestions.length > 0 && (
                      <div className="border border-border rounded-md overflow-hidden max-h-32 overflow-y-auto">
                          {suggestions.map(p => (
                              <button
                                type="button"
                                key={p.id}
                                className="w-full text-left px-3 py-2 hover:bg-muted text-sm flex items-center gap-2 transition-colors"
                                onClick={() => setName(p.name)}
                              >
                                  <div className="w-6 h-6 rounded-full overflow-hidden bg-muted">
                                    <img src={p.thumbnailUrl} className="w-full h-full object-cover" alt="" />
                                  </div>
                                  {p.name}
                              </button>
                          ))}
                      </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                      <AppButton variant="ghost" onClick={onClose} type="button">Cancel</AppButton>
                      <AppButton variant="primary" type="submit" disabled={!name.trim()} leftIcon={Check}>
                          Save Tag
                      </AppButton>
                  </div>
              </form>
          </AppCard>
       </div>
    </div>
  );
};