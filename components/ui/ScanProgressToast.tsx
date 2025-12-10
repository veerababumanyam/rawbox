import React, { useState } from 'react';
import { Loader2, X, Minimize2, Maximize2, CheckCircle2, ScanFace, AlertCircle } from 'lucide-react';
import { AppCard } from './AppCard';

interface ScanProgressToastProps {
  total: number;
  processed: number;
  foundCount: number;
  isScanning: boolean;
  onStop: () => void;
  onClose: () => void;
}

export const ScanProgressToast: React.FC<ScanProgressToastProps> = ({
  total,
  processed,
  foundCount,
  isScanning,
  onStop,
  onClose
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const percent = total > 0 ? Math.round((processed / total) * 100) : 0;
  const isComplete = processed >= total && total > 0;

  if (total === 0) return null;

  return (
    <div className={`fixed bottom-4 right-4 z-[200] transition-all duration-300 ease-in-out ${isMinimized ? 'w-auto' : 'w-80 md:w-96'}`}>
      <AppCard padding="none" className="shadow-2xl border-accent/20 bg-surface/95 backdrop-blur-md overflow-hidden">
        <div className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isComplete ? 'bg-success-soft text-success-DEFAULT' : 'bg-accent/10 text-accent-DEFAULT'}`}>
                {isComplete ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <ScanFace className={`w-5 h-5 ${isScanning ? 'animate-pulse' : ''}`} />
                )}
              </div>
              
              {!isMinimized && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    {isComplete ? 'Scan Complete' : isScanning ? 'Scanning Faces...' : 'Scan Paused'}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {isComplete 
                      ? `Found ${foundCount} people in ${total} photos.`
                      : `${processed} of ${total} photos analyzed`
                    }
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button 
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 text-muted-foreground hover:bg-muted rounded-md transition-colors"
                title={isMinimized ? "Expand" : "Minimize"}
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              
              {isComplete ? (
                <button 
                    onClick={onClose}
                    className="p-1.5 text-muted-foreground hover:bg-muted rounded-md transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
              ) : (
                <button 
                    onClick={onStop}
                    className="p-1.5 text-destructive-DEFAULT hover:bg-destructive-soft rounded-md transition-colors"
                    title="Stop Scanning"
                >
                    <div className="w-4 h-4 border-2 border-current rounded-sm flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-current rounded-[1px]" />
                    </div>
                </button>
              )}
            </div>
          </div>

          {!isMinimized && (
             <div className="mt-3 space-y-1.5">
                <div className="flex justify-between text-xs font-medium text-muted-foreground">
                    <span>Progress</span>
                    <span>{percent}%</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-300 ease-out ${isComplete ? 'bg-success-DEFAULT' : 'bg-accent-DEFAULT'}`}
                        style={{ width: `${percent}%` }} 
                    />
                </div>
                {foundCount > 0 && !isComplete && (
                     <p className="text-[10px] text-accent-DEFAULT pt-1 animate-in fade-in">
                        ✨ {foundCount} potential faces found so far
                     </p>
                )}
             </div>
          )}
        </div>
        
        {isMinimized && !isComplete && (
             <div className="h-1 w-full bg-muted">
                 <div 
                    className="h-full bg-accent-DEFAULT transition-all duration-300"
                    style={{ width: `${percent}%` }} 
                />
             </div>
        )}
      </AppCard>
    </div>
  );
};
