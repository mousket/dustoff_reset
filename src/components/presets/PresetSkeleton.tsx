import React from 'react';
import { cn } from '@/lib/utils';

interface PresetSkeletonProps {
  count?: number;
}

export const PresetSkeleton: React.FC<PresetSkeletonProps> = ({ 
  count = 1 
}) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse flex items-center gap-4 p-4 rounded-xl bg-zinc-800/50 border border-zinc-700"
        >
          {/* Icon skeleton */}
          <div className="w-10 h-10 rounded-lg bg-zinc-700" />

          {/* Content skeleton */}
          <div className="flex-grow space-y-2">
            {/* Name */}
            <div className="h-4 w-32 rounded bg-zinc-700" />
            {/* Mode and duration */}
            <div className="h-3 w-24 rounded bg-zinc-700/70" />
          </div>

          {/* Button skeleton */}
          <div className="h-8 w-16 rounded-lg bg-zinc-700" />
        </div>
      ))}
    </>
  );
};
