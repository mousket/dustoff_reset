import { useState, useMemo, useCallback } from 'react';
import { tauriBridge } from '@/lib/tauri-bridge';
import { SessionMode, QuickStartConfig, MODE_INFO } from '@/lib/presets/types';

export interface UseQuickStartReturn {
  // State
  selectedMode: SessionMode | null;
  duration: number;
  isLoading: boolean;
  error: string | null;
  
  // Computed
  canStart: boolean;
  buttonColor: string;
  buttonBgColor: string;
  
  // Actions
  setMode: (mode: SessionMode) => void;
  setDuration: (minutes: number) => void;
  startSession: () => Promise<QuickStartConfig | null>;
  clearError: () => void;
}

export function useQuickStart(): UseQuickStartReturn {
  const [selectedMode, setSelectedMode] = useState<SessionMode | null>(null);
  const [duration, setDuration] = useState(30);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Computed: Can we start a session?
  const canStart = selectedMode !== null && duration > 0 && !isLoading;

  // Computed: Button colors based on mode
  const buttonColor = useMemo(() => {
    if (!selectedMode) return 'text-gray-400';
    return MODE_INFO[selectedMode].color;
  }, [selectedMode]);

  const buttonBgColor = useMemo(() => {
    if (!selectedMode) return 'bg-gray-600';
    return MODE_INFO[selectedMode].buttonBg;
  }, [selectedMode]);

  // Actions
  const setMode = useCallback((mode: SessionMode) => {
    setSelectedMode(mode);
    setError(null);
    console.log('[useQuickStart] Mode selected:', mode);
  }, []);

  const setDurationValue = useCallback((minutes: number) => {
    // Clamp between 5 and 120
    const clamped = Math.min(120, Math.max(5, minutes));
    setDuration(clamped);
    setError(null);
    console.log('[useQuickStart] Duration set:', clamped);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const startSession = useCallback(async (): Promise<QuickStartConfig | null> => {
    if (!selectedMode) {
      setError('Please select a mode');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('[useQuickStart] Starting session...', { mode: selectedMode, duration });

      // 1. Get smart defaults from backend
      const config = await tauriBridge.getQuickStartConfig(selectedMode, duration);
      console.log('[useQuickStart] Got config:', {
        whitelistedApps: config.whitelistedApps.length,
        blockedDomains: config.blockedDomains.length,
      });

      // 2. Save as Last Session for next time
      await tauriBridge.saveAsLastSession(
        selectedMode,
        duration,
        config.whitelistedApps,
        config.whitelistedDomains,
        true,  // useDefaultBlocklist
        false  // includeMentalPrep (Quick Start skips this)
      );
      console.log('[useQuickStart] Saved as Last Session');

      // 3. Return the config for the caller to start the session
      return config;

    } catch (err) {
      console.error('[useQuickStart] Failed to start session:', err);
      
      const message = err instanceof Error ? err.message : 'Failed to start session';
      setError(message);
      return null;

    } finally {
      setIsLoading(false);
    }
  }, [selectedMode, duration]);

  return {
    selectedMode,
    duration,
    isLoading,
    error,
    canStart,
    buttonColor,
    buttonBgColor,
    setMode,
    setDuration: setDurationValue,
    startSession,
    clearError,
  };
}
