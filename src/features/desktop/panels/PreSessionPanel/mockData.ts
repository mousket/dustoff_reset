import type { WhitelistSuggestion } from "./types"

export const whitelistSuggestions: WhitelistSuggestion[] = [
  { name: "VS Code", icon: "💻", category: "app" },
  { name: "Figma", icon: "🎨", category: "app" },
  { name: "Slack", icon: "💬", category: "app" },
  { name: "Notion", icon: "📝", category: "app" },
  { name: "Spotify", icon: "🎵", category: "app" },
  { name: "Terminal", icon: "⚡", category: "app" },
  { name: "GitHub", icon: "🔗", category: "tab" },
  { name: "Documentation", icon: "📚", category: "tab" },
  { name: "Linear", icon: "✅", category: "tab" },
  { name: "Stack Overflow", icon: "❓", category: "tab" },
]

export const systemChecks = [
  { label: "Notifications silenced", description: "All distractions blocked" },
  { label: "Tracking initialized", description: "Bandwidth monitoring active" },
  { label: "Whitelist configured", description: "Focus boundaries set" },
  { label: "Session timer ready", description: "Duration locked in" },
]
