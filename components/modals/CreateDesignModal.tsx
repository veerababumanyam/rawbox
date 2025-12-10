import React, { useState } from 'react';
import { Album } from '../../types';
import { AppButton } from '../ui/AppButton';
import { AppInput } from '../ui/AppInput';
import { Book, X } from 'lucide-react';

interface CreateDesignModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (albumId: string, name: string) => void;
    albums: Album[];
}

/**
 * Modal for creating a new print album design
 * Allows user to select a gallery and name the design
 */
export const CreateDesignModal: React.FC<CreateDesignModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    albums
}) => {
    const [albumId, setAlbumId] = useState('');
    const [name, setName] = useState('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (albumId && name) {
            onConfirm(albumId, name);
            // Reset form
            setAlbumId('');
            setName('');
        }
    };

    const handleClose = () => {
        onClose();
        // Reset form on close
        setAlbumId('');
        setName('');
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={handleClose}
                role="presentation"
                aria-hidden="true"
            />
            <div
                className="relative bg-surface w-full max-w-md rounded-xl shadow-2xl p-6 animate-in zoom-in-95 duration-200"
                role="dialog"
                aria-modal="true"
                aria-labelledby="create-design-title"
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 id="create-design-title" className="text-xl font-semibold flex items-center gap-2">
                        <Book className="w-5 h-5 text-accent-DEFAULT" aria-hidden="true" />
                        New Album Design
                    </h3>
                    <button
                        onClick={handleClose}
                        aria-label="Close dialog"
                        type="button"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label htmlFor="gallery-select" className="block text-sm font-medium">
                            Link to Gallery
                        </label>
                        <select
                            id="gallery-select"
                            className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent-DEFAULT"
                            value={albumId}
                            onChange={(e) => setAlbumId(e.target.value)}
                        >
                            <option value="">Select a Gallery...</option>
                            {albums.map(a => (
                                <option key={a.id} value={a.id}>{a.title}</option>
                            ))}
                        </select>
                    </div>

                    <AppInput
                        label="Design Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Main Wedding Album"
                        autoFocus
                    />

                    <div className="pt-2 flex justify-end gap-3">
                        <AppButton variant="ghost" onClick={handleClose}>
                            Cancel
                        </AppButton>
                        <AppButton
                            variant="primary"
                            onClick={handleSubmit}
                            disabled={!albumId || !name}
                        >
                            Create Design
                        </AppButton>
                    </div>
                </div>
            </div>
        </div>
    );
};
