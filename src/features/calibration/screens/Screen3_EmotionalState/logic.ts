import type { EmotionCard, LoadLevel } from "./types"

export const emotionCards: EmotionCard[] = [
  { id: "CLEAR", label: "Clear", description: "Steady. Present. Open." },
  { id: "FOCUSED", label: "Focused", description: "Directed. Engaged. Ready." },
  { id: "SCATTERED", label: "Scattered", description: "Pulled. Fragmented. Unsettled." },
  { id: "HEAVY", label: "Heavy", description: "Weighted. Slow. Burdened." },
  { id: "DRAINED", label: "Drained", description: "Low energy. Low spark." },
]

export const loadLevels: LoadLevel[] = [
  { value: 1, label: "Light" },
  { value: 2, label: "Manageable" },
  { value: 3, label: "Full" },
  { value: 4, label: "Heavy" },
  { value: 5, label: "Overloaded" },
]

export function validateScreen3Data(emotionalState: string, cognitiveLoad: number): boolean {
  return emotionalState !== "" && cognitiveLoad > 0
}

export function getReflectionPrompt(): string {
  return "Your state is not a judgment. It's information."
}
