# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Node Version

```
nvm use 20.17.0
```

## Commands

```bash
npm run dev          # Next.js dev server
npm run build        # prisma generate && next build
npm run lint         # ESLint
npx tsc --noEmit     # Type-check without emitting
npx prisma db push   # Push schema changes to DB
npx prisma seed      # Seed DB (node prisma/seed.js)
```

## Architecture Overview

This is a **Next.js 15 / React 19** app for Backyard Estates, an ADU (Accessory Dwelling Unit) construction company. The app has three distinct surfaces:

### 1. Public Marketing Site (`app/`)
Standard Next.js pages: blog, floorplans, customer stories, pricing, FAQ, events, contact. Uses **Sanity CMS** for all content (client at `sanity/client.ts`, GROQ queries at `sanity/queries.ts`).

### 2. Admin Proposal Tool (`app/tools/admin/master/`)
A multi-step wizard (6 steps) that sales reps use to build a custom ADU proposal for a prospect. Steps are rendered by `AdminMasterClient` and each step is a `StepCard`. The core flow:
- **Step 1**: Customer name, address, ADU type, motivation
- **Step 2**: Choose floorplan units to compare
- **Step 3**: Site work cost estimation
- **Step 4**: Discounts
- **Step 5**: Rental market comps (via Rentcast API)
- **Step 6**: Review & generate → broadcasts to the presenter view

All financial calculations happen in `lib/investment/scenario.ts`, which builds `Scenario` objects (defined in `lib/investment/types.ts`). The `DEFAULTS` object in types.ts holds all model constants (interest rate 6.5%, 30yr, etc.). **Never change these without explicit instruction** — they drive the investment math shown to prospects.

### 3. Presenter View (`app/present/`)
A fullscreen 10-slide deck shown on a second display during the sales meeting. Key architecture:

- **`PresentClient.tsx`** — shell that renders all 10 slide components in an absolute-positioned stack; only the active slide is visible via CSS transition
- **`lib/store/presentationStore.ts`** — single Zustand store holding all state for both the admin tool and the presenter view
- **`lib/sync/presentationSync.ts`** — `BroadcastChannel` + `localStorage` bridge so the admin tab pushes state to the presenter tab in real time
- **Slides** — `app/present/slides/SlideN_Name.tsx` + `SlideN.module.css` (one CSS module per slide)
- **Design tokens** — `app/present/styles/present.design.css` (imported globally in `app/present/layout.tsx`); all colors/typography/spacing via `var(--p-*)` CSS custom properties. `present.system.css` in the same folder is unused/superseded.
- **Font** — Outfit (Google Fonts) loaded via `next/font/google` in `app/present/layout.tsx` with variable `--font-outfit`; referenced via `--p-font` in design tokens

Global CSS classes from `present.design.css` (e.g. `slide-header`, `slide-header-dark`, `slide-header-title`, `slide-header-pill`, `p-tag`, `eyebrow`) are used directly as string `className` values in JSX — they are **not** CSS module references.

Count-up animations on dollar/percentage values use the local `useCountUp` hook pattern (RAF + ease-out cubic) in Slides 3, 6, 8, 9. The `active` flag (`currentSlide === N`) resets/restarts animation on slide entry.

### 4. Feasibility Tool (`app/tools/feasibility/`)
Customer-facing tool to check if their property qualifies for an ADU. Uses Prisma + PostgreSQL (`lib/feasibility/`). State in `lib/feasibility/stores/`.

## Auth & Roles

**Clerk** handles auth. Three roles: `CUSTOMER`, `ARCHITECT`, `ADMIN` (defined in `types/roles.ts`).

- `/present` — public (no auth)
- `/tools/feasibility` — any signed-in user
- `/tools/admin` — ADMIN only
- `/tools/fpa` — ARCHITECT or ADMIN

Role is read from Clerk session claims in `middleware.ts`.

## Data Layer

- **Sanity** — CMS for floorplans, blog posts, customer stories, completed properties. All queries in `sanity/queries.ts`.
- **Prisma + PostgreSQL** — used for feasibility reports (`FeasibilityReport`, `FeasibilityAnswer`, `FormalAnalysis`), work items/pricing models, and users. Schema at `prisma/schema.prisma`.
- **Supabase** — present but minimal; PostgreSQL adapter used with Prisma.
- **Rentcast API** — rental market data fetched via `app/api/rentcast/` and `lib/rentcast/`.
- **Pipedrive API** — CRM integration at `app/api/pipedrive/`.
- **Resend** — transactional email at `app/api/send-email/` and `app/api/send/`.
- **Cloudinary** — image hosting; `next-cloudinary` for uploads.

## Key Configuration Files

- `lib/config/repConfig.ts` — company contact info, license numbers, tagline. Update here first when company details change.
- `lib/investment/types.ts` — `DEFAULTS` object with all financial model constants.
- `lib/investment/cityTimelines.ts` — permitting timelines by city (shown on Slide 10).
- `lib/investment/paymentSchedule.ts` — payment milestone generation logic.

## Presenter Slide Conventions

When adding or modifying slides:
1. Each slide gets its own `SlideN.module.css` — no shared module, no hardcoded colors/sizes in TSX
2. Use `var(--p-*)` for all colors, typography, spacing
3. Global utility classes (`slide-header`, etc.) are string classNames, not `s.className`
4. Count-up: use the local `useCountUp` pattern (no animation library); gate on `currentSlide === N`
5. "We build for you." appears as a footer note on every slide — styled via `.wbfy` in each module
6. Never touch `lib/store/presentationStore.ts` data fields or `lib/investment/scenario.ts` formulas when working on visual changes
