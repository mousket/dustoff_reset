
## Complete Telemetry Feature List (Ultimate Dustoff Reset)

### Category 1: Detection (Knowing What's Happening)

| Feature | Description | What It Enables |
|---------|-------------|-----------------|
| **Active App Detection** | Know which app is in foreground | Context switch detection |
| **Active Window Title** | Know the window/document name | More granular tracking |
| **Active Browser Tab** | Know current tab URL/title | Tab-level tracking |
| **Tab Switch Detection** | Detect when user changes tabs | Tab switch penalties |
| **App Switch Detection** | Detect when user changes apps | Context switch penalties |
| **Idle Detection** | Detect no keyboard/mouse activity | Dead air detection |
| **Screen Recording** | Capture screen content | AI-based distraction detection |
| **Keystroke Patterns** | Detect typing rhythm | Flow state detection |
| **Mouse Movement Patterns** | Detect mouse activity | Engagement detection |

### Category 2: Classification (Understanding Intent)

| Feature | Description | What It Enables |
|---------|-------------|-----------------|
| **App Categorization** | Classify apps (work, social, entertainment) | Automatic penalty rules |
| **URL Categorization** | Classify websites by category | Website-level penalties |
| **Whitelist Matching** | Check if app/tab is whitelisted | Allowed vs. distraction |
| **Distraction Scoring** | Score how distracting an app/site is | Graduated penalties |
| **Work Pattern Learning** | Learn user's typical work apps | Smarter classifications |

### Category 3: Enforcement (Taking Action)

| Feature | Description | What It Enables |
|---------|-------------|-----------------|
| **App Blocking** | Prevent launching certain apps | Hard enforcement |
| **Website Blocking** | Block access to certain URLs | Hard enforcement |
| **Tab Closing** | Auto-close distraction tabs | Medium enforcement |
| **Notification Suppression** | Block notifications during session | Focus protection |
| **Window Minimizing** | Minimize distraction windows | Soft enforcement |
| **Grayscale Mode** | Make distractions less appealing | Psychological enforcement |
| **Popup Warnings** | Show warning before distraction | Awareness enforcement |

### Category 4: Penalties & Bonuses (Bandwidth Impact)

| Feature | Description | Impact |
|---------|-------------|--------|
| **Context Switch Penalty** | Bandwidth hit when switching apps | -3 to -8 points |
| **Tab Switch Penalty** | Bandwidth hit when switching tabs | -2 to -5 points |
| **Social Media Penalty** | Extra penalty for social sites | -5 to -10 points |
| **Non-Whitelist Penalty** | Penalty for unauthorized apps | -5 to -15 points |
| **Sustained Focus Bonus** | Bonus for staying focused | +2 to +5 points |
| **Deep Work Bonus** | Bonus for long uninterrupted work | +5 to +10 points |
| **Quick Return Bonus** | Reduced penalty if return quickly | 50% penalty reduction |
| **Idle Penalty** | Penalty for extended inactivity | -1 to -3 points/min |

### Category 5: Advanced/AI Features

| Feature | Description | Complexity |
|---------|-------------|------------|
| **Intent Prediction** | Predict if user is about to distract | Very High |
| **Automatic Whitelist** | Learn which apps are work-related | High |
| **Focus Quality Score** | ML-based focus assessment | Very High |
| **Optimal Break Timing** | Predict when user needs break | High |
| **Personalized Decay Rates** | Learn user's attention patterns | High |

---

## Ranked by Implementation Difficulty

### 🟢 EASY (Can implement in 1-2 hours each)

| Rank | Feature | Why Easy | Immediate Value |
|------|---------|----------|-----------------|
| 1 | **Idle Detection** | Tauri has built-in idle time API | Dead air penalties |
| 2 | **Active App Detection (macOS)** | Single Rust crate + Accessibility API | Know current app |
| 3 | **App Switch Detection** | Compare current vs previous app | Context switch penalties |
| 4 | **Hardcoded App Categories** | Just a lookup table | Social media = bad |
| 5 | **Context Switch Penalty** | Already have penalty function | Real bandwidth impact |
| 6 | **Popup Warnings** | Just show our intervention overlay | Awareness |

### 🟡 MEDIUM (4-8 hours each)

| Rank | Feature | Why Medium | Immediate Value |
|------|---------|------------|-----------------|
| 7 | **Active Window Title** | Need accessibility permissions | Document-level tracking |
| 8 | **Whitelist Matching** | Compare detected app to user list | Whitelist enforcement |
| 9 | **Non-Whitelist Penalty** | Combine detection + penalty | Real enforcement |
| 10 | **Notification Suppression** | OS-specific APIs | Focus protection |
| 11 | **URL Detection (Browser)** | Need browser extension | Website tracking |
| 12 | **Tab Switch Detection** | Need browser extension | Tab penalties |

### 🔴 HARD (1-3 days each)

| Rank | Feature | Why Hard | Value |
|------|---------|----------|-------|
| 13 | **App Blocking** | Need system-level permissions | Hard enforcement |
| 14 | **Website Blocking** | Need proxy or browser extension | Hard enforcement |
| 15 | **Cross-Platform Support** | Different APIs per OS | Windows/Linux users |
| 16 | **Browser Extension** | Separate codebase, store approval | Full tab tracking |

### ⚫ VERY HARD (1+ weeks each)

| Rank | Feature | Why Very Hard | Value |
|------|---------|---------------|-------|
| 17 | **Screen Recording + AI** | Privacy, ML models, compute | AI distraction detection |
| 18 | **Intent Prediction** | ML training data needed | Proactive intervention |
| 19 | **Cross-Browser Extension** | Chrome, Firefox, Safari, Edge | Full coverage |

---

## My Recommendation: Start Here

### Phase 4.5: Basic Telemetry (4-6 hours)

Implement the **top 6 easy features**:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   BASIC TELEMETRY PACKAGE                                       │
│                                                                 │
│   1. Active App Detection (macOS)                               │
│      - Know which app is in foreground                          │
│      - Poll every 2 seconds                                     │
│                                                                 │
│   2. App Switch Detection                                       │
│      - Detect when app changes                                  │
│      - Emit event to frontend                                   │
│                                                                 │
│   3. Hardcoded App Categories                                   │
│      - Social: Twitter, Facebook, Instagram, TikTok, Reddit     │
│      - Messaging: Slack, Discord, Messages, WhatsApp            │
│      - Entertainment: YouTube, Netflix, Spotify                 │
│      - Productive: VS Code, Xcode, Terminal, Figma              │
│                                                                 │
│   4. Context Switch Penalty                                     │
│      - Any app switch: -3 bandwidth                             │
│      - Switch to social: -8 bandwidth                           │
│      - Switch to non-whitelist: -5 bandwidth                    │
│                                                                 │
│   5. Idle Detection                                             │
│      - No activity for 2+ minutes: "dead air" warning           │
│      - No activity for 5+ minutes: -5 bandwidth                 │
│                                                                 │
│   6. Popup Warnings                                             │
│      - Show intervention when switching to distraction          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### What This Gets You

With just these 6 features:

| Scenario | What Happens |
|----------|--------------|
| User switches to Twitter | Bandwidth -8, warning popup |
| User switches to Slack | Bandwidth -5 (messaging penalty) |
| User switches to VS Code | No penalty (whitelisted) |
| User idle for 3 minutes | "Dead air" warning |
| User stays focused 10 min | Bandwidth stable/rising |

**This is 80% of the value with 20% of the effort.**

---

## Want Me To Write Phase 4.5?

I can create a walkthrough that adds:

1. **Rust: Active app detection** (macOS first)
2. **Rust: App monitoring loop** (poll every 2 sec)
3. **Rust: Tauri events** (emit app_changed to frontend)
4. **TypeScript: App category lookup**
5. **TypeScript: Penalty application**
6. **Integration with existing bandwidth engine**

This would give you **real telemetry** that makes bandwidth respond to actual user behavior, not just time decay.

---

**Do you want to:**

A) **Do Phase 4 first** (polish, fix builds, ship MVP) → then Phase 4.5 (telemetry)

B) **Do Phase 4.5 now** (add basic telemetry) → then finish polish

**Your call.** Both are valid paths.