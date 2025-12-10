
import React, { useState } from 'react';
import { Mail, User } from 'lucide-react';
import { AppInput } from './ui/AppInput';
import { AppButton } from './ui/AppButton';
import { AppCard } from './ui/AppCard';

interface ClientEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (email: string) => void;
}

export const ClientEmailModal: React.FC<ClientEmailModalProps> = ({
  isOpen,
  onClose,
  onConfirm
}) => {
  const [email, setEmail] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      onConfirm(email);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm animate-in zoom-in-95 duration-200">
        <AppCard className="shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-6 h-6 text-accent-DEFAULT" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Client Identity</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Enter an email to simulate a specific client favoring photos.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AppInput 
              leftIcon={Mail}
              type="email"
              placeholder="client@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              required
            />
            
            <div className="flex gap-3 pt-2">
              <AppButton variant="ghost" fullWidth onClick={onClose} type="button">
                Cancel
              </AppButton>
              <AppButton variant="primary" fullWidth type="submit" disabled={!email}>
                Continue
              </AppButton>
            </div>
          </form>
        </AppCard>
      </div>
    </div>
  );
};
