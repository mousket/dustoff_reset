import React from 'react';
import { cn } from '@/lib/utils';
import { SessionMode, MODE_INFO } from '@/lib/presets/types';

interface ConfigurationSummaryProps {
  mode: SessionMode;
  durationMinutes: number;
  whitelistedApps: string[];
  whitelistedDomains: string[];
  className?: string;
}

export const ConfigurationSummary: React.FC<ConfigurationSummaryProps> = ({
  mode,
  durationMinutes,
  whitelistedApps,
  whitelistedDomains,
  className,
}) => {
  const modeInfo = MODE_INFO[mode];

  // Format list with "and X more"
  const formatList = (items: string[], max: number = 3): string => {
    if (items.length === 0) return 'None selected';
    if (items.length <= max) return items.join(', ');
    const shown = items.slice(0, max).join(', ');
    const remaining = items.length - max;
    return `${shown}, and ${remaining} more`;
  };

  return (
    <div className={cn('space-y-2 text-sm', className)}>
      {/* Mode */}
      <div className="flex items-center gap-2">
        <span className="text-gray-500">Mode:</span>
        <span
          className={cn(
            'px-1.5 py-0.5 rounded text-xs font-medium',
            modeInfo.bgColor,
            modeInfo.color
          )}
        >
          {modeInfo.title}
        </span>
      </div>

      {/* Duration */}
      <div className="flex items-center gap-2">
        <span className="text-gray-500">Duration:</span>
        <span className="text-gray-200">{durationMinutes} min</span>
      </div>

      {/* Apps */}
      <div className="flex items-start gap-2">
        <span className="text-gray-500 flex-shrink-0">Apps:</span>
        <span className="text-gray-200">{formatList(whitelistedApps)}</span>
      </div>

      {/* Domains */}
      <div className="flex items-start gap-2">
        <span className="text-gray-500 flex-shrink-0">Sites:</span>
        <span className="text-gray-200">{formatList(whitelistedDomains)}</span>
      </div>
    </div>
  );
};
