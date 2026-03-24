import { SessionMode } from '@/lib/presets/types';

// Full session configuration
export interface SessionConfig {
  // Core settings
  mode: SessionMode;
  durationMinutes: number;
  
  // Whitelisting
  whitelistedApps: string[];
  whitelistedDomains: string[];
  blockedApps: string[];
  blockedDomains: string[];
  
  // Behavior
  useDefaultBlocklist: boolean;
  includeMentalPrep: boolean;
  
  // Tracking
  startedFrom: 'quickStart' | 'preset' | 'createNew';
  presetId?: string;
}

// Wizard state for Create New flow
export interface WizardState {
  // Configuration being built
  mode: SessionMode | null;
  durationMinutes: number;
  whitelistedApps: string[];
  whitelistedDomains: string[];
  useDefaultBlocklist: boolean;
  
  // Mental prep tracking
  skippedMentalPrep: boolean;
  intention?: string;
}

// Initial wizard state
export const INITIAL_WIZARD_STATE: WizardState = {
  mode: null,
  durationMinutes: 30,
  whitelistedApps: [],
  whitelistedDomains: [],
  useDefaultBlocklist: true,
  skippedMentalPrep: false,
};
