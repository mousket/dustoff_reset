// Session mode type
export type SessionMode = 'Zen' | 'Flow' | 'Legend';

// App category type
export type AppCategory = 
  | 'productivity' 
  | 'communication' 
  | 'browser' 
  | 'entertainment' 
  | 'social' 
  | 'game' 
  | 'utility' 
  | 'unknown';

// A saved session preset
export interface SessionPreset {
  id: string;
  name: string;
  icon: string;
  mode: SessionMode;
  durationMinutes: number;
  whitelistedApps: string[];
  whitelistedDomains: string[];
  useDefaultBlocklist: boolean;
  includeMentalPrep: boolean;
  isDefault: boolean;
  isLastSession: boolean;
  createdAt: number;
  updatedAt: number;
  lastUsedAt: number | null;
  usageCount: number;
}

// Response from get_all_presets
export interface AllPresetsResponse {
  lastSession: SessionPreset | null;
  userPresets: SessionPreset[];
  defaultPresets: SessionPreset[];
}

// Input for creating a preset
export interface CreatePresetInput {
  name: string;
  icon: string;
  mode: string;
  durationMinutes: number;
  whitelistedApps: string[];
  whitelistedDomains: string[];
  useDefaultBlocklist: boolean;
  includeMentalPrep: boolean;
}

// Quick start configuration from backend
export interface QuickStartConfig {
  mode: SessionMode;
  durationMinutes: number;
  whitelistedApps: string[];
  whitelistedDomains: string[];
  blockedApps: string[];
  blockedDomains: string[];
}

// Preset icons available for selection
export const PRESET_ICONS = [
  '🎯', '🔥', '🌊', '🧘', '⚡', '🚀', 
  '💻', '📝', '📧', '🎨', '📚', '🔧',
  '💡', '🏃', '🎮', '🎵', '📊', '✨'
] as const;

// Duration quick-select options (minutes)
export const DURATION_OPTIONS = [15, 25, 30, 45, 60, 90, 120] as const;

// Max user presets allowed
export const MAX_USER_PRESETS = 5;

// Mode display information
export const MODE_INFO: Record<SessionMode, {
  icon: string;
  title: string;
  primaryBenefit: string;
  keyCharacteristic: string;
  color: string;
  bgColor: string;
  borderColor: string;
  buttonBg: string;
}> = {
  Zen: {
    icon: '🧘',
    title: 'Zen',
    primaryBenefit: 'Gentle focus',
    keyCharacteristic: 'No penalties',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500',
    buttonBg: 'bg-emerald-500 hover:bg-emerald-600',
  },
  Flow: {
    icon: '🌊',
    title: 'Flow',
    primaryBenefit: 'Stay on track',
    keyCharacteristic: 'Delay gates',
    color: 'text-orange-500',
    bgColor: 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10',
    borderColor: 'border-orange-500',
    buttonBg: 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600',
  },
  Legend: {
    icon: '🔥',
    title: 'Legend',
    primaryBenefit: 'No escape',
    keyCharacteristic: 'Hard blocks',
    color: 'text-yellow-400',
    bgColor: 'bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-red-600/20',
    borderColor: 'border-yellow-500',
    buttonBg: 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600',
  },
};
