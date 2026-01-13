import type React from "react"
import { useState, useRef, useEffect, type ReactNode } from "react"

interface DraggableContainerProps {
  children: ReactNode
  initialX?: number
  initialY?: number
  hasPanel?: boolean
  onPositionChange?: (position: { x: number; y: number }) => void
}

export function DraggableContainer({
  children,
  initialX,
  initialY = 20,
  hasPanel = false,
  onPositionChange,
}: DraggableContainerProps) {
  const [position, setPosition] = useState({
    x: initialX ?? window.innerWidth - 340,
    y: initialY,
  })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [hasBeenManuallyMoved, setHasBeenManuallyMoved] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (initialX === undefined) {
      setPosition({ x: window.innerWidth - 340, y: initialY })
    }
  }, [initialX, initialY])

  useEffect(() => {
    if (hasBeenManuallyMoved || !containerRef.current) return

    const EDGE_MARGIN = 60 // Minimum distance from screen edges

    const checkAndAdjustPosition = () => {
      if (!containerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      const windowWidth = window.innerWidth

      // Calculate ideal centered position
      const centeredX = (windowWidth - rect.width) / 2

      // Check if we need adjustment
      let newX = position.x

      // If left edge is off screen or too close
      if (rect.left < EDGE_MARGIN) {
        newX = EDGE_MARGIN
      }
      // If right edge is off screen or too close
      else if (rect.right > windowWidth - EDGE_MARGIN) {
        newX = windowWidth - rect.width - EDGE_MARGIN
      }
      // If container is wider than 800px (has panels open), center it
      else if (rect.width > 800) {
        newX = Math.max(EDGE_MARGIN, centeredX)
      }

      if (Math.abs(newX - position.x) > 5) {
        setPosition((prev) => ({ ...prev, x: newX }))
      }
    }

    // Initial check
    checkAndAdjustPosition()

    // Watch for size changes
    const resizeObserver = new ResizeObserver(() => {
      checkAndAdjustPosition()
    })

    resizeObserver.observe(containerRef.current)

    // Watch for window resize
    const handleWindowResize = () => {
      checkAndAdjustPosition()
    }
    window.addEventListener("resize", handleWindowResize)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener("resize", handleWindowResize)
    }
  }, [hasBeenManuallyMoved])

  useEffect(() => {
    if (onPositionChange) {
      onPositionChange(position)
    }
  }, [position, onPositionChange])

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      const EDGE_MARGIN = 60

      let newX = e.clientX - dragOffset.x
      let newY = e.clientY - dragOffset.y

      // Constrain X position
      newX = Math.max(EDGE_MARGIN, newX)
      newX = Math.min(window.innerWidth - rect.width - EDGE_MARGIN, newX)

      // Constrain Y position
      newY = Math.max(20, newY)
      newY = Math.min(window.innerHeight - rect.height - 20, newY)

      setPosition({ x: newX, y: newY })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setHasBeenManuallyMoved(true)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, dragOffset])

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    if (
      target.tagName === "BUTTON" ||
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.tagName === "SELECT" ||
      target.closest("button") ||
      target.closest("input") ||
      target.closest("textarea") ||
      target.closest("select") ||
      target.closest('[role="button"]') ||
      target.closest("a")
    ) {
      return
    }

    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
    setIsDragging(true)
    e.stopPropagation()
  }

  return (
    <div
      ref={containerRef}
      className="fixed z-[9999] pointer-events-auto"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: hasPanel && isDragging ? "grabbing" : hasPanel ? "grab" : "default",
        transition: hasBeenManuallyMoved ? "none" : "left 0.3s ease-out",
      }}
      onMouseDown={hasPanel ? handleMouseDown : undefined}
    >
      <div className="flex flex-col items-center gap-3 transition-all duration-300">{children}</div>
    </div>
  )
}
