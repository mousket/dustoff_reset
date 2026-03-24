import React from 'react';
import { cn } from '@/lib/utils';

interface PresetSectionProps {
  title: string;
  badge?: number;
  children: React.ReactNode;
  hidden?: boolean;
  className?: string;
}

export const PresetSection: React.FC<PresetSectionProps> = ({
  title,
  badge,
  children,
  hidden = false,
  className,
}) => {
  if (hidden) return null;

  return (
    <section className={cn('space-y-3', className)}>
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          {title}
        </h3>
        {badge !== undefined && badge > 0 && (
          <span className="px-1.5 py-0.5 text-xs font-medium bg-zinc-800 text-zinc-300 rounded-full">
            {badge}
          </span>
        )}
      </div>

      {/* Section Content */}
      <div className="space-y-2">
        {children}
      </div>
    </section>
  );
};
