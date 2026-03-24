import React from 'react';
import { cn } from '@/lib/utils';

interface EmptyPresetsProps {
  variant: 'user' | 'all';
  className?: string;
}

export const EmptyPresets: React.FC<EmptyPresetsProps> = ({
  variant,
  className,
}) => {
  return (
    <div
      className={cn(
        'p-6 rounded-xl border-2 border-dashed border-zinc-700 text-center',
        className
      )}
    >
      {variant === 'user' ? (
        <>
          <p className="text-zinc-400 mb-1">
            No saved presets yet
          </p>
          <p className="text-sm text-zinc-500">
            Use "Create New" to build and save your own preset!
          </p>
        </>
      ) : (
        <>
          <p className="text-zinc-400 mb-1">
            No presets available
          </p>
          <p className="text-sm text-zinc-500">
            Something went wrong loading presets.
          </p>
        </>
      )}
    </div>
  );
};
