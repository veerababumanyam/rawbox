
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { X, Heart, Share2, Play, Pause, Volume2, Volume1, VolumeX, FastForward, Lock, Globe, Download, ChevronUp, ChevronDown, Scissors, Check, ZoomIn, ZoomOut, PlayCircle, StopCircle, Loader2, Info, Sparkles, FileText, Tag, Calendar, KeyRound, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Photo, AppLanguage, BrandingSettings } from '../types';
import { AppIconButton, AppButton } from './ui/AppButton';
import { AppBadge } from './ui/AppBadge';
import { WatermarkOverlay } from './Branding';
import { AccessCodeModal } from './AccessCodeModal';
import { getTranslations } from '../i18n/translations';

interface MediaViewerProps {
  items: Photo[];
  initialItemId: string;
  onClose: () => void;
  onUpdateItem: (id: string, updates: Partial<Photo>) => void;
  language: AppLanguage;
  onLanguageChange: (lang: AppLanguage) => void;
  currentUserEmail: string | null;
  onRequireAuth: () => void;
  onShare: (photo: Photo) => void;
  branding?: BrandingSettings;
  bypassLock?: boolean;
  allowDownloadGlobal?: boolean;
}




export const MediaViewer: React.FC<MediaViewerProps> = ({
  items,
  initialItemId,
  onClose,
  onUpdateItem,
  language,
  onLanguageChange,
  currentUserEmail,
  onRequireAuth,
  onShare,
  branding,
  bypassLock = false,
  allowDownloadGlobal = true
}) => {
  const [currentIndex, setCurrentIndex] = useState(items.findIndex(i => i.id === initialItemId));
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isSlideshowActive, setIsSlideshowActive] = useState(false);
  const [isMediaLoaded, setIsMediaLoaded] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);



  // Trimming State
  const [isTrimming, setIsTrimming] = useState(false);
  const [trimState, setTrimState] = useState<{ start: number; end: number; duration: number }>({ start: 0, end: 0, duration: 0 });
  const [draggingHandle, setDraggingHandle] = useState<'start' | 'end' | null>(null);
  const [currentTime, setCurrentTime] = useState(0);

  // Swipe State
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scrubberRef = useRef<HTMLDivElement>(null);
  const slideshowIntervalRef = useRef<number | null>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);

  // Memoize expensive computations
  const currentItem = useMemo(() => items[currentIndex], [items, currentIndex]);
  const t = useMemo(() => getTranslations(language, 'mediaViewer'), [language]);

  const isLikedByUser = useMemo(() =>
    currentUserEmail
      ? (currentItem.favoritedBy || []).includes(currentUserEmail)
      : currentItem.isFavorite,
    [currentUserEmail, currentItem.favoritedBy, currentItem.isFavorite]
  );

  // Check Access
  const isLocked = useMemo(
    () => !bypassLock && currentItem.privacy === 'private' && !currentItem.isUnlocked,
    [bypassLock, currentItem.privacy, currentItem.isUnlocked]
  );

  // Determine if download is allowed
  const canDownload = useMemo(
    () => (allowDownloadGlobal ?? true) && (currentItem.allowDownload !== false),
    [allowDownloadGlobal, currentItem.allowDownload]
  );

  // Common button styles
  const actionButtonClass = "p-3 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-all active:scale-90 focus:outline-none focus:ring-2 focus:ring-white";



  // --- Accessibility: Focus Trap ---
  useEffect(() => {
    if (!containerRef.current) return;
    if (firstFocusableRef.current) firstFocusableRef.current.focus();
    else containerRef.current.focus();

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        const focusableElements = containerRef.current?.querySelectorAll(
          'button:not([disabled]):not(.invisible), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusableElements || focusableElements.length === 0) return;

        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };
    const container = containerRef.current;
    container.addEventListener('keydown', handleTabKey);
    return () => container.removeEventListener('keydown', handleTabKey);
  }, [showControls, isTrimming]);

  // --- Performance: Preloading ---
  useEffect(() => {
    const preloadImage = (item: Photo) => {
      if (item.type === 'photo' && (!item.privacy || item.privacy === 'public' || item.isUnlocked || bypassLock)) {
        const img = new Image();
        img.src = item.url;
        img.decoding = 'async';
      }
    };
    const nextItem = items[(currentIndex + 1) % items.length];
    const prevItem = items[(currentIndex - 1 + items.length) % items.length];
    if (nextItem) preloadImage(nextItem);
    if (prevItem) preloadImage(prevItem);
  }, [currentIndex, items, bypassLock]);

  // --- Effects ---
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const resetControls = () => {
      if (isTrimming || showInfoPanel || isLocked) return;
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setShowControls(false), 3000);
    };
    window.addEventListener('mousemove', resetControls);
    window.addEventListener('touchstart', resetControls);
    window.addEventListener('keydown', resetControls);
    return () => {
      window.removeEventListener('mousemove', resetControls);
      window.removeEventListener('touchstart', resetControls);
      window.removeEventListener('keydown', resetControls);
      clearTimeout(timeout);
    };
  }, [isTrimming, showInfoPanel, isLocked]);

  useEffect(() => {
    setIsTrimming(false);
    setIsPlaying(true);
    setZoomLevel(1);
    setIsMediaLoaded(false);
    setShowUnlockModal(false);
  }, [currentIndex]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
      videoRef.current.muted = isMuted;
      videoRef.current.volume = volume;
    }
  }, [playbackSpeed, isMuted, volume]);

  useEffect(() => {
    if (videoRef.current && !isLocked) {
      if (isPlaying) videoRef.current.play().catch(() => setIsPlaying(false));
      else videoRef.current.pause();
    }
  }, [isPlaying, currentIndex, isLocked]);

  useEffect(() => {
    if (isSlideshowActive && !isLocked) {
      const duration = currentItem.type === 'video'
        ? (currentItem.duration ? (currentItem.duration * 1000) + 1000 : 5000)
        : 4000;
      slideshowIntervalRef.current = setTimeout(() => {
        handleNext();
      }, duration) as unknown as number;
    } else {
      if (slideshowIntervalRef.current) clearTimeout(slideshowIntervalRef.current);
    }
    return () => {
      if (slideshowIntervalRef.current) clearTimeout(slideshowIntervalRef.current);
    };
  }, [isSlideshowActive, currentIndex, currentItem, items.length, isLocked]);

  const handleNext = useCallback(() => {
    setCurrentIndex(prev => {
      if (prev < items.length - 1) return prev + 1;
      if (isSlideshowActive) return 0;
      return prev;
    });
  }, [items.length, isSlideshowActive]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  // Swipe Handlers
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrev();
    }
  };

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUserEmail) {
      onRequireAuth();
      return;
    }
    let newFavoritedBy = currentItem.favoritedBy ? [...currentItem.favoritedBy] : [];
    if (newFavoritedBy.includes(currentUserEmail)) {
      newFavoritedBy = newFavoritedBy.filter(e => e !== currentUserEmail);
    } else {
      newFavoritedBy.push(currentUserEmail);
    }
    onUpdateItem(currentItem.id, {
      isFavorite: newFavoritedBy.length > 0,
      favoritedBy: newFavoritedBy
    });
  };

  const togglePicked = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateItem(currentItem.id, { isPicked: !currentItem.isPicked });
  };

  const handleZoom = (e: React.MouseEvent, direction: 'in' | 'out') => {
    e.stopPropagation();
    setZoomLevel(prev => direction === 'in' ? Math.min(prev + 0.5, 3) : Math.max(prev - 0.5, 1));
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = currentItem.url;
    link.download = currentItem.title || `photo-${currentItem.id}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const time = videoRef.current.currentTime;
    setCurrentTime(time);
    const start = isTrimming ? trimState.start : (currentItem.trimStart || 0);
    const end = isTrimming ? trimState.end : (currentItem.trimEnd || videoRef.current.duration);
    if (end > 0 && time >= end && !isSlideshowActive) {
      videoRef.current.currentTime = start;
      if (isPlaying) videoRef.current.play();
    }
    if (start > 0 && time < start) videoRef.current.currentTime = start;
  };

  const handleSpeedChange = (e: React.MouseEvent) => {
    e.stopPropagation();
    const speeds = [0.5, 1, 1.5, 2];
    setPlaybackSpeed(speeds[(speeds.indexOf(playbackSpeed) + 1) % speeds.length]);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMuted) {
      setIsMuted(false);
      if (volume === 0) setVolume(1);
    } else {
      setIsMuted(true);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (newVol > 0 && isMuted) setIsMuted(false);
    else if (newVol === 0) setIsMuted(true);
  };

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return <VolumeX className="w-6 h-6" />;
    if (volume < 0.5) return <Volume1 className="w-6 h-6" />;
    return <Volume2 className="w-6 h-6" />;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isTrimming || isLocked) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') handleNext();
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') handlePrev();
    if (e.key === 'Escape') onClose();
    if (e.key === 'i') setShowInfoPanel(!showInfoPanel);
    if (e.key === ' ' && !['INPUT', 'BUTTON'].includes((e.target as HTMLElement).tagName)) {
      e.preventDefault();
      setIsPlaying(!isPlaying);
    }
  };

  const startTrimmingMode = () => {
    if (videoRef.current) {
      const duration = videoRef.current.duration;
      setTrimState({
        duration,
        start: currentItem.trimStart || 0,
        end: currentItem.trimEnd || duration
      });
      setIsTrimming(true);
      setShowControls(true);
      setIsSlideshowActive(false);
      if (videoRef.current.paused) setIsPlaying(true);
    }
  };

  const saveTrim = () => {
    onUpdateItem(currentItem.id, { trimStart: trimState.start, trimEnd: trimState.end });
    setIsTrimming(false);
  };

  const cancelTrim = () => {
    setIsTrimming(false);
    if (videoRef.current) videoRef.current.currentTime = currentItem.trimStart || 0;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePointerDown = (e: React.PointerEvent, handle: 'start' | 'end') => {
    e.stopPropagation(); e.preventDefault(); setDraggingHandle(handle); (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingHandle || !scrubberRef.current) return;
    e.stopPropagation();
    const rect = scrubberRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = percentage * trimState.duration;
    if (draggingHandle === 'start') {
      const newStart = Math.min(newTime, trimState.end - 1);
      setTrimState(prev => ({ ...prev, start: newStart }));
      if (videoRef.current) videoRef.current.currentTime = newStart;
    } else {
      const newEnd = Math.max(newTime, trimState.start + 1);
      setTrimState(prev => ({ ...prev, end: newEnd }));
      if (videoRef.current) videoRef.current.currentTime = newEnd;
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setDraggingHandle(null); (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  if (!currentItem) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[150] bg-black text-white flex flex-col outline-none touch-none"
      onKeyDown={handleKeyDown}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
    >
      <div className="sr-only" aria-live="polite">
        {`Showing item ${currentIndex + 1} of ${items.length}: ${currentItem.title || 'Untitled'}`}
      </div>

      <AccessCodeModal
        isOpen={showUnlockModal}
        onClose={() => setShowUnlockModal(false)}
        targetName={currentItem.title || "Private Media"}
        correctCode={currentItem.accessCode}
        onSuccess={() => onUpdateItem(currentItem.id, { isUnlocked: true })}
      />

      {/* --- Top Bar --- */}
      <div className={`absolute top-0 left-0 right-0 z-20 p-4 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent transition-all duration-300 ${showControls || showInfoPanel || isLocked ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
        <div className="flex items-center gap-4">
          {!isTrimming && <AppIconButton ref={firstFocusableRef} icon={X} onClick={onClose} aria-label={t.close} className="text-white hover:bg-white/20" />}
          <div>
            <h2 id="media-title" className="font-semibold text-sm drop-shadow-md flex items-center gap-2">
              {currentItem.title || 'Untitled'}
              {currentItem.privacy === 'private' && <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] flex items-center gap-1 backdrop-blur-sm"><Lock className="w-3 h-3" /> {t.private}</span>}
            </h2>
            <p className="text-xs text-white/70 drop-shadow-md">{currentIndex + 1} / {items.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isTrimming && !isLocked && (
            <button onClick={() => setIsSlideshowActive(!isSlideshowActive)} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all backdrop-blur-md border ${isSlideshowActive ? 'bg-accent-DEFAULT text-white border-accent-DEFAULT' : 'bg-black/40 text-white border-white/20 hover:bg-white/10'}`}>
              {isSlideshowActive ? <><StopCircle className="w-4 h-4" /> <span className="hidden sm:inline">{t.stopSlideshow}</span></> : <><PlayCircle className="w-4 h-4" /> <span className="hidden sm:inline">{t.slideshow}</span></>}
            </button>
          )}
          {!isTrimming && !isLocked && (
            <div className="relative group">
              <button className="p-2 rounded-full hover:bg-white/20 transition-colors"><Globe className="w-5 h-5" /></button>
              <div className="absolute right-0 top-full mt-2 w-32 bg-surface text-foreground rounded-lg shadow-xl overflow-hidden hidden group-hover:block border border-border">
                {(['en', 'hi', 'te', 'ta', 'kn', 'ml'] as AppLanguage[]).map(lang => (
                  <button key={lang} onClick={() => onLanguageChange(lang)} className={`w-full text-left px-4 py-2 text-sm hover:bg-accent/10 ${language === lang ? 'bg-accent/5 font-bold text-accent-DEFAULT' : ''}`}>{lang.toUpperCase()}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- Main Content --- */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-black">
        {!isTrimming && !showInfoPanel && (
          <>
            <button
              className="absolute inset-y-0 left-0 w-1/4 z-10 cursor-w-resize opacity-0 hover:opacity-10 transition-opacity bg-gradient-to-r from-white/20 to-transparent border-0 bg-transparent flex items-center justify-start pl-4"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              aria-label={t.prev}
            >
              <ChevronLeft className="w-8 h-8 text-white drop-shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="sr-only">{t.prev}</span>
            </button>
            <button
              className="absolute inset-y-0 right-0 w-1/4 z-10 cursor-e-resize opacity-0 hover:opacity-10 transition-opacity bg-gradient-to-l from-white/20 to-transparent border-0 bg-transparent flex items-center justify-end pr-4"
              onClick={handleNext}
              disabled={currentIndex === items.length - 1}
              aria-label={t.next}
            >
              <ChevronRight className="w-8 h-8 text-white drop-shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="sr-only">{t.next}</span>
            </button>
          </>
        )}

        <div className={`relative w-full h-full max-w-md md:max-w-2xl mx-auto flex items-center justify-center transition-all duration-300 ${isTrimming ? 'pb-40' : ''}`}>
          {!isMediaLoaded && !isLocked && <div className="absolute inset-0 flex items-center justify-center z-0"><Loader2 className="w-10 h-10 text-white/50 animate-spin" /><span className="sr-only">{t.loading}</span></div>}

          {isLocked ? (
            <div className="flex flex-col items-center justify-center z-50 text-center p-6 animate-in zoom-in-95">
              <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 backdrop-blur-xl">
                <Lock className="w-10 h-10 text-white/60" />
              </div>
              <h3 className="text-2xl font-bold mb-2 text-white">Private Content</h3>
              <p className="text-white/60 mb-6 max-w-xs">This media is protected. Enter the access code to view it.</p>
              <AppButton variant="primary" size="lg" onClick={() => setShowUnlockModal(true)} leftIcon={KeyRound}>
                {t.unlock}
              </AppButton>
            </div>
          ) : currentItem.type === 'video' ? (
            <div className="relative w-full h-full">
              <video
                ref={videoRef}
                src={currentItem.videoUrl}
                poster={currentItem.thumbnailUrl}
                className={`w-full h-full object-contain ${!isMediaLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
                loop={!isTrimming}
                playsInline
                preload="metadata"
                muted={isMuted}
                onTimeUpdate={handleTimeUpdate}
                onLoadedData={() => setIsMediaLoaded(true)}
                onLoadedMetadata={(e) => {
                  if (currentItem.trimStart) e.currentTarget.currentTime = currentItem.trimStart;
                  setIsMediaLoaded(true);
                }}
                onClick={() => { if (!isTrimming) setIsPlaying(!isPlaying); }}
              />
              {!isPlaying && !isTrimming && <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20"><Play className="w-16 h-16 text-white/80 fill-white/80 drop-shadow-lg animate-in zoom-in duration-200" /></div>}
            </div>
          ) : (
            <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
              <img
                src={currentItem.url}
                // srcSet={generateSrcSet(currentItem, isLowBandwidth)} // Removed as it's for mock data
                sizes="100vw"
                alt={currentItem.description || currentItem.title}
                width={currentItem.width}
                height={currentItem.height}
                className={`max-w-full max-h-full object-contain transition-all duration-200 ease-out ${!isMediaLoaded ? 'opacity-0' : 'opacity-100'}`}
                style={{ transform: `scale(${zoomLevel})` }}
                onLoad={() => setIsMediaLoaded(true)}
                loading="eager"
                fetchPriority="high"
                decoding="async"
              />
              <WatermarkOverlay branding={branding} />
            </div>
          )}
        </div>

        {/* --- Right Action Bar --- */}
        {!isTrimming && !isLocked && (
          <div className={`absolute bottom-24 z-30 flex flex-col gap-5 items-center transition-all duration-300 ${showControls || showInfoPanel ? 'opacity-100 visible' : 'opacity-0 invisible'}`} style={{ right: showInfoPanel ? '22rem' : '1rem' }}>
            <div className="flex flex-col items-center gap-1 group">
              <button onClick={toggleFavorite} className={`${actionButtonClass} ${isLikedByUser ? 'text-error bg-white/10' : ''}`} aria-label={t.like} aria-pressed={isLikedByUser}>
                <Heart className={`w-7 h-7 ${isLikedByUser ? 'fill-current' : ''}`} strokeWidth={2} />
              </button>
              <span className="text-xs font-medium drop-shadow-md hidden sm:block">{t.like}</span>
            </div>
            {/* Pick / Selection for Photographer */}
            <div className="flex flex-col items-center gap-1 group">
              <button onClick={togglePicked} className={`${actionButtonClass} ${currentItem.isPicked ? 'text-white bg-success-DEFAULT' : ''}`} aria-label={t.pick} aria-pressed={currentItem.isPicked}>
                <CheckCircle2 className={`w-7 h-7 ${currentItem.isPicked ? 'fill-current' : ''}`} strokeWidth={2} />
              </button>
              <span className="text-xs font-medium drop-shadow-md hidden sm:block">{t.pick}</span>
            </div>

            <div className="flex flex-col items-center gap-1 group">
              <button onClick={() => setShowInfoPanel(!showInfoPanel)} className={`${actionButtonClass} ${showInfoPanel ? 'bg-white/20 text-accent-DEFAULT' : ''}`} aria-label={t.info} aria-pressed={showInfoPanel}>
                <Info className="w-6 h-6" />
              </button>
              <span className="text-xs font-medium drop-shadow-md hidden sm:block">{t.info}</span>
            </div>
            {currentItem.type === 'photo' && (
              <div className="flex flex-col items-center gap-1 group">
                <button onClick={(e) => handleZoom(e, zoomLevel > 1 ? 'out' : 'in')} className={actionButtonClass} aria-label={zoomLevel > 1 ? t.zoomOut : t.zoomIn}>
                  {zoomLevel > 1 ? <ZoomOut className="w-6 h-6" /> : <ZoomIn className="w-6 h-6" />}
                </button>
                <span className="text-xs font-medium drop-shadow-md hidden sm:block">{zoomLevel > 1 ? t.zoomOut : t.zoomIn}</span>
              </div>
            )}
            {currentItem.type === 'video' && (
              <>
                <div className="flex flex-col items-center gap-1 group">
                  <button onClick={handleSpeedChange} className={actionButtonClass} aria-label={`${t.speed}: ${playbackSpeed}x`}>
                    <FastForward className="w-6 h-6" />
                  </button>
                  <span className="text-xs font-medium drop-shadow-md hidden sm:block">{playbackSpeed}x</span>
                </div>
                <div className="flex flex-col items-center gap-1 group relative">
                  <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center bg-black/60 backdrop-blur-md rounded-lg p-3 animate-in fade-in slide-in-from-right-2 z-50" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-24 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-white"
                      aria-label="Volume"
                    />
                  </div>
                  <button onClick={toggleMute} className={actionButtonClass} aria-label={isMuted ? t.unmute : t.mute}>
                    {getVolumeIcon()}
                  </button>
                  <span className="text-xs font-medium drop-shadow-md hidden sm:block">{isMuted ? t.unmute : t.mute}</span>
                </div>
                <div className="flex flex-col items-center gap-1 group">
                  <button onClick={startTrimmingMode} className={actionButtonClass} aria-label={t.trim}>
                    <Scissors className="w-6 h-6" />
                  </button>
                  <span className="text-xs font-medium drop-shadow-md hidden sm:block">{t.trim}</span>
                </div>
              </>
            )}
            {canDownload && (
              <div className="flex flex-col items-center gap-1 group">
                <button onClick={handleDownload} className={actionButtonClass} aria-label={t.download}>
                  <Download className="w-6 h-6" />
                </button>
                <span className="text-xs font-medium drop-shadow-md hidden sm:block">{t.download}</span>
              </div>
            )}
            <div className="flex flex-col items-center gap-1 group">
              <button onClick={() => onShare(currentItem)} className={actionButtonClass} aria-label={t.share}>
                <Share2 className="w-6 h-6" />
              </button>
              <span className="text-xs font-medium drop-shadow-md hidden sm:block">{t.share}</span>
            </div>
          </div>
        )}

        {/* --- Navigation Buttons --- */}
        {!isTrimming && !showInfoPanel && !isLocked && (
          <div className={`absolute right-24 bottom-24 hidden md:flex flex-col gap-2 transition-opacity duration-300 ${showControls ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
            <button onClick={handlePrev} disabled={currentIndex === 0} className="p-2 bg-black/50 rounded-full hover:bg-black/70 disabled:opacity-30 transition-all focus:outline-none focus:ring-2 focus:ring-white"><ChevronUp className="w-6 h-6 text-white" /></button>
            <button onClick={handleNext} disabled={currentIndex === items.length - 1} className="p-2 bg-black/50 rounded-full hover:bg-black/70 disabled:opacity-30 transition-all focus:outline-none focus:ring-2 focus:ring-white"><ChevronDown className="w-6 h-6 text-white" /></button>
          </div>
        )}

        {/* --- Info Panel --- */}
        {showInfoPanel && !isLocked && (
          <div className="absolute top-0 right-0 bottom-0 w-full sm:w-80 bg-black/95 backdrop-blur-xl border-l border-white/10 z-40 p-6 overflow-y-auto animate-in slide-in-from-right duration-300 text-white shadow-2xl custom-scrollbar">
            <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
              <h2 className="text-xl font-bold flex items-center gap-2"><Info className="w-5 h-5 text-accent-DEFAULT" /> {t.details}</h2>
              <button onClick={() => setShowInfoPanel(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">{currentItem.title || 'Untitled'}</h3>
                {currentItem.description && <p className="text-sm text-white/70 leading-relaxed">{currentItem.description}</p>}
              </div>
              <section>
                <h3 className="text-xs font-bold text-accent-DEFAULT uppercase tracking-widest mb-3 flex items-center gap-2"><Sparkles className="w-3 h-3" /> AI Analysis</h3>
                <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-xl p-4 space-y-4 border border-white/10">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-white/40 mb-1.5">Generated Caption</p>
                    {currentItem.aiStatus === 'analyzing' ? (<div className="flex items-center gap-2 text-accent-DEFAULT text-sm italic animate-pulse"><Loader2 className="w-3 h-3 animate-spin" /> Analyzing...</div>) : currentItem.aiDescription ? (<p className="text-sm leading-relaxed italic text-white/90 border-l-2 border-accent-DEFAULT pl-3 py-0.5">"{currentItem.aiDescription}"</p>) : (<p className="text-sm text-white/40 italic">Analysis unavailable.</p>)}
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-white/40 mb-2 flex items-center gap-1"><Tag className="w-3 h-3" /> Smart Tags</p>
                    <div className="flex flex-wrap gap-2">{((currentItem.aiTags || []).concat(currentItem.tags || [])).length > 0 ? (Array.from(new Set((currentItem.aiTags || []).concat(currentItem.tags || []))).map((tag, i) => (<span key={`${tag}-${i}`} className="px-2.5 py-1 rounded-md bg-accent/10 text-accent-light border border-accent/20 text-xs font-medium hover:bg-accent/20 transition-colors cursor-default">#{tag}</span>))) : (<span className="text-sm text-white/40 italic">No tags detected.</span>)}</div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}

        {/* --- Trimming UI --- */}
        {isTrimming && !isLocked && (
          <div className="absolute bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-xl border-t border-border p-6 pb-8 z-40 animate-in slide-in-from-bottom-10 text-foreground">
            <div className="max-w-2xl mx-auto w-full space-y-4">
              <div className="flex items-center justify-center gap-6 pb-2">
                <button onClick={() => setIsPlaying(!isPlaying)} className="p-2 rounded-full hover:bg-muted transition-colors" aria-label={isPlaying ? "Pause" : "Play"}>{isPlaying ? <Pause className="w-6 h-6 fill-foreground" /> : <Play className="w-6 h-6 fill-foreground" />}</button>
                <div className="flex items-center gap-2"><button onClick={handleSpeedChange} className="text-xs font-bold border border-border rounded-md px-2 py-1 min-w-[3rem] hover:bg-muted transition-colors">{playbackSpeed}x</button><span className="text-xs text-muted-foreground">{t.speed}</span></div>
              </div>
              <div className="relative h-12 flex items-center select-none touch-none" ref={scrubberRef} role="slider" aria-label="Video Trimmer">
                <div className="absolute -top-6 left-0 text-[10px] font-mono text-muted-foreground">{formatTime(trimState.start)}</div>
                <div className="absolute -top-6 right-0 text-[10px] font-mono text-muted-foreground">{formatTime(trimState.end)}</div>
                <div className="absolute -top-6 text-[10px] font-mono font-bold text-accent-DEFAULT transform -translate-x-1/2" style={{ left: `${(currentTime / trimState.duration) * 100}%` }}>{formatTime(currentTime)}</div>
                <div className="absolute left-0 right-0 h-2 bg-muted rounded-full overflow-hidden"><div className="w-full h-full bg-foreground/5" /></div>
                <div className="absolute h-2 bg-accent-DEFAULT/30 rounded-full pointer-events-none" style={{ left: `${(trimState.start / trimState.duration) * 100}%`, width: `${((trimState.end - trimState.start) / trimState.duration) * 100}%` }} />
                <div className="absolute h-8 w-0.5 bg-foreground top-1/2 -translate-y-1/2 z-10 pointer-events-none" style={{ left: `${(currentTime / trimState.duration) * 100}%` }} />
                <div className="absolute w-6 h-8 bg-accent-DEFAULT rounded-md shadow-md cursor-ew-resize flex items-center justify-center z-20 group hover:scale-110 transition-transform touch-none" style={{ left: `calc(${(trimState.start / trimState.duration) * 100}% - 12px)` }} onPointerDown={(e) => handlePointerDown(e, 'start')} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} tabIndex={0}><div className="w-0.5 h-4 bg-white/50 rounded-full" /></div>
                <div className="absolute w-6 h-8 bg-accent-DEFAULT rounded-md shadow-md cursor-ew-resize flex items-center justify-center z-20 group hover:scale-110 transition-transform touch-none" style={{ left: `calc(${(trimState.end / trimState.duration) * 100}% - 12px)` }} onPointerDown={(e) => handlePointerDown(e, 'end')} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} tabIndex={0}><div className="w-0.5 h-4 bg-white/50 rounded-full" /></div>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-border mt-2">
                <AppButton variant="ghost" size="sm" onClick={cancelTrim} leftIcon={X}>{t.cancel}</AppButton>
                <span className="text-xs font-medium text-muted-foreground">Total: <span className="text-foreground">{formatTime(trimState.end - trimState.start)}</span></span>
                <AppButton variant="primary" size="sm" onClick={saveTrim} leftIcon={Check}>{t.save}</AppButton>
              </div>
            </div>
          </div>
        )}

        {!isTrimming && !showInfoPanel && !isLocked && (
          <div className={`p-4 pb-8 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
            <div className="max-w-2xl mx-auto w-full">
              <div className="flex items-end justify-between mb-3">
                <div className="flex-1 mr-12">
                  <h3 className="text-lg font-bold text-white mb-1 drop-shadow-md flex items-center gap-2">{currentItem.title || 'Untitled'}{currentItem.privacy === 'private' && <AppBadge size="sm" intent="accent" className="ml-2">Private</AppBadge>}</h3>
                  <p className="text-sm text-white/80 line-clamp-2 drop-shadow-md">{currentItem.description || 'No description available.'}</p>
                  {currentItem.tags && (<div className="flex flex-wrap gap-2 mt-2">{currentItem.tags.map(tag => (<span key={tag} className="text-xs font-medium text-white/90 bg-white/10 px-2 py-0.5 rounded-full backdrop-blur-sm">#{tag}</span>))}</div>)}
                </div>
              </div>
              {currentItem.type === 'video' && videoRef.current && (
                <div className="w-full h-1 bg-white/30 rounded-full overflow-hidden relative group cursor-pointer" onClick={(e) => { e.stopPropagation(); const rect = e.currentTarget.getBoundingClientRect(); if (videoRef.current) videoRef.current.currentTime = ((e.clientX - rect.left) / rect.width) * videoRef.current.duration; }}>
                  {currentItem.trimStart !== undefined && currentItem.trimEnd !== undefined && (<div className="absolute top-0 bottom-0 bg-white/20" style={{ left: `${(currentItem.trimStart / (videoRef.current?.duration || 1)) * 100}%`, width: `${((currentItem.trimEnd - currentItem.trimStart) / (videoRef.current?.duration || 1)) * 100}%` }} />)}
                  <div className="h-full bg-accent-DEFAULT relative transition-all duration-100 ease-linear" style={{ width: `${(currentTime / (videoRef.current?.duration || 1)) * 100}%` }}><div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-md scale-0 group-hover:scale-100 transition-transform" /></div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
