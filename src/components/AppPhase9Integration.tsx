import React, { useState, useEffect, useCallback } from 'react';
import { tauriBridge } from '@/lib/tauri-bridge';
import { SessionPreset, QuickStartConfig } from '@/lib/presets/types';
import { PanelType } from '@/types/panels';
import { SessionConfig, WizardState, INITIAL_WIZARD_STATE } from '@/types/session';
import { useNavigation } from '@/hooks/useNavigation';
import { useSessionStart } from '@/hooks/useSessionStart';
import { usePresets } from '@/hooks/usePresets';
import { useSavePreset } from '@/hooks/useSavePreset';

// Import Phase 9 components
import {
  EntryPointPanel,
  QuickStartPanel,
  PresetPickerPanel,
  SavePresetPrompt,
  SkipPrepButton,
} from '@/components/presets';

// You'll need to import your existing components:
// import { HUD } from '@/components/HUD';
// import { ModeSelectPanel } from '@/components/session/ModeSelectPanel';
// import { DurationPanel } from '@/components/session/DurationPanel';
// import { MentalPrepPanel } from '@/components/session/MentalPrepPanel';
// import { ActiveSessionPanel } from '@/components/session/ActiveSessionPanel';

export const AppPhase9Integration: React.FC = () => {
  // Navigation
  const { currentPanel, navigate, goBack } = useNavigation('hud');
  
  // Session start logic
  const { startFromQuickStart, startFromPreset, startFromWizard } = useSessionStart();
  
  // Save preset logic
  const { canSave, presetCount, checkCanSave, isSaving } = useSavePreset();
  
  // Wizard state
  const [wizardState, setWizardState] = useState<WizardState>(INITIAL_WIZARD_STATE);
  
  // Active session
  const [sessionConfig, setSessionConfig] = useState<SessionConfig | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);

  // Initialize presets on mount
  useEffect(() => {
    const init = async () => {
      try {
        await tauriBridge.initPresets();
        console.log('[App] Presets initialized');
      } catch (error) {
        console.error('[App] Failed to initialize presets:', error);
      }
    };
    init();
  }, []);

  // Reset wizard state
  const resetWizard = useCallback(() => {
    setWizardState(INITIAL_WIZARD_STATE);
  }, []);

  // Update wizard state
  const updateWizard = useCallback((updates: Partial<WizardState>) => {
    setWizardState(prev => ({ ...prev, ...updates }));
  }, []);

  // Handle Play button click
  const handlePlayClick = useCallback(() => {
    if (isSessionActive) {
      navigate('activeSession');
    } else {
      navigate('entryPoint');
    }
  }, [isSessionActive, navigate]);

  // Handle Quick Start session
  const handleQuickStartSession = useCallback(async (config: QuickStartConfig) => {
    try {
      const fullConfig = await startFromQuickStart(config);
      setSessionConfig(fullConfig);
      setIsSessionActive(true);
      navigate('activeSession');
    } catch (error) {
      console.error('[App] Quick Start failed:', error);
    }
  }, [startFromQuickStart, navigate]);

  // Handle Preset session
  const handlePresetSession = useCallback(async (preset: SessionPreset) => {
    try {
      const fullConfig = await startFromPreset(preset);
      setSessionConfig(fullConfig);
      
      // Check if preset includes mental prep
      if (preset.includeMentalPrep) {
        // Show mental prep first
        updateWizard({
          mode: preset.mode,
          durationMinutes: preset.durationMinutes,
          whitelistedApps: preset.whitelistedApps,
          whitelistedDomains: preset.whitelistedDomains,
          useDefaultBlocklist: preset.useDefaultBlocklist,
          skippedMentalPrep: false,
        });
        navigate('mentalPrep1');
      } else {
        setIsSessionActive(true);
        navigate('activeSession');
      }
    } catch (error) {
      console.error('[App] Preset session failed:', error);
    }
  }, [startFromPreset, navigate, updateWizard]);

  // Handle Create New selection
  const handleCreateNew = useCallback(() => {
    resetWizard();
    navigate('modeSelect'); // Or 'sessionType' if that's your first step
  }, [resetWizard, navigate]);

  // Handle Skip Mental Prep
  const handleSkipMentalPrep = useCallback(async () => {
    updateWizard({ skippedMentalPrep: true });
    await checkCanSave();
    navigate('savePrompt');
  }, [updateWizard, checkCanSave, navigate]);

  // Handle Continue Mental Prep
  const handleContinueMentalPrep = useCallback(async () => {
    if (currentPanel === 'mentalPrep1') {
      navigate('mentalPrep2');
    } else if (currentPanel === 'mentalPrep2') {
      await checkCanSave();
      navigate('savePrompt');
    }
  }, [currentPanel, navigate, checkCanSave]);

  // Handle Save and Start from wizard
  const handleSaveAndStart = useCallback(async (
    name: string,
    icon: string,
    includeMentalPrep: boolean
  ) => {
    try {
      const fullConfig = await startFromWizard(
        { ...wizardState, skippedMentalPrep: !includeMentalPrep },
        true,
        name,
        icon
      );
      setSessionConfig(fullConfig);
      setIsSessionActive(true);
      navigate('activeSession');
    } catch (error) {
      console.error('[App] Save and start failed:', error);
      throw error;
    }
  }, [wizardState, startFromWizard, navigate]);

  // Handle Just Start from wizard
  const handleJustStart = useCallback(async () => {
    try {
      const fullConfig = await startFromWizard(wizardState, false);
      setSessionConfig(fullConfig);
      setIsSessionActive(true);
      navigate('activeSession');
    } catch (error) {
      console.error('[App] Just start failed:', error);
    }
  }, [wizardState, startFromWizard, navigate]);

  // Handle Back from Save Prompt
  const handleBackFromSavePrompt = useCallback(() => {
    if (wizardState.skippedMentalPrep) {
      navigate('mentalPrep1');
    } else {
      navigate('mentalPrep2');
    }
  }, [wizardState.skippedMentalPrep, navigate]);

  // Global keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      // Escape to go back (except during active session)
      if (e.key === 'Escape' && !isSessionActive) {
        goBack();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSessionActive, goBack]);

  // Build config from wizard state for SavePresetPrompt
  const buildWizardConfig = () => ({
    mode: wizardState.mode!,
    durationMinutes: wizardState.durationMinutes,
    whitelistedApps: wizardState.whitelistedApps,
    whitelistedDomains: wizardState.whitelistedDomains,
    useDefaultBlocklist: wizardState.useDefaultBlocklist,
  });

  return (
    <div className="app-container">
      {/* Entry Point Panel */}
      {currentPanel === 'entryPoint' && (
        <EntryPointPanel
          onSelectQuickStart={() => navigate('quickStart')}
          onSelectPreset={() => navigate('presetPicker')}
          onSelectCreateNew={handleCreateNew}
          onClose={() => navigate('hud')}
        />
      )}

      {/* Quick Start Panel */}
      {currentPanel === 'quickStart' && (
        <QuickStartPanel
          onBack={() => goBack()}
          onSessionStart={handleQuickStartSession}
        />
      )}

      {/* Preset Picker Panel */}
      {currentPanel === 'presetPicker' && (
        <PresetPickerPanel
          onBack={() => goBack()}
          onSelectPreset={handlePresetSession}
        />
      )}

      {/* Save Preset Prompt */}
      {currentPanel === 'savePrompt' && wizardState.mode && (
        <SavePresetPrompt
          config={buildWizardConfig()}
          skippedMentalPrep={wizardState.skippedMentalPrep}
          onSaveAndStart={handleSaveAndStart}
          onJustStart={handleJustStart}
          onBack={handleBackFromSavePrompt}
          canSave={canSave}
          presetCount={presetCount}
          isSaving={isSaving}
        />
      )}

      {/* 
        YOUR EXISTING PANELS GO HERE:
        
        {currentPanel === 'hud' && (
          <HUD onPlay={handlePlayClick} />
        )}
        
        {currentPanel === 'modeSelect' && (
          <ModeSelectPanel
            onBack={() => goBack()}
            onSelect={(mode) => {
              updateWizard({ mode });
              navigate('duration');
            }}
          />
        )}
        
        {currentPanel === 'mentalPrep1' && (
          <MentalPrepPanel1
            onContinue={handleContinueMentalPrep}
            onBack={() => goBack()}
          >
            <SkipPrepButton onSkip={handleSkipMentalPrep} />
          </MentalPrepPanel1>
        )}
        
        {currentPanel === 'mentalPrep2' && (
          <MentalPrepPanel2
            onContinue={handleContinueMentalPrep}
            onBack={() => goBack()}
          >
            <SkipPrepButton onSkip={handleSkipMentalPrep} />
          </MentalPrepPanel2>
        )}
        
        {currentPanel === 'activeSession' && (
          <ActiveSessionPanel config={sessionConfig} />
        )}
      */}
    </div>
  );
};
