# TripGem — Agent Guide

A Next.js 16 App Router SSG site: 540+ substances, 615+ static pages, combo matrix, interaction checker. Dark vaporwave/cyberpunk theme, Tailwind v4.

## Commands
- `npm run dev` — Next.js 16 Turbopack dev server
- `npm run build` — full SSG build (615+ pages)
- `npm run lint` — ESLint on `src/` (currently 0 errors; `@next/next/no-img-element` off, `prefer-const` warn)
- No test suite

## Data Layer
- **`src/data/all-data.json`** (51K lines) uses compact single-letter keys: `n`=name, `c`=category, `hl`=harmLevel, `sm`=SMILES, `r`=risks, `s`=safety, etc. Deserialized via `expandSubstance()` in `src/lib/data.ts:27`. Must cast via `as RawData` — Zod schemas exist but data bypasses them.
- **Subjective effects**: MDMA has full data from `mdma-effects.json`; ~50 others have `{positives,negatives,why}` from `subjective-effects.json`. Rest have none.
- **Search**: bigram-based index built at import time. Exact match + prefix boosted. No API calls. Min 2 chars.
- **Harm score**: 0-100 scaled to 10 LED dots (`Math.round(harmScore / 10)`).

## Architecture
- **Routes**: `/` (server → `HomeClient`), `/substances/[slug]` (SSG, 615+ paths), `/combo` → `redirect('/')`. `/lab` is preview with mock data. `/studio` is Sanity CMS (crashes without `.env.local` vars).
- **Feature registry**: `src/features/registry.ts` is source of truth for category config. `src/lib/types.ts` derives `CATEGORY_COLORS`, `COMBO_LEVEL_COLORS` etc. from it. Never hardcode colors.
- **Entry**: `HomeClient.tsx` orchestrates dynamic imports of `SubstancesSection`, `MatrixSection`, `ToolsSection`. Manages all keyboard shortcuts.
- **Path alias**: `@/*` → `./src/*`.
- **Keyboard shortcuts**: `Alt+1/2/3` sections, `/` or `Ctrl+K` search, `?` help, `Esc` close popup.

## CSS Gotchas
- `.glass` variants have `overflow: hidden` — breaks `position: sticky`. For sticky headers (ComboMatrix): inline `background: var(--bg3)` with `position: sticky`, never `.glass`.
- `.section-card` has `contain: content` — Matrix must override with inline `contain: none`.
- Tailwind v4 via `@tailwindcss/postcss` (import `@import "tailwindcss"` in globals.css, NOT classic `tailwindcss`).
- iOS zoom prevention: `.search-input` must have `font-size: 16px`.
- `.vaporwave-scanlines` at `z-index: 9999` — killed by `prefers-reduced-motion: reduce`.
- `content-visibility: auto` on `.vaporwave-card` for offscreen rendering perf.
- Mobile popup: use `dvh` not `vh`, add `min-h-0` to flex children to prevent overflow.

## Effects Layer (z-index stack, bottom→top)
- `z-index: -2` — Body animated gradient (`body::before`, 3 radial ellipses, `bg-shift` animation)
- `z-index: 0` — Floating orbs, grid-noise SVG, cyberpunk perspective grid
- `z-index: 1` — Particles, DigitalRain canvas
- `z-index: 2` — Mouse-glow radial follower
- `z-index: 9997` — Chromatic aberration overlay (RGB fringe + flicker)
- `z-index: 9998` — AmbientSound toggle button (bottom-right corner)
- `z-index: 9999` — CRT scanlines + vignette

## Ambient Sound
- `src/components/AmbientSound.tsx`: Web Audio API cyberpunk drone pad — 8 detuned oscillators at 27.5Hz, simulated spring reverb, dual LFOs on filter/detune, 0.5Hz heartbeat pulse.
- Requires user gesture (click) to start — browser autoplay policy. Toggle button in bottom-right corner.
- `src/components/DigitalRain.tsx`: Canvas-based katakana/alphanumeric rain columns at 15% opacity, masked fade.

## Accessibility
- SubstancePopup: `role="dialog"`, `aria-modal="true"`, focus trap (Tab cycles, restores on close).
- SearchBar: `role="combobox"`, `role="listbox"`, `role="option"`, `aria-selected`.
- SVGs are decorative (`aria-hidden="true"`) or wrapped in labeled buttons.
- `prefers-reduced-motion: reduce` disables all animations, scanlines, particles, chromatic overlay; reduces cyber-grid opacity. Handled per-element in CSS.

## Environment & Setup
- **Required**: `NEXT_PUBLIC_SANITY_PROJECT_ID` and `NEXT_PUBLIC_SANITY_DATASET` in `.env.local` (Sanity Studio at `/studio` crashes without them).
- **Sentry**: configured in `next.config.mjs` with tunnel route `/monitoring`. Requires `.env.sentry-build-plugin` for source maps in prod builds.
- **Sanity packages are unused** in src/ — Studio schema exists at `src/sanity/schemas/` but no data fetching from Sanity occurs. Safe to remove if unwanted.
- `@sanity` packages, `next-sanity` — unused deps. Can prune but keep if Studio is expected.
