import type { DistractionOption } from "./types"

export const distractionOptions: DistractionOption[] = [
  "EMAIL",
  "SLACK_TEAMS",
  "PHONE",
  "PEOPLE",
  "ERRANDS",
  "EMOTIONAL",
  "SOCIAL_MEDIA",
  "THOUGHTS_TASKS",
]

export const distractionLabels: Record<DistractionOption, string> = {
  EMAIL: "Email",
  SLACK_TEAMS: "Slack / Teams",
  PHONE: "Phone",
  PEOPLE: "People",
  ERRANDS: "Errands",
  EMOTIONAL: "Emotional",
  SOCIAL_MEDIA: "Social Media",
  THOUGHTS_TASKS: "Wandering Thoughts",
}

export function toggleDistraction(distractions: string[], distraction: string): string[] {
  return distractions.includes(distraction)
    ? distractions.filter((d) => d !== distraction)
    : [...distractions, distraction]
}

export function getReflectionPrompt(): string {
  return "Awareness is preparation."
}
