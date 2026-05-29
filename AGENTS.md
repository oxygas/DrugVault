# TripGem — Agent Guide

A Next.js 16 App Router SSG site: 618 substances, 619+ static pages, combo matrix, interaction checker, dosage guides. Dark vaporwave/cyberpunk theme, Tailwind v4.

## Commands
- `npm run dev` — Next.js 16 Turbopack dev server
- `npm run build` — SSG build (~30-60s)
- `npm run lint` — ESLint on `src/`; `@next/next/no-img-element` off, `prefer-const` warn
- No test suite; no typecheck script

## Data Layer
- **`src/data/all-data.json`** (~55K lines, 618 substances, 877 combos, 200 rules) uses compact single-letter keys: `n`=name, `c`=category, `hl`=harmLevel, `sm`=SMILES, etc. Deserialized via `expandSubstance()` in `src/lib/data.ts:27`. Cast as `RawData`.
- **Subjective effects**: MDMA has full data from `mdma-effects.json`; ~50 others have `{positives,negatives,why}` from `subjective-effects.json`. Rest have none.
- **Search**: bigram-based index built at import time. Exact match + prefix boosted. Min 2 chars. No API calls.
- **Harm score**: 0-100 scaled to 10 LED dots (`Math.round(harmScore / 10)`).
- `scripts/enrich-from-pw.py` for data enrichment from PsychonautWiki.

## Architecture
- **Routes**: `/` (server → `HomeClient`), `/substances/[slug]` (SSG, 618 paths), `/combo` → `redirect('/')`. `/lab` is preview with mock data. `/studio` is Sanity CMS (crashes without `.env.local`).
- **Config registries**: `src/lib/registry.ts` is source of truth for `CATEGORY_REGISTRY`, `COMBO_LEVEL_REGISTRY`, `HARM_LEVEL_REGISTRY`. `src/lib/types.ts` derives `CATEGORY_COLORS`, `COMBO_LEVEL_COLORS` etc. from it. Never hardcode colors. `src/features/registry.ts` is a separate feature registration system for dynamic section imports.
- **Entry**: `HomeClient.tsx` orchestrates `StatsBar` + 3 feature sections; manages keyboard shortcuts.
- **Path alias**: `@/*` → `./src/*`.
- **Keyboard shortcuts**: `Alt+1/2/3` sections, `Alt+S` settings, `/` or `Ctrl+K` search, `?` help, `Esc` close popup.
- **15 categories, 6 combo levels, 4 harm levels** — all defined in `src/lib/registry.ts`.

## Section Transition
- Sections render in a `<div style={{ display: 'grid' }}>` with `gridRow: 1, gridColumn: 1` overlap. Inactive sections use `display: none`. Pure React state toggle — no crossfade animation between sections currently.
- `.section-card` has `contain: content` in CSS — ALL sections override inline with `contain: none`. Never rely on the CSS class value.
- Single `activeSection` state in `HomeClient`.

## State Management
- **5 zustand stores**: `src/stores/bookmarks.ts`, `journal.ts`, `settings.ts`, `theme.ts`, `ui.ts`.
- **Theme**: 9 themes from `src/themes/config.ts` via `data-theme` attribute on `<html>`, managed by `src/stores/theme.ts`.

## Performance (do not regress)
- **DigitalRain.tsx**: RAF loop MUST pause when `document.hidden` and resume on `visibilitychange` — was running 24/7 on full-viewport canvas.
- **layout.tsx**: Mousemove handler MUST be RAF-coalesced — was invalidating CSS vars on every pixel.
- **RadarChart.tsx**: `useEffect` for redraw MUST have `[needsRedraw]` dep array — was running on every render.

## CSS Gotchas
- `.glass` variants have `overflow: hidden` — breaks `position: sticky`. For sticky headers (ComboMatrix): inline `background: var(--bg3)` with `position: sticky`, never `.glass`.
- Tailwind v4 via `@tailwindcss/postcss` (import `@import "tailwindcss"` in globals.css, NOT classic `tailwindcss`).
- iOS zoom prevention: `.search-input` must have `font-size: 16px`.
- `content-visibility: auto` on `.vaporwave-card` for offscreen rendering perf.
- Mobile popup: use `dvh` not `vh`, add `min-h-0` to flex children to prevent overflow.
- `contain: content` is set on `.section-card`, `.metric-card`, and `.info-card` in CSS — always needs inline override when `position: sticky` is needed.

## Effects Layer (z-index stack, bottom→top)
- `z-index: -2` — Body animated gradient
- `z-index: 0` — Floating orbs, grid-noise SVG, cyberpunk perspective grid
- `z-index: 1` — Particles, DigitalRain canvas
- `z-index: 2` — Mouse-glow radial follower
- `z-index: 99` — Chromatic aberration overlay
- `z-index: 9999` — CRT scanlines + vignette
- Reduced motion: `prefers-reduced-motion: reduce` kills all layers above z-2 via `display: none`.

## Accessibility
- SubstancePopup: `role="dialog"`, `aria-modal="true"`, focus trap.
- SearchBar: `role="combobox"`, `role="listbox"`, `role="option"`, `aria-selected`.
- SVGs: decorative (`aria-hidden="true"`) or wrapped in labeled buttons.

## Environment & Setup
- **Required**: `NEXT_PUBLIC_SANITY_PROJECT_ID` and `NEXT_PUBLIC_SANITY_DATASET` in `.env.local` (Sanity Studio crashes without them).
- **Sentry**: configured in `next.config.mjs` with tunnel `/monitoring`. DSN in `sentry.server.config.ts`, `sentry.client.config.ts`, `sentry.edge.config.ts`. `@sentry/nextjs` in deps.
- **Vercel deploy**: `vercel.json` sets `iad1` region, security headers, standard build.
