
import React, { useState, useRef, useEffect } from 'react';
import { AppButton } from './AppButton';
import { ZoomIn, ZoomOut, Check, X, Move } from 'lucide-react';

interface ImageCropperProps {
  imageSrc: string;
  onCrop: (croppedImageBase64: string) => void;
  onCancel: () => void;
  aspectRatio?: number; // width / height, default 1
}

export const ImageCropper: React.FC<ImageCropperProps> = ({ imageSrc, onCrop, onCancel, aspectRatio = 1 }) => {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCrop = () => {
    if (!imageRef.current || !containerRef.current) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions to the container size (or a fixed high-res size)
    const size = 500; 
    canvas.width = size;
    canvas.height = size / aspectRatio;

    // Draw image with transformations
    // We need to map the CSS transforms (zoom/offset) to Canvas drawImage
    
    // For simplicity in this demo, we'll draw the visible area relative to the container
    // In a production app, you might calculate exact source/dest coordinates
    
    // Simple approach: Center the image and apply scale/translate
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const img = imageRef.current;
    
    // Calculate the scale factor between the displayed container and the target canvas
    const containerRect = containerRef.current.getBoundingClientRect();
    const scaleFactor = canvas.width / containerRect.width;

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.translate(offset.x * scaleFactor, offset.y * scaleFactor);
    ctx.scale(zoom, zoom);
    
    // Draw centered
    ctx.drawImage(
        img, 
        - (img.naturalWidth * scaleFactor * (containerRect.width / img.naturalWidth)) / 2, 
        - (img.naturalHeight * scaleFactor * (containerRect.width / img.naturalWidth)) / 2, 
        img.naturalWidth * scaleFactor * (containerRect.width / img.naturalWidth), 
        img.naturalHeight * scaleFactor * (containerRect.width / img.naturalWidth)
    );
    
    ctx.restore();

    onCrop(canvas.toDataURL('image/jpeg', 0.9));
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-surface w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-border flex justify-between items-center">
          <h3 className="font-semibold text-foreground">Adjust Photo</h3>
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 flex flex-col items-center gap-4 bg-muted/10">
          <div 
            ref={containerRef}
            className="relative w-64 h-64 bg-black rounded-full overflow-hidden cursor-move ring-4 ring-white shadow-lg"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ borderRadius: aspectRatio === 1 ? '50%' : '8px', aspectRatio: `${aspectRatio}` }}
          >
            <img 
              ref={imageRef}
              src={imageSrc} 
              alt="Crop target" 
              className="absolute max-w-none origin-center pointer-events-none select-none"
              style={{ 
                transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                left: '50%',
                top: '50%',
                width: '100%', // Initial fit
                height: 'auto'
              }}
              draggable={false}
            />
            
            {/* Grid overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-30">
                <div className="w-full h-full border border-white/50" />
                <div className="absolute top-1/3 left-0 right-0 h-px bg-white/50" />
                <div className="absolute top-2/3 left-0 right-0 h-px bg-white/50" />
                <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/50" />
                <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/50" />
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground flex items-center gap-1">
             <Move className="w-3 h-3" /> Drag to reposition
          </p>

          <div className="w-full max-w-xs space-y-2">
             <div className="flex justify-between text-xs text-muted-foreground">
                 <ZoomOut className="w-4 h-4" />
                 <span>Zoom</span>
                 <ZoomIn className="w-4 h-4" />
             </div>
             <input 
                type="range" 
                min="1" 
                max="3" 
                step="0.1" 
                value={zoom} 
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-accent-DEFAULT"
             />
          </div>
        </div>

        <div className="p-4 border-t border-border flex justify-end gap-3 bg-surface">
          <AppButton variant="ghost" onClick={onCancel}>Cancel</AppButton>
          <AppButton variant="primary" onClick={handleCrop} leftIcon={Check}>Apply Crop</AppButton>
        </div>
      </div>
    </div>
  );
};
