import { useState, useEffect, useCallback } from 'react';
import { tauriBridge } from '@/lib/tauri-bridge';
import type { 
  SessionPreset, 
  AllPresetsResponse,
  CreatePresetInput 
} from '@/lib/presets/types';

export interface UsePresetsReturn {
  // State
  lastSession: SessionPreset | null;
  userPresets: SessionPreset[];
  defaultPresets: SessionPreset[];
  isLoading: boolean;
  error: string | null;
  
  // Computed
  hasLastSession: boolean;
  hasUserPresets: boolean;
  userPresetCount: number;
  canCreatePreset: boolean;
  
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

export function usePresets(): UsePresetsReturn {
  const [lastSession, setLastSession] = useState<SessionPreset | null>(null);
  const [userPresets, setUserPresets] = useState<SessionPreset[]>([]);
  const [defaultPresets, setDefaultPresets] = useState<SessionPreset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all presets
  const refreshPresets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response: AllPresetsResponse = await tauriBridge.getAllPresets();
      
      setLastSession(response.lastSession);
      setUserPresets(response.userPresets);
      setDefaultPresets(response.defaultPresets);
      
      console.log('[usePresets] Loaded presets:', {
        lastSession: response.lastSession?.name || 'None',
        userPresets: response.userPresets.length,
        defaultPresets: response.defaultPresets.length,
      });
    } catch (err) {
      console.error('[usePresets] Failed to load presets:', err);
      setError(err instanceof Error ? err.message : 'Failed to load presets');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create a new preset
  const createPreset = useCallback(async (input: CreatePresetInput): Promise<SessionPreset> => {
    try {
      const preset = await tauriBridge.createUserPreset(input);
      await refreshPresets(); // Refresh list
      console.log('[usePresets] Created preset:', preset.name);
      return preset;
    } catch (err) {
      console.error('[usePresets] Failed to create preset:', err);
      throw err;
    }
  }, [refreshPresets]);

  // Update a preset
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

  // Delete a preset
  const deletePreset = useCallback(async (id: string): Promise<void> => {
    try {
      await tauriBridge.deleteUserPreset(id);
      await refreshPresets(); // Refresh list
      console.log('[usePresets] Deleted preset:', id);
    } catch (err) {
      console.error('[usePresets] Failed to delete preset:', err);
      throw err;
    }
  }, [refreshPresets]);

  // Use a preset (records usage)
  const usePresetAction = useCallback(async (id: string): Promise<SessionPreset> => {
    try {
      const preset = await tauriBridge.usePreset(id);
      console.log('[usePresets] Using preset:', preset.name);
      return preset;
    } catch (err) {
      console.error('[usePresets] Failed to use preset:', err);
      throw err;
    }
  }, []);

  // Initial load
  useEffect(() => {
    refreshPresets();
  }, [refreshPresets]);

  // Computed values
  const hasLastSession = lastSession !== null;
  const hasUserPresets = userPresets.length > 0;
  const userPresetCount = userPresets.length;
  const canCreatePreset = userPresetCount < 5;

  return {
    lastSession,
    userPresets,
    defaultPresets,
    isLoading,
    error,
    hasLastSession,
    hasUserPresets,
    userPresetCount,
    canCreatePreset,
    refreshPresets,
    createPreset,
    updatePreset,
    deletePreset,
    usePreset: usePresetAction,
  };
}
