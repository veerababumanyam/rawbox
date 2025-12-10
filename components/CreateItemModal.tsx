
import React, { useState, useEffect } from 'react';
import { AppInput } from './ui/AppInput';
import { AppButton } from './ui/AppButton';
import { ImagePlus, X } from 'lucide-react';

interface CreateItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { title: string; clientName?: string }) => void;
}

export const CreateItemModal: React.FC<CreateItemModalProps> = ({
  isOpen,
  onClose,
  onConfirm
}) => {
  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setClientName('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onConfirm({ title, clientName });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <ImagePlus className="w-5 h-5 text-accent-DEFAULT" />
              Create New Gallery
            </h2>
            <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="p-6 space-y-4">
            <AppInput 
              label="Gallery Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Sarah & James Wedding"
              autoFocus
              required
            />
            <AppInput 
              label="Client Name"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g. Sarah Jenkins"
            />
          </div>

          <div className="p-6 border-t border-border bg-muted/10 flex justify-end gap-3">
            <AppButton type="button" variant="ghost" onClick={onClose}>Cancel</AppButton>
            <AppButton type="submit" variant="primary" disabled={!title.trim()}>Create</AppButton>
          </div>
        </form>
      </div>
    </div>
  );
};
