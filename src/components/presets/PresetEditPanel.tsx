import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { SessionPreset, SessionMode, MODE_INFO, DURATION_OPTIONS } from '@/lib/presets/types';
import { IconPicker } from './IconPicker';
import { ModeSelector } from './ModeSelector';
import { DurationSelector } from './DurationSelector';

interface PresetEditPanelProps {
  preset: SessionPreset;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: {
    id: string;
    name?: string;
    icon?: string;
    mode?: string;
    durationMinutes?: number;
    includeMentalPrep?: boolean;
  }) => Promise<void>;
  isSaving?: boolean;
}

export const PresetEditPanel: React.FC<PresetEditPanelProps> = ({
  preset,
  isOpen,
  onClose,
  onSave,
  isSaving = false,
}) => {
  // Form state
  const [name, setName] = useState(preset.name);
  const [icon, setIcon] = useState(preset.icon);
  const [mode, setMode] = useState<SessionMode>(preset.mode);
  const [duration, setDuration] = useState(preset.durationMinutes);
  const [includeMentalPrep, setIncludeMentalPrep] = useState(preset.includeMentalPrep);
  const [error, setError] = useState<string | null>(null);

  // Reset form when preset changes
  useEffect(() => {
    setName(preset.name);
    setIcon(preset.icon);
    setMode(preset.mode);
    setDuration(preset.durationMinutes);
    setIncludeMentalPrep(preset.includeMentalPrep);
    setError(null);
  }, [preset]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSaving) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSaving, onClose]);

  // Prevent body scroll
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

  // Check if form has changes
  const hasChanges =
    name !== preset.name ||
    icon !== preset.icon ||
    mode !== preset.mode ||
    duration !== preset.durationMinutes ||
    includeMentalPrep !== preset.includeMentalPrep;

  // Validate form
  const isValid = name.trim().length > 0;

  // Handle save
  const handleSave = async () => {
    if (!isValid || isSaving) return;

    setError(null);

    try {
      await onSave({
        id: preset.id,
        name: name.trim(),
        icon,
        mode,
        durationMinutes: duration,
        includeMentalPrep,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => !isSaving && onClose()}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-panel-title"
        className={cn(
          'relative w-full max-w-md max-h-[90vh]',
          'bg-gray-800 rounded-xl border border-gray-700 shadow-2xl',
          'flex flex-col',
          'transition-all duration-150 ease-out',
          'opacity-100 scale-100'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <button
            onClick={onClose}
            disabled={isSaving}
            className={cn(
              'p-2 -ml-2 text-gray-400 hover:text-gray-200 transition-colors',
              isSaving && 'opacity-50 cursor-not-allowed'
            )}
            aria-label="Close"
          >
            ← Back
          </button>
          <h2 id="edit-panel-title" className="text-lg font-semibold text-gray-100">
            Edit Preset
          </h2>
          <div className="w-16" />
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-4 space-y-6">
          {/* Name Input */}
          <div className="space-y-2">
            <label htmlFor="preset-name" className="block text-sm font-medium text-gray-300">
              Name
            </label>
            <input
              id="preset-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSaving}
              placeholder="Enter preset name"
              className={cn(
                'w-full px-3 py-2 rounded-lg',
                'bg-gray-700 border border-gray-600',
                'text-gray-100 placeholder-gray-500',
                'focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            />
          </div>

          {/* Icon Picker */}
          <IconPicker selectedIcon={icon} onSelect={setIcon} />

          {/* Mode Selector */}
          <ModeSelector
            selectedMode={mode}
            onSelect={setMode}
            disabled={isSaving}
          />

          {/* Duration Selector */}
          <DurationSelector
            duration={duration}
            onChange={setDuration}
            disabled={isSaving}
          />

          {/* Mental Prep Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="mental-prep" className="text-sm font-medium text-gray-300">
                Mental Preparation
              </label>
              <p className="text-xs text-gray-500">
                Show intention-setting screens before session
              </p>
            </div>
            <button
              id="mental-prep"
              type="button"
              role="switch"
              aria-checked={includeMentalPrep}
              onClick={() => setIncludeMentalPrep(!includeMentalPrep)}
              disabled={isSaving}
              className={cn(
                'relative w-11 h-6 rounded-full transition-colors duration-200',
                'focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-800',
                includeMentalPrep ? 'bg-cyan-500' : 'bg-gray-600',
                isSaving && 'opacity-50 cursor-not-allowed'
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow',
                  'transition-transform duration-200',
                  includeMentalPrep ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 space-y-2">
          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={!isValid || !hasChanges || isSaving}
            className={cn(
              'w-full py-2.5 px-4 rounded-lg font-medium text-white',
              'transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-800',
              isValid && hasChanges && !isSaving
                ? 'bg-cyan-500 hover:bg-cyan-600'
                : 'bg-gray-600 cursor-not-allowed opacity-50'
            )}
          >
            {isSaving ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span>
                Saving...
              </span>
            ) : (
              'Save Changes'
            )}
          </button>

          {/* Cancel Button */}
          <button
            onClick={onClose}
            disabled={isSaving}
            className={cn(
              'w-full py-2.5 px-4 rounded-lg font-medium',
              'bg-gray-700 text-gray-200',
              'transition-colors duration-150',
              'hover:bg-gray-600',
              'focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800',
              isSaving && 'opacity-50 cursor-not-allowed'
            )}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
