import React from 'react';
import { cn } from '@/lib/utils';
import { SessionMode, MODE_INFO } from '@/lib/presets/types';

interface ModeCardProps {
  mode: SessionMode;
  isSelected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export const ModeCard: React.FC<ModeCardProps> = ({
  mode,
  isSelected,
  onClick,
  disabled = false,
}) => {
  const info = MODE_INFO[mode];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative flex flex-col items-center p-4 rounded-lg border-2 transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0a0f0d]',
        disabled && 'opacity-50 cursor-not-allowed',
        isSelected
          ? [
              info.borderColor,
              info.bgColor,
              'focus:ring-current',
            ]
          : [
              'border-zinc-700 bg-zinc-900/30',
              'hover:border-zinc-600 hover:bg-zinc-900/50',
              'focus:ring-emerald-500',
            ]
      )}
    >
      {/* Selected indicator */}
      {isSelected && (
        <div className={cn(
          'absolute top-2 right-2 w-5 h-5 rounded-full',
          'flex items-center justify-center text-xs',
          info.color,
          info.bgColor
        )}>
          ✓
        </div>
      )}

      {/* Icon */}
      <span className="text-3xl mb-2">{info.icon}</span>

      {/* Title */}
      <h3 className={cn(
        'font-semibold text-base',
        isSelected ? info.color : 'text-white'
      )}>
        {info.title}
      </h3>

      {/* Benefits */}
      <p className="text-xs text-zinc-400 mt-1 text-center">
        {info.primaryBenefit}
      </p>
      <p className="text-xs text-zinc-500 text-center">
        {info.keyCharacteristic}
      </p>
    </button>
  );
};
