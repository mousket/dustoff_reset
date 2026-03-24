
## Phase 9: Presets - Complete Revised Plan

### Overview

| Phase | Total Outputs | Purpose |
|-------|---------------|---------|
| **Specifications (A Series)** | 8 documents | Architecture, design, understanding |
| **Cursor Prompts (B Series)** | 6 documents | Step-by-step implementation |
| **Total** | **14 outputs** | Complete Phase 9 |

---

## Specification Documents (A Series)

| Output | Name | Focus | Est. Lines |
|--------|------|-------|------------|
| ✅ **A1** | Data Layer - Architecture | Why presets, database design, Rust types | ~400 | 
| ✅ **A2** | Smart Whitelisting - Architecture | Default presets, blocklists, categorization | ~450 |
| **A3-1** | Entry Point - Architecture | "How to start?" screen, user flows | ~400 |
| **A3-2** | Quick Start - Architecture | Mode + Duration, smart defaults, state | ~400 |
| **A4-1** | Preset Selection - Architecture | Preset picker, Last Session, sections | ~400 |
| **A4-2** | Preset Cards & Actions - Architecture | Card design, start/edit/delete flows | ~350 |
| **A5** | Create New Updates - Architecture | Save as preset, skip mental prep | ~350 |
| **A6** | Integration - Architecture | Connecting to App.tsx, final flow | ~350 |

---

## Cursor Prompt Documents (B Series)

| Output | Name | What It Builds | Est. Lines |
|--------|------|----------------|------------|
| ✅ **B1** | Backend Prompts | Rust types, persistence, commands | ~500 |
| **B2-1** | Entry Point Prompts | TypeScript types, Entry Point panel | ~400 |
| **B2-2** | Quick Start Prompts | Quick Start panel, hooks | ~400 |
| **B3** | Preset Selection Prompts | Preset picker, preset cards | ~450 |
| **B4** | Create New Prompts | Save as preset, skip prep, wizard updates | ~400 |
| **B5** | Integration Prompts | App.tsx updates, final wiring, testing | ~400 |

---

## Visual Flow

```
SPECIFICATIONS                           PROMPTS
─────────────────────────────────────────────────────────────────

A1: Data Layer ──────────────────────┐
                                     ├──► B1: Backend
A2: Smart Whitelisting ──────────────┘    (You build Rust layer)
                                          
A3-1: Entry Point Architecture ──────┐
                                     ├──► B2-1: Entry Point UI
A3-2: Quick Start Architecture ──────┤
                                     └──► B2-2: Quick Start UI
                                          (You build entry flow)

A4-1: Preset Selection Architecture ─┐
                                     ├──► B3: Preset Selection
A4-2: Preset Cards Architecture ─────┘    (You build preset picker)

A5: Create New Updates ──────────────────► B4: Create New Updates
                                          (You update wizard)

A6: Integration Architecture ────────────► B5: Integration
                                          (You wire everything)
```

---

## Execution Order

### Phase A: Specifications (Read & Understand)

| Step | Output | Status | Time to Read |
|------|--------|--------|--------------|
| 1 | A1: Data Layer | ✅ Complete | ~15 min |
| 2 | A2: Smart Whitelisting | ✅ Complete | ~15 min |
| 3 | A3-1: Entry Point | ⏳ Next | ~12 min |
| 4 | A3-2: Quick Start | ⏳ Pending | ~12 min |
| 5 | A4-1: Preset Selection | ⏳ Pending | ~12 min |
| 6 | A4-2: Preset Cards | ⏳ Pending | ~10 min |
| 7 | A5: Create New Updates | ⏳ Pending | ~10 min |
| 8 | A6: Integration | ⏳ Pending | ~10 min |

### Phase B: Implementation (Build with Cursor)

| Step | Output | Depends On | Time to Build |
|------|--------|------------|---------------|
| 1 | B1: Backend | A1, A2 | ~3-4 hours |
| 2 | B3-1: Entry Point UI | A3-1 | ~2-3 hours |
| 3 | B3-2: Quick Start UI | A3-2 | ~2-3 hours |
| 4 | B4: Preset Selection | A4-1, A4-2 | ~3-4 hours |
| 5 | B5: Create New Updates | A5 | ~2-3 hours |
| 6 | B6: Integration | A6 | ~2-3 hours |



