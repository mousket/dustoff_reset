// src/components/PanelContainer.tsx
// Wraps any panel with consistent styling and animation
// Matches the panel styling from docs/specs/14_ui_architecture.md

import { ReactNode } from 'react'

interface PanelContainerProps {
  children: ReactNode
  isOpen: boolean
  width?: number  // pixels
  className?: string
}

export function PanelContainer({ 
  children, 
  isOpen,
  width = 600,
  className = '',
}: PanelContainerProps) {
  if (!isOpen) return null
  
  return (
    <div className="mt-3">
      <div 
        className={`
          rounded-3xl 
          bg-[#0a0f0d]/95 
          backdrop-blur-xl 
          border 
          border-[#2f4a42]/40 
          shadow-2xl 
          overflow-hidden
          transition-all 
          duration-300
          animate-in
          fade-in
          slide-in-from-bottom-2
          ${className}
        `}
        style={{ width: `${width}px` }}
      >
        {children}
      </div>
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
