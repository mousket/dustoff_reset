
import { useState, useEffect } from "react"
import type { PreSessionPanelProps, SessionType } from "./types"
import { TimerHalo } from "@/components/animations/TimerHalo"
import { getActiveParkingLotItems } from "@/lib/parking-lot-storage"

const COMMON_APPS = [
  "VS Code",
  "Visual Studio Code",
  "Chrome",
  "Google Chrome",
  "Safari",
  "Firefox",
  "Edge",
  "Word",
  "Microsoft Word",
  "Excel",
  "Microsoft Excel",
  "PowerPoint",
  "Microsoft PowerPoint",
  "Outlook",
  "Microsoft Outlook",
  "Notepad",
  "Paint",
  "Slack",
  "Discord",
  "Zoom",
  "Teams",
  "Microsoft Teams",
  "Figma",
  "Photoshop",
  "Illustrator",
  "Notion",
  "Obsidian",
  "Spotify",
  "Terminal",
]

export function PreSessionPanel({ isOpen, onClose, onComplete }: PreSessionPanelProps) {
  const [step, setStep] = useState(1)
  const [sessionType, setSessionType] = useState<SessionType>("deep")
  const [selectedParkingLotItems, setSelectedParkingLotItems] = useState<string[]>([])
  const [intention, setIntention] = useState("")
  const [mode, setMode] = useState<"Zen" | "Flow" | "Legend">("Zen")
  const [duration, setDuration] = useState(50)
  const [whitelistedApps, setWhitelistedApps] = useState<string[]>([])
  const [whitelistedBrowser, setWhitelistedBrowser] = useState("Chrome")
  const [whitelistedTabs, setWhitelistedTabs] = useState<string[]>([])
  const [systemChecksComplete, setSystemChecksComplete] = useState(false)
  const [emotionalGrounding, setEmotionalGrounding] = useState(5)
  const [preparationMinutes, setPreparationMinutes] = useState(3)
  const [preparationChecklist, setPreparationChecklist] = useState<string[]>([])
  const [isPreparationStarted, setIsPreparationStarted] = useState(false)
  const [preparationTimeLeft, setPreparationTimeLeft] = useState(0)
  const [appSearchQuery, setAppSearchQuery] = useState("")
  const [appSuggestions, setAppSuggestions] = useState<string[]>([])
  const [isPrimaryIntentionValid, setIsPrimaryIntentionValid] = useState(true)
  const [parkingLotItems, setParkingLotItems] = useState<
    Array<{ id: string; text: string; action?: string; status: string }>
  >([])
  const [hasParkingLotItems, setHasParkingLotItems] = useState(false)

  useEffect(() => {
    if (isOpen) {
      const nextSessionItems = getActiveParkingLotItems().filter(
        (item) => item.action === "next-session" && item.status === "OPEN",
      )
      const allItems = getActiveParkingLotItems()

      setParkingLotItems(allItems)
      setHasParkingLotItems(allItems.length > 0)

      setSelectedParkingLotItems(nextSessionItems.map((item) => item.text))
    }
  }, [isOpen])

  useEffect(() => {
    if (isPreparationStarted && preparationTimeLeft > 0) {
      const timer = setInterval(() => {
        setPreparationTimeLeft((prev) => prev - 1)
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [isPreparationStarted, preparationTimeLeft])

  useEffect(() => {
    if (appSearchQuery.trim()) {
      const filtered = COMMON_APPS.filter((app) => app.toLowerCase().includes(appSearchQuery.toLowerCase())).slice(0, 5)
      setAppSuggestions(filtered)
    } else {
      setAppSuggestions([])
    }
  }, [appSearchQuery])

  const handleNext = () => {
    if (step === 5 && !systemChecksComplete) {
      return // Don't advance until system check is complete
    }

    if (step === 2 && sessionType !== "parking-lot" && !intention.trim()) {
      setIsPrimaryIntentionValid(false)
      return // Don't advance if primary intention is empty
    }

    if (sessionType === "parking-lot" && step === 2) {
      setStep(5) // Skip whitelist for parking lot sessions
    } else {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (sessionType === "parking-lot" && step === 5) {
      setStep(2) // Skip back over whitelist
    } else {
      setStep(step - 1)
    }
  }

  const handleComplete = () => {
    onComplete({
      sessionType,
      selectedParkingLotItems: sessionType === "parking-lot" ? selectedParkingLotItems : undefined,
      intention,
      mode,
      duration,
      whitelistedApps,
      whitelistedBrowser,
      whitelistedTabs,
      systemChecksComplete,
      emotionalGrounding,
      preparationMinutes,
      preparationChecklist,
    })
  }

  const toggleParkingLotItem = (item: string) => {
    setSelectedParkingLotItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : prev.length < 3 ? [...prev, item] : prev,
    )
  }

  const toggleWhitelistItem = (category: "apps" | "tabs", item: string) => {
    if (category === "apps") {
      setWhitelistedApps((prev) => (prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]))
    } else {
      setWhitelistedTabs((prev) => (prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]))
    }
  }

  const preparationOptions = [
    "Bathroom break",
    "Coffee & drinks",
    "Snacks",
    "Books / notebooks",
    "Quick phone call",
    "Deep breathing",
    "Meditation",
    "Stretch",
  ]

  if (!isOpen) return null

  return (
    <div
      className="rounded-3xl bg-[#0a0f0d]/55 backdrop-blur-xl border border-emerald-500/30 shadow-2xl transition-all duration-300 overflow-hidden"
      style={{ width: "380px", maxHeight: "calc(100vh - 120px)" }}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-emerald-500/20">
          <div>
            <h2 className="text-sm text-emerald-400 uppercase tracking-wider">PREPARE YOUR MIND</h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Step {step} of {hasParkingLotItems ? 6 : 5}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-zinc-800/80 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 transition-colors text-sm"
          >
            ×
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-zinc-900">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
            style={{ width: `${(step / (hasParkingLotItems ? 6 : 5)) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-white mb-1">Choose Your Session Type</h3>
                <p className="text-sm text-zinc-300 mb-4">What kind of work are you doing?</p>
              </div>

              <div className="space-y-2">
                {[
                  {
                    type: "deep" as SessionType,
                    title: "Deep Session",
                    desc: "Focused work with full tracking",
                  },
                  {
                    type: "parking-lot" as SessionType,
                    title: "Parking Lot Session",
                    desc: "Tackle queued tasks (skips whitelist)",
                    visible: hasParkingLotItems,
                  },
                  {
                    type: "admin" as SessionType,
                    title: "Administrative Session",
                    desc: "Email, meetings, coordination work",
                  },
                ].map(
                  (option) =>
                    (option.visible === undefined || option.visible) && (
                      <button
                        key={option.type}
                        onClick={() => setSessionType(option.type)}
                        className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                          sessionType === option.type
                            ? "border-emerald-500 bg-emerald-500/20"
                            : "border-zinc-700 bg-zinc-900/30 hover:border-zinc-600"
                        }`}
                      >
                        <div className="font-semibold text-white mb-1">{option.title}</div>
                        <div className="text-sm text-zinc-400">{option.desc}</div>
                      </button>
                    ),
                )}
              </div>
            </div>
          )}

          {step === 2 && sessionType === "parking-lot" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Select Parking Lot Items</h3>
                <p className="text-sm text-zinc-400 mb-4">
                  Choose 1-3 items to work on ({selectedParkingLotItems.length}/3 selected)
                </p>
              </div>

              <div className="space-y-2">
                {parkingLotItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => toggleParkingLotItem(item.text)}
                    className={`w-full p-2.5 rounded-lg border text-left text-xs transition-all ${
                      selectedParkingLotItems.includes(item.text)
                        ? "border-emerald-500 bg-emerald-500/10 text-white"
                        : "border-zinc-700 bg-zinc-900/50 text-zinc-300 hover:border-zinc-600"
                    }`}
                  >
                    {item.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && sessionType !== "parking-lot" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Define Your Victory</h3>
                <p className="text-sm text-zinc-300 mb-4">What will winning look like?</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-zinc-200 mb-1.5">Primary Intention</label>
                  <input
                    type="text"
                    value={intention}
                    onChange={(e) => {
                      setIntention(e.target.value)
                      setIsPrimaryIntentionValid(true)
                    }}
                    placeholder="What matters most in this session?"
                    className={`w-full px-3 py-2 bg-zinc-900/80 border rounded-lg text-white text-sm placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none transition-colors ${
                      !isPrimaryIntentionValid && "border-red-500"
                    }`}
                  />
                  {!isPrimaryIntentionValid && (
                    <p className="text-xs text-red-500 mt-1">Primary intention cannot be empty</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-200 mb-1.5">Session Mode</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["Zen", "Flow", "Legend"] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => setMode(m)}
                        className={`px-3 py-2 rounded-lg border-2 font-semibold text-sm transition-all ${
                          mode === m
                            ? m === "Legend"
                              ? "border-yellow-500 bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-red-600/20 text-yellow-400"
                              : m === "Flow"
                                ? "border-sky-400 bg-sky-400/10 text-sky-400"
                                : "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                            : "border-zinc-700 bg-zinc-900/50 text-zinc-400 hover:border-zinc-600"
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-200 mb-1.5">Duration: {duration} min</label>
                  <input
                    type="range"
                    min="15"
                    max="90"
                    step="15"
                    value={duration}
                    onChange={(e) => setDuration(Number.parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                    <span>15m</span>
                    <span>30m</span>
                    <span>50m</span>
                    <span>90m</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && sessionType !== "parking-lot" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-white mb-1">Whitelist: Applications</h3>
                <p className="text-sm text-zinc-300 mb-4">Which apps will help you win?</p>
              </div>

              <div>
                <div className="relative">
                  <input
                    type="text"
                    value={appSearchQuery}
                    onChange={(e) => setAppSearchQuery(e.target.value)}
                    placeholder="Type to search apps..."
                    className="w-full px-3 py-2 bg-zinc-900/80 border border-zinc-700 rounded-lg text-white text-sm placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none transition-colors mb-3"
                  />

                  {appSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900/95 backdrop-blur-xl border border-zinc-700 rounded-lg shadow-2xl z-50 max-h-[200px] overflow-y-auto scrollbar-hide">
                      {appSuggestions.map((app) => (
                        <button
                          key={app}
                          onClick={() => {
                            toggleWhitelistItem("apps", app)
                            setAppSearchQuery("")
                            setAppSuggestions([])
                          }}
                          className="w-full px-3 py-2.5 text-left text-sm text-white hover:bg-emerald-500/20 transition-colors border-b border-zinc-800 last:border-b-0"
                        >
                          {app}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {whitelistedApps.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {whitelistedApps.map((app) => (
                      <span
                        key={app}
                        className="px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs rounded-full flex items-center gap-1.5"
                      >
                        {app}
                        <button
                          onClick={() => toggleWhitelistItem("apps", app)}
                          className="hover:text-emerald-300 text-sm"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <p className="text-xs text-zinc-400">Start typing to see suggestions</p>
              </div>
            </div>
          )}

          {step === 4 && sessionType !== "parking-lot" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Whitelist: Browser & Tabs</h3>
                <p className="text-sm text-zinc-300 mb-4">Which browser will you use?</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-zinc-200 mb-1.5">Browser</label>
                  <select
                    value={whitelistedBrowser}
                    onChange={(e) => setWhitelistedBrowser(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900/80 border border-zinc-700 rounded-lg text-white text-sm focus:border-emerald-500 focus:outline-none transition-colors"
                  >
                    <option value="Safari">Safari</option>
                    <option value="Chrome">Chrome</option>
                    <option value="Firefox">Firefox</option>
                    <option value="Edge">Edge</option>
                    <option value="None">None</option>
                  </select>
                </div>

                {whitelistedBrowser !== "None" && (
                  <div>
                    <label className="block text-sm font-medium text-zinc-200 mb-1.5">
                      Add allowed tabs (website or activity)
                    </label>
                    <div className="space-y-1.5">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <input
                          key={i}
                          type="text"
                          placeholder={
                            i === 0
                              ? "docs.google.com"
                              : i === 1
                                ? "notion.so/project-plan"
                                : i === 2
                                  ? "email"
                                  : i === 3
                                    ? "research article"
                                    : "calendar"
                          }
                          className="w-full px-3 py-1.5 bg-zinc-900/80 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none transition-colors text-xs"
                        />
                      ))}
                    </div>
                    <p className="text-xs text-zinc-400 mt-1.5">At least 1 tab required</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Get Grounded</h3>
                <p className="text-sm text-zinc-300 mb-4">Prepare your body and mind</p>
              </div>

              {!isPreparationStarted ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-200 mb-1.5">
                      How many minutes do you need to prepare?
                    </label>
                    <select
                      value={preparationMinutes}
                      onChange={(e) => setPreparationMinutes(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-zinc-900/80 border border-zinc-700 rounded-lg text-white text-sm focus:border-emerald-500 focus:outline-none transition-colors"
                    >
                      <option value={1}>1 minute</option>
                      <option value={2}>2 minutes</option>
                      <option value={3}>3 minutes</option>
                      <option value={5}>5 minutes</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-200 mb-1.5">Preparation Actions</label>
                    <div className="grid grid-cols-2 gap-2">
                      {preparationOptions.map((option) => (
                        <button
                          key={option}
                          onClick={() =>
                            setPreparationChecklist((prev) =>
                              prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option],
                            )
                          }
                          className={`px-2.5 py-2 rounded-lg border text-xs transition-all ${
                            preparationChecklist.includes(option)
                              ? "border-emerald-500 bg-emerald-500/10 text-white"
                              : "border-zinc-700 bg-zinc-900/50 text-zinc-300 hover:border-zinc-600"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-200 mb-1.5">Emotional Grounding</label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={emotionalGrounding}
                      onChange={(e) => setEmotionalGrounding(Number(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-zinc-400 mt-1">
                      <span>Scattered (1)</span>
                      <span className="font-semibold text-emerald-400">{emotionalGrounding}</span>
                      <span>Centered (10)</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setPreparationTimeLeft(preparationMinutes * 60)
                      setIsPreparationStarted(true)
                    }}
                    className="w-full py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 border-2 border-emerald-500/30 text-emerald-400 rounded-lg font-semibold text-sm transition-all"
                  >
                    Begin Preparation
                  </button>
                </div>
              ) : preparationTimeLeft > 0 ? (
                <div className="flex flex-col items-center justify-center py-6 space-y-4">
                  <TimerHalo
                    variant="pulse-ring"
                    color="emerald"
                    size={128}
                    progress={(preparationMinutes * 60 - preparationTimeLeft) / (preparationMinutes * 60)}
                  >
                    <div className="text-center">
                      <div className="text-3xl font-bold text-emerald-400">
                        {Math.floor(preparationTimeLeft / 60)}:{String(preparationTimeLeft % 60).padStart(2, "0")}
                      </div>
                    </div>
                  </TimerHalo>

                  <button
                    onClick={() => {
                      setPreparationTimeLeft(0)
                    }}
                    className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 rounded-lg font-semibold text-sm transition-all"
                  >
                    Start Now
                  </button>
                </div>
              ) : (
                <div className="space-y-4 text-center py-4">
                  <div className="text-sm text-white font-medium">Are you ready to start or do you need more time?</div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setPreparationTimeLeft(preparationMinutes * 60)
                      }}
                      className="flex-1 py-2 bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 rounded-lg font-semibold text-sm transition-all"
                    >
                      More Time
                    </button>
                    <button
                      onClick={() => {
                        handleComplete()
                      }}
                      className="flex-1 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border-2 border-emerald-500 text-emerald-400 rounded-lg font-semibold text-sm transition-all"
                    >
                      Start Now
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer - Updated button styles */}
        <div className="px-5 py-4 border-t border-emerald-500/20 flex justify-between gap-3">
          {step > 1 && (
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white rounded-lg transition-colors text-sm"
            >
              Back
            </button>
          )}
          <button
            onClick={step === 6 ? handleComplete : handleNext}
            disabled={
              (step === 2 && sessionType !== "parking-lot" && !intention.trim()) ||
              (step === 5 && !systemChecksComplete) ||
              (step === 2 && sessionType === "parking-lot" && selectedParkingLotItems.length === 0)
            }
            className={`px-6 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-zinc-300 uppercase tracking-wider rounded-2xl transition-all duration-200 border border-emerald-500/30 backdrop-blur-sm text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
              step === 1 ? "ml-auto" : ""
            }`}
          >
            {step === 6 ? "START NOW" : "NEXT"}
          </button>
        </div>
      </div>
    </div>
  )
}
