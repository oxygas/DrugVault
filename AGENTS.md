# DrugVault — Agent Guide

## Commands
- `npm run dev` — start dev server (Next.js 16 Turbopack)
- `npm run build` — production build
- `npm run lint` — ESLint on `src/`

No test suite configured.

## Stack
- Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4
- Sanity CMS for substance data (schemas in `src/sanity/`)
- Sentry error tracking (`sentry.client.config.ts`, etc.)
- Path alias: `@/*` → `./src/*`

## Architecture
- Static data: `src/data/` — 540+ substances, combo rules, substance combos
- API routes: `src/app/api/` — substances, search, combo-matrix, interaction-check, chemical-structure
- Feature modules: `src/features/{substances,matrix,tools}/` — each has components + index
- Shared UI: `src/components/` — SearchBar, StatsBar, RadarChart, DosageTable, DurationTimeline
- isMobile detection: `'ontouchstart' in window`, unified via `HomeClient.tsx:38`
- `isMobile` prop flows: HomeClient → feature components (MatrixSection → ComboMatrix, etc.)

## ComboMatrix Layout
- **Phone** (<640px): pill selector + expandable interaction cards (no grid)
- **PC** (≥640px): `<table>` with sticky `<th>` headers (left column + top row)
  - Table approach avoids CSS Grid sizing bugs with `contain: content`
  - Sticky headers: `position: sticky; background: var(--bg3)` — **never** use `.glass` class on sticky elements (has `overflow: hidden` that breaks sticky)
  - Wrapper: `overflow: auto; maxHeight: 75vh` — matrix section overrides `contain: content` with `contain: none`
  - Cell sizing: `max(MIN_CELL=72, min(MAX_CELL=100, fit))` where `fit = floor((containerW - PAD*2 - LABEL_W - GAP*N) / N)`
- `.section-card` CSS has `contain: content` — clips overflow. Matrix section overrides via inline `contain: none`
- Grid header row fixed at 36px, row labels column fixed at 110px

## Theme
- Dark theme via CSS custom properties in `globals.css`
- Glass morphism: `.glass`, `.glass-strong`, `.glass-aero` classes
- Section cards: `.section-card` with `contain: content`, backdrop blur, gradient border

## Configs
- `eslint.config.mjs`: extends `eslint-config-next`, relaxes `@next/next/no-img-element`, `prefer-const: warn`
- `tsconfig.json`: strict mode, JSX react-jsx, `@/` path alias, includes `.next/types/`
- `postcss.config.mjs`: `@tailwindcss/postcss` plugin
- `.env.local` needed: `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`
