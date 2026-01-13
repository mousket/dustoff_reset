import type { CalibrationScore, PreSessionData, InitialBandwidth } from "./types"

// Section 5A: Mode Modifier
export function getModeModifier(mode?: "Zen" | "Flow" | "Legend"): number {
  if (!mode) return 0

  switch (mode) {
    case "Zen":
      return 0 // No penalty
    case "Flow":
      return -3
    case "Legend":
      return -5
    default:
      return 0
  }
}

// Section 5B: Preparation Modifier
export function getPreparationModifier(
  preparationMinutes?: number,
  preparationChecklist?: string[],
  emotionalGrounding?: number,
): number {
  if (!preparationMinutes || !preparationChecklist || emotionalGrounding === undefined) {
    return 0
  }

  // Time component (max +2)
  let timeBonus = 0
  if (preparationMinutes >= 3) {
    timeBonus = 2
  } else if (preparationMinutes === 2) {
    timeBonus = 1
  } else {
    timeBonus = 0
  }

  // Checklist component (max +3)
  const checklistCount = preparationChecklist.length
  let checklistBonus = 0
  if (checklistCount >= 4) {
    checklistBonus = 3
  } else if (checklistCount === 3) {
    checklistBonus = 2
  } else if (checklistCount >= 1) {
    checklistBonus = 1
  }

  // Emotional grounding (max +3)
  let groundingBonus = 0
  if (emotionalGrounding >= 8) {
    groundingBonus = 3
  } else if (emotionalGrounding >= 6) {
    groundingBonus = 2
  } else if (emotionalGrounding >= 4) {
    groundingBonus = 1
  }

  return timeBonus + checklistBonus + groundingBonus
}

// Section 5C: Whitelist Modifier
export function getWhitelistModifier(
  whitelistedApps?: string[],
  whitelistedBrowser?: string,
  whitelistedTabs?: string[],
): number {
  if (!whitelistedApps || !whitelistedBrowser) {
    return 0 // No whitelist configured
  }

  // Apps component (max +2)
  const appCount = whitelistedApps.length
  let appBonus = 0
  if (appCount >= 1 && appCount <= 3) {
    appBonus = 2
  } else if (appCount >= 4 && appCount <= 6) {
    appBonus = 1
  } else {
    appBonus = 0
  }

  // Browser + tabs component (max +2)
  let browserBonus = 0
  if (whitelistedBrowser !== "None") {
    const tabCount = whitelistedTabs?.length || 0
    if (tabCount >= 1 && tabCount <= 3) {
      browserBonus = 2
    } else if (tabCount >= 4 && tabCount <= 5) {
      browserBonus = 1
    }
  }

  return appBonus + browserBonus
}

// Section 5D: Calculate Initial Bandwidth
export function calculateInitialBandwidth(
  calibrationScore: CalibrationScore,
  preSessionData: PreSessionData,
): InitialBandwidth {
  const baseCalibrationScore = calibrationScore.totalScore
  const modeModifier = getModeModifier(preSessionData.mode)
  const prepModifier = getPreparationModifier(
    preSessionData.preparationMinutes,
    preSessionData.preparationChecklist,
    preSessionData.emotionalGrounding,
  )
  const whitelistModifier = getWhitelistModifier(
    preSessionData.whitelistedApps,
    preSessionData.whitelistedBrowser,
    preSessionData.whitelistedTabs,
  )

  const totalBandwidth = Math.max(
    40,
    Math.min(100, baseCalibrationScore + modeModifier + prepModifier + whitelistModifier),
  )

  return {
    baseCalibrationScore,
    modeModifier,
    prepModifier,
    whitelistModifier,
    totalBandwidth,
    timestamp: Date.now(),
  }
}
