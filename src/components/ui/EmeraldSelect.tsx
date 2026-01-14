// src/components/ui/EmeraldSelect.tsx
// Emerald Contour styled select/dropdown component

import { useState, useRef, useEffect } from "react"

export interface SelectOption {
  value: string | number
  label: string
  icon?: string
  description?: string
}

interface EmeraldSelectProps {
  value: string | number
  onChange: (value: string | number) => void
  options: SelectOption[]
  placeholder?: string
  size?: "sm" | "md" | "lg"
  variant?: "default" | "compact" | "minimal"
  className?: string
  disabled?: boolean
}

export function EmeraldSelect({
  value,
  onChange,
  options,
  placeholder = "Select...",
  size = "md",
  variant = "default",
  className = "",
  disabled = false,
}: EmeraldSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const selectedOption = options.find((opt) => opt.value === value)

  // Size classes
  const sizeClasses = {
    sm: "px-2.5 py-1.5 text-xs",
    md: "px-3 py-2 text-sm",
    lg: "px-4 py-2.5 text-sm",
  }

  const dropdownItemSizes = {
    sm: "px-2.5 py-2 text-xs",
    md: "px-3 py-2.5 text-sm",
    lg: "px-4 py-3 text-sm",
  }

  // Variant classes
  const variantClasses = {
    default: "bg-emerald-500/5 border-emerald-500/30 focus-within:border-emerald-500/60 focus-within:bg-emerald-500/10",
    compact: "bg-zinc-800/60 border-zinc-700/50 focus-within:border-emerald-500/50",
    minimal: "bg-transparent border-transparent hover:bg-emerald-500/5 hover:border-emerald-500/20",
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between gap-2 
          border rounded-xl transition-all cursor-pointer
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          ${isOpen ? "border-emerald-500/60 bg-emerald-500/10" : ""}
        `}
      >
        <div className="flex items-center gap-2 min-w-0">
          {/* Emerald dot indicator */}
          {variant === "default" && (
            <div className={`w-1.5 h-1.5 rounded-full transition-colors ${
              isOpen ? "bg-emerald-400" : "bg-emerald-500/50"
            }`} />
          )}
          
          {selectedOption?.icon && (
            <span className="flex-shrink-0">{selectedOption.icon}</span>
          )}
          
          <span className={`truncate ${selectedOption ? "text-white" : "text-zinc-500"}`}>
            {selectedOption?.label || placeholder}
          </span>
        </div>
        
        {/* Chevron */}
        <svg 
          className={`w-4 h-4 text-emerald-500/50 transition-transform flex-shrink-0 ${isOpen ? "rotate-180" : ""}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-black/80 backdrop-blur-xl border border-emerald-500/20 rounded-xl overflow-hidden shadow-lg shadow-emerald-500/5 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="max-h-48 overflow-y-auto scrollbar-hide">
            {options.map((option, index) => {
              const isSelected = option.value === value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value)
                    setIsOpen(false)
                  }}
                  className={`
                    w-full flex items-center gap-2 text-left transition-colors
                    ${dropdownItemSizes[size]}
                    ${isSelected 
                      ? "bg-emerald-500/15 text-emerald-300" 
                      : "text-zinc-200 hover:bg-emerald-500/10"
                    }
                    ${index < options.length - 1 ? "border-b border-dashed border-emerald-500/10" : ""}
                  `}
                >
                  {option.icon && (
                    <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-xs bg-emerald-500/10 rounded">
                      {option.icon}
                    </span>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="truncate">{option.label}</div>
                    {option.description && (
                      <div className="text-xs text-zinc-500 truncate">{option.description}</div>
                    )}
                  </div>
                  
                  {isSelected && (
                    <span className="text-emerald-400 ml-auto flex-shrink-0">✓</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// Compact status select for inline use (like parking lot items)
interface EmeraldStatusSelectProps {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string; color?: string }[]
  className?: string
}

export function EmeraldStatusSelect({
  value,
  onChange,
  options,
  className = "",
}: EmeraldStatusSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const selectedOption = options.find((opt) => opt.value === value)
  
  const getStatusColor = (optValue: string) => {
    switch (optValue) {
      case "in-progress":
        return "text-cyan-400 bg-cyan-500/10 border-cyan-500/30"
      case "done":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
      default:
        return "text-zinc-400 bg-zinc-800/60 border-zinc-700/50"
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          px-2 py-1 text-xs rounded-lg border transition-all cursor-pointer
          ${getStatusColor(value)}
          hover:border-emerald-500/50
        `}
      >
        {selectedOption?.label || value}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 z-50 min-w-[100px] bg-black/90 backdrop-blur-xl border border-emerald-500/20 rounded-lg overflow-hidden shadow-lg shadow-emerald-500/5">
          {options.map((option) => {
            const isSelected = option.value === value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
                className={`
                  w-full px-3 py-2 text-xs text-left transition-colors
                  ${isSelected 
                    ? "bg-emerald-500/15 text-emerald-300" 
                    : "text-zinc-300 hover:bg-emerald-500/10"
                  }
                `}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
