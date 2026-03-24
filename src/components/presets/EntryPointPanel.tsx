import React, { useEffect, useCallback } from 'react';
import { EntryOptionCard } from './EntryOptionCard';
import { cn } from '@/lib/utils';

interface EntryPointPanelProps {
  onSelectQuickStart: () => void;
  onSelectPreset: () => void;
  onSelectCreateNew: () => void;
  onClose: () => void;
}

export const EntryPointPanel: React.FC<EntryPointPanelProps> = ({
  onSelectQuickStart,
  onSelectPreset,
  onSelectCreateNew,
  onClose,
}) => {
  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case '1':
        onSelectQuickStart();
        break;
      case '2':
        onSelectPreset();
        break;
      case '3':
        onSelectCreateNew();
        break;
      case 'Escape':
        onClose();
        break;
    }
  }, [onSelectQuickStart, onSelectPreset, onSelectCreateNew, onClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div
      className="rounded-3xl bg-[#0a0f0d]/80 backdrop-blur-xl border border-emerald-500/30 shadow-2xl transition-all duration-300"
      style={{ width: "380px" }}
    >
      <div className="flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-emerald-500/20">
          <div>
            <h2 className="text-sm uppercase tracking-wider text-emerald-400">
              START SESSION
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Choose your path
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-zinc-800/80 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 transition-colors text-sm"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Progress Bar - not needed for entry point, but keeping structure */}
        <div className="h-1 bg-zinc-900">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
            style={{ width: '100%' }}
          />
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-5 py-4 max-h-[480px]">
          <div className="mb-4">
            <h3 className="text-base font-bold text-white mb-1">How do you want to start?</h3>
            <p className="text-sm text-zinc-300">Choose the option that fits your needs</p>
          </div>

          {/* Options */}
          <div className="space-y-2">
            <EntryOptionCard
              icon="⚡"
              title="Quick Start"
              description="Smart defaults, 2 clicks to focus"
              onClick={onSelectQuickStart}
              shortcutKey="1"
            />

            <EntryOptionCard
              icon="📁"
              title="Use Preset"
              description="Start from a saved configuration"
              onClick={onSelectPreset}
              shortcutKey="2"
            />

            <EntryOptionCard
              icon="✨"
              title="Create New"
              description="Full configuration wizard"
              onClick={onSelectCreateNew}
              shortcutKey="3"
            />
          </div>

          {/* Keyboard hint */}
          <p className="text-center text-xs text-zinc-500 mt-6">
            Press <span className="font-mono bg-zinc-800 px-1 rounded">1</span>,{' '}
            <span className="font-mono bg-zinc-800 px-1 rounded">2</span>, or{' '}
            <span className="font-mono bg-zinc-800 px-1 rounded">3</span> to quick select
          </p>
        </div>
      </div>
    </div>
  );
};
