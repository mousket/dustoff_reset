# Phase 9: Presets & Quick Start
## Output B4-2: Preset Cards & Actions - Implementation Prompts

---

## Overview

This document contains step-by-step prompts for Cursor to implement the Preset Card actions - the edit/delete functionality, menus, and dialogs.

**Depends on:** B4-1 (Preset Selection) must be complete.

**Total Steps:** 10
**Estimated Time:** 2-3 hours

---

## Step 1: Create PresetCardMenu Component

**Prompt for Cursor:**

```
Create the dropdown menu component for preset card actions.

Create file: src/components/presets/PresetCardMenu.tsx

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface PresetCardMenuProps {
  onEdit: () => void;
  onDelete: () => void;
  presetName: string;
}

export const PresetCardMenu: React.FC<PresetCardMenuProps> = ({
  onEdit,
  onDelete,
  presetName,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close menu on Escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleEdit = () => {
    setIsOpen(false);
    onEdit();
  };

  const handleDelete = () => {
    setIsOpen(false);
    onDelete();
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={cn(
          'p-2 rounded-lg text-gray-400 transition-colors',
          'hover:text-gray-200 hover:bg-gray-700',
          'focus:outline-none focus:ring-2 focus:ring-cyan-500',
          isOpen && 'bg-gray-700 text-gray-200'
        )}
        aria-label={`More options for ${presetName}`}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <span className="text-sm tracking-wider">•••</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          ref={menuRef}
          role="menu"
          className={cn(
            'absolute right-0 top-full mt-1 z-50',
            'w-36 py-1 rounded-lg',
            'bg-gray-800 border border-gray-700 shadow-xl',
            'animate-in fade-in-0 zoom-in-95 duration-100'
          )}
        >
          {/* Edit Option */}
          <button
            role="menuitem"
            onClick={handleEdit}
            className={cn(
              'w-full px-3 py-2 text-left text-sm',
              'flex items-center gap-2',
              'text-gray-200 hover:bg-gray-700',
              'transition-colors'
            )}
          >
            <span>✏️</span>
            <span>Edit</span>
          </button>

          {/* Divider */}
          <div className="my-1 border-t border-gray-700" />

          {/* Delete Option */}
          <button
            role="menuitem"
            onClick={handleDelete}
            className={cn(
              'w-full px-3 py-2 text-left text-sm',
              'flex items-center gap-2',
              'text-red-400 hover:bg-red-500/10',
              'transition-colors'
            )}
          >
            <span>🗑️</span>
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
};
```

---

## Step 2: Create IconPicker Component

**Prompt for Cursor:**

```
Create an emoji icon picker component for preset editing.

Create file: src/components/presets/IconPicker.tsx

import React from 'react';
import { cn } from '@/lib/utils';
import { PRESET_ICONS } from '@/lib/presets/types';

interface IconPickerProps {
  selectedIcon: string;
  onSelect: (icon: string) => void;
}

export const IconPicker: React.FC<IconPickerProps> = ({
  selectedIcon,
  onSelect,
}) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">
        Icon
      </label>
      <div className="flex flex-wrap gap-2">
        {PRESET_ICONS.map((icon) => (
          <button
            key={icon}
            type="button"
            onClick={() => onSelect(icon)}
            className={cn(
              'w-10 h-10 rounded-lg text-xl',
              'flex items-center justify-center',
              'transition-all duration-150',
              'focus:outline-none focus:ring-2 focus:ring-cyan-500',
              selectedIcon === icon
                ? 'bg-cyan-500/20 border-2 border-cyan-500'
                : 'bg-gray-700 border-2 border-transparent hover:border-gray-600'
            )}
            aria-label={`Select ${icon} icon`}
            aria-pressed={selectedIcon === icon}
          >
            {icon}
          </button>
        ))}
      </div>
    </div>
  );
};
```

---

## Step 3: Create DeleteConfirmDialog Component

**Prompt for Cursor:**

```
Create a confirmation dialog for deleting presets.

Create file: src/components/presets/DeleteConfirmDialog.tsx

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
          'animate-in fade-in-0 zoom-in-95 duration-150'
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
```

---

## Step 4: Create PresetEditPanel Component

**Prompt for Cursor:**

```
Create the edit panel component for modifying presets.

Create file: src/components/presets/PresetEditPanel.tsx

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
          'animate-in fade-in-0 zoom-in-95 duration-150'
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
```

---

## Step 5: Update PresetCard with Real Menu

**Prompt for Cursor:**

```
Update the PresetCard component to use the real PresetCardMenu.

Update file: src/components/presets/PresetCard.tsx

Replace the existing file with:

import React from 'react';
import { cn } from '@/lib/utils';
import { SessionPreset, MODE_INFO } from '@/lib/presets/types';
import { PresetCardMenu } from './PresetCardMenu';

interface PresetCardProps {
  preset: SessionPreset;
  variant?: 'user' | 'default' | 'lastSession';
  onStart: (preset: SessionPreset) => void;
  onEdit?: (preset: SessionPreset) => void;
  onDelete?: (preset: SessionPreset) => void;
  isLoading?: boolean;
  showAppPreview?: boolean;
}

export const PresetCard: React.FC<PresetCardProps> = ({
  preset,
  variant = 'user',
  onStart,
  onEdit,
  onDelete,
  isLoading = false,
  showAppPreview = false,
}) => {
  const modeInfo = MODE_INFO[preset.mode];
  const isLastSession = variant === 'lastSession';
  const isDefault = variant === 'default';
  const canEdit = variant === 'user' && onEdit;
  const canDelete = variant === 'user' && onDelete;
  const showMenu = canEdit || canDelete;

  const handleStart = () => {
    if (!isLoading) {
      onStart(preset);
    }
  };

  // Format app preview text
  const appPreview = showAppPreview && preset.whitelistedApps.length > 0
    ? preset.whitelistedApps.slice(0, 3).join(', ') + 
      (preset.whitelistedApps.length > 3 ? '...' : '')
    : null;

  return (
    <div
      className={cn(
        'flex items-center gap-4 p-4 rounded-xl border transition-all duration-150',
        'hover:border-gray-600',
        isLastSession
          ? 'bg-cyan-500/5 border-cyan-500/30 hover:border-cyan-500/50'
          : 'bg-gray-800/30 border-gray-700',
        isDefault && 'opacity-90'
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-xl',
          isLastSession ? 'bg-cyan-500/20' : 'bg-gray-700/50'
        )}
      >
        {preset.icon}
      </div>

      {/* Content */}
      <div className="flex-grow min-w-0">
        {/* Name */}
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-gray-100 truncate">
            {preset.name}
          </h4>
          {isLastSession && (
            <span className="px-1.5 py-0.5 text-xs bg-cyan-500/20 text-cyan-400 rounded">
              Recent
            </span>
          )}
        </div>

        {/* Mode and Duration */}
        <div className="flex items-center gap-2 mt-0.5">
          <span
            className={cn(
              'text-xs font-medium px-1.5 py-0.5 rounded',
              modeInfo.bgColor,
              modeInfo.color
            )}
          >
            {modeInfo.title}
          </span>
          <span className="text-xs text-gray-500">•</span>
          <span className="text-xs text-gray-400">
            {preset.durationMinutes} min
          </span>
        </div>

        {/* App Preview (for Last Session) */}
        {appPreview && (
          <p className="text-xs text-gray-500 mt-1 truncate">
            {appPreview}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* More Menu */}
        {showMenu && (
          <PresetCardMenu
            presetName={preset.name}
            onEdit={() => onEdit?.(preset)}
            onDelete={() => onDelete?.(preset)}
          />
        )}

        {/* Start Button */}
        <button
          onClick={handleStart}
          disabled={isLoading}
          className={cn(
            'px-4 py-2 rounded-lg font-medium text-sm text-white transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900',
            isLoading
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-cyan-500 hover:bg-cyan-600 focus:ring-cyan-500'
          )}
        >
          {isLoading ? (
            <span className="flex items-center gap-1">
              <span className="animate-spin text-xs">⏳</span>
            </span>
          ) : (
            'Start'
          )}
        </button>
      </div>
    </div>
  );
};
```

---

## Step 6: Update usePresets Hook with Update Function

**Prompt for Cursor:**

```
Update the usePresets hook to include the updatePreset function.

Update file: src/hooks/usePresets.ts

Add updatePreset to the interface and implementation:

// Add to UsePresetsReturn interface:
export interface UsePresetsReturn {
  // ... existing properties ...
  
  // Actions
  refreshPresets: () => Promise<void>;
  createPreset: (input: CreatePresetInput) => Promise<SessionPreset>;
  updatePreset: (input: {
    id: string;
    name?: string;
    icon?: string;
    mode?: string;
    durationMinutes?: number;
    whitelistedApps?: string[];
    whitelistedDomains?: string[];
    useDefaultBlocklist?: boolean;
    includeMentalPrep?: boolean;
  }) => Promise<SessionPreset>;
  deletePreset: (id: string) => Promise<void>;
  usePreset: (id: string) => Promise<SessionPreset>;
}

// Add the updatePreset function inside usePresets:
const updatePreset = useCallback(async (input: {
  id: string;
  name?: string;
  icon?: string;
  mode?: string;
  durationMinutes?: number;
  whitelistedApps?: string[];
  whitelistedDomains?: string[];
  useDefaultBlocklist?: boolean;
  includeMentalPrep?: boolean;
}): Promise<SessionPreset> => {
  try {
    const preset = await tauriBridge.updateUserPreset(input);
    await refreshPresets(); // Refresh list
    console.log('[usePresets] Updated preset:', preset.name);
    return preset;
  } catch (err) {
    console.error('[usePresets] Failed to update preset:', err);
    throw err;
  }
}, [refreshPresets]);

// Add updatePreset to the return object:
return {
  // ... existing properties ...
  updatePreset,
  // ... rest ...
};
```

---

## Step 7: Update PresetPickerPanel with Edit/Delete State

**Prompt for Cursor:**

```
Update the PresetPickerPanel to handle edit and delete actions.

Update file: src/components/presets/PresetPickerPanel.tsx

Replace the existing file with:

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
      <div className="flex flex-col h-full bg-gray-900 text-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <button
            onClick={onBack}
            className="p-2 -ml-2 text-gray-400 hover:text-gray-200 transition-colors"
            aria-label="Back"
          >
            ← Back
          </button>
          <div className="flex items-center gap-2">
            <span className="text-lg">📁</span>
            <h1 className="text-lg font-semibold">Use Preset</h1>
          </div>
          <div className="w-16" />
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-4 space-y-6">
          {/* Error State */}
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-center">
              <p className="text-red-400 mb-2">Couldn't load presets</p>
              <p className="text-sm text-gray-400 mb-3">{error}</p>
              <button
                onClick={refreshPresets}
                className="px-4 py-2 rounded-lg bg-gray-700 text-gray-200 hover:bg-gray-600 transition-colors"
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
              {/* Recent Section */}
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

              {/* Suggested Section */}
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
        <div className="p-4 border-t border-gray-800">
          <p className="text-center text-xs text-gray-500">
            Press <span className="font-mono bg-gray-800 px-1 rounded">Esc</span> to go back
          </p>
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
```

---

## Step 8: Update Presets Components Index

**Prompt for Cursor:**

```
Update the presets components index to export all new components.

Update file: src/components/presets/index.ts

// Entry Point components
export { EntryOptionCard } from './EntryOptionCard';
export { EntryPointPanel } from './EntryPointPanel';

// Quick Start components
export { ModeCard } from './ModeCard';
export { ModeSelector } from './ModeSelector';
export { DurationButton } from './DurationButton';
export { DurationSlider } from './DurationSlider';
export { DurationSelector } from './DurationSelector';
export { SmartDefaultsInfo } from './SmartDefaultsInfo';
export { QuickStartPanel } from './QuickStartPanel';

// Preset Picker components
export { PresetSection } from './PresetSection';
export { PresetSkeleton } from './PresetSkeleton';
export { EmptyPresets } from './EmptyPresets';
export { PresetCard } from './PresetCard';
export { PresetCardMenu } from './PresetCardMenu';
export { PresetPickerPanel } from './PresetPickerPanel';

// Preset Actions components
export { IconPicker } from './IconPicker';
export { PresetEditPanel } from './PresetEditPanel';
export { DeleteConfirmDialog } from './DeleteConfirmDialog';
```

---

## Step 9: Add Tailwind Animation Classes

**Prompt for Cursor:**

```
Ensure Tailwind animation classes are available. If you're using Tailwind CSS, the animate-in classes may require the tailwindcss-animate plugin.

If animate-in classes don't work, replace them with standard transitions.

For example, in DeleteConfirmDialog and PresetEditPanel, if the animate-in class doesn't work:

Replace:
'animate-in fade-in-0 zoom-in-95 duration-150'

With:
'transition-all duration-150'

And wrap the dialog rendering in a simple fade effect using opacity and transform if needed.

Alternatively, add to tailwind.config.js:

module.exports = {
  // ... existing config
  plugins: [
    require('tailwindcss-animate'),
    // ... other plugins
  ],
}

And install: npm install tailwindcss-animate
```

---

## Step 10: Test Preset Actions

**Testing Checkpoint 5: Preset Actions Work**

After completing steps 1-9, test the preset actions:

### 10.1: Verify Build

```bash
npm run build
```

**Expected:** No TypeScript errors.

### 10.2: Create Test Presets

In DevTools console:

```javascript
// Create a couple test presets
await window.__TAURI__.invoke('create_user_preset', {
  input: {
    name: 'Test Preset 1',
    icon: '🧪',
    mode: 'Zen',
    durationMinutes: 30,
    whitelistedApps: ['VS Code'],
    whitelistedDomains: ['github.com'],
    useDefaultBlocklist: true,
    includeMentalPrep: false
  }
});

await window.__TAURI__.invoke('create_user_preset', {
  input: {
    name: 'Test Preset 2',
    icon: '🔬',
    mode: 'Flow',
    durationMinutes: 45,
    whitelistedApps: ['Terminal'],
    whitelistedDomains: ['stackoverflow.com'],
    useDefaultBlocklist: true,
    includeMentalPrep: true
  }
});

// Verify
const presets = await window.__TAURI__.invoke('get_all_presets');
console.log('User presets:', presets.userPresets.map(p => p.name));
```

### 10.3: Menu Tests

| Action | Expected Result |
|--------|-----------------|
| Click ••• on user preset | Menu opens with Edit and Delete options |
| Click outside menu | Menu closes |
| Press Escape with menu open | Menu closes |
| Click ••• then Edit | Edit panel opens |
| Click ••• then Delete | Delete confirmation opens |
| Default presets | No ••• menu visible |
| Last Session | No ••• menu visible |

### 10.4: Edit Panel Tests

| Action | Expected Result |
|--------|-----------------|
| Open edit panel | Shows current preset values |
| Change name | Save button enables |
| Clear name | Save button disables |
| Select different icon | Icon updates, save enables |
| Select different mode | Mode updates, save enables |
| Change duration | Duration updates, save enables |
| Toggle mental prep | Toggle updates, save enables |
| Click Save | Panel closes, preset updates in list |
| Click Cancel | Panel closes, no changes |
| Press Escape | Panel closes, no changes |

### 10.5: Delete Dialog Tests

| Action | Expected Result |
|--------|-----------------|
| Open delete dialog | Shows preset name in title |
| Click Cancel | Dialog closes, preset remains |
| Press Escape | Dialog closes, preset remains |
| Click Delete | Shows loading, then preset removed |
| Preset list updates | Deleted preset no longer visible |

### 10.6: Visual Checklist

- [ ] Menu appears below ••• button
- [ ] Menu has Edit and Delete options
- [ ] Delete option is red
- [ ] Edit panel has all form fields
- [ ] Icon picker shows grid of emojis
- [ ] Selected icon has cyan border
- [ ] Mode selector matches Quick Start design
- [ ] Duration selector matches Quick Start design
- [ ] Mental prep toggle works
- [ ] Delete dialog has warning styling
- [ ] Delete button is red
- [ ] Loading states show spinners
- [ ] Dialogs have backdrop blur

### 10.7: Backend Verification

After editing a preset:

```javascript
const presets = await window.__TAURI__.invoke('get_all_presets');
const edited = presets.userPresets.find(p => p.name === 'New Name');
console.log('Edited preset:', edited);
// Verify all fields updated correctly
```

After deleting a preset:

```javascript
const presets = await window.__TAURI__.invoke('get_all_presets');
console.log('Remaining presets:', presets.userPresets.map(p => p.name));
// Deleted preset should not appear
```

---

## Summary: What You Built

| File | Purpose |
|------|---------|
| `src/components/presets/PresetCardMenu.tsx` | Dropdown menu with Edit/Delete |
| `src/components/presets/IconPicker.tsx` | Emoji icon selection grid |
| `src/components/presets/DeleteConfirmDialog.tsx` | Delete confirmation modal |
| `src/components/presets/PresetEditPanel.tsx` | Full edit panel/modal |
| `src/components/presets/PresetCard.tsx` | Updated with real menu |
| `src/components/presets/PresetPickerPanel.tsx` | Updated with edit/delete state |
| `src/hooks/usePresets.ts` | Added updatePreset function |

---

