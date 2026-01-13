// src/components/animations/TimerHalo.tsx
// Timer halo animation component

import { ReactNode } from 'react'

interface TimerHaloProps {
  children: ReactNode
  variant?: 'pulse-ring' | 'glow' | 'minimal'
  color?: 'emerald' | 'cyan' | 'amber' | 'red'
  size?: number
  progress?: number // 0-1
  className?: string
}

const colorMap = {
  emerald: {
    ring: 'border-emerald-500',
    glow: 'shadow-emerald-500/30',
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/20',
  },
  cyan: {
    ring: 'border-cyan-500',
    glow: 'shadow-cyan-500/30',
    text: 'text-cyan-400',
    bg: 'bg-cyan-500/20',
  },
  amber: {
    ring: 'border-amber-500',
    glow: 'shadow-amber-500/30',
    text: 'text-amber-400',
    bg: 'bg-amber-500/20',
  },
  red: {
    ring: 'border-red-500',
    glow: 'shadow-red-500/30',
    text: 'text-red-400',
    bg: 'bg-red-500/20',
  },
}

export function TimerHalo({
  children,
  variant = 'pulse-ring',
  color = 'emerald',
  size = 120,
  progress = 0,
  className = '',
}: TimerHaloProps) {
  const colors = colorMap[color]
  
  // Calculate the stroke dash for progress ring
  const radius = (size / 2) - 8
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - progress)
  
  return (
    <div 
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Background ring */}
      <div 
        className={`absolute inset-0 rounded-full border-4 border-zinc-800 ${colors.bg}`}
      />
      
      {/* Progress ring (SVG) */}
      {variant === 'pulse-ring' && (
        <svg 
          className="absolute inset-0 -rotate-90"
          style={{ width: size, height: size }}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            className={colors.text}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset,
              transition: 'stroke-dashoffset 0.5s ease',
            }}
          />
        </svg>
      )}
      
      {/* Glow effect */}
      {variant === 'glow' && (
        <div 
          className={`absolute inset-2 rounded-full blur-xl ${colors.bg} animate-pulse`}
        />
      )}
      
      {/* Pulse animation for pulse-ring */}
      {variant === 'pulse-ring' && (
        <div 
          className={`absolute inset-0 rounded-full border-2 ${colors.ring} opacity-30 animate-ping`}
          style={{ animationDuration: '2s' }}
        />
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}

export type { TimerHaloProps }
