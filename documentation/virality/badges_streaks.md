
# Dustoff Reset: Badges, Streaks & Virality System

## Overview

The badge system is designed with **virality as the core goal**. The philosophy:

> *"People share **victories** to flex and **failures** to be relatable. Dustoff Reset gives them both."*

---

## 1. Badge Categories (45 Total Badges)

| Category | Count | Purpose | Viral Strategy |
|----------|-------|---------|----------------|
| **Milestone** | 9 | Session count achievements | Progress flex |
| **Streak** | 6 | Consecutive day/week streaks | Accountability proof |
| **Performance** | 5 | High bandwidth finishes | Skill flex |
| **Mode** | 7 | Mode-specific (Zen/Flow/Legend) | Status symbols |
| **Shame** | 6 | Low performance badges | Self-deprecating humor |
| **Resilience** | 3 | Comeback stories | Emotional narratives |
| **Secret** | 5 | Hidden until unlocked | Discovery/surprise |
| **Social** | 2 | Sharing achievements | Viral loop |

---

## 2. Badge Rarity System

Each badge has a rarity that affects its visual glow and prestige:

| Rarity | Color | Meaning |
|--------|-------|---------|
| **Common** | Gray | Easy to get |
| **Uncommon** | Green | Some effort |
| **Rare** | Blue | Impressive |
| **Epic** | Purple | Very difficult |
| **Legendary** | Gold/Amber | Elite status |
| **Shame** | Red | Walk of shame |

---

## 3. How Badges Are Unlocked

### Session Evaluation Flow:

```
Session Completes → evaluateBadgesForSession() → Check All Criteria → Unlock Matching Badges
```

The Rust backend (`src-tauri/src/badges/evaluator.rs`) checks:

1. **Milestone badges** - Total session count (1, 5, 10, 25, 50, 100)
2. **Streak badges** - Consecutive days (3, 7, 14, 30, 90, 365)
3. **Performance badges** - Final bandwidth (≥80, ≥90, 100, zero distractions)
4. **Mode badges** - Sessions in specific modes (Zen, Flow, Legend)
5. **Shame badges** - Low bandwidth (≤20, ≤5, exactly 1), many distractions (5+, 10+)
6. **Time badges** - Total focus hours (1h, 10h, 100h)
7. **Secret badges** - Time of day (night owl, early bird), marathon sessions, etc.

---

## 4. Streak System

### Types of Streaks Tracked:

| Streak Type | Logic |
|-------------|-------|
| `daily` | Any session per day |
| `weekly` | At least one session per week |
| `zen_daily` | Zen mode sessions per day |
| `flow_daily` | Flow mode sessions per day |
| `legend_daily` | Legend mode sessions per day |

### Streak Badges Unlock At:
- 3 days → "Trilogy"
- 7 days → "Week Warrior"  
- 14 days → "Fortnight Fighter"
- 30 days → "Monthly Master"
- 90 days → "Quarterly Quest" (Legendary)
- 365 days → "Yearly Legend" (Legendary)

### "At Risk" Detection:
The system checks if your last session was yesterday — if so, your streak is "at risk" and can show a warning.

---

## 5. How Badges Appear (UI Flow)

### Badge Unlock Toast:
When you complete a session and earn a badge:

1. **`BadgeUnlockToast`** slides in below the HUD
2. Shows badge icon with rarity-colored glow
3. Displays "Badge Unlocked!" + name + flavor text
4. Has "Share on X" button and "Dismiss" button
5. Auto-closes after 8 seconds

### Multiple Badge Queue:
If you unlock multiple badges at once, they queue up and show one at a time via `BadgeUnlockQueue`.

---

## 6. Sharing System

### Share Button Flow:

```
Click "Share on X" → buildShareText() → Open Twitter Intent → recordShare()
```

### What Gets Shared:

Each badge has pre-written `shareText` and `hashtags`. Example for "First Blood":

```
Just completed my first focus session with Dustoff Reset! The journey begins. 🩸

#DustoffReset #FirstBlood #Focus

dustoffreset.com
```

### Stats Are Appended:
If you have a streak or total hours, they're added:
- `🔥 7-day streak!`
- `⏱️ 50h focused`

---

## 7. Twitter/X Sharing (How It Works)

### Current Implementation:

```typescript
const shareToTwitter = (options: ShareOptions) => {
  const text = buildShareText(options)
  const encodedText = encodeURIComponent(text)
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedText}`
  
  window.open(twitterUrl, '_blank', 'width=550,height=420')
}
```

**What this does:**
1. Builds the share text with badge info + stats + hashtags
2. URL-encodes the text
3. Opens a popup window with Twitter's "compose tweet" intent
4. **User still needs to click "Post"** — this is by design (Twitter doesn't allow auto-posting for security reasons)

### Can It Auto-Post?
**No** — and that's a good thing. Twitter/X requires:
1. User to be logged in
2. User to explicitly click "Post"

This is a **privacy/security feature** of Twitter. No app can post on your behalf without OAuth authorization and explicit user action.

### Copy to Clipboard:
Alternative sharing method — copies the text so user can paste anywhere (LinkedIn, Discord, etc.)

---

## 8. The Share Card (Visual)

The `ShareCard` component creates a beautiful card that can be:
- Shown in the share modal as a preview
- Potentially exported as an image (future feature)

**Design features:**
- Rarity-based gradient backgrounds (amber for legendary, purple for epic, etc.)
- Glowing badge icon
- Stats display (streak, sessions, hours)
- "dustoffreset.com" watermark

---

## 9. Virality Features Summary

| Feature | How It Creates Virality |
|---------|------------------------|
| **Glory badges** | Users flex achievements |
| **Shame badges** | Users share failures for laughs (relatable!) |
| **Streak badges** | Social accountability |
| **Pre-written share text** | Removes friction from sharing |
| **Hashtags** | Discoverability |
| **Beautiful share cards** | Visual appeal on feeds |
| **Share tracking badges** | Rewards sharing behavior |
| **App link** | Traffic back to dustoffreset.com |

---

## 10. What's NOT Implemented Yet

Based on my review:

1. **LinkedIn sharing** — Only Twitter/X is implemented. Could add:
   ```typescript
   const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
   ```

2. **Image export** — ShareCard renders but can't be downloaded as PNG yet. Would need `html-to-image` or canvas rendering.

3. **Auto-post to Twitter** — Not possible without OAuth. Would need:
   - Twitter developer account
   - OAuth 2.0 flow
   - Server-side API calls
   - User authorization

4. **Referral tracking** — Badge exists ("Spread the Word") but no actual referral system with unique links.

---

## Summary: Is It Viral-Ready?

**Yes, the foundation is solid:**
- 45 badges covering victories AND failures
- Beautiful UI components
- One-click Twitter sharing
- Pre-written shareable content
- Streak psychology built-in

**To make it MORE viral:**
- Add LinkedIn sharing
- Add image export for share cards
- Add referral links for tracking
- Consider Instagram/TikTok share formats

Would you like me to implement any of these enhancements?



after the reset ritual ,
there should be a screen asking how do you feel
or skip it as well 
how are you feeling

for each option, make a recommendation, 