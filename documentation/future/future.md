
1. **Commercialization** - Identity, payments, trials, licensing
2. **Hector Mode** - Protection/recovery user journey
3. **Conversational AI** - The HUD becoming an intelligent companion


## Strategic Roadmap: Post-Phase 7

### Stream A: Commercialization & Identity

| Phase | Focus | Key Deliverables |
|-------|-------|------------------|
| **A1** | Identity & Settings | User profile, email, preferences, settings UI |
| **A2** | Trial System | 14-day trial, feature gating, trial-to-paid flow |
| **A3** | Payment Integration | Stripe integration, subscription management |
| **A4** | Licensing Modes | Individual, Sponsored (employer/insurance), Enterprise |
| **A5** | Multi-tenancy | Organization accounts, admin dashboards, aggregate reporting |

### Stream B: Hector Mode (Protection/Recovery)

| Phase | Focus | Key Deliverables |
|-------|-------|------------------|
| **B1** | Mode Selection | First-run "What brings you here?", Achilles vs Hector choice |
| **B2** | Hector Pre-Session | "How are you feeling?", context gathering, gentle recommendations |
| **B3** | Hector During-Session | Mid-session check-ins, rest reminders, no penalties |
| **B4** | Hector Post-Session | Reflection prompts, "What helped?", mood tracking |
| **B5** | Pattern Recognition | Data analysis, correlations, personalized insights |
| **B6** | Sustainable Capacity Metric | Alternative to performance bandwidth |

### Stream C: Conversational AI Companion

| Phase | Focus | Key Deliverables |
|-------|-------|------------------|
| **C1** | Message-Based Hints | HUD shows contextual tips, suggestions |
| **C2** | Voice Integration | Text-to-speech for prompts and insights |
| **C3** | Weekly Reviews | "Based on this week, here's what I noticed..." |
| **C4** | Predictive Recommendations | "Tomorrow is Tuesday - your best focus day" |
| **C5** | Conversational Interface | Ask questions, get answers about your patterns |

---

## Dependencies & Sequencing

```
Current State
     │
     ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 5-7: Core Features                                       │
│  (Cognitive Detection, Hard Enforcement, Audio/Polish)          │
└─────────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 10: Smart Learning                                       │
│  ("Is this for work?" prompts)                                  │
└─────────────────────────────────────────────────────────────────┘
     │
     ├─────────────────────┬─────────────────────┐
     ▼                     ▼                     ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  STREAM A   │     │  STREAM B   │     │  STREAM C   │
│             │     │             │     │             │
│ Commercial- │     │   Hector    │     │ Conversa-   │
│ ization     │     │   Mode      │     │ tional AI   │
│             │     │             │     │             │
│ A1 Identity │     │ B1 Mode Sel │     │ C1 Hints    │
│ A2 Trial    │     │ B2 Pre-Sess │     │ C2 Voice    │
│ A3 Payments │     │ B3 During   │     │ C3 Reviews  │
│ A4 Licensing│     │ B4 Post-Sess│     │ C4 Predict  │
│ A5 Multi-ten│     │ B5 Patterns │     │ C5 Chat     │
│             │     │ B6 Capacity │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
```

**Note:** Stream A (Commercialization) is somewhat independent and could start earlier. Streams B and C benefit from having Phases 5-7 and 10 complete.

---

## Stream A: Commercialization Deep Dive

### A1: Identity & Settings

**What we need:**

```
┌─────────────────────────────────────────────────────────────────┐
│  SETTINGS                                                       │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  PROFILE                                                 │   │
│  │                                                         │   │
│  │  Name:     [John Doe                    ]               │   │
│  │  Email:    [john@example.com            ]               │   │
│  │                                                         │   │
│  │  Account:  Free Trial (12 days left)                    │   │
│  │            [Upgrade to Pro]                             │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  MODE                                                    │   │
│  │                                                         │   │
│  │  ○ Achilles (Performance)                               │   │
│  │  ○ Hector (Protection)                                  │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  PREFERENCES                                             │   │
│  │                                                         │   │
│  │  Sound cues:     [On/Off toggle]                        │   │
│  │  Notifications:  [On/Off toggle]                        │   │
│  │  Theme:          [System/Light/Dark]                    │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Data to store:**

```typescript
interface UserProfile {
  id: string;
  email: string;
  name?: string;
  
  // Subscription
  accountType: 'trial' | 'pro' | 'sponsored' | 'enterprise';
  trialEndsAt?: number;
  subscriptionId?: string;
  sponsorId?: string;  // If paid by employer/insurance
  
  // Mode
  appMode: 'achilles' | 'hector';
  
  // Preferences
  soundCues: boolean;
  notifications: boolean;
  theme: 'system' | 'light' | 'dark';
  
  // Metadata
  createdAt: number;
  lastActiveAt: number;
}
```

### A2: Trial System

**Flow:**

```
First Launch
     │
     ▼
"Welcome to Dustoff Reset"
     │
     ▼
"Start your 14-day free trial"
[Enter email to begin]
     │
     ▼
Trial Active
(Full features, countdown visible)
     │
     ├── Day 7: "One week left" reminder
     ├── Day 12: "2 days left" reminder
     └── Day 14: Trial ends
              │
              ▼
     "Your trial has ended"
     [Subscribe to continue] [Enter license key]
```

### A3: Payment Integration (Stripe)

**Pricing consideration:**

| Tier | Price | Features |
|------|-------|----------|
| **Trial** | Free (14 days) | Full features |
| **Pro** | $9/month or $79/year | Full features, unlimited |
| **Sponsored** | Paid by org | Full features + reporting |
| **Enterprise** | Custom | Multi-user, admin, analytics |

### A4-A5: Licensing & Multi-tenancy

For insurance/employer-sponsored:

```
Organization Admin Dashboard
     │
     ├── Issue license keys
     ├── View aggregate usage (not individual data)
     ├── Set organization defaults
     └── Manage seats
```

---

## Stream B: Hector Mode Deep Dive

### The Hector User Journey

```
FIRST RUN (Hector selected)
─────────────────────────────────────────────────────────────────

"We're glad you're here. Let's set things up gently."

"Recovery isn't about pushing harder.
 It's about understanding your patterns."

"We'll help you:
 • Track how you feel, not just what you do
 • Notice what helps and what drains you
 • Build sustainable focus capacity"

[Let's begin]
```

### B2: Hector Pre-Session

```
Before Every Session (Hector Mode)
─────────────────────────────────────────────────────────────────

┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Before we start...                                             │
│                                                                 │
│  How are you feeling right now?                                 │
│                                                                 │
│  😫        😕        😐        🙂        😊                      │
│  Drained   Low      Neutral   Good     Energized               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  What have you been doing before this?                          │
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ 🚶 Walk  │ │ ☕ Coffee │ │ 📱 Phone │ │ 😴 Rest  │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ 🍽️ Meal  │ │ 💬 Social│ │ 🏃 Exercise│ │ 📺 Media │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│                                                                 │
│  [Other: ____________]                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Based on your patterns, we suggest:                            │
│                                                                 │
│  🧘 Zen mode, 25 minutes                                        │
│                                                                 │
│  "On days when you feel 'neutral' after using your phone,       │
│   shorter sessions tend to work better for you."                │
│                                                                 │
│  [Sounds good]              [I want to adjust]                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### B3: Hector During-Session

```
Mid-Session Check-in (for sessions > 30 min)
─────────────────────────────────────────────────────────────────

┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  You've been focusing for 20 minutes.                           │
│                                                                 │
│  How's it going?                                                │
│                                                                 │
│  [😊 Great, keep going]                                         │
│                                                                 │
│  [😐 Okay, but could use a short break]                         │
│                                                                 │
│  [😫 Struggling - let's wrap up soon]                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**No penalties. Just check-ins.**

### B4: Hector Post-Session

```
After Session (Hector Mode)
─────────────────────────────────────────────────────────────────

┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Session complete. Well done. 🌿                                │
│                                                                 │
│  How do you feel now compared to before?                        │
│                                                                 │
│  [⬆️ Better]    [➡️ Same]    [⬇️ More tired]                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  What helped you focus today? (optional)                        │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                                                          │  │
│  │  [Text area for reflection]                              │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  [Save & Close]                              [Skip]             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### B5-B6: Pattern Recognition & Capacity Metric

**Data we'd collect over time:**

```typescript
interface HectorSessionLog {
  sessionId: string;
  date: string;
  
  // Pre-session
  preSessionMood: 1 | 2 | 3 | 4 | 5;
  preSessionActivities: string[];
  
  // Session
  mode: SessionMode;
  durationPlanned: number;
  durationActual: number;
  midSessionCheckins: Array<{
    time: number;
    response: 'great' | 'okay' | 'struggling';
  }>;
  
  // Post-session
  postSessionMoodChange: 'better' | 'same' | 'worse';
  reflectionNote?: string;
}
```

**Insights we could generate:**

```
"This week you completed 4.2 hours of focused work.
 That's up from 3.1 hours last week. 📈"

"Pattern noticed: Sessions after walks (3 times)
 had 40% longer focus duration."

"Your best focus days this month: Tuesdays and Thursdays."

"Recommendation: Your capacity seems strongest 9-11am.
 Consider scheduling important work then."
```

---

## Stream C: Conversational AI Deep Dive

### C1: Message-Based Hints

The HUD could show contextual messages:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  [HUD with session timer]                                       │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  💡 "You usually take a break around now. Want one?"            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### C3: Weekly Reviews

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  YOUR WEEK IN REVIEW                                            │
│                                                                 │
│  "This week you completed 12 sessions totaling 6.5 hours.       │
│   Your average session length was 32 minutes.                   │
│                                                                 │
│   I noticed you struggled more on Wednesday afternoon -         │
│   that's the day after your late Monday. Consider protecting    │
│   your sleep before midweek.                                    │
│                                                                 │
│   Your best session this week was Thursday at 10am after        │
│   your morning walk. More of that! 🌿"                          │
│                                                                 │
│  [Got it]                            [Tell me more]             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### C5: Conversational Interface (Future)

```
User: "How am I doing this week compared to last?"

AI: "Your focus time is up 15% - 6.5 hours vs 5.6 hours.
     More importantly, your post-session mood ratings
     are averaging 'better' instead of 'same'.
     
     You're not just doing more, you're recovering better."

User: "What should I do differently next week?"

AI: "Based on your patterns, I'd suggest:
     
     1. Keep the morning walks - they consistently
        precede your best sessions.
     
     2. Avoid scheduling long sessions on Wednesdays -
        your data shows that's your lowest energy day.
     
     3. Try a 20-min session before lunch instead of
        your usual 45-min. You tend to fatigue by minute 30
        on pre-lunch sessions."
```

---

## Bandwidth: Achilles vs Hector

### Achilles Bandwidth (Current)

```
Performance-based:
- Starts at 100
- Decreases with distractions (penalties)
- Regenerates with rest
- Competitive: "Beat your score"
```

### Hector Bandwidth (New Concept)

```
Capacity-based:
- "Sustainable focus hours per day"
- Built from historical data
- No penalties, just observations
- Supportive: "You're within healthy limits"

Example display:

┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Today's Capacity                                               │
│                                                                 │
│  ████████████░░░░░░░░░░░░  3.2 / 5.0 hours used                │
│                                                                 │
│  "You have about 1.8 hours of sustainable focus left today.    │
│   After that, consider lighter tasks or rest."                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**How we calculate Hector capacity:**

```
1. Baseline: Average successful session duration over past 2 weeks
2. Daily total: Sum of sessions where post-mood was 'better' or 'same'
3. Warnings when approaching historical limits
4. Adjusts based on pre-session mood and activities
```

---

## Document Summary

I've created this outline as a **planning document** that covers:

| Stream | Phases | Effort Estimate |
|--------|--------|-----------------|
| **A: Commercialization** | A1-A5 | 4-6 weeks |
| **B: Hector Mode** | B1-B6 | 6-8 weeks |
| **C: Conversational AI** | C1-C5 | 8-12 weeks |

---

## Recommended Sequence

```
NOW
 │
 ├── Complete Phase 5 (Cognitive Detection)
 ├── Complete Phase 6 (Hard Enforcement)
 ├── Complete Phase 7 (Audio & Polish)
 │
 ▼
MILESTONE: Achilles Mode Complete
 │
 ├── Phase 10 (Smart Learning)
 ├── Stream A1-A2 (Identity + Trial) ← Enables commercialization
 │
 ▼
MILESTONE: Ready for Public Launch
 │
 ├── Stream A3 (Payments)
 ├── Stream B1-B2 (Hector Mode Selection + Pre-Session)
 │
 ▼
MILESTONE: Two Modes Available
 │
 ├── Stream B3-B4 (Hector During/Post)
 ├── Stream C1-C2 (Hints + Voice)
 │
 ▼
MILESTONE: Hector MVP Complete
 │
 ├── Stream B5-B6 (Pattern Recognition)
 ├── Stream C3-C5 (Reviews + Conversational)
 ├── Stream A4-A5 (Enterprise)
 │
 ▼
MILESTONE: Full Vision Realized
```

