// src/components/permissions/PermissionSetup.tsx

import React, { useEffect, useState } from 'react'
import { usePermissions } from '@/hooks/usePermissions'
import { PanelContainer } from '@/components/PanelContainer'
import { resizeForPanel } from '@/hooks/useTauriWindow'
import { X, Shield, Settings, CheckCircle, AlertTriangle } from 'lucide-react'

interface PermissionSetupProps {
  onComplete: () => void
  onSkip?: () => void
}

export const PermissionSetup: React.FC<PermissionSetupProps> = ({
  onComplete,
  onSkip,
}) => {
  const {
    permissionState,
    isLoading,
    isGranted,
    platformName,
    checkPermissions,
    openSettings,
  } = usePermissions()
  
  const [isChecking, setIsChecking] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)
  const [checkFailed, setCheckFailed] = useState(false)

  // Auto-complete when permissions are granted
  useEffect(() => {
    if (isGranted && !isLoading) {
      onComplete()
    }
  }, [isGranted, isLoading, onComplete])

  // Poll for permission changes when user might be in settings
  useEffect(() => {
    if (showInstructions) {
      const interval = setInterval(() => {
        checkPermissions()
      }, 2000)
      
      return () => clearInterval(interval)
    }
  }, [showInstructions, checkPermissions])

  // Resize window when instructions appear (expanded state)
  useEffect(() => {
    if (showInstructions) {
      resizeForPanel('permissionSetupExpanded')
    }
  }, [showInstructions])

  const handleOpenSettings = async () => {
    setShowInstructions(true)
    await openSettings()
  }

  const handleCheckAgain = async () => {
    setIsChecking(true)
    setCheckFailed(false)
    await checkPermissions()
    setIsChecking(false)
    // If still not granted after check, show feedback
    // Small delay to let state update
    setTimeout(() => {
      if (!isGranted) {
        setCheckFailed(true)
      }
    }, 100)
  }

  if (isLoading) {
    return (
      <PanelContainer isOpen={true}>
        <div 
          className="rounded-3xl bg-[#0a0f0d]/55 backdrop-blur-xl border border-cyan-500/30 shadow-2xl"
          style={{ width: '400px' }}
        >
          <div className="p-8 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-cyan-400 border-t-transparent" />
            <p className="mt-4 text-zinc-400 text-sm">Checking permissions...</p>
          </div>
        </div>
      </PanelContainer>
    )
  }

  return (
    <PanelContainer isOpen={true}>
      <div 
        className="rounded-3xl bg-[#0a0f0d]/55 backdrop-blur-xl border border-cyan-500/30 shadow-2xl"
        style={{ width: '400px' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-cyan-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Setup Required</h3>
              <p className="text-xs text-zinc-500">{platformName}</p>
            </div>
          </div>
          {onSkip && (
            <button
              onClick={onSkip}
              className="w-7 h-7 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 flex items-center justify-center text-zinc-400 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="px-5 py-4 space-y-3">
          {/* Main Message */}
          {isGranted ? (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/20 border border-green-500/30">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
              <p className="text-sm font-medium text-green-400">All set! You're ready to go.</p>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/20 border border-amber-500/40">
              <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-300">Accessibility Permission</p>
                <p className="text-sm text-zinc-300 mt-1.5 leading-relaxed">
                  Required to detect active apps<br/>
                  and block distractions.
                </p>
              </div>
            </div>
          )}

          {/* Instructions (shown after opening settings) */}
          {showInstructions && !isGranted && (
            <div className="space-y-2 text-xs text-zinc-400">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] flex items-center justify-center flex-shrink-0">1</span>
                <span>Privacy & Security → Accessibility</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] flex items-center justify-center flex-shrink-0">2</span>
                <span>Find & enable "Dustoff Reset"</span>
              </div>
            </div>
          )}

          {/* Check failed feedback */}
          {checkFailed && !isGranted && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
              <p className="text-xs text-amber-300">
                Permission not detected. If you've enabled it, try:
              </p>
              <ul className="text-xs text-zinc-400 list-disc ml-4 space-y-1">
                <li>Make sure "Dustoff Reset" is toggled ON</li>
                <li>Try clicking "Check Again" one more time</li>
              </ul>
              <button
                onClick={onComplete}
                className="w-full mt-2 py-2 px-3 rounded-lg bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 text-green-400 text-xs font-medium transition-colors"
              >
                I've enabled it — Proceed Anyway
              </button>
            </div>
          )}

          {/* Privacy note */}
          {!showInstructions && !isGranted && (
            <p className="text-[11px] text-zinc-500">
              Data stays on your device. Nothing is sent anywhere.
            </p>
          )}
        </div>

        {/* Footer / Actions */}
        <div className="px-5 pb-4 space-y-2">
          {!isGranted && (
            <>
              <button
                onClick={handleOpenSettings}
                className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-medium text-sm transition-colors flex items-center justify-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Open System Settings
              </button>
              
              {showInstructions && (
                <button
                  onClick={handleCheckAgain}
                  disabled={isChecking}
                  className="w-full py-2.5 px-4 rounded-xl bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-200 text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isChecking ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-zinc-400 border-t-transparent" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      I've Enabled It — Check Again
                    </>
                  )}
                </button>
              )}
              
              {onSkip && (
                <button
                  onClick={onSkip}
                  className="w-full py-2 text-zinc-500 text-xs hover:text-zinc-400 transition-colors"
                >
                  Skip for now (limited functionality)
                </button>
              )}
            </>
          )}
          
          {isGranted && (
            <button
              onClick={onComplete}
              className="w-full py-2.5 px-4 rounded-xl bg-green-500 hover:bg-green-400 text-black font-medium text-sm transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Continue
            </button>
          )}
        </div>
      </div>
    </PanelContainer>
  )
}
