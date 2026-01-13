export function validatePrimaryIntention(intention: string): boolean {
  return intention.trim().length > 0
}

export function filterEmptyStrings(items: string[]): string[] {
  return items.filter((item) => item.trim().length > 0)
}

export function getReflectionPrompt(): string {
  return "Clarity creates momentum."
}
