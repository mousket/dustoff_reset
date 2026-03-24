import React, { useEffect, useCallback, useState } from 'react';
import { PresetSection } from './PresetSection';
import { PresetCard } from './PresetCard';
import { PresetSkeleton } from './PresetSkeleton';
import { EmptyPresets } from './EmptyPresets';
import { PresetEditPanel } from './PresetEditPanel';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { usePresets } from '@/hooks/usePresets';
import { cn } from '@/lib/utils';
import { SessionPreset } from '@/lib/presets/types';

interface PresetPickerPanelProps {
  onBack: () => void;
  onSelectPreset: (preset: SessionPreset) => void;
}

export const PresetPickerPanel: React.FC<PresetPickerPanelProps> = ({
  onBack,
  onSelectPreset,
}) => {
  const {
    lastSession,
    userPresets,
    defaultPresets,
    isLoading,
    error,
    hasLastSession,
    hasUserPresets,
    refreshPresets,
    usePreset,
    updatePreset,
    deletePreset,
  } = usePresets();

  // Action states
  const [startingPresetId, setStartingPresetId] = useState<string | null>(null);
  const [editingPreset, setEditingPreset] = useState<SessionPreset | null>(null);
  const [deletingPreset, setDeletingPreset] = useState<SessionPreset | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Handle starting a preset
  const handleStartPreset = async (preset: SessionPreset) => {
    try {
      setStartingPresetId(preset.id);
      const usedPreset = await usePreset(preset.id);
      onSelectPreset(usedPreset);
    } catch (err) {
      console.error('Failed to start preset:', err);
    } finally {
      setStartingPresetId(null);
    }
  };

  // Handle edit
  const handleEditPreset = (preset: SessionPreset) => {
    setEditingPreset(preset);
  };

  // Handle save edit
  const handleSaveEdit = async (updates: {
    id: string;
    name?: string;
    icon?: string;
    mode?: string;
    durationMinutes?: number;
    includeMentalPrep?: boolean;
  }) => {
    setIsSaving(true);
    try {
      await updatePreset(updates);
      setEditingPreset(null);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete
  const handleDeletePreset = (preset: SessionPreset) => {
    setDeletingPreset(preset);
  };

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (!deletingPreset) return;
    
    setIsDeleting(true);
    try {
      await deletePreset(deletingPreset.id);
      setDeletingPreset(null);
    } catch (err) {
      console.error('Failed to delete preset:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't handle if a dialog is open
    if (editingPreset || deletingPreset) return;
    
    if (e.key === 'Escape') {
      onBack();
    }
  }, [onBack, editingPreset, deletingPreset]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      <div
        className="rounded-3xl bg-[#0a0f0d]/80 backdrop-blur-xl border border-emerald-500/30 shadow-2xl transition-all duration-300"
        style={{ width: "440px" }}
      >
        <div className="flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-emerald-500/20">
            <div>
              <h2 className="text-sm uppercase tracking-wider text-emerald-400">
                USE PRESET
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Choose a saved configuration
              </p>
            </div>
            <button
              onClick={onBack}
              className="w-7 h-7 rounded-full bg-zinc-800/80 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 transition-colors text-sm"
              aria-label="Back"
            >
              ×
            </button>
          </div>

          {/* Progress Bar */}
          <div className="h-1 bg-zinc-900">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
              style={{ width: '100%' }}
            />
          </div>

          {/* Content */}
          <div className="overflow-y-auto px-5 py-4 max-h-[480px] space-y-6">
            {/* Error State */}
            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-center">
                <p className="text-red-400 mb-2">Couldn't load presets</p>
                <p className="text-sm text-zinc-400 mb-3">{error}</p>
                <button
                  onClick={refreshPresets}
                  className="px-4 py-2 rounded-lg bg-zinc-700 text-zinc-200 hover:bg-zinc-600 transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Loading State */}
            {isLoading && !error && (
              <>
                <PresetSection title="Recent">
                  <PresetSkeleton count={1} />
                </PresetSection>
                <PresetSection title="My Presets">
                  <PresetSkeleton count={2} />
                </PresetSection>
                <PresetSection title="Suggested">
                  <PresetSkeleton count={4} />
                </PresetSection>
              </>
            )}

            {/* Loaded State */}
            {!isLoading && !error && (
              <>
                {/* Recent Section (Last Session) */}
                <PresetSection title="Recent" hidden={!hasLastSession}>
                  {lastSession && (
                    <PresetCard
                      preset={lastSession}
                      variant="lastSession"
                      onStart={handleStartPreset}
                      isLoading={startingPresetId === lastSession.id}
                      showAppPreview={true}
                    />
                  )}
                </PresetSection>

                {/* My Presets Section */}
                <PresetSection title="My Presets" badge={userPresets.length}>
                  {hasUserPresets ? (
                    userPresets.map((preset) => (
                      <PresetCard
                        key={preset.id}
                        preset={preset}
                        variant="user"
                        onStart={handleStartPreset}
                        onEdit={handleEditPreset}
                        onDelete={handleDeletePreset}
                        isLoading={startingPresetId === preset.id}
                      />
                    ))
                  ) : (
                    <EmptyPresets variant="user" />
                  )}
                </PresetSection>

                {/* Suggested Section (Default Presets) */}
                <PresetSection title="Suggested">
                  {defaultPresets.map((preset) => (
                    <PresetCard
                      key={preset.id}
                      preset={preset}
                      variant="default"
                      onStart={handleStartPreset}
                      isLoading={startingPresetId === preset.id}
                    />
                  ))}
                </PresetSection>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-emerald-500/20">
            <p className="text-center text-xs text-zinc-500">
              Press <span className="font-mono bg-zinc-800 px-1 rounded">Esc</span> to go back
            </p>
          </div>
        </div>
      </div>

      {/* Edit Panel */}
      {editingPreset && (
        <PresetEditPanel
          preset={editingPreset}
          isOpen={true}
          onClose={() => setEditingPreset(null)}
          onSave={handleSaveEdit}
          isSaving={isSaving}
        />
      )}

      {/* Delete Confirmation */}
      {deletingPreset && (
        <DeleteConfirmDialog
          preset={deletingPreset}
          isOpen={true}
          onClose={() => setDeletingPreset(null)}
          onConfirm={handleConfirmDelete}
          isDeleting={isDeleting}
        />
      )}
    </>
  );
};
