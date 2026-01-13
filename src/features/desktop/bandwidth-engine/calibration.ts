import type { CalibrationData, CalibrationScore } from "./types"

// Section 1: Sleep Score (40 points)
export function calculateSleepScore(sleepHours: number, sleepQuality: number): number {
  // Hours scoring (25 points)
  let hoursScore = 0
  if (sleepHours >= 7 && sleepHours <= 9) {
    hoursScore = 25
  } else if (sleepHours === 6 || sleepHours === 10) {
    hoursScore = 20
  } else if (sleepHours === 5 || sleepHours === 11) {
    hoursScore = 12
  } else {
    hoursScore = 5
  }

  // Quality scoring (15 points)
  let qualityScore = 0
  if (sleepQuality >= 8) {
    qualityScore = 15
  } else if (sleepQuality >= 6) {
    qualityScore = 10
  } else if (sleepQuality >= 4) {
    qualityScore = 5
  } else {
    qualityScore = 2
  }

  return hoursScore + qualityScore
}

// Section 2: Emotional Score (40 points)
export function calculateEmotionalScore(emotionalResidue: number, emotionalState: string): number {
  // Residue scoring (20 points) - inverted scale
  let residueScore = 0
  if (emotionalResidue <= 3) {
    residueScore = 20
  } else if (emotionalResidue <= 5) {
    residueScore = 15
  } else if (emotionalResidue <= 7) {
    residueScore = 8
  } else {
    residueScore = 3
  }

  // State scoring (20 points)
  const stateScores: Record<string, number> = {
    Energized: 20,
    Focused: 18,
    Calm: 15,
    Tired: 8,
    Anxious: 5,
    Scattered: 3,
  }
  const stateScore = stateScores[emotionalState] || 10

  return residueScore + stateScore
}

// Section 3: Distraction Awareness (20 points)
export function calculateDistractionScore(distractions: string[]): number {
  const count = distractions.length

  if (count === 0) {
    return 20 // Aware + nothing identified
  } else if (count === 1) {
    return 16
  } else if (count === 2) {
    return 12
  } else if (count === 3) {
    return 8
  } else if (count === 4) {
    return 5
  } else {
    return 2 // 5-6 distractions
  }
}

// Section 4: Total Calibration Score (0-100)
export function calculateCalibrationScore(data: CalibrationData): CalibrationScore {
  const sleepScore = calculateSleepScore(data.sleepHours, data.sleepQuality)
  const emotionalScore = calculateEmotionalScore(data.emotionalResidue, data.emotionalState)
  const distractionScore = calculateDistractionScore(data.distractions)
  const totalScore = sleepScore + emotionalScore + distractionScore

  return {
    sleepScore,
    emotionalScore,
    distractionScore,
    totalScore,
    timestamp: Date.now(),
  }
}
