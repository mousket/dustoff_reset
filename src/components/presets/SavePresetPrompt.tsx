import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { SessionMode, PRESET_ICONS, MAX_USER_PRESETS } from '@/lib/presets/types';
import { IconPicker } from './IconPicker';
import { ConfigurationSummary } from './ConfigurationSummary';

interface SessionConfig {
  mode: SessionMode;
  durationMinutes: number;
  whitelistedApps: string[];
  whitelistedDomains: string[];
  useDefaultBlocklist: boolean;
}

interface SavePresetPromptProps {
  config: SessionConfig;
  skippedMentalPrep: boolean;
  onSaveAndStart: (name: string, icon: string, includeMentalPrep: boolean) => Promise<void>;
  onJustStart: () => void;
  onBack: () => void;
  canSave: boolean;
  presetCount: number;
  isSaving?: boolean;
}

export const SavePresetPrompt: React.FC<SavePresetPromptProps> = ({
  config,
  skippedMentalPrep,
  onSaveAndStart,
  onJustStart,
  onBack,
  canSave,
  presetCount,
  isSaving = false,
}) => {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🎯');
  const [error, setError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Focus name input on mount
  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  // Clear error when name changes
  useEffect(() => {
    if (error) setError(null);
  }, [name]);

  // Handle save and start
  const handleSaveAndStart = async () => {
    // Validate
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      setError('Please enter a name for your preset');
      nameInputRef.current?.focus();
      return;
    }

    if (trimmedName.length > 50) {
      setError('Name is too long (max 50 characters)');
      return;
    }

    try {
      // includeMentalPrep is false if user skipped, true if they completed
      await onSaveAndStart(trimmedName, icon, !skippedMentalPrep);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save preset');
    }
  };

  // Handle keyboard
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSaving && canSave && name.trim()) {
      handleSaveAndStart();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <button
          onClick={onBack}
          disabled={isSaving}
          className={cn(
            'p-2 -ml-2 text-gray-400 hover:text-gray-200 transition-colors',
            isSaving && 'opacity-50 cursor-not-allowed'
          )}
          aria-label="Back"
        >
          ← Back
        </button>
        <h1 className="text-lg font-semibold">Save Preset</h1>
        <div className="w-16" />
      </div>

      {/* Content */}
      <div className="flex-grow overflow-y-auto p-4">
        {/* Icon and Title */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">✨</div>
          <h2 className="text-xl font-bold text-gray-100">
            Save these settings for next time?
          </h2>
        </div>

        {/* Configuration Summary */}
        <div className="mb-6 p-4 rounded-xl bg-gray-800/50 border border-gray-700">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Your Configuration
          </h3>
          <ConfigurationSummary
            mode={config.mode}
            durationMinutes={config.durationMinutes}
            whitelistedApps={config.whitelistedApps}
            whitelistedDomains={config.whitelistedDomains}
          />
        </div>

        {/* Can Save Form */}
        {canSave ? (
          <div className="space-y-6">
            {/* Name Input */}
            <div className="space-y-2">
              <label 
                htmlFor="preset-name" 
                className="block text-sm font-medium text-gray-300"
              >
                Name Your Preset
              </label>
              <input
                ref={nameInputRef}
                id="preset-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isSaving}
                placeholder="e.g., Deep Coding, Morning Focus"
                maxLength={50}
                className={cn(
                  'w-full px-4 py-3 rounded-xl',
                  'bg-gray-800 border-2',
                  'text-gray-100 placeholder-gray-500',
                  'transition-colors duration-150',
                  'focus:outline-none focus:ring-0',
                  error
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-gray-700 focus:border-cyan-500',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
                aria-describedby={error ? 'name-error' : undefined}
              />
              {error && (
                <p id="name-error" className="text-sm text-red-400">
                  {error}
                </p>
              )}
            </div>

            {/* Icon Picker */}
            <IconPicker selectedIcon={icon} onSelect={setIcon} />
          </div>
        ) : (
          /* At Preset Limit */
          <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
            <div className="flex items-start gap-3">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="text-yellow-400 font-medium">
                  You've reached the preset limit ({MAX_USER_PRESETS})
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  To save this configuration, delete an existing preset first.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800 space-y-2">
        {/* Save & Start Button (only if can save) */}
        {canSave && (
          <button
            onClick={handleSaveAndStart}
            disabled={isSaving || !name.trim()}
            className={cn(
              'w-full py-3 px-4 rounded-xl font-semibold text-white',
              'transition-all duration-150',
              'focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-900',
              isSaving || !name.trim()
                ? 'bg-gray-600 cursor-not-allowed opacity-50'
                : 'bg-cyan-500 hover:bg-cyan-600'
            )}
          >
            {isSaving ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span>
                Saving...
              </span>
            ) : (
              'Save & Start'
            )}
          </button>
        )}

        {/* Just Start Button */}
        <button
          onClick={onJustStart}
          disabled={isSaving}
          className={cn(
            'w-full py-3 px-4 rounded-xl font-medium',
            'transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900',
            canSave
              ? 'text-gray-400 hover:text-gray-200'
              : 'bg-cyan-500 hover:bg-cyan-600 text-white',
            isSaving && 'opacity-50 cursor-not-allowed'
          )}
        >
          {canSave ? 'Just Start' : 'Start Without Saving'}
        </button>
      </div>
    </div>
  );
};
