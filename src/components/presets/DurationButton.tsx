import React from 'react';
import { cn } from '@/lib/utils';

interface DurationButtonProps {
  minutes: number;
  isSelected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export const DurationButton: React.FC<DurationButtonProps> = ({
  minutes,
  isSelected,
  onClick,
  disabled = false,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'px-3 py-2 rounded-lg font-medium text-sm transition-all duration-150',
        'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 focus:ring-offset-[#0a0f0d]',
        disabled && 'opacity-50 cursor-not-allowed',
        isSelected
          ? 'bg-emerald-500 text-white'
          : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
      )}
    >
      {minutes}
    </button>
  );
};
