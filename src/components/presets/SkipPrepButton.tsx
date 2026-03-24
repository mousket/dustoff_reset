import React from 'react';
import { cn } from '@/lib/utils';

interface SkipPrepButtonProps {
  onSkip: () => void;
  disabled?: boolean;
  className?: string;
}

export const SkipPrepButton: React.FC<SkipPrepButtonProps> = ({
  onSkip,
  disabled = false,
  className,
}) => {
  return (
    <div className={cn('pt-4 border-t border-gray-800', className)}>
      <button
        onClick={onSkip}
        disabled={disabled}
        className={cn(
          'w-full py-2 text-sm text-gray-500',
          'transition-colors duration-150',
          'hover:text-gray-300',
          'focus:outline-none focus:text-gray-300',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        Skip – I'm ready to start
      </button>
    </div>
  );
};
