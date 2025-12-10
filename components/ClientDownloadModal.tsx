import React, { useState } from 'react';
import { Download, FileImage, Image as ImageIcon, X, Check } from 'lucide-react';
import { AppCard } from './ui/AppCard';
import { AppButton } from './ui/AppButton';

interface ClientDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  count: number;
  onConfirm: (format: 'original' | 'webp') => void;
}

export const ClientDownloadModal: React.FC<ClientDownloadModalProps> = ({
  isOpen,
  onClose,
  count,
  onConfirm
}) => {
  const [format, setFormat] = useState<'original' | 'webp'>('original');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm animate-in zoom-in-95 duration-200">
        <AppCard className="shadow-2xl border border-white/10 bg-surface/95 backdrop-blur-xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Download className="w-5 h-5 text-accent-DEFAULT" /> Download Photos
            </h3>
            <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You are about to download <strong className="text-foreground">{count}</strong> photo{count !== 1 ? 's' : ''}.
              Please select your preferred format.
            </p>

            <div className="grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={() => setFormat('original')}
                className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                  format === 'original' 
                    ? 'border-accent-DEFAULT bg-accent/5 ring-1 ring-accent-DEFAULT' 
                    : 'border-border hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${format === 'original' ? 'bg-accent/20 text-accent-DEFAULT' : 'bg-muted text-muted-foreground'}`}>
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold">Original Quality</div>
                    <div className="text-xs text-muted-foreground">High-res JPG (Best for printing)</div>
                  </div>
                </div>
                {format === 'original' && <Check className="w-5 h-5 text-accent-DEFAULT" />}
              </button>

              <button
                type="button"
                onClick={() => setFormat('webp')}
                className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                  format === 'webp' 
                    ? 'border-accent-DEFAULT bg-accent/5 ring-1 ring-accent-DEFAULT' 
                    : 'border-border hover:bg-muted/50'
                }`}
              >
                 <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${format === 'webp' ? 'bg-accent/20 text-accent-DEFAULT' : 'bg-muted text-muted-foreground'}`}>
                    <FileImage className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold">Web Optimized</div>
                    <div className="text-xs text-muted-foreground">WebP Format (Faster, smaller size)</div>
                  </div>
                </div>
                {format === 'webp' && <Check className="w-5 h-5 text-accent-DEFAULT" />}
              </button>
            </div>

            <div className="pt-4 flex gap-3">
              <AppButton variant="ghost" fullWidth onClick={onClose}>Cancel</AppButton>
              <AppButton variant="primary" fullWidth onClick={() => onConfirm(format)}>
                Start Download
              </AppButton>
            </div>
          </div>
        </AppCard>
      </div>
    </div>
  );
};