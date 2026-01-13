export interface Screen5Props {
  onContinue: (data: Screen5Data) => void
  onBack: () => void
  demo?: boolean
  initialData?: Partial<Screen5Data>
}

export interface Screen5Data {
  primaryIntention: string
  secondaryIntentions: string[]
  specificTasks: string[]
}
