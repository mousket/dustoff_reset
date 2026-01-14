// src/components/PanelContainer.tsx
// Handles ONLY positioning and animation for panels
// The actual panel components provide their own glassmorphism styling

import { ReactNode } from 'react'

interface PanelContainerProps {
  children: ReactNode
  isOpen: boolean
  className?: string
}

/**
 * PanelContainer
 * 
 * A minimal wrapper that ONLY handles:
 * - Visibility (isOpen)
 * - Margin from HUD (mt-3)
 * - Entry animation
 * 
 * It does NOT add:
 * - Background
 * - Border
 * - Shadow
 * - Border radius
 * 
 * Those are the responsibility of the child panel component.
 */
export function PanelContainer({ 
  children, 
  isOpen,
  className = '',
}: PanelContainerProps) {
  if (!isOpen) return null
  
  return (
    <div 
      className={`
        mt-3
        animate-in
        fade-in
        slide-in-from-bottom-2
        duration-300
        ${className}
      `}
    >
      {children}
    </div>
  )
}

// Panel header component for consistent header styling
interface PanelHeaderProps {
  title: string
  onClose: () => void
  subtitle?: string
}

export function PanelHeader({ title, onClose, subtitle }: PanelHeaderProps) {
  return (
    <div className="flex justify-between items-start p-6 pb-0">
      <div>
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        {subtitle && (
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        )}
      </div>
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-white transition-colors p-1 -mt-1 -mr-1"
        aria-label="Close panel"
      >
        <svg 
          className="w-5 h-5" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M6 18L18 6M6 6l12 12" 
          />
        </svg>
      </button>
    </div>
  )
}

// Panel content wrapper with consistent padding
interface PanelContentProps {
  children: ReactNode
  className?: string
}

export function PanelContent({ children, className = '' }: PanelContentProps) {
  return (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  )
}

// Panel footer for action buttons
interface PanelFooterProps {
  children: ReactNode
  className?: string
}

export function PanelFooter({ children, className = '' }: PanelFooterProps) {
  return (
    <div className={`px-6 pb-6 pt-2 flex gap-3 ${className}`}>
      {children}
    </div>
  )
}

export type { PanelContainerProps, PanelHeaderProps, PanelContentProps, PanelFooterProps }
