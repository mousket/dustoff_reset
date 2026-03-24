import { useCallback } from 'react';
import { tauriBridge } from '@/lib/tauri-bridge';
import { SessionPreset, QuickStartConfig } from '@/lib/presets/types';
import { SessionConfig, WizardState } from '@/types/session';

interface UseSessionStartReturn {
  startFromQuickStart: (config: QuickStartConfig) => Promise<SessionConfig>;
  startFromPreset: (preset: SessionPreset) => Promise<SessionConfig>;
  startFromWizard: (
    wizard: WizardState,
    savePreset: boolean,
    presetName?: string,
    presetIcon?: string
  ) => Promise<SessionConfig>;
}

export function useSessionStart(): UseSessionStartReturn {
  
  // Start session from Quick Start
  const startFromQuickStart = useCallback(async (config: QuickStartConfig): Promise<SessionConfig> => {
    console.log('[useSessionStart] Starting from Quick Start');
    
    // Quick Start already saved Last Session in the QuickStartPanel
    // Just build and return the full config
    
    const fullConfig: SessionConfig = {
      mode: config.mode,
      durationMinutes: config.durationMinutes,
      whitelistedApps: config.whitelistedApps,
      whitelistedDomains: config.whitelistedDomains,
      blockedApps: config.blockedApps,
      blockedDomains: config.blockedDomains,
      useDefaultBlocklist: true,
      includeMentalPrep: false,
      startedFrom: 'quickStart',
    };
    
    return fullConfig;
  }, []);

  // Start session from Preset
  const startFromPreset = useCallback(async (preset: SessionPreset): Promise<SessionConfig> => {
    console.log('[useSessionStart] Starting from Preset:', preset.name);
    
    // Get blocked lists if using default blocklist
    let blockedApps: string[] = [];
    let blockedDomains: string[] = [];
    
    if (preset.useDefaultBlocklist) {
      // Fetch default blocked lists
      blockedDomains = await tauriBridge.getBlockedDomains();
      // blockedApps would come from cached_apps, but we'll handle that in session monitoring
    }
    
    const fullConfig: SessionConfig = {
      mode: preset.mode,
      durationMinutes: preset.durationMinutes,
      whitelistedApps: preset.whitelistedApps,
      whitelistedDomains: preset.whitelistedDomains,
      blockedApps,
      blockedDomains,
      useDefaultBlocklist: preset.useDefaultBlocklist,
      includeMentalPrep: preset.includeMentalPrep,
      startedFrom: 'preset',
      presetId: preset.id,
    };
    
    // Save as Last Session
    await tauriBridge.saveAsLastSession(
      preset.mode,
      preset.durationMinutes,
      preset.whitelistedApps,
      preset.whitelistedDomains,
      preset.useDefaultBlocklist,
      preset.includeMentalPrep
    );
    
    return fullConfig;
  }, []);

  // Start session from Create New wizard
  const startFromWizard = useCallback(async (
    wizard: WizardState,
    savePreset: boolean,
    presetName?: string,
    presetIcon?: string
  ): Promise<SessionConfig> => {
    console.log('[useSessionStart] Starting from Wizard, save preset:', savePreset);
    
    if (!wizard.mode) {
      throw new Error('Mode is required');
    }
    
    // Get blocked lists
    let blockedDomains: string[] = [];
    if (wizard.useDefaultBlocklist) {
      blockedDomains = await tauriBridge.getBlockedDomains();
    }
    
    const includeMentalPrep = !wizard.skippedMentalPrep;
    
    // Save as preset if requested
    if (savePreset && presetName && presetIcon) {
      await tauriBridge.createUserPreset({
        name: presetName,
        icon: presetIcon,
        mode: wizard.mode,
        durationMinutes: wizard.durationMinutes,
        whitelistedApps: wizard.whitelistedApps,
        whitelistedDomains: wizard.whitelistedDomains,
        useDefaultBlocklist: wizard.useDefaultBlocklist,
        includeMentalPrep,
      });
      console.log('[useSessionStart] Saved preset:', presetName);
    }
    
    // Save as Last Session
    await tauriBridge.saveAsLastSession(
      wizard.mode,
      wizard.durationMinutes,
      wizard.whitelistedApps,
      wizard.whitelistedDomains,
      wizard.useDefaultBlocklist,
      includeMentalPrep
    );
    
    const fullConfig: SessionConfig = {
      mode: wizard.mode,
      durationMinutes: wizard.durationMinutes,
      whitelistedApps: wizard.whitelistedApps,
      whitelistedDomains: wizard.whitelistedDomains,
      blockedApps: [],
      blockedDomains,
      useDefaultBlocklist: wizard.useDefaultBlocklist,
      includeMentalPrep,
      startedFrom: 'createNew',
    };
    
    return fullConfig;
  }, []);

  return {
    startFromQuickStart,
    startFromPreset,
    startFromWizard,
  };
}
