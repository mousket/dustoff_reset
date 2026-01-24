
import { useState, useEffect, useMemo } from "react"
import type { PreSessionPanelProps, SessionType } from "./types"
import { TimerHalo } from "@/components/animations/TimerHalo"
import { getActiveParkingLotItems } from "@/lib/parking-lot-storage"
import { tauriBridge, InstalledApp } from "@/lib/tauri-bridge"
import { EmeraldSelect } from "@/components/ui/EmeraldSelect"

// Category icons for visual distinction
const CATEGORY_ICONS: Record<string, string> = {
  browser: "🌐",
  editor: "⌘",
  communication: "💬",
  design: "◆",
  productivity: "📝",
  office: "📄",
  media: "🎵",
  terminal: "▶",
  default: "●",
}

export function PreSessionPanel({ isOpen, onClose, onComplete }: PreSessionPanelProps) {
  const [step, setStep] = useState(1)
  const [sessionType, setSessionType] = useState<SessionType>("deep")
  const [selectedParkingLotItems, setSelectedParkingLotItems] = useState<string[]>([])
  const [intention, setIntention] = useState("")
  const [mode, setMode] = useState<"Zen" | "Flow" | "Legend">("Zen")
  const [duration, setDuration] = useState(25)
  const [whitelistedApps, setWhitelistedApps] = useState<string[]>([])
  const [whitelistedBrowser, setWhitelistedBrowser] = useState("")
  const [whitelistedDomains, setWhitelistedDomains] = useState<string[]>(["", "", ""])
  const [systemChecksComplete, setSystemChecksComplete] = useState(false)
  const [emotionalGrounding, setEmotionalGrounding] = useState(5)
  const [preparationMinutes, setPreparationMinutes] = useState(3)
  const [preparationChecklist, setPreparationChecklist] = useState<string[]>([])
  const [isPreparationStarted, setIsPreparationStarted] = useState(false)
  const [preparationTimeLeft, setPreparationTimeLeft] = useState(0)
  const [appSearchQuery, setAppSearchQuery] = useState("")
  const [isPrimaryIntentionValid, setIsPrimaryIntentionValid] = useState(true)
  const [parkingLotItems, setParkingLotItems] = useState<
    Array<{ id: string; text: string; action?: string; status: string }>
  >([])
  const [hasParkingLotItems, setHasParkingLotItems] = useState(false)
  
  // New state for system apps
  const [installedApps, setInstalledApps] = useState<InstalledApp[]>([])
  const [installedBrowsers, setInstalledBrowsers] = useState<InstalledApp[]>([])
  const [showAppDropdown, setShowAppDropdown] = useState(false)
  
  // Loading transition state (between step 2 and 3)
  const [isPreparingSession, setIsPreparingSession] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [loadingMessage, setLoadingMessage] = useState("")

  // Load parking lot items when panel opens (lightweight)
  useEffect(() => {
    if (isOpen) {
      // Load parking lot items - this is fast/local
      const nextSessionItems = getActiveParkingLotItems().filter(
        (item) => item.action === "next-session" && item.status === "OPEN",
      )
      const allItems = getActiveParkingLotItems()
      setParkingLotItems(allItems)
      setHasParkingLotItems(allItems.length > 0)
      setSelectedParkingLotItems(nextSessionItems.map((item) => item.text))
    }
  }, [isOpen])
  
  // Prepare session: Load apps, browsers, and configure interventions
  // This runs as a transition between step 2 and step 3
  // Note: isPreparingSession is already set to true before this is called
  const prepareSessionConfiguration = async () => {
    try {
      // Small delay to ensure the loading screen renders first
      await new Promise(resolve => setTimeout(resolve, 50))
      
      // Stage 1: Load system applications (0-40%)
      setLoadingMessage("Scanning installed applications...")
      setLoadingProgress(10)
      
      const apps = await tauriBridge.getSystemApps()
      setInstalledApps(apps)
      setLoadingProgress(40)
      
      // Stage 2: Load browsers (40-70%)
      setLoadingMessage("Detecting browsers...")
      const browsers = await tauriBridge.getSystemBrowsers()
      setInstalledBrowsers(browsers)
      setLoadingProgress(70)
      
      // Set default browser if we found browsers
      if (browsers.length > 0 && !whitelistedBrowser) {
        const chrome = browsers.find(b => b.name.toLowerCase().includes('chrome'))
        const safari = browsers.find(b => b.name.toLowerCase().includes('safari'))
        setWhitelistedBrowser(chrome?.name || safari?.name || browsers[0].name)
      }
      
      // Stage 3: Configure interventions (70-90%)
      setLoadingMessage(`Configuring ${mode} mode interventions...`)
      setLoadingProgress(85)
      
      // Small delay to show the message
      await new Promise(resolve => setTimeout(resolve, 400))
      
      // Stage 4: Finalize (90-100%)
      setLoadingMessage("Ready to configure whitelist...")
      setLoadingProgress(100)
      
      // Brief pause to show completion
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Advance to step 3
      setIsPreparingSession(false)
      setStep(3)
      
    } catch (error) {
      console.error('[PreSession] Failed to prepare session:', error)
      setLoadingMessage("Configuration failed. Proceeding anyway...")
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      setIsPreparingSession(false)
      setStep(3)
    }
  }

  useEffect(() => {
    if (isPreparationStarted && preparationTimeLeft > 0) {
      const timer = setInterval(() => {
        setPreparationTimeLeft((prev) => prev - 1)
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [isPreparationStarted, preparationTimeLeft])

  // Filter apps based on search query
  const filteredApps = useMemo(() => {
    if (!appSearchQuery.trim()) return installedApps.slice(0, 8)
    return installedApps
      .filter((app) => app.name.toLowerCase().includes(appSearchQuery.toLowerCase()))
      .slice(0, 8)
  }, [appSearchQuery, installedApps])

  // Get whitelisted domains (filter empty strings)
  const activeWhitelistedDomains = useMemo(() => {
    return whitelistedDomains.filter(d => d.trim().length > 0)
  }, [whitelistedDomains])

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
    } else if (step === 2 && sessionType !== "parking-lot") {
      // Show loading screen IMMEDIATELY (synchronous)
      setIsPreparingSession(true)
      setLoadingProgress(0)
      setLoadingMessage("Initializing session configuration...")
      
      // Then start the async work (will update progress as it goes)
      prepareSessionConfiguration()
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
      whitelistedTabs: activeWhitelistedDomains, // Use domain-based matching
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

  const toggleWhitelistApp = (appName: string) => {
    setWhitelistedApps((prev) => 
      prev.includes(appName) ? prev.filter((a) => a !== appName) : [...prev, appName]
    )
  }

  const updateDomain = (index: number, value: string) => {
    setWhitelistedDomains(prev => {
      const updated = [...prev]
      updated[index] = value
      return updated
    })
  }

  const addDomainField = () => {
    if (whitelistedDomains.length < 5) {
      setWhitelistedDomains(prev => [...prev, ""])
    }
  }

  const getCategoryIcon = (category: string | null) => {
    return CATEGORY_ICONS[category || "default"] || CATEGORY_ICONS.default
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
      className="rounded-3xl bg-[#0a0f0d]/80 backdrop-blur-xl border border-emerald-500/30 shadow-2xl transition-all duration-300"
      style={{ width: "380px" }}
    >
      <div className="flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-emerald-500/20">
          <div>
            <h2 className={`text-sm uppercase tracking-wider ${
              isPreparingSession
                ? mode === 'Legend' 
                  ? 'text-yellow-400' 
                  : mode === 'Flow' 
                    ? 'text-sky-400'
                    : 'text-emerald-400'
                : 'text-emerald-400'
            }`}>
              {isPreparingSession ? `CONFIGURING ${mode.toUpperCase()}` : 'PREPARE YOUR MIND'}
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              {isPreparingSession 
                ? 'Loading session parameters...'
                : `Step ${step} of ${hasParkingLotItems ? 6 : 5}`
              }
            </p>
          </div>
          {!isPreparingSession && (
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-zinc-800/80 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 transition-colors text-sm"
            >
              ×
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-zinc-900">
          <div
            className={`h-full transition-all duration-500 ${
              isPreparingSession
                ? mode === 'Legend' 
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500' 
                  : mode === 'Flow' 
                    ? 'bg-gradient-to-r from-sky-500 to-cyan-500'
                    : 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                : 'bg-gradient-to-r from-emerald-500 to-emerald-400'
            }`}
            style={{ 
              width: isPreparingSession 
                ? `${loadingProgress}%` 
                : `${(step / (hasParkingLotItems ? 6 : 5)) * 100}%` 
            }}
          />
        </div>

        {/* Content - scrollable with max height */}
        <div className="overflow-y-auto px-5 py-4 max-h-[480px]">
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

          {/* Loading Transition Screen - Shows between step 2 and 3 */}
          {isPreparingSession && (
            <div className="space-y-6 py-4">
              <div className="flex flex-col items-center justify-center space-y-6">
                {/* Animated loader with mode-colored rings */}
                <div className="relative">
                  <div className={`w-20 h-20 rounded-full border-2 ${
                    mode === 'Legend' 
                      ? 'border-yellow-500/20' 
                      : mode === 'Flow' 
                        ? 'border-sky-500/20'
                        : 'border-emerald-500/20'
                  }`} />
                  <div className={`absolute inset-0 w-20 h-20 rounded-full border-2 border-transparent animate-spin ${
                    mode === 'Legend' 
                      ? 'border-t-yellow-500' 
                      : mode === 'Flow' 
                        ? 'border-t-sky-500'
                        : 'border-t-emerald-500'
                  }`} />
                  <div className={`absolute inset-2 w-16 h-16 rounded-full border-2 border-transparent animate-spin ${
                    mode === 'Legend' 
                      ? 'border-b-orange-400/50' 
                      : mode === 'Flow' 
                        ? 'border-b-sky-400/50'
                        : 'border-b-emerald-400/50'
                  }`} style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                  
                  {/* Center icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl">
                      {mode === 'Legend' ? '⚔️' : mode === 'Flow' ? '🌊' : '🧘'}
                    </span>
                  </div>
                </div>
                
                {/* Loading header */}
                <div className="text-center space-y-2">
                  <h3 className={`text-base font-bold ${
                    mode === 'Legend' 
                      ? 'text-yellow-400' 
                      : mode === 'Flow' 
                        ? 'text-sky-400'
                        : 'text-emerald-400'
                  }`}>
                    Preparing {mode} Mode
                  </h3>
                  <p className="text-xs text-zinc-400 animate-pulse">
                    {loadingMessage}
                  </p>
                </div>
                
                {/* Progress bar */}
                <div className="w-full max-w-[280px]">
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ease-out rounded-full ${
                        mode === 'Legend' 
                          ? 'bg-gradient-to-r from-yellow-500 to-orange-500' 
                          : mode === 'Flow' 
                            ? 'bg-gradient-to-r from-sky-500 to-cyan-500'
                            : 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                      }`}
                      style={{ width: `${loadingProgress}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-zinc-500 text-center mt-2">
                    {loadingProgress}% complete
                  </p>
                </div>
                
                {/* What's being configured */}
                <div className={`px-4 py-3 rounded-xl border text-center max-w-[300px] ${
                  mode === 'Legend' 
                    ? 'bg-yellow-500/10 border-yellow-500/30' 
                    : mode === 'Flow' 
                      ? 'bg-sky-500/10 border-sky-500/30'
                      : 'bg-emerald-500/10 border-emerald-500/30'
                }`}>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-center gap-2 text-zinc-300">
                      <span className={loadingProgress >= 40 ? 'text-emerald-400' : 'text-zinc-500'}>
                        {loadingProgress >= 40 ? '✓' : '○'}
                      </span>
                      <span>Scanning applications</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-zinc-300">
                      <span className={loadingProgress >= 70 ? 'text-emerald-400' : 'text-zinc-500'}>
                        {loadingProgress >= 70 ? '✓' : '○'}
                      </span>
                      <span>Detecting browsers</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-zinc-300">
                      <span className={loadingProgress >= 85 ? 'text-emerald-400' : 'text-zinc-500'}>
                        {loadingProgress >= 85 ? '✓' : '○'}
                      </span>
                      <span>Configuring interventions</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-zinc-300">
                      <span className={loadingProgress >= 100 ? 'text-emerald-400' : 'text-zinc-500'}>
                        {loadingProgress >= 100 ? '✓' : '○'}
                      </span>
                      <span>Preparing blockers</span>
                    </div>
                  </div>
                </div>
                
                {/* Mode description */}
                <p className={`text-[10px] text-center max-w-[280px] ${
                  mode === 'Legend' 
                    ? 'text-yellow-300/70' 
                    : mode === 'Flow' 
                      ? 'text-sky-300/70'
                      : 'text-emerald-300/70'
                }`}>
                  {mode === 'Legend' 
                    ? 'Full blocking enabled. No escape routes. Maximum focus.'
                    : mode === 'Flow'
                      ? 'Delay gates active. Gentle redirection when distracted.'
                      : 'Soft nudges only. Freedom to explore with awareness.'}
                </p>
              </div>
            </div>
          )}

          {step === 2 && sessionType !== "parking-lot" && !isPreparingSession && (
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
                    min="5"
                    max="90"
                    step="5"
                    value={duration}
                    onChange={(e) => setDuration(Number.parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                    <span>5m</span>
                    <span>25m</span>
                    <span>45m</span>
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
                {/* Search Input with emerald accent */}
                <div className="relative mb-3">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <input
                    type="text"
                    value={appSearchQuery}
                    onChange={(e) => {
                      setAppSearchQuery(e.target.value)
                      setShowAppDropdown(true)
                    }}
                    onFocus={() => setShowAppDropdown(true)}
                    placeholder="Search installed apps..."
                    className="w-full pl-8 pr-10 py-2.5 bg-emerald-500/5 border border-emerald-500/30 rounded-xl text-white placeholder:text-zinc-500 focus:border-emerald-500/60 focus:bg-emerald-500/10 focus:outline-none transition-all text-sm"
                  />
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {/* App Dropdown with Emerald Contour style */}
                {showAppDropdown && filteredApps.length > 0 && (
                  <div className="bg-black/60 backdrop-blur-xl border border-emerald-500/20 rounded-xl overflow-hidden mb-4 shadow-lg shadow-emerald-500/5 max-h-[200px] overflow-y-auto scrollbar-hide">
                    {filteredApps.map((app, index) => {
                      const isSelected = whitelistedApps.includes(app.name)
                      return (
                        <button
                          key={app.identifier}
                          onClick={() => {
                            toggleWhitelistApp(app.name)
                            setAppSearchQuery("")
                          }}
                          className={`w-full px-4 py-3 flex items-center justify-between transition-colors ${
                            isSelected 
                              ? "bg-emerald-500/10" 
                              : "hover:bg-emerald-500/5"
                          } ${index < filteredApps.length - 1 ? "border-b border-dashed border-emerald-500/10" : ""}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 bg-emerald-500/10 rounded-lg flex items-center justify-center text-xs">
                              {getCategoryIcon(app.category)}
                            </span>
                            <div className="text-left">
                              <span className={`text-sm block ${isSelected ? "text-white" : "text-zinc-200"}`}>
                                {app.name}
                              </span>
                              {app.category && (
                                <span className="text-zinc-500 text-xs">{app.category}</span>
                              )}
                            </div>
                          </div>
                          {isSelected && <span className="text-emerald-400 text-lg">✓</span>}
                        </button>
                      )
                    })}
                  </div>
                )}

                    {/* Close dropdown button */}
                    {showAppDropdown && (
                      <button
                        onClick={() => setShowAppDropdown(false)}
                        className="text-xs text-zinc-500 hover:text-zinc-400 mb-3"
                      >
                        Close list
                      </button>
                    )}

                    {/* Selected Apps as Emerald Chips */}
                    {whitelistedApps.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {whitelistedApps.map((appName) => {
                          const app = installedApps.find(a => a.name === appName)
                          return (
                            <span
                              key={appName}
                              className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 text-xs rounded-full flex items-center gap-2 shadow-sm shadow-emerald-500/10"
                            >
                              <span className="w-4 h-4 bg-emerald-500/20 rounded flex items-center justify-center text-[10px]">
                                {getCategoryIcon(app?.category || null)}
                              </span>
                              {appName}
                              <button
                                onClick={() => toggleWhitelistApp(appName)}
                                className="hover:text-emerald-100 text-emerald-400/60 ml-1"
                              >
                                ×
                              </button>
                            </span>
                          )
                        })}
                      </div>
                    )}

                <p className="text-xs text-zinc-500">
                  {installedApps.length} apps found on your system
                </p>
              </div>
            </div>
          )}

          {step === 4 && sessionType !== "parking-lot" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Whitelist: Browser & Domains</h3>
                <p className="text-sm text-zinc-300 mb-4">Which browser and sites will you use?</p>
              </div>

              <div className="space-y-4">
                {/* Browser Selection - Button Group */}
                <div>
                  <label className="block text-sm font-medium text-zinc-200 mb-2">Browser</label>
                  <div className="flex gap-2 flex-wrap">
                    {installedBrowsers.length > 0 ? (
                      <>
                        {installedBrowsers.map((browser) => (
                          <button
                            key={browser.identifier}
                            onClick={() => setWhitelistedBrowser(browser.name)}
                            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                              whitelistedBrowser === browser.name
                                ? "bg-emerald-500/10 border-2 border-emerald-500/50 text-emerald-300"
                                : "bg-zinc-800/30 border border-zinc-700/50 text-zinc-400 hover:border-zinc-600"
                            }`}
                          >
                            🌐 {browser.name}
                          </button>
                        ))}
                        <button
                          onClick={() => setWhitelistedBrowser("None")}
                          className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                            whitelistedBrowser === "None"
                              ? "bg-emerald-500/10 border-2 border-emerald-500/50 text-emerald-300"
                              : "bg-zinc-800/30 border border-zinc-700/50 text-zinc-400 hover:border-zinc-600"
                          }`}
                        >
                          None
                        </button>
                      </>
                    ) : (
                      <span className="text-zinc-500 text-sm">Loading browsers...</span>
                    )}
                  </div>
                </div>

                {/* Domain Input Section */}
                {whitelistedBrowser !== "None" && (
                  <div>
                    <label className="block text-sm font-medium text-zinc-200 mb-1.5">
                      Allowed Domains
                    </label>
                    <p className="text-xs text-zinc-500 mb-3">
                      Enter domains — we'll match any URL containing them
                    </p>
                    
                    <div className="space-y-2 mb-3">
                      {whitelistedDomains.map((domain, index) => (
                        <div key={index} className="relative">
                          <input
                            type="text"
                            value={domain}
                            onChange={(e) => updateDomain(index, e.target.value)}
                            placeholder={
                              index === 0
                                ? "gemini.google.com"
                                : index === 1
                                  ? "docs.google.com"
                                  : "github.com"
                            }
                            className={`w-full px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none ${
                              domain.trim()
                                ? "bg-emerald-500/5 border border-emerald-500/30 text-emerald-300 focus:border-emerald-500/60"
                                : "bg-black/20 border border-zinc-700/50 text-white placeholder:text-zinc-600 focus:border-emerald-500/30 focus:bg-emerald-500/5"
                            }`}
                          />
                          {domain.trim() && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500/60 text-xs">
                              ✓ matches /...
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Add more domains button */}
                    {whitelistedDomains.length < 5 && (
                      <button
                        onClick={addDomainField}
                        className="text-xs text-emerald-500/60 hover:text-emerald-400 flex items-center gap-1 mb-4"
                      >
                        <span>+</span> Add another domain
                      </button>
                    )}

                    {/* Example matching explanation */}
                    {activeWhitelistedDomains.length > 0 && (
                      <div className="bg-black/30 rounded-xl p-4 border border-zinc-800">
                        <p className="text-xs text-zinc-500 mb-2">
                          Example: <span className="text-emerald-400">{activeWhitelistedDomains[0]}</span> will allow:
                        </p>
                        <ul className="text-xs text-zinc-400 space-y-1">
                          <li className="flex items-center gap-2">
                            <span className="text-emerald-400">✓</span>
                            https://{activeWhitelistedDomains[0]}/any/path/here
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-emerald-400">✓</span>
                            https://{activeWhitelistedDomains[0]}/app/12345
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-red-400">✗</span>
                            https://other-site.com/{activeWhitelistedDomains[0]}
                          </li>
                        </ul>
                      </div>
                    )}
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
                    <EmeraldSelect
                      value={preparationMinutes}
                      onChange={(val) => setPreparationMinutes(Number(val))}
                      options={[
                        { value: 1, label: "1 minute", icon: "⏱" },
                        { value: 2, label: "2 minutes", icon: "⏱" },
                        { value: 3, label: "3 minutes", icon: "⏱" },
                        { value: 5, label: "5 minutes", icon: "⏱" },
                      ]}
                    />
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
                    className="relative z-20 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 rounded-lg font-semibold text-sm transition-all active:scale-95"
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

        {/* Footer - Hidden during loading transition */}
        {!isPreparingSession && (
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
        )}
      </div>
    </div>
  )
}
