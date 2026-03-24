import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { SessionPreset } from '@/lib/presets/types';

interface DeleteConfirmDialogProps {
  preset: SessionPreset;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  preset,
  isOpen,
  onClose,
  onConfirm,
  isDeleting = false,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  // Focus trap and escape key handling
  useEffect(() => {
    if (!isOpen) return;

    // Focus the cancel button when dialog opens
    cancelButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  // Prevent body scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => !isDeleting && onClose()}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
        className={cn(
          'relative w-full max-w-sm',
          'bg-gray-800 rounded-xl border border-gray-700 shadow-2xl',
          'p-6',
          'transition-all duration-150 ease-out',
          'opacity-100 scale-100'
        )}
      >
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
            <span className="text-2xl">🗑️</span>
          </div>
        </div>

        {/* Title */}
        <h2
          id="delete-dialog-title"
          className="text-lg font-semibold text-gray-100 text-center mb-2"
        >
          Delete "{preset.name}"?
        </h2>

        {/* Description */}
        <p
          id="delete-dialog-description"
          className="text-sm text-gray-400 text-center mb-6"
        >
          This preset will be permanently removed.
          <br />
          This action cannot be undone.
        </p>

        {/* Actions */}
        <div className="space-y-2">
          {/* Delete Button */}
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className={cn(
              'w-full py-2.5 px-4 rounded-lg font-medium',
              'transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800',
              isDeleting
                ? 'bg-red-500/50 text-red-200 cursor-not-allowed'
                : 'bg-red-500 text-white hover:bg-red-600'
            )}
          >
            {isDeleting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span>
                Deleting...
              </span>
            ) : (
              'Delete'
            )}
          </button>

          {/* Cancel Button */}
          <button
            ref={cancelButtonRef}
            onClick={onClose}
            disabled={isDeleting}
            className={cn(
              'w-full py-2.5 px-4 rounded-lg font-medium',
              'bg-gray-700 text-gray-200',
              'transition-colors duration-150',
              'hover:bg-gray-600',
              'focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800',
              isDeleting && 'opacity-50 cursor-not-allowed'
            )}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
