// State machine for session lifecycle
export type SessionFlowState =
  | "idle"
  | "calibrating"
  | "pre-session"
  | "preparing"
  | "in-session"
  | "ending-session"
  | "post-session-summary"
  | "reflection"
  | "parking-lot-harvest"
  | "complete"

export type EndSessionFlowState = "select-reason" | "confirming" | "processing" | "complete"

export type SummaryFlowState = "loading" | "displaying" | "transition-to-reflection"

export type ReflectionFlowState = "question-1" | "question-2" | "question-3" | "question-4" | "submitting" | "complete"

export interface SessionFlowContext {
  currentState: SessionFlowState
  sessionId: string | null
  startTime: number | null
  endTime: number | null
  endReason: string | null
  endSubReason: string | null
}

// Placeholder for state transitions
export function transitionSessionFlow(currentState: SessionFlowState, action: string): SessionFlowState {
  // Will be implemented in Prompt 1
  return currentState
}
