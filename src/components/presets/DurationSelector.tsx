import React from 'react';
import { DurationButton } from './DurationButton';
import { DurationSlider } from './DurationSlider';
import { DURATION_OPTIONS } from '@/lib/presets/types';

interface DurationSelectorProps {
  duration: number;
  onChange: (minutes: number) => void;
  disabled?: boolean;
}

export const DurationSelector: React.FC<DurationSelectorProps> = ({
  duration,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-bold text-white mb-1">Set Duration</h3>
        {/*<p className="text-sm text-zinc-300">How long will you focus?</p>*/}
      </div>

      {/* Quick select buttons */}
      <div className="flex flex-wrap gap-2">
        {DURATION_OPTIONS.map((minutes) => (
          <DurationButton
            key={minutes}
            minutes={minutes}
            isSelected={duration === minutes}
            onClick={() => onChange(minutes)}
            disabled={disabled}
          />
        ))}
       {/*<span className="flex items-center text-sm text-zinc-400 ml-1">
          minutes
        </span>  */}
      </div>

      {/* Slider */}
      <DurationSlider
        value={duration}
        onChange={onChange}
        disabled={disabled}
      />

      {/* Current value display */}
      <div className="text-center">
        <span className="text-2xl font-bold text-white">{duration}</span>
        <span className="text-zinc-400 ml-2">minutes</span>
      </div>
    </div>
  );
};
