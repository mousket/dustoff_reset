// src/features/calibration/CalibrationCeremony.tsx
// Full calibration ceremony with all screens

import { useState } from "react"

// Import actual screen components
import { Screen0_TimeAwareIntro } from "./screens/Screen0_TimeAwareIntro"
import { Screen2_SleepTracking } from "./screens/Screen2_SleepTracking"
import Screen3_EmotionalState from "./screens/Screen3_EmotionalState"
import Screen4_DistractionsHurdles from "./screens/Screen4_DistractionsHurdles"
import Screen5_Intention from "./screens/Screen5_Intention"
import Screen6_Completion from "./screens/Screen6_Completion"

// Simple Ritual Glyph Component (for export)
export function RitualGlyph() {
  return (
    <div className="mx-auto w-16 h-16 animate-breathe">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-emerald-500/30"
        />
        <circle
          cx="50"
          cy="50"
          r="30"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-emerald-500/50"
        />
        <circle cx="50" cy="50" r="15" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-500" />
        <path d="M50,20 L50,80 M20,50 L80,50" stroke="currentColor" strokeWidth="1" className="text-emerald-500/70" />
      </svg>
    </div>
  )
}

// Calibration data collected across screens
interface CalibrationCeremonyData {
  // Screen 2: Sleep
  sleepData?: {
    bedtime: string
    wakeTime: string
    startOfDay: string
    sleepSufficient: 'yes' | 'no' | 'notSure'
    restfulness: number
  }
  // Screen 3: Emotional
  emotionalState?: string
  cognitiveLoad?: number
  // Screen 4: Distractions
  distractions?: string[]
  distractionNotes?: string
  obstacles?: string
  // Screen 5: Intention
  primaryIntention?: string
  secondaryIntentions?: string[]
  specificTasks?: string[]
}

interface CalibrationCeremonyProps {
  onComplete: (data: CalibrationCeremonyData) => void
  onClose?: () => void
  demo?: boolean
}

export function CalibrationCeremony({ onComplete, onClose, demo = false }: CalibrationCeremonyProps) {
  const [currentScreen, setCurrentScreen] = useState(0)
  const [data, setData] = useState<CalibrationCeremonyData>({})

  // Screen flow: 0 (Intro) -> 2 (Sleep) -> 3 (Emotional) -> 4 (Distractions) -> 5 (Intention) -> 6 (Complete)
  const handleScreen0Continue = () => setCurrentScreen(2)
  
  const handleScreen2Continue = () => {
    // Sleep screen doesn't pass data via onContinue in current implementation
    setCurrentScreen(3)
  }
  
  const handleScreen3Continue = (screen3Data: { emotionalState: string; cognitiveLoad: number }) => {
    setData(prev => ({
      ...prev,
      emotionalState: screen3Data.emotionalState,
      cognitiveLoad: screen3Data.cognitiveLoad,
    }))
    setCurrentScreen(4)
  }
  
  const handleScreen4Continue = (screen4Data: { distractions: string[]; distractionNotes: string; obstacles: string }) => {
    setData(prev => ({
      ...prev,
      distractions: screen4Data.distractions,
      distractionNotes: screen4Data.distractionNotes,
      obstacles: screen4Data.obstacles,
    }))
    setCurrentScreen(5)
  }
  
  const handleScreen5Continue = (screen5Data: { primaryIntention: string; secondaryIntentions: string[]; specificTasks: string[] }) => {
    setData(prev => ({
      ...prev,
      primaryIntention: screen5Data.primaryIntention,
      secondaryIntentions: screen5Data.secondaryIntentions,
      specificTasks: screen5Data.specificTasks,
    }))
    setCurrentScreen(6)
  }
  
  const handleComplete = () => {
    onComplete(data)
  }

  return (
    <div className="min-h-screen bg-[#0a0f0d]">
      {currentScreen === 0 && (
        <Screen0_TimeAwareIntro 
          onContinue={handleScreen0Continue} 
          demo={demo} 
        />
      )}
      
      {currentScreen === 2 && (
        <Screen2_SleepTracking 
          onContinue={handleScreen2Continue} 
          onBack={() => setCurrentScreen(0)} 
          demo={demo} 
        />
      )}
      
      {currentScreen === 3 && (
        <Screen3_EmotionalState 
          onContinue={handleScreen3Continue} 
          onBack={() => setCurrentScreen(2)} 
          demo={demo} 
        />
      )}
      
      {currentScreen === 4 && (
        <Screen4_DistractionsHurdles 
          onContinue={handleScreen4Continue} 
          onBack={() => setCurrentScreen(3)} 
          demo={demo} 
        />
      )}
      
      {currentScreen === 5 && (
        <Screen5_Intention 
          onContinue={handleScreen5Continue} 
          onBack={() => setCurrentScreen(4)} 
          demo={demo} 
        />
      )}
      
      {currentScreen === 6 && (
        <Screen6_Completion 
          onContinue={handleComplete} 
          demo={demo} 
        />
      )}
    </div>
  )
}

export type { CalibrationCeremonyProps, CalibrationCeremonyData }
