import React, { useState } from 'react';
import { Lock, KeyRound, X, AlertCircle } from 'lucide-react';
import { AppInput } from './ui/AppInput';
import { AppButton } from './ui/AppButton';
import { AppCard } from './ui/AppCard';

interface AccessCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  targetName?: string;
  correctCode?: string;
  onVerify?: (code: string) => boolean;
}

export const AccessCodeModal: React.FC<AccessCodeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  targetName = 'Item',
  correctCode,
  onVerify
}) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    let isValid = false;
    if (onVerify) {
        isValid = onVerify(code);
    } else {
        isValid = code === correctCode;
    }

    if (isValid) {
        onSuccess();
        onClose();
        setCode('');
    } else {
        setError('Incorrect access code. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-sm animate-in zoom-in-95 duration-200">
        <AppCard className="shadow-2xl border border-white/10 bg-surface/95 backdrop-blur-xl">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center mb-6 pt-2">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-accent/20">
              <Lock className="w-8 h-8 text-accent-DEFAULT" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Restricted Content</h2>
            <p className="text-sm text-muted-foreground mt-2 px-4">
              <span className="font-semibold text-foreground">{targetName}</span> is private. Please enter the exclusive access code to view it.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AppInput 
              leftIcon={KeyRound}
              type="text"
              placeholder="Enter Access Code"
              value={code}
              onChange={(e) => {
                  setCode(e.target.value);
                  setError('');
              }}
              autoFocus
              className="text-center font-mono tracking-widest text-lg"
              wrapperClassName="mx-auto max-w-[200px]"
            />
            
            {error && (
                <div className="flex items-center justify-center gap-2 text-xs text-destructive-DEFAULT bg-destructive-soft p-2 rounded-md">
                    <AlertCircle className="w-4 h-4" /> {error}
                </div>
            )}
            
            <div className="pt-2">
              <AppButton variant="primary" fullWidth type="submit" disabled={!code} className="h-11">
                Unlock Content
              </AppButton>
            </div>
          </form>
        </AppCard>
      </div>
    </div>
  );
};