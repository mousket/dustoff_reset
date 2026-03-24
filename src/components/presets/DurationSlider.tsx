import React from 'react';
import { cn } from '@/lib/utils';

interface DurationSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}

export const DurationSlider: React.FC<DurationSliderProps> = ({
  value,
  onChange,
  min = 5,
  max = 120,
  step = 5,
  disabled = false,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value));
  };

  // Calculate percentage for custom styling
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className={cn(
            'w-full h-2 rounded-full appearance-none cursor-pointer',
            'bg-zinc-800',
            'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-[#0a0f0d]',
            disabled && 'opacity-50 cursor-not-allowed',
            // Custom thumb styling
            '[&::-webkit-slider-thumb]:appearance-none',
            '[&::-webkit-slider-thumb]:w-5',
            '[&::-webkit-slider-thumb]:h-5',
            '[&::-webkit-slider-thumb]:rounded-full',
            '[&::-webkit-slider-thumb]:bg-emerald-500',
            '[&::-webkit-slider-thumb]:cursor-pointer',
            '[&::-webkit-slider-thumb]:transition-transform',
            '[&::-webkit-slider-thumb]:hover:scale-110',
            // Firefox
            '[&::-moz-range-thumb]:w-5',
            '[&::-moz-range-thumb]:h-5',
            '[&::-moz-range-thumb]:rounded-full',
            '[&::-moz-range-thumb]:bg-emerald-500',
            '[&::-moz-range-thumb]:border-0',
            '[&::-moz-range-thumb]:cursor-pointer',
          )}
          style={{
            background: `linear-gradient(to right, #10b981 0%, #10b981 ${percentage}%, #27272a ${percentage}%, #27272a 100%)`,
          }}
        />
      </div>
      
      {/* Min/Max labels */}
      <div className="flex justify-between text-xs text-zinc-500">
        <span>{min} min</span>
        <span>{max} min</span>
      </div>
    </div>
  );
};
