export function getCurrentDate(): string {
  return new Date().toISOString().split("T")[0]
}

export function getCompletionMessage() {
  return {
    title: "Calibration Complete",
    message: "Your mind is calibrated.\nYou're ready to begin your practice.",
    subtitle: "Centered. Clear. Ready.",
  }
}
