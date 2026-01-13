export interface Screen4Props {
  onContinue: (data: Screen4Data) => void
  onBack: () => void
  demo?: boolean
  initialData?: Partial<Screen4Data>
}

export interface Screen4Data {
  distractions: string[]
  distractionNotes: string
  obstacles: string
}

export type DistractionOption =
  | "EMAIL"
  | "SLACK_TEAMS"
  | "PHONE"
  | "PEOPLE"
  | "ERRANDS"
  | "EMOTIONAL"
  | "SOCIAL_MEDIA"
  | "THOUGHTS_TASKS"
