import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface SmartDefaultsInfoProps {
  className?: string;
}

export const SmartDefaultsInfo: React.FC<SmartDefaultsInfoProps> = ({
  className,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className={cn('text-center', className)}>
      <p className="text-xs text-zinc-500">
        Using smart defaults: productivity apps allowed, social media & games blocked.{' '}
        <button
          onClick={() => setShowDetails(true)}
          className="text-emerald-400 hover:text-emerald-300 underline"
        >
          Learn more
        </button>
      </p>

      {/* Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-[#0a0f0d]/95 backdrop-blur-xl rounded-3xl p-6 max-w-md w-full border border-emerald-500/30 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-4">
              Smart Defaults
            </h3>
            
            <p className="text-sm text-zinc-300 mb-4">
              Quick Start uses intelligent defaults so you can start working immediately.
            </p>

            <div className="space-y-3 text-sm">
              <div>
                <h4 className="font-medium text-emerald-400 mb-1">✅ Allowed:</h4>
                <p className="text-zinc-400">
                  VS Code, Terminal, Slack, Notion, Chrome, and other productivity apps.
                  Sites like github.com, docs.google.com, notion.so.
                </p>
              </div>

              <div>
                <h4 className="font-medium text-red-400 mb-1">❌ Blocked:</h4>
                <p className="text-zinc-400">
                  Social media (Twitter, Instagram, TikTok), games (Steam, Epic Games),
                  entertainment (Netflix, Twitch).
                </p>
              </div>

              <div>
                <h4 className="font-medium text-yellow-400 mb-1">⚠️ Unknown:</h4>
                <p className="text-zinc-400">
                  Apps we don't recognize will ask "Is this for work?" The system learns
                  from your choices.
                </p>
              </div>
            </div>

            <p className="text-xs text-zinc-500 mt-4">
              Want full control? Use "Create New" instead.
            </p>

            <button
              onClick={() => setShowDetails(false)}
              className={cn(
                'mt-4 w-full py-2 px-4 rounded-lg',
                'bg-zinc-800 text-zinc-200',
                'hover:bg-zinc-700 transition-colors'
              )}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
