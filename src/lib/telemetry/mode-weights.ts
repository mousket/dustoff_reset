// src/lib/telemetry/mode-weights.ts
// Mode weight configurations (platform-agnostic)

/**
 * Mode type
 */
export type Mode = 'Zen' | 'Flow' | 'Legend'

/**
 * Weight configuration for each mode
 */
export interface ModeWeights {
  /** Multiplier for passive drains (entropy) */
  drainWeight: number
  /** Multiplier for penalties (app switches, friction) */
  penaltyWeight: number
  /** Multiplier for bonuses (focus, flow, resistance) */
  bonusWeight: number
}

/**
 * Mode weight configurations
 * 
 * Zen: Training ground - gentle, forgiving
 * Flow: Proving ground - balanced, moderate accountability
 * Legend: The arena - harsh, unforgiving
 */
export const MODE_WEIGHTS: Record<Mode, ModeWeights> = {
  Zen: {
    drainWeight: 1.0,    // Normal entropy
    penaltyWeight: 1.0,  // Normal penalties
    bonusWeight: 1.25,   // Generous bonuses (encourage good behavior)
  },
  Flow: {
    drainWeight: 1.0,    // Normal entropy
    penaltyWeight: 1.25, // Elevated penalties (distractions cost more)
    bonusWeight: 1.0,    // Normal bonuses
  },
  Legend: {
    drainWeight: 1.25,   // Faster entropy (time is enemy)
    penaltyWeight: 1.5,  // Severe penalties (every slip cuts deep)
    bonusWeight: 0.75,   // Reduced bonuses (glory is earned)
  },
}

/**
 * Get weights for a mode
 */
export function getModeWeights(mode: Mode): ModeWeights {
  return MODE_WEIGHTS[mode]
}

/**
 * Get the penalty weight for a mode
 */
export function getPenaltyWeight(mode: Mode): number {
  return MODE_WEIGHTS[mode].penaltyWeight
}

/**
 * Get the bonus weight for a mode
 */
export function getBonusWeight(mode: Mode): number {
  return MODE_WEIGHTS[mode].bonusWeight
}

/**
 * Get the drain weight for a mode
 */
export function getDrainWeight(mode: Mode): number {
  return MODE_WEIGHTS[mode].drainWeight
}

/**
 * Get mode description for UI
 */
export function getModeDescription(mode: Mode): string {
  switch (mode) {
    case 'Zen':
      return 'Training ground - gentle penalties, generous bonuses'
    case 'Flow':
      return 'Proving ground - elevated penalties for distractions'
    case 'Legend':
      return 'The arena - severe penalties, reduced bonuses'
    default:
      return ''
  }
}
