import React from 'react';
import { cn } from '@/lib/utils';

interface EntryOptionCardProps {
  icon: string;
  title: string;
  description: string;
  onClick: () => void;
  shortcutKey?: string;
  disabled?: boolean;
  className?: string;
}

export const EntryOptionCard: React.FC<EntryOptionCardProps> = ({
  icon,
  title,
  description,
  onClick,
  shortcutKey,
  disabled = false,
  className,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full p-4 rounded-lg border-2 transition-all text-left',
        'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-[#0a0f0d]',
        disabled
          ? 'border-zinc-700 bg-zinc-900/30 cursor-not-allowed opacity-50'
          : [
              'border-zinc-700 bg-zinc-900/30',
              'hover:border-emerald-500/50 hover:bg-emerald-500/10',
              'active:border-emerald-500 active:bg-emerald-500/20',
            ],
        className
      )}
    >
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 text-2xl">
          {icon}
        </div>

        {/* Content */}
        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={cn(
              'font-semibold',
              disabled ? 'text-zinc-500' : 'text-white'
            )}>
              {title}
            </h3>
            {shortcutKey && !disabled && (
              <span className="px-1.5 py-0.5 text-xs font-mono bg-zinc-800 text-zinc-400 rounded">
                {shortcutKey}
              </span>
            )}
          </div>
          <p className={cn(
            'text-sm',
            disabled ? 'text-zinc-600' : 'text-zinc-400'
          )}>
            {description}
          </p>
        </div>

        {/* Arrow */}
        <div className={cn(
          'flex-shrink-0 text-lg',
          disabled ? 'text-zinc-600' : 'text-zinc-500'
        )}>
          →
        </div>
      </div>
    </button>
  );
};
