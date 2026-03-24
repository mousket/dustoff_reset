import React from 'react';
import { cn } from '@/lib/utils';
import { SessionPreset, MODE_INFO } from '@/lib/presets/types';
import { PresetCardMenu } from './PresetCardMenu';

interface PresetCardProps {
  preset: SessionPreset;
  variant?: 'user' | 'default' | 'lastSession';
  onStart: (preset: SessionPreset) => void;
  onEdit?: (preset: SessionPreset) => void;
  onDelete?: (preset: SessionPreset) => void;
  isLoading?: boolean;
  showAppPreview?: boolean;
}

export const PresetCard: React.FC<PresetCardProps> = ({
  preset,
  variant = 'user',
  onStart,
  onEdit,
  onDelete,
  isLoading = false,
  showAppPreview = false,
}) => {
  const modeInfo = MODE_INFO[preset.mode];
  const isLastSession = variant === 'lastSession';
  const isDefault = variant === 'default';
  const canEdit = variant === 'user' && onEdit;
  const canDelete = variant === 'user' && onDelete;
  const showMenu = canEdit || canDelete;

  const handleStart = () => {
    if (!isLoading) {
      onStart(preset);
    }
  };

  // Format app preview text
  const appPreview = showAppPreview && preset.whitelistedApps.length > 0
    ? preset.whitelistedApps.slice(0, 3).join(', ') + 
      (preset.whitelistedApps.length > 3 ? '...' : '')
    : null;

  return (
    <div
      className={cn(
        'flex items-center gap-4 p-4 rounded-xl border transition-all duration-150',
        'hover:border-zinc-600',
        isLastSession
          ? 'bg-cyan-500/5 border-cyan-500/30 hover:border-cyan-500/50'
          : 'bg-zinc-800/30 border-zinc-700',
        isDefault && 'opacity-90'
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-xl',
          isLastSession ? 'bg-cyan-500/20' : 'bg-zinc-700/50'
        )}
      >
        {preset.icon}
      </div>

      {/* Content */}
      <div className="flex-grow min-w-0">
        {/* Name */}
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-white truncate">
            {preset.name}
          </h4>
          {isLastSession && (
            <span className="px-1.5 py-0.5 text-xs bg-cyan-500/20 text-cyan-400 rounded">
              Recent
            </span>
          )}
        </div>

        {/* Mode and Duration */}
        <div className="flex items-center gap-2 mt-0.5">
          <span
            className={cn(
              'text-xs font-medium px-1.5 py-0.5 rounded',
              modeInfo.bgColor,
              modeInfo.color
            )}
          >
            {modeInfo.title}
          </span>
          <span className="text-xs text-zinc-500">•</span>
          <span className="text-xs text-zinc-400">
            {preset.durationMinutes} min
          </span>
        </div>

        {/* App Preview (for Last Session) */}
        {appPreview && (
          <p className="text-xs text-zinc-500 mt-1 truncate">
            {appPreview}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* More Menu */}
        {showMenu && (
          <PresetCardMenu
            presetName={preset.name}
            onEdit={() => onEdit?.(preset)}
            onDelete={() => onDelete?.(preset)}
          />
        )}

        {/* Start Button */}
        <button
          onClick={handleStart}
          disabled={isLoading}
          className={cn(
            'px-4 py-2 rounded-lg font-medium text-sm text-white transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900',
            isLoading
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-cyan-500 hover:bg-cyan-600 focus:ring-cyan-500'
          )}
        >
          {isLoading ? (
            <span className="flex items-center gap-1">
              <span className="animate-spin text-xs">⏳</span>
            </span>
          ) : (
            'Start'
          )}
        </button>
      </div>
    </div>
  );
};
