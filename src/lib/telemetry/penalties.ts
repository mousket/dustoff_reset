// src/lib/telemetry/penalties.ts
// Base penalties and bonuses configuration (platform-agnostic)

/**
 * Base penalty values (before mode weight applied)
 * Negative numbers = bandwidth loss
 */
export const BASE_PENALTIES = {
  // App switches by category
  app_switch_productive: 0,        // No penalty for productive apps
  app_switch_neutral: -2,          // Minor penalty
  app_switch_communication: -4,    // Moderate penalty
  app_switch_social_media: -8,     // Significant penalty
  app_switch_entertainment: -10,   // Heavy penalty
  app_switch_gaming: -12,          // Heaviest penalty
  app_switch_unknown: -3,          // Unknown apps get moderate penalty
  app_switch_non_whitelist: -5,    // Not on whitelist
  
  // Block attempts (Legend mode)
  block_attempt: -10,              // Tried to open blocked app
  repeated_block_attempt: -15,     // Tried again
  bypass_attempt: -20,             // Tried to circumvent blocking
  
  // Rapid switching
  rapid_switch: -3,                // 3rd+ switch in 2 minutes
  
  // Domain penalties
  domain_social_media: -8,         // Visited social media domain
  domain_entertainment: -10,       // Visited entertainment domain
  domain_non_whitelist: -5,        // Domain not on whitelist
} as const

/**
 * Base bonus values (before mode weight applied)
 * Positive numbers = bandwidth gain
 * NOTE: Bonuses are intentionally modest - penalties are the main driver
 */
export const BASE_BONUSES = {
  // Intervention responses
  delay_gate_returned: 2,          // Chose to return from delay gate
  block_accepted: 1,               // Accepted block without rage
  quick_return: 1,                 // Returned to work < 10 seconds
  temptation_resisted: 2,          // Hovered but didn't click
  
  // Self-correction
  self_close_distraction: 1,       // Closed distraction app yourself
  
  // Focus bonuses
  focus_streak_5min: 1,            // 5 minutes of focused work
  focus_streak_15min: 2,           // 15 minutes of focused work
  focus_streak_30min: 5,           // 30 minutes of focused work
  
  // Reset ritual (walk)
  reset_walk: 6,                   // Completed a walk/reset ritual
} as const

/**
 * Escalation multipliers based on offense number
 * Applied to penalties for distractions
 */
export const ESCALATION_MULTIPLIERS = [
  1.0,    // 1st offense - full penalty
  1.15,   // 2nd offense - 15% more
  1.3,    // 3rd offense - 30% more
  1.4,    // 4th offense - 40% more
  1.5,    // 5th offense - 50% more
  1.5,    // 6th+ offense - capped at 50%
] as const

/**
 * Delay gate timing based on offense number (Flow mode)
 * In seconds
 */
export const DELAY_GATE_SECONDS = [
  10,     // 1st offense - 10 seconds
  15,     // 2nd offense - 15 seconds
  20,     // 3rd offense - 20 seconds
  30,     // 4th+ offense - 30 seconds (capped)
] as const

/**
 * Session extension triggers (Legend mode)
 * Offense numbers that trigger +5 minute extension
 */
export const EXTENSION_TRIGGERS = [3, 6, 9, 12] as const

/**
 * Get escalation multiplier for offense number
 */
export function getEscalationMultiplier(offenseNumber: number): number {
  const index = Math.min(
    Math.max(0, offenseNumber - 1),
    ESCALATION_MULTIPLIERS.length - 1
  )
  return ESCALATION_MULTIPLIERS[index]
}

/**
 * Get delay gate seconds for offense number
 */
export function getDelayGateSeconds(offenseNumber: number): number {
  const index = Math.min(
    Math.max(0, offenseNumber - 1),
    DELAY_GATE_SECONDS.length - 1
  )
  return DELAY_GATE_SECONDS[index]
}

/**
 * Check if offense number triggers session extension
 */
export function triggersExtension(offenseNumber: number): boolean {
  return EXTENSION_TRIGGERS.includes(offenseNumber as typeof EXTENSION_TRIGGERS[number])
}

/**
 * Get penalty key for app category
 */
export function getPenaltyKeyForCategory(category: string): keyof typeof BASE_PENALTIES {
  const mapping: Record<string, keyof typeof BASE_PENALTIES> = {
    productive: 'app_switch_productive',
    neutral: 'app_switch_neutral',
    communication: 'app_switch_communication',
    social_media: 'app_switch_social_media',
    entertainment: 'app_switch_entertainment',
    gaming: 'app_switch_gaming',
    unknown: 'app_switch_unknown',
  }
  return mapping[category] || 'app_switch_unknown'
}

/**
 * Get penalty key for domain category
 */
export function getPenaltyKeyForDomainCategory(category: string): keyof typeof BASE_PENALTIES {
  const mapping: Record<string, keyof typeof BASE_PENALTIES> = {
    social_media: 'domain_social_media',
    entertainment: 'domain_entertainment',
  }
  return mapping[category] || 'domain_non_whitelist'
}
