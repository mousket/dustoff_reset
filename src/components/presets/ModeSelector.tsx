import React from 'react';
import { ModeCard } from './ModeCard';
import { SessionMode } from '@/lib/presets/types';

interface ModeSelectorProps {
  selectedMode: SessionMode | null;
  onSelect: (mode: SessionMode) => void;
  disabled?: boolean;
}

const MODES: SessionMode[] = ['Zen', 'Flow', 'Legend'];

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  selectedMode,
  onSelect,
  disabled = false,
}) => {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-white mb-1">Choose Your Mode</h3>
      {/*<p className="text-sm text-zinc-300 mb-4">Select your focus intensity</p>*/}
      
      <div className="grid grid-cols-3 gap-3">
        {MODES.map((mode) => (
          <ModeCard
            key={mode}
            mode={mode}
            isSelected={selectedMode === mode}
            onClick={() => onSelect(mode)}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
};
