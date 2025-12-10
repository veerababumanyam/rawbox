import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, FileImage, Trash2, Plus, CheckCircle2, FileVideo, Film, Folder, Check } from 'lucide-react';
import { AppButton, AppIconButton } from './ui/AppButton';
import { AppCard } from './ui/AppCard';
import { SubGallery } from '../types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (files: File[], subGalleryIds: string[], storageProvider: string) => Promise<void>;
  albumTitle: string;
  subGalleries?: SubGallery[];
  defaultSubGalleryId?: string | null;
  storageProviders: { id: string; name: string }[];
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  albumTitle,
  subGalleries,
  defaultSubGalleryId,
  storageProviders,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [targetSubGalleryIds, setTargetSubGalleryIds] = useState<string[]>(['']);
  const [storageProvider, setStorageProvider] = useState<string>(storageProviders[0]?.id || '');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  useEffect(() => {
    if (isOpen) {
      setFiles([]);
      setUploadProgress({});
      setIsUploading(false);
      // Default to the specific sub-gallery if provided, otherwise Root ('')
      setTargetSubGalleryIds(defaultSubGalleryId ? [defaultSubGalleryId] : ['']);
      dragCounter.current = 0;
      setIsDragging(false);
    }
  }, [isOpen, defaultSubGalleryId]);

  const toggleTarget = (id: string) => {
    setTargetSubGalleryIds(prev => {
        if (prev.includes(id)) {
            return prev.filter(x => x !== id);
        } else {
            return [...prev, id];
        }
    });
  };

  if (!isOpen) return null;

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from<File>(e.dataTransfer.files).filter(
        file => file.type.startsWith('image/') || file.type.startsWith('video/')
      );
      setFiles(prev => [...prev, ...droppedFiles]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from<File>(e.target.files).filter(
        file => file.type.startsWith('image/') || file.type.startsWith('video/')
      );
      setFiles(prev => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadClick = async () => {
    if (files.length === 0 || !storageProvider) return;
    
    const effectiveTargets = (subGalleries && subGalleries.length > 0) 
        ? targetSubGalleryIds 
        : [''];

    if (effectiveTargets.length === 0) return;

    setIsUploading(true);
    
    try {
      await onUpload(files, effectiveTargets, storageProvider);
      onClose();
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={!isUploading ? onClose : undefined}
      />

      {/* Modal Content */}
      <div className="relative bg-surface w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Upload Media</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Adding to <span className="font-medium text-foreground">{albumTitle}</span>
            </p>
          </div>
          {!isUploading && (
            <AppIconButton icon={X} aria-label="Close" onClick={onClose} />
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-2">Storage Provider</label>
            <AppSelect
              value={storageProvider}
              onChange={(e) => setStorageProvider(e.target.value)}
              disabled={isUploading}
            >
              {storageProviders.map(provider => (
                <option key={provider.id} value={provider.id}>{provider.name}</option>
              ))}
            </AppSelect>
            {storageProvider === '' && <p className="text-xs text-destructive mt-1">Please select a storage provider.</p>}
          </div>

          {subGalleries && subGalleries.length > 0 && !isUploading && (
               <div className="mb-6">
                   <label className="block text-sm font-medium text-foreground mb-2">Destination Folders</label>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[160px] overflow-y-auto p-1 border border-border rounded-lg bg-muted/10">
                       <button
                          type="button"
                          onClick={() => toggleTarget('')}
                          className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm transition-all ${targetSubGalleryIds.includes('') ? 'border-accent bg-accent/10 text-accent-DEFAULT font-medium' : 'border-transparent hover:bg-muted bg-surface'}`}
                       >
                           <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${targetSubGalleryIds.includes('') ? 'bg-accent border-accent text-white' : 'border-muted-foreground'}`}>
                               {targetSubGalleryIds.includes('') && <Check className="w-3 h-3" />}
                           </div>
                           <Folder className="w-4 h-4 text-muted-foreground" />
                           <span>Root Gallery</span>
                       </button>
                       {subGalleries.map(sg => (
                           <button
                              key={sg.id}
                              type="button"
                              onClick={() => toggleTarget(sg.id)}
                              className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm transition-all ${targetSubGalleryIds.includes(sg.id) ? 'border-accent bg-accent/10 text-accent-DEFAULT font-medium' : 'border-transparent hover:bg-muted bg-surface'}`}
                           >
                               <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${targetSubGalleryIds.includes(sg.id) ? 'bg-accent border-accent text-white' : 'border-muted-foreground'}`}>
                                   {targetSubGalleryIds.includes(sg.id) && <Check className="w-3 h-3" />}
                               </div>
                               <Folder className="w-4 h-4 text-muted-foreground" />
                               <span className="truncate">{sg.title}</span>
                           </button>
                       ))}
                   </div>
                   {targetSubGalleryIds.length === 0 && <p className="text-xs text-destructive mt-1">Please select at least one destination.</p>}
               </div>
          )}

          {files.length === 0 ? (
            <div
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-xl p-12
                flex flex-col items-center justify-center text-center cursor-pointer
                transition-all duration-200 relative overflow-hidden
                ${isDragging 
                  ? 'border-accent bg-accent/10 scale-[1.02] shadow-lg ring-4 ring-accent/10' 
                  : 'border-border hover:border-accent/50 hover:bg-muted/30'
                }
              `}
            >
              {isDragging && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/60 backdrop-blur-[2px] animate-in fade-in duration-200">
                    <div className="bg-accent text-white px-6 py-3 rounded-full font-bold shadow-xl flex items-center gap-2 transform scale-110">
                        <Upload className="w-5 h-5" />
                        <span>Drop files here</span>
                    </div>
                </div>
              )}

              <div className={`w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4 transition-transform duration-200 ${isDragging ? 'scale-110 bg-accent/20' : ''}`}>
                <Upload className={`w-8 h-8 ${isDragging ? 'text-accent' : 'text-muted-foreground'}`} />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-1">
                Drag & Drop photos or videos
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Supports JPG, PNG, MP4, MOV directly from camera roll
              </p>
              <AppButton variant="secondary" size="sm">
                Select Media
              </AppButton>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  {files.length} {files.length === 1 ? 'item' : 'items'} queued
                </span>
                <AppButton 
                  size="sm" 
                  variant="ghost" 
                  leftIcon={Plus}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  Add more
                </AppButton>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4"
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
              >
                {/* Visual feedback for drop when list is populated */}
                {isDragging && (
                    <div className="col-span-full border-2 border-dashed border-accent bg-accent/10 rounded-lg p-8 flex items-center justify-center animate-in fade-in">
                        <div className="text-accent font-semibold flex items-center gap-2">
                             <Plus className="w-5 h-5" /> Add to Queue
                        </div>
                    </div>
                )}

                {files.map((file, index) => {
                  const progress = uploadProgress[file.name] || 0;
                  const isDone = progress === 100;
                  const isVideo = file.type.startsWith('video/');

                  return (
                    <div key={`${file.name}-${index}`} className="group relative aspect-square bg-muted rounded-lg overflow-hidden border border-border">
                      {isVideo ? (
                         <div className="w-full h-full flex items-center justify-center bg-black/10">
                            <Film className="w-8 h-8 text-muted-foreground" />
                            <div className="absolute inset-0 bg-black/10" />
                         </div>
                      ) : (
                        <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className={`w-full h-full object-cover transition-opacity ${isUploading ? 'opacity-50' : ''}`}
                        />
                      )}
                      
                      {/* Video Indicator Badge */}
                      {isVideo && (
                          <div className="absolute top-2 left-2 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-sm">
                              VIDEO
                          </div>
                      )}

                      {/* Upload Status Overlay */}
                      {isUploading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-2 bg-black/20 backdrop-blur-[1px]">
                           {isDone ? (
                             <div className="bg-success-DEFAULT rounded-full p-1 shadow-lg animate-in zoom-in">
                                <CheckCircle2 className="w-6 h-6 text-white" />
                             </div>
                           ) : (
                             <div className="w-full max-w-[80%] text-center">
                               <div className="h-1.5 w-full bg-black/30 rounded-full overflow-hidden backdrop-blur-sm">
                                  <div 
                                    className="h-full bg-accent-DEFAULT transition-all duration-300 ease-out"
                                    style={{ width: `${progress}%` }}
                                  />
                               </div>
                               <p className="text-[10px] text-white font-medium mt-1 drop-shadow-md">
                                 {progress < 80 ? 'Optimizing Media...' : 'Syncing to Cloud...'}
                               </p>
                             </div>
                           )}
                        </div>
                      )}

                      {!isUploading && (
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => removeFile(index)}
                            className="bg-destructive text-white p-1.5 rounded-md hover:bg-destructive-hover shadow-sm transition-colors"
                            aria-label="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      
                      <div className="absolute bottom-0 inset-x-0 bg-black/60 p-2">
                        <p className="text-xs text-white truncate">{file.name}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            multiple
            accept="image/*,video/*"
          />
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-muted/10 flex justify-end gap-3">
          <AppButton 
            variant="ghost" 
            onClick={onClose} 
            disabled={isUploading}
          >
            Cancel
          </AppButton>
          <AppButton 
            variant="primary" 
            onClick={handleUploadClick}
            disabled={files.length === 0 || isUploading || (subGalleries && subGalleries.length > 0 && targetSubGalleryIds.length === 0)}
            loading={isUploading}
            leftIcon={Upload}
          >
            {isUploading ? 'Syncing Media...' : `Upload ${files.length} Items`}
          </AppButton>
        </div>
      </div>
    </div>
  );
};