
import React, { useRef, useState, useEffect } from 'react';
import { AlbumSpread, PrintSpecs, Photo, DesignElement } from '../../types';
import { MessageSquare, Check, X, Move, Plus } from 'lucide-react';
import { DesignerTool } from './AlbumDesigner';

interface SpreadCanvasProps {
  spread: AlbumSpread;
  specs: PrintSpecs;
  allPhotos: Photo[];
  isProofing: boolean;
  onDrop: (e: React.DragEvent) => void;
  selectedElementIds: Set<string>;
  onSelectElements: (ids: Set<string>) => void;
  onUpdateElement: (id: string, updates: Partial<DesignElement>) => void;
  onAddComment?: (x: number, y: number) => void;
  onResolveComment?: (commentId: string) => void;
  onInteractionStart?: () => void;
  onAddText?: (x: number, y: number) => void;
  activeTool?: DesignerTool;
  globalStyles?: { fontFamily: string; spacing: number; backgroundColor: string; };
  snapEnabled?: boolean;
  showGuides?: boolean;
  showGrid?: boolean;
  type?: 'spread' | 'cover';
}

export const SpreadCanvas: React.FC<SpreadCanvasProps> = ({
  spread,
  specs,
  allPhotos,
  isProofing,
  onDrop,
  selectedElementIds,
  onSelectElements,
  onUpdateElement,
  onAddComment,
  onResolveComment,
  onInteractionStart,
  onAddText,
  activeTool = 'pointer',
  globalStyles,
  snapEnabled = true,
  showGuides = true,
  showGrid = false,
  type = 'spread'
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Interaction State
  const [interaction, setInteraction] = useState<{
    type: 'move' | 'resize' | 'pan' | 'box-select';
    elementIds: string[]; // Support moving multiple
    handle?: string;
    startX: number;
    startY: number;
    initialData: Record<string, { x: number, y: number, w: number, h: number, imgX: number, imgY: number }>;
  } | null>(null);

  // Snap Lines State
  const [snapLines, setSnapLines] = useState<{ x?: number, y?: number }>({});

  // Selection Box State
  const [selectionBox, setSelectionBox] = useState<{ x: number, y: number, w: number, h: number } | null>(null);

  const aspectRatio = (specs.width * 2) / specs.height;

  // --- Helpers ---
  
  const getClientCoords = (e: MouseEvent | React.MouseEvent) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      return { x, y, pxX: e.clientX, pxY: e.clientY };
  };

  // --- Interaction Logic ---

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
        if (!interaction || !canvasRef.current) return;
        
        const { x: curX, y: curY, pxX, pxY } = getClientCoords(e);
        const deltaX = curX - ((interaction.startX - canvasRef.current.getBoundingClientRect().left) / canvasRef.current.getBoundingClientRect().width * 100);
        const deltaY = curY - ((interaction.startY - canvasRef.current.getBoundingClientRect().top) / canvasRef.current.getBoundingClientRect().height * 100);

        // Box Selection Logic
        if (interaction.type === 'box-select') {
             const startRelX = ((interaction.startX - canvasRef.current.getBoundingClientRect().left) / canvasRef.current.getBoundingClientRect().width * 100);
             const startRelY = ((interaction.startY - canvasRef.current.getBoundingClientRect().top) / canvasRef.current.getBoundingClientRect().height * 100);
             
             const x = Math.min(curX, startRelX);
             const y = Math.min(curY, startRelY);
             const w = Math.abs(curX - startRelX);
             const h = Math.abs(curY - startRelY);
             
             setSelectionBox({ x, y, w, h });
             
             // Find intersected elements
             const newSelection = new Set<string>();
             spread.elements.forEach(el => {
                 if (el.x < x + w && el.x + el.width > x && el.y < y + h && el.y + el.height > y) {
                     newSelection.add(el.id);
                 }
             });
             onSelectElements(newSelection);
             return;
        }

        // Element Manipulation Logic
        let snapX: number | undefined;
        let snapY: number | undefined;

        interaction.elementIds.forEach(id => {
            const init = interaction.initialData[id];
            
            if (interaction.type === 'move') {
                let newX = init.x + deltaX;
                let newY = init.y + deltaY;

                // Snapping Logic
                if (snapEnabled && interaction.elementIds.length === 1) {
                    const threshold = 1;
                    
                    if (Math.abs(newX + (init.w / 2) - 50) < threshold) { newX = 50 - (init.w / 2); snapX = 50; }
                    if (Math.abs(newY + (init.h / 2) - 50) < threshold) { newY = 50 - (init.h / 2); snapY = 50; }
                    
                    if (Math.abs(newX) < threshold) { newX = 0; snapX = 0; }
                    if (Math.abs(newX + init.w - 100) < threshold) { newX = 100 - init.w; snapX = 100; }
                    if (Math.abs(newY) < threshold) { newY = 0; snapY = 0; }
                    if (Math.abs(newY + init.h - 100) < threshold) { newY = 100 - init.h; snapY = 100; }
                }

                onUpdateElement(id, { x: Number(newX.toFixed(2)), y: Number(newY.toFixed(2)) });
            } 
            else if (interaction.type === 'resize' && interaction.handle) {
                let newW = init.w;
                let newH = init.h;
                let newX = init.x;
                let newY = init.y;

                if (interaction.handle.includes('e')) newW = Math.max(1, init.w + deltaX);
                if (interaction.handle.includes('s')) newH = Math.max(1, init.h + deltaY);
                if (interaction.handle.includes('w')) {
                    const d = Math.min(deltaX, init.w - 1);
                    newW = init.w - d;
                    newX = init.x + d;
                }
                if (interaction.handle.includes('n')) {
                    const d = Math.min(deltaY, init.h - 1);
                    newH = init.h - d;
                    newY = init.y + d;
                }
                
                onUpdateElement(id, { x: Number(newX.toFixed(2)), y: Number(newY.toFixed(2)), width: Number(newW.toFixed(2)), height: Number(newH.toFixed(2)) });
            }
            else if (interaction.type === 'pan') {
                const pxDeltaX = pxX - interaction.startX;
                const pxDeltaY = pxY - interaction.startY;
                const element = spread.elements.find(e=>e.id===id);
                if(element) {
                    const currentTransform = element.imageTransform || { x: 0, y: 0, scale: 1 };
                    onUpdateElement(id, { imageTransform: { ...currentTransform, x: init.imgX + pxDeltaX, y: init.imgY + pxDeltaY } });
                }
            }
        });
        
        setSnapLines({ x: snapX, y: snapY });
    };
    
    const handleMouseUp = () => {
        setInteraction(null);
        setSelectionBox(null);
        setSnapLines({});
    };

    if (interaction) {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [interaction, onUpdateElement, spread.elements, snapEnabled]);

  // Image Zoom via Wheel (when Crop tool active)
  const handleWheel = (e: React.WheelEvent, el: DesignElement) => {
      if (activeTool !== 'crop' || el.type !== 'photo') return;
      e.stopPropagation();
      e.preventDefault();

      const currentScale = el.imageTransform?.scale || 1;
      // Scroll Up (negative deltaY) -> Zoom In
      const newScale = Math.min(Math.max(1, currentScale - (e.deltaY * 0.001 * 5)), 5); 
      
      const currentTransform = el.imageTransform || { x: 0, y: 0 };
      onUpdateElement(el.id, { imageTransform: { ...currentTransform, scale: Number(newScale.toFixed(2)) } });
  };

  const startInteraction = (e: React.MouseEvent, type: 'move' | 'resize' | 'pan', id: string, handle?: string) => {
      if (isProofing || activeTool === 'text') return;
      e.stopPropagation(); 
      e.preventDefault(); 
      
      const element = spread.elements.find(el => el.id === id);

      // Auto-switch to Pan if Crop tool is active on a photo
      if (activeTool === 'crop' && type === 'move') {
          if (element?.type === 'photo') {
              type = 'pan';
          } else {
              return; // Crop tool doesn't affect non-photos
          }
      }

      // Notify parent to save history snapshot
      // Allow history for crop tool (pan operations) as well
      if (!isProofing) {
         onInteractionStart?.();
      }

      const newSelection = new Set(selectedElementIds);
      
      if (e.shiftKey) {
          if (newSelection.has(id)) {
              newSelection.delete(id);
          } else {
              newSelection.add(id);
          }
      } else {
          if (!newSelection.has(id)) {
              newSelection.clear();
              newSelection.add(id);
          }
      }
      onSelectElements(newSelection);

      // Only start interaction if the item is selected
      if (newSelection.has(id)) {
          const initialData: any = {};
          spread.elements.forEach(el => {
              if (newSelection.has(el.id)) {
                  initialData[el.id] = {
                      x: el.x, y: el.y, w: el.width, h: el.height,
                      imgX: el.imageTransform?.x || 0,
                      imgY: el.imageTransform?.y || 0
                  };
              }
          });

          setInteraction({
              type,
              elementIds: Array.from(newSelection),
              handle,
              startX: e.clientX,
              startY: e.clientY,
              initialData
          });
      }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
      if (isProofing) {
          if (onAddComment) {
              const { x, y } = getClientCoords(e);
              onAddComment(x, y);
          }
          return;
      }
      
      // Text Tool: Click to Place
      if (activeTool === 'text') {
          e.stopPropagation(); // Stop bubbling to prevent deselect logic in parent if any
          const { x, y } = getClientCoords(e);
          onAddText?.(x, y);
          return;
      }

      onSelectElements(new Set()); // Clear selection
      setInteraction({
          type: 'box-select',
          elementIds: [],
          startX: e.clientX,
          startY: e.clientY,
          initialData: {}
      });
  };

  return (
    <div className={`relative h-full w-full flex items-center justify-center bg-transparent select-none ${activeTool === 'text' ? 'cursor-text' : 'cursor-default'}`}>
        
        <div 
            ref={canvasRef}
            className="bg-white shadow-2xl relative overflow-hidden"
            style={{ 
                aspectRatio: `${aspectRatio}`,
                height: '100%', 
                width: 'auto',
                maxWidth: '100%',
                backgroundImage: spread.background?.startsWith('http') ? `url(${spread.background})` : undefined,
                backgroundColor: spread.background || '#fff'
            }}
            onDrop={isProofing ? undefined : onDrop}
            onDragOver={(e) => e.preventDefault()}
            onMouseDown={handleMouseDown}
        >
            {/* Grid Overlay */}
            {showGrid && !isProofing && (
                <div className="absolute inset-0 z-0 pointer-events-none" style={{ 
                    backgroundImage: `linear-gradient(to right, #ddd 1px, transparent 1px), linear-gradient(to bottom, #ddd 1px, transparent 1px)`,
                    backgroundSize: '5% 5%' 
                }} />
            )}

            {/* Safe Zone / Bleed Guides */}
            {showGuides && !isProofing && (
                <>
                    {/* Bleed (Red) */}
                    <div className="absolute inset-0 border border-red-400 opacity-50 pointer-events-none z-50 mix-blend-multiply" title="Bleed Line">
                        <div className="absolute top-0 right-0 bg-red-500 text-white text-[8px] px-1">BLEED</div>
                    </div>
                    {/* Safe Zone (Green Dashed) */}
                    <div className="absolute top-[5%] bottom-[5%] left-[5%] right-[5%] border border-dashed border-green-500 opacity-30 pointer-events-none z-50 mix-blend-multiply" title="Safe Zone">
                        <div className="absolute bottom-0 right-0 bg-green-500 text-white text-[8px] px-1">SAFE</div>
                    </div>
                    {/* Spine (Center) - If Spread */}
                    {type === 'spread' && (
                        <div className="absolute inset-y-0 left-1/2 w-px border-l border-dashed border-gray-400 pointer-events-none z-0" />
                    )}
                    {/* Cover Spine - If Cover */}
                    {type === 'cover' && (
                        <>
                            <div className="absolute inset-y-0 left-1/2 -ml-2 w-4 border-x border-dashed border-blue-400 pointer-events-none z-50 bg-blue-400/10" title="Spine Area" />
                            <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[9px] text-blue-500 font-bold uppercase tracking-wider bg-white/80 px-1 rounded">Spine</div>
                        </>
                    )}
                </>
            )}
            
            {/* Snap Lines */}
            {snapLines.x !== undefined && <div className="absolute inset-y-0 w-px bg-red-500 z-50" style={{ left: `${snapLines.x}%` }} />}
            {snapLines.y !== undefined && <div className="absolute inset-x-0 h-px bg-red-500 z-50" style={{ top: `${snapLines.y}%` }} />}

            {/* Elements */}
            {spread.elements.map(el => {
                const photo = el.type === 'photo' ? allPhotos.find(p => p.id === el.photoId) : null;
                const isSelected = selectedElementIds.has(el.id);
                
                // Determine cursor based on tool and element type
                let cursor = 'move';
                if (activeTool === 'text') cursor = 'text';
                else if (activeTool === 'crop' && el.type === 'photo') cursor = interaction?.type === 'pan' ? 'grabbing' : 'grab';

                return (
                    <div
                        key={el.id}
                        className={`absolute overflow-visible group ${isSelected ? 'z-30' : 'z-10'}`}
                        style={{
                            left: `${el.x}%`, top: `${el.y}%`, width: `${el.width}%`, height: `${el.height}%`,
                            transform: `rotate(${el.rotation}deg)`, zIndex: el.zIndex
                        }}
                        onMouseDown={(e) => startInteraction(e, 'move', el.id)}
                        onWheel={(e) => handleWheel(e, el)}
                    >
                         <div 
                            className={`w-full h-full overflow-hidden transition-shadow duration-100 ${isSelected ? 'ring-2 ring-red-500 shadow-xl' : 'hover:ring-1 hover:ring-red-300'}`}
                            style={{
                                opacity: el.style?.opacity,
                                borderRadius: el.style?.borderRadius ? `${el.style.borderRadius}px` : 0,
                                borderWidth: el.style?.borderWidth ? `${el.style.borderWidth}px` : 0,
                                borderColor: el.style?.borderColor || 'transparent',
                                borderStyle: 'solid',
                                boxShadow: el.style?.shadow ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)' : 'none',
                                cursor,
                                filter: el.filters ? `grayscale(${el.filters.grayscale}%) sepia(${el.filters.sepia}%)` : 'none'
                            }}
                         >
                            {el.type === 'photo' && photo ? (
                                <img 
                                    src={photo.url} 
                                    className="w-full h-full object-cover pointer-events-none select-none" 
                                    alt="" 
                                    style={{
                                        transform: el.imageTransform ? `translate(${el.imageTransform.x}px, ${el.imageTransform.y}px) scale(${el.imageTransform.scale})` : 'none',
                                        transformOrigin: 'center center'
                                    }}
                                />
                            ) : el.type === 'text' ? (
                                <div 
                                    className="w-full h-full flex items-center justify-center text-center select-none p-1 break-words whitespace-pre-wrap"
                                    style={{
                                        fontFamily: el.style?.fontFamily || globalStyles?.fontFamily || 'sans-serif',
                                        fontSize: el.style?.fontSize ? `${el.style.fontSize}px` : '16px',
                                        fontWeight: el.style?.fontWeight === 'bold' ? 'bold' : 'normal',
                                        fontStyle: el.style?.fontStyle === 'italic' ? 'italic' : 'normal',
                                        color: el.style?.color,
                                        textAlign: el.style?.textAlign || 'center',
                                        letterSpacing: el.style?.letterSpacing ? `${el.style.letterSpacing}em` : 'normal',
                                    }}
                                >
                                    {el.text}
                                </div>
                            ) : null}
                        </div>

                        {/* Handles - Hidden in crop/text mode */}
                        {!isProofing && isSelected && activeTool === 'pointer' && (
                            <>
                                <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border border-red-500 rounded-full cursor-nw-resize z-50" onMouseDown={(e) => startInteraction(e, 'resize', el.id, 'nw')} />
                                <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border border-red-500 rounded-full cursor-ne-resize z-50" onMouseDown={(e) => startInteraction(e, 'resize', el.id, 'ne')} />
                                <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border border-red-500 rounded-full cursor-sw-resize z-50" onMouseDown={(e) => startInteraction(e, 'resize', el.id, 'sw')} />
                                <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border border-red-500 rounded-full cursor-se-resize z-50" onMouseDown={(e) => startInteraction(e, 'resize', el.id, 'se')} />
                            </>
                        )}
                        
                        {/* Crop Mode Overlay */}
                        {!isProofing && isSelected && activeTool === 'crop' && el.type === 'photo' && (
                            <div className="absolute inset-0 border-2 border-dashed border-white/50 pointer-events-none flex items-center justify-center">
                                <Move className="w-8 h-8 text-white drop-shadow-md opacity-50" />
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Comment Pins */}
            {isProofing && spread.comments?.map(comment => (
                <div 
                    key={comment.id}
                    className={`absolute w-8 h-8 -ml-4 -mt-8 flex items-center justify-center cursor-pointer z-[60] transition-transform hover:scale-110 ${comment.isResolved ? 'opacity-50' : 'opacity-100'}`}
                    style={{ left: `${comment.x}%`, top: `${comment.y}%` }}
                    onClick={(e) => { e.stopPropagation(); if (onResolveComment) onResolveComment(comment.id); }}
                    title={`${comment.author}: ${comment.text}`}
                >
                    <div className={`relative w-full h-full ${comment.isResolved ? 'text-green-600' : 'text-red-600'}`}>
                        <MessageSquare className="w-full h-full fill-current" />
                        <div className="absolute inset-0 flex items-center justify-center text-white pb-1">
                            {comment.isResolved ? <Check className="w-3 h-3" /> : <span className="text-[10px] font-bold">!</span>}
                        </div>
                    </div>
                </div>
            ))}

            {/* Selection Box Visual */}
            {selectionBox && (
                <div 
                    className="absolute border border-red-500 bg-red-500/10 pointer-events-none z-50"
                    style={{ left: `${selectionBox.x}%`, top: `${selectionBox.y}%`, width: `${selectionBox.w}%`, height: `${selectionBox.h}%` }}
                />
            )}
        </div>
    </div>
  );
};
