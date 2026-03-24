import React from 'react';
import { cn } from '@/lib/utils';
import { PRESET_ICONS } from '@/lib/presets/types';

interface IconPickerProps {
  selectedIcon: string;
  onSelect: (icon: string) => void;
}

export const IconPicker: React.FC<IconPickerProps> = ({
  selectedIcon,
  onSelect,
}) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">
        Icon
      </label>
      <div className="flex flex-wrap gap-2">
        {PRESET_ICONS.map((icon) => (
          <button
            key={icon}
            type="button"
            onClick={() => onSelect(icon)}
            className={cn(
              'w-10 h-10 rounded-lg text-xl',
              'flex items-center justify-center',
              'transition-all duration-150',
              'focus:outline-none focus:ring-2 focus:ring-cyan-500',
              selectedIcon === icon
                ? 'bg-cyan-500/20 border-2 border-cyan-500'
                : 'bg-gray-700 border-2 border-transparent hover:border-gray-600'
            )}
            aria-label={`Select ${icon} icon`}
            aria-pressed={selectedIcon === icon}
          >
            {icon}
          </button>
        ))}
      </div>
    </div>
  );
};
