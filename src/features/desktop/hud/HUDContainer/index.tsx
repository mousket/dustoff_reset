
import type { ReactNode } from "react"

interface HUDContainerProps {
  children: ReactNode
  className?: string
}

export function HUDContainer({ children, className = "" }: HUDContainerProps) {
  return (
    <div className={`min-h-screen bg-gradient-to-br from-[#0a0f0d] via-[#0d1512] to-[#0a0f0d] relative ${className}`}>
      {/* Background Pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, #10B981 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  )
}
