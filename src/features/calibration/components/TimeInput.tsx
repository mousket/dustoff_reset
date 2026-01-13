
interface TimeInputProps {
  label?: string
  value: string
  onChange: (value: string) => void
  "aria-label": string
}

export function TimeInput({ label, value, onChange, "aria-label": ariaLabel }: TimeInputProps) {
  return (
    <div>
      {label && <label className="block text-sm text-muted-foreground mb-2">{label}</label>}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#10B981] pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="12" r="10" strokeWidth="2" />
          <path d="M12 6v6l4 2" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          type="time"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-[#0a0f0d] border border-[#2f4a42] rounded-md text-white font-mono focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] outline-none transition-colors"
          aria-label={ariaLabel}
        />
      </div>
    </div>
  )
}
