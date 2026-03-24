import { useState, useCallback } from 'react';
import { tauriBridge } from '@/lib/tauri-bridge';
import { SessionMode, CreatePresetInput } from '@/lib/presets/types';

interface SessionConfig {
  mode: SessionMode;
  durationMinutes: number;
  whitelistedApps: string[];
  whitelistedDomains: string[];
  useDefaultBlocklist: boolean;
}

interface UseSavePresetReturn {
  isSaving: boolean;
  error: string | null;
  canSave: boolean;
  presetCount: number;
  checkCanSave: () => Promise<void>;
  savePreset: (
    name: string,
    icon: string,
    config: SessionConfig,
    includeMentalPrep: boolean
  ) => Promise<boolean>;
  clearError: () => void;
}

export function useSavePreset(): UseSavePresetReturn {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canSave, setCanSave] = useState(true);
  const [presetCount, setPresetCount] = useState(0);

  // Check if user can save (under limit)
  const checkCanSave = useCallback(async () => {
    try {
      const count = await tauriBridge.getUserPresetCount();
      setPresetCount(count);
      setCanSave(count < 5);
    } catch (err) {
      console.error('[useSavePreset] Failed to check preset count:', err);
      // Assume they can save if we can't check
      setCanSave(true);
    }
  }, []);

  // Save a new preset
  const savePreset = useCallback(async (
    name: string,
    icon: string,
    config: SessionConfig,
    includeMentalPrep: boolean
  ): Promise<boolean> => {
    setIsSaving(true);
    setError(null);

    try {
      const input: CreatePresetInput = {
        name,
        icon,
        mode: config.mode,
        durationMinutes: config.durationMinutes,
        whitelistedApps: config.whitelistedApps,
        whitelistedDomains: config.whitelistedDomains,
        useDefaultBlocklist: config.useDefaultBlocklist,
        includeMentalPrep,
      };

      await tauriBridge.createUserPreset(input);
      console.log('[useSavePreset] Preset saved:', name);
      return true;

    } catch (err) {
      console.error('[useSavePreset] Failed to save preset:', err);
      const message = err instanceof Error ? err.message : 'Failed to save preset';
      setError(message);
      return false;

    } finally {
      setIsSaving(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isSaving,
    error,
    canSave,
    presetCount,
    checkCanSave,
    savePreset,
    clearError,
  };
}
