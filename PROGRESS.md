# Admin Master Tool — Build Progress

Branch: `claude/pensive-easley-ea1b24`
Last updated: 2026-05-13

---

## What this branch builds

A full redesign of the Admin Master pricing tool at `/tools/admin/master`. The old tool was a single scrolling page with 8 flat "StepSection" blocks. This branch converts it to a **6-step progress-driven workflow** with collapsible step cards, a sticky sidebar, and a rewritten site work estimator UX.

---

## Phase summary

| Phase | Status | Description |
|-------|--------|-------------|
| Changes 1–3 | ✅ Done (prior session) | Base cost / sqft / rent overrides per ADU |
| Change 4 | ✅ Done | Custom "Special" discount amount input |
| Change 5 | ✅ Done | Rental comps "Use" button wired to rent override |
| Change 6 | ✅ Done | Financial Summary CSS polish |
| Change 7 | ✅ Done | Financing Options — collapsible policy knobs, CSS dot badges |
| Change 8 | ✅ Done | Full Model — assumptions collapsible, source badges, toggle pill |
| Phase A | ✅ Done | 6 step shell components + master page wired |
| Phase B | ✅ Done | Content moved into each step, `useAduModel` hook extracted |
| Phase C | ✅ Done | Step collapse/expand, auto-advance, sidebar wiring |
| Phase D | ✅ Done | `market` instance bug fixed, dead code removed |
| SiteWorkPanel | ✅ Done | Master + per-unit estimator redesign |
| SiteWorkEstimator v2 | ✅ Done | Full field editability, two-tab view, version history, localStorage persistence |

---

## Files created (new, did not exist before this branch)

### Shared step infrastructure
| File | Purpose |
|------|---------|
| `app/tools/admin/master/components/shared/StepCard.tsx` | Reusable step card: active/complete/pending states, collapse/expand |
| `app/tools/admin/master/components/shared/StepCard.module.css` | StepCard styles — teal active ring, green collapsed header, gold dot, pending dim |

### Step shell components
| File | Purpose |
|------|---------|
| `app/tools/admin/master/components/steps/Step1_WhoAndWhere.tsx` | Step 1 wrapper |
| `app/tools/admin/master/components/steps/Step2_ChooseUnits.tsx` | Step 2 wrapper |
| `app/tools/admin/master/components/steps/Step3_EstimateJob.tsx` | Step 3 wrapper |
| `app/tools/admin/master/components/steps/Step4_Discounts.tsx` | Step 4 wrapper (badge: OPTIONAL) |
| `app/tools/admin/master/components/steps/Step5_RentalMarket.tsx` | Step 5 wrapper |
| `app/tools/admin/master/components/steps/Step6_ReviewAndGenerate.tsx` | Step 6 wrapper (never collapses) |
| `app/tools/admin/master/components/steps/QuickScan.tsx` | Stub — Phase C placeholder, not yet implemented |

### Hooks
| File | Purpose |
|------|---------|
| `hooks/investment/useAduModel.ts` | All ADU state + computation extracted from `InvestmentSection`. Owns: estimator state, discount state, rent/sqft/baseCost overrides, `defaults`, `scenarios`, `selectedAdus`, all mutator functions. Accepts `market` from parent to avoid duplicate hook instances. |

### Site work estimator
| File | Purpose |
|------|---------|
| `lib/investment/siteWorkItems.ts` | Full category/item data, `EstimatorState` type, `computeTotal`, `createEmptyState`, `mergeEstimatorStates` |
| `app/tools/admin/master/components/SiteWorkEstimator/SiteWorkEstimator.tsx` | Per-unit line-item estimator with preset rows, custom rows, summary stats, reset/copy actions |
| `app/tools/admin/master/components/SiteWorkEstimator/SiteWorkEstimator.module.css` | Estimator styles (local `--sw-*` tokens) |
| `app/tools/admin/master/components/SiteWorkEstimator/SiteWorkPanel.tsx` | **New UX**: master estimator + per-unit override dashboard. Unit cards show totals + Synced/Custom status. Customize → opens per-unit editor. Apply to all → promotes unit state to master. Reset → re-syncs to master. |
| `app/tools/admin/master/components/SiteWorkEstimator/SiteWorkPanel.module.css` | SiteWorkPanel styles |

---

## Files modified (existed before, changed in this branch)

### Core orchestrator
| File | Key changes |
|------|------------|
| `app/tools/admin/master/components/AdminMasterClient.tsx` | Fully rewritten: calls `useAduModel`, renders 6 `Step*` shells with real content, auto-advances (submit→Step2, Done→Step4), passes `completedSteps` + `onStepClick` to sidebar. `InvestmentSection` and `ResultsSection` removed from render tree. |
| `app/tools/admin/master/components/AdminMasterClient.module.css` | Added `.useBtn` (teal outline pill), fixed `.compRight` alignment, polished `.results`/`.card`/`.cardTitle`/`.cardBody`/`.row`/`.rowLabel`/`.rowValue` with `--be-*` tokens |

### Sidebar
| File | Key changes |
|------|------------|
| `app/tools/admin/master/components/StepSidebar/StepSidebar.tsx` | Updated STEPS from 8 old entries → 6 new entries. Accepts `onStepClick` + `completedSteps` props. Clicking a sidebar item both scrolls AND activates the step. `isDone` now reflects real completion booleans, not position. |

### Investment section
| File | Key changes |
|------|------------|
| `app/tools/admin/master/components/Investment/InvestmentSection.tsx` | Added `siteWorkConfirmed` + `setSiteWorkConfirmed` props (Phase A TypeScript fix). Otherwise preserved — file is no longer imported by AdminMasterClient but kept on disk. Dead `useInvestmentModel` call still inside it (orphaned). |
| `app/tools/admin/master/components/Investment/InvestmentSection.module.css` | Added `.specialInput`, `.rentRow`, `.rentBadge`, `.rentBadgeLabel`, `.rentBadgeInput` |

### Rentals
| File | Key changes |
|------|------------|
| `app/tools/admin/master/components/RentalsPanel/RentalsPanel.tsx` | Added `onRentPick?: (rent: number) => void` prop. Each comp row now has a "Use" button that fires the callback and prevents the details toggle. |

### Financing
| File | Key changes |
|------|------------|
| `app/tools/admin/master/components/Financing/FinancingTable.tsx` | Policy card converted from `<div>` to `<details>`/`<summary>`. Reset button fires `e.preventDefault()`. Badge text changed from emoji (`✅`/`❌`) to `"Eligible"` / `"Not eligible"`. |
| `app/tools/admin/master/components/Financing/FinancingTable.module.css` | Full `--be-*` token migration. `.finBadge::before` CSS dot replaces emoji. `.policyHead::after` chevron rotates on `[open]`. |

### Investment model table
| File | Key changes |
|------|------------|
| `app/tools/admin/master/components/investmentModel/InvestmentModelTable.module.css` | `.toggle` pill button with teal accent. Uncommented `.srcInput`/`.srcApi`/`.srcCalc` source badges. Added `.assumptionsDetails` + `.assumptionsSummary` for collapsible assumptions block. |

### StepSection (legacy, kept for reference)
| File | Key changes |
|------|------------|
| `app/tools/admin/master/components/StepSection/StepSection.module.css` | `.badge` changed to orange tint (INTERNAL badge style) |

---

## Architecture decisions

### `useAduModel` hook
All ADU-level state lives here, not in `InvestmentSection`. This decouples the computation from the presentation and lets each step shell receive only what it needs directly from the parent (`AdminMasterClient`).

**Why not context?** The state changes frequently (every input keystroke). A context would re-render the whole tree. Prop drilling through `adu.*` is explicit and fast.

### `market` data flow
`useRentcastData` uses local `useState` — it is **not** context-based. Calling it in both `AdminMasterClient` and `useAduModel` creates two separate instances. Fixed: `AdminMasterClient` calls the hook once, extracts `market`, and passes it into `useAduModel` as a prop.

### StepCard state model
- `isActive` → body visible, teal ring
- `isComplete && !isActive` → collapsed: green header, summary text, Edit button
- `isPending` (`n > activeStep && !isComplete`) → opacity 0.45, pointer-events none
- Step 6 is hardcoded `isActive={true}`, never collapses

### SiteWorkPanel sync model
`SiteWorkPanel` owns `masterEstimator` and `customByAduId` internally. A `useEffect` writes the effective state (custom override ?? master) for each ADU into `setEstimatorByAduId` whenever either changes. `useAduModel` reads `estimatorByAduId` as before — no changes to `buildScenarios`.

### What is NOT changed (protected)
- `buildScenarios()` function — untouched
- `Scenario`, `Defaults`, `RowSpec` types — untouched
- `useInvestmentModel` hook — untouched (orphaned in `InvestmentSection.tsx`, not imported anywhere)
- `useRentcastData` hook — untouched
- `AddressAutocomplete` — untouched
- `FinancingTable` eligibility logic — untouched
- `ModelTable` row rendering — untouched

---

## What's remaining

### Immediate / known issues
- [ ] **Pending steps are fully locked** (`pointer-events: none`) — users can't click the card header to navigate. Fix: remove pointer-events block from `.cardPending`, make pending headers clickable via `onEdit`. Currently requires sidebar for navigation.
- [ ] `InvestmentSection.tsx` is dead code (not imported anywhere). Can be deleted once the team confirms nothing else imports it.
- [ ] `useInvestmentModel` dead call inside `InvestmentSection.tsx` — remove when deleting the file.

### SiteWorkEstimator v2 — completed
- `lib/investment/siteWorkItems.ts`: Added `RowOverride`, `overrides` field, `ActiveLineItem` type, `buildActiveSnapshot()`, `effectiveBeCost()`, `effectiveMarkup()`. All quantities start at 0.
- `SiteWorkEstimator.tsx`: Rewritten. `NumInput` sub-component, full field editability (BE cost, markup, unit price → back-calcs markup, total → back-calcs qty), two-tab view (All accordion / Active flat list), version history with Save & Reset (up to 10 snapshots, session-only).
- `SiteWorkEstimator.module.css`: All new classes added (`.numInput`, `.itemCell`, `.modDot`, `.resetRowBtn`, `.dimCell`, `.totalActive`, `.itemRowOverridden`, `.topBar`, `.topStats`, `.topTotal`, `.topMeta`, `.tabs`, `.tab`, `.tabActive`, `.activeList*`, `.emptyActive`, `.customBadge`, `.histBtn`, `.saveResetBtn`, `.histPanel`, `.histEntry*`, `.restoreBtn`).
- `SiteWorkPanel.tsx`: Added localStorage persistence for `masterEstimator` and `customByAduId` (keys: `swp_master`, `swp_custom`). Survives page reload.
- `hooks/investment/useAduModel.ts`: Added `activeSnapshotByAduId: Record<string, ActiveLineItem[]>` computed from `buildActiveSnapshot` per selected ADU.

### Phase C items not yet done
- [ ] `QuickScan` component — stub only, no implementation
- [ ] "Proposal ready" indicator in sidebar
- [ ] Step 5 (`step5Complete`) is hardcoded `false` — no completion signal yet

### Future / Phase D+ ideas
- [ ] Step 2 "Next" button — currently no explicit action to advance from Step 2 → 3 (requires sidebar click)
- [ ] Completion summary strings for Steps 3–5 are generic placeholders
- [ ] `StepSidebar` uses `showDivider = false` (dead code from old 8-step layout) — can be cleaned up
- [ ] `SiteWorkPanel`: consider persisting master estimator to localStorage so it survives page reload
- [ ] Mobile responsive pass for StepCard layout
