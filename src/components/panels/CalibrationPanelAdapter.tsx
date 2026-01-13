// src/components/panels/CalibrationPanelAdapter.tsx
// Adapts the DailyCalibrationPanel to work with App.tsx and Tauri storage

import { PanelContainer } from '@/components/PanelContainer'
import { DailyCalibrationPanel } from '@/features/desktop/panels/DailyCalibrationPanel'
import { CalibrationData } from '@/lib/tauri-types'
import { tauriBridge } from '@/lib/tauri-bridge'

// The panel's internal CalibrationData type (without score, date, timestamp)
interface PanelCalibrationResult {
  sleepHours: number
  sleepQuality: number
  emotionalResidue: number
  emotionalState: string
  distractions: string[]
}

interface CalibrationPanelAdapterProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (data: CalibrationData) => void
}

/**
 * Calculate calibration score using biological core math
 * Based on docs/specs/06_biological_core_math.md
 * 
 * Score components:
 * - Sleep (0-40): hours + quality
 * - Emotional (0-40): residue (inverted) + state bonus
 * - Distraction penalty (0-20): based on count
 */
function calculateCalibrationScore(result: PanelCalibrationResult): number {
  // Sleep component (0-40 points)
  // Hours: 8 hours = 20 points, scale linearly
  const hoursScore = Math.min(20, (result.sleepHours / 8) * 20)
  // Quality: 10 = 20 points, scale linearly
  const qualityScore = (result.sleepQuality / 10) * 20
  const sleepScore = hoursScore + qualityScore

  // Emotional component (0-40 points)
  // Residue is inverted: low residue = high score
  const residueScore = ((10 - result.emotionalResidue) / 10) * 20
  
  // State bonus: positive states get bonus points
  const positiveStates = ['Energized', 'Focused', 'Calm']
  const neutralStates = ['Tired']
  const negativeStates = ['Anxious', 'Scattered']
  
  let stateScore = 10 // Default middle score
  if (positiveStates.includes(result.emotionalState)) {
    stateScore = 20
  } else if (neutralStates.includes(result.emotionalState)) {
    stateScore = 12
  } else if (negativeStates.includes(result.emotionalState)) {
    stateScore = 5
  }
  
  const emotionalScore = residueScore + stateScore

  // Distraction penalty (0-20 points)
  // Each distraction costs 3-4 points, max penalty of 20
  const distractionPenalty = Math.min(20, result.distractions.length * 3.5)
  const distractionScore = 20 - distractionPenalty

  // Total score (0-100)
  const totalScore = Math.round(sleepScore + emotionalScore + distractionScore)
  
  // Clamp to 0-100
  return Math.max(0, Math.min(100, totalScore))
}

export function CalibrationPanelAdapter({
  isOpen,
  onClose,
  onComplete,
}: CalibrationPanelAdapterProps) {
  
  const handleCalibrationComplete = async (panelResult: PanelCalibrationResult) => {
    try {
      // Get workday date from Tauri (respects 5am boundary)
      const date = await tauriBridge.getWorkdayDate()
      
      // Calculate the calibration score
      const score = calculateCalibrationScore(panelResult)
      
      // Build full CalibrationData object
      const data: CalibrationData = {
        date,
        calibrationScore: score,
        sleepHours: panelResult.sleepHours,
        sleepQuality: panelResult.sleepQuality,
        emotionalResidue: panelResult.emotionalResidue,
        emotionalState: panelResult.emotionalState,
        distractions: panelResult.distractions,
        timestamp: Date.now(),
      }
      
      onComplete(data)
    } catch (error) {
      console.error('Failed to complete calibration:', error)
      // Fallback: use local date if Tauri fails
      const fallbackDate = new Date().toISOString().split('T')[0]
      const score = calculateCalibrationScore(panelResult)
      
      const data: CalibrationData = {
        date: fallbackDate,
        calibrationScore: score,
        sleepHours: panelResult.sleepHours,
        sleepQuality: panelResult.sleepQuality,
        emotionalResidue: panelResult.emotionalResidue,
        emotionalState: panelResult.emotionalState,
        distractions: panelResult.distractions,
        timestamp: Date.now(),
      }
      
      onComplete(data)
    }
  }
  
  return (
    <PanelContainer isOpen={isOpen} width={400}>
      <DailyCalibrationPanel
        isOpen={true}  // Always true since PanelContainer handles visibility
        onComplete={handleCalibrationComplete}
        onClose={onClose}
      />
    </PanelContainer>
  )
}

export { calculateCalibrationScore }
export type { CalibrationPanelAdapterProps }
