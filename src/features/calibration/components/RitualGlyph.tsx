interface RitualGlyphProps {
  size?: number
}

export default function RitualGlyph({ size = 64 }: RitualGlyphProps) {
  return (
    <div 
      className="mx-auto animate-breathe"
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-emerald-500/30"
        />
        <circle
          cx="50"
          cy="50"
          r="30"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-emerald-500/50"
        />
        <circle cx="50" cy="50" r="15" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-500" />
        <path d="M50,20 L50,80 M20,50 L80,50" stroke="currentColor" strokeWidth="1" className="text-emerald-500/70" />
      </svg>
    </div>
  )
}
