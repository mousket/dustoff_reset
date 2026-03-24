import React, { useEffect, useCallback } from 'react';
import { ModeSelector } from './ModeSelector';
import { DurationSelector } from './DurationSelector';
import { SmartDefaultsInfo } from './SmartDefaultsInfo';
import { useQuickStart } from '@/hooks/useQuickStart';
import { cn } from '@/lib/utils';
import { SessionMode, QuickStartConfig } from '@/lib/presets/types';

interface QuickStartPanelProps {
  onBack: () => void;
  onSessionStart: (config: QuickStartConfig) => void;
}

export const QuickStartPanel: React.FC<QuickStartPanelProps> = ({
  onBack,
  onSessionStart,
}) => {
  const {
    selectedMode,
    duration,
    isLoading,
    error,
    canStart,
    buttonBgColor,
    setMode,
    setDuration,
    startSession,
    clearError,
  } = useQuickStart();

  // Handle session start
  const handleStart = useCallback(async () => {
    const config = await startSession();
    if (config) {
      onSessionStart(config);
    }
  }, [startSession, onSessionStart]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case '1':
        setMode('Zen');
        break;
      case '2':
        setMode('Flow');
        break;
      case '3':
        setMode('Legend');
        break;
      case 'Escape':
        onBack();
        break;
      case 'Enter':
        if (canStart) {
          handleStart();
        }
        break;
    }
  }, [setMode, onBack, canStart, handleStart]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Get mode color for header
  const getModeColor = () => {
    if (!selectedMode) return 'text-emerald-400';
    switch (selectedMode) {
      case 'Zen': return 'text-emerald-400';
      case 'Flow': return 'text-sky-400';
      case 'Legend': return 'text-yellow-400';
    }
  };

  const getProgressColor = () => {
    if (!selectedMode) return 'bg-gradient-to-r from-emerald-500 to-emerald-400';
    switch (selectedMode) {
      case 'Zen': return 'bg-gradient-to-r from-emerald-500 to-emerald-400';
      case 'Flow': return 'bg-gradient-to-r from-sky-500 to-cyan-500';
      case 'Legend': return 'bg-gradient-to-r from-yellow-500 to-orange-500';
    }
  };

  // Get border and background styling based on mode
  const getPanelBorderAndBg = () => {
    if (selectedMode === 'Legend') {
      return 'border-yellow-500 bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-red-600/20';
    } else if (selectedMode === 'Flow') {
      return 'border-sky-500/30 bg-[#0a0f0d]/80';
    } else {
      return 'border-emerald-500/30 bg-[#0a0f0d]/80';
    }
  };

  // Get border color for dividers
  const getDividerColor = () => {
    if (selectedMode === 'Legend') {
      return 'border-yellow-500/20';
    } else if (selectedMode === 'Flow') {
      return 'border-sky-500/20';
    } else {
      return 'border-emerald-500/20';
    }
  };

  // Calculate progress (mode selected = 50%, duration set = 100%)
  const progress = selectedMode ? (duration > 0 ? 100 : 50) : 0;

  return (
    <div
      className={cn(
        "rounded-3xl backdrop-blur-xl shadow-2xl transition-all duration-300",
        getPanelBorderAndBg()
      )}
      style={{ width: "400px" }}
    >
      <div className="flex flex-col">
        {/* Header */}
        <div className={cn("flex items-center justify-between px-5 py-3 border-b", getDividerColor())}>
          <div>
            <h2 className={cn(
              'text-sm uppercase tracking-wider',
              getModeColor()
            )}>
              QUICK START
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              {selectedMode ? `Mode: ${selectedMode}` : 'Select mode & duration'}
            </p>
          </div>
          <button
            onClick={onBack}
            className="w-7 h-7 rounded-full bg-zinc-800/80 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 transition-colors text-sm"
            aria-label="Back"
          >
            ×
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-zinc-900">
          <div
            className={cn('h-full transition-all duration-500', getProgressColor())}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-5 py-4 max-h-[480px] space-y-6">
          {/* Mode Selector */}
          <ModeSelector
            selectedMode={selectedMode}
            onSelect={setMode}
            disabled={isLoading}
          />

          {/* Divider */}
          <div className={cn("border-t", getDividerColor())} />

          {/* Duration Selector */}
          <DurationSelector
            duration={duration}
            onChange={setDuration}
            disabled={isLoading}
          />

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <div className="flex items-center justify-between">
                <p className="text-sm text-red-400">{error}</p>
                <button
                  onClick={clearError}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  ×
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={cn("px-5 py-4 border-t space-y-3", getDividerColor())}>
          {/* Start Button */}
          <button
            onClick={handleStart}
            disabled={!canStart}
            className={cn(
              'w-full py-3 px-6 rounded-lg font-semibold text-white transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-[#0a0f0d]',
              canStart
                ? [buttonBgColor, 'focus:ring-current']
                : 'bg-zinc-700 cursor-not-allowed opacity-50'
            )}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span>
                Starting...
              </span>
            ) : (
              'Start Session'
            )}
          </button>

          {/* Smart Defaults Info */}
          <SmartDefaultsInfo />

          {/* Keyboard hint */}
          <p className="text-center text-xs text-zinc-500">
            Press <span className="font-mono bg-zinc-800 px-1 rounded">Enter</span> to start,{' '}
            <span className="font-mono bg-zinc-800 px-1 rounded">Esc</span> to go back
          </p>
        </div>
      </div>
    </div>
  );
};
