# TripGem — Agent Guide

A Next.js 16 App Router SSG site: 540+ substances, 634+ static pages, combo matrix, interaction checker. Dark vaporwave/cyberpunk theme, Tailwind v4.

## Commands
- `npm run dev` — Next.js 16 Turbopack dev server
- `npm run build` — full SSG build (634+ pages, ~30-60s)
- `npm run lint` — ESLint on `src/` (0 errors; `@next/next/no-img-element` off, `prefer-const` warn)
- No test suite

## Data Layer
- **`src/data/all-data.json`** (~55K lines) uses compact single-letter keys: `n`=name, `c`=category, `hl`=harmLevel, `sm`=SMILES, `r`=risks, `s`=safety, etc. Deserialized via `expandSubstance()` in `src/lib/data.ts:27`. Must cast via `as RawData` — Zod schemas exist but data bypasses them.
- **Subjective effects**: MDMA has full data from `mdma-effects.json`; ~50 others have `{positives,negatives,why}` from `subjective-effects.json`. Rest have none.
- **Search**: bigram-based index built at import time. Exact match + prefix boosted. No API calls. Min 2 chars.
- **Harm score**: 0-100 scaled to 10 LED dots (`Math.round(harmScore / 10)`).

## Architecture
- **Routes**: `/` (server → `HomeClient`), `/substances/[slug]` (SSG, 634+ paths), `/combo` → `redirect('/')`. `/lab` is preview with mock data. `/studio` is Sanity CMS (crashes without `.env.local` vars).
- **Feature registry**: `src/features/registry.ts` is source of truth for category config. `src/lib/types.ts` derives `CATEGORY_COLORS`, `COMBO_LEVEL_COLORS` etc. from it. Never hardcode colors.
- **Entry**: `HomeClient.tsx` orchestrates dynamic imports of `SubstancesSection`, `MatrixSection`, `ToolsSection`. Manages all keyboard shortcuts.
- **Path alias**: `@/*` → `./src/*`.
- **Keyboard shortcuts**: `Alt+1/2/3` sections, `Alt+S` settings, `/` or `Ctrl+K` search, `?` help, `Esc` close popup.

## Section Transition (critical — easy to break)
- Uses `prevSection` + grid-overlap + single `entering` state. Never use React `key`-based unmount — it kills exit animations.
- Two sections render simultaneously in a `<div style={{ display: 'grid' }}>`, both with `gridRow: 1, gridColumn: 1` (overlap, no layout shift).
- `fadeOut` 0.1s on prevSection, `fadeIn` 0.12s on new section. Pure opacity crossfade — GPU composited, zero paint invalidation. All state changes are React-batched. Single timeout at 220ms for cleanup.

## State Management
- **5 zustand stores**: `src/stores/bookmarks.ts`, `journal.ts`, `settings.ts`, `theme.ts`, `ui.ts`.
- **Theme**: 9 themes from `src/themes/config.ts` via `data-theme` attribute on `<html>`, managed by `src/stores/theme.ts`.

## Performance (do not regress)
- **DigitalRain.tsx**: RAF loop MUST pause when `document.hidden` and resume on `visibilitychange` — was running 24/7 on full-viewport canvas.
- **layout.tsx**: Mousemove handler MUST be RAF-coalesced — was invalidating CSS vars on every pixel.
- **RadarChart.tsx**: `useEffect` for redraw MUST have `[needsRedraw]` dep array — was running on every render.

## CSS Gotchas
- `.glass` variants have `overflow: hidden` — breaks `position: sticky`. For sticky headers (ComboMatrix): inline `background: var(--bg3)` with `position: sticky`, never `.glass`.
- `.section-card` has `contain: content` in CSS — ALL sections override inline with `contain: none`. Never rely on the CSS class value.
- Tailwind v4 via `@tailwindcss/postcss` (import `@import "tailwindcss"` in globals.css, NOT classic `tailwindcss`).
- iOS zoom prevention: `.search-input` must have `font-size: 16px`.
- `content-visibility: auto` on `.vaporwave-card` for offscreen rendering perf.
- Mobile popup: use `dvh` not `vh`, add `min-h-0` to flex children to prevent overflow.

## Effects Layer (z-index stack, bottom→top)
- `z-index: -2` — Body animated gradient (`body::before`, 3 radial ellipses, `bg-shift` animation)
- `z-index: 0` — Floating orbs, grid-noise SVG, cyberpunk perspective grid
- `z-index: 1` — Particles, DigitalRain canvas
- `z-index: 2` — Mouse-glow radial follower
- `z-index: 99` — Chromatic aberration overlay (2 pseudo-elements with smooth RGB drift)
- `z-index: 9998` — AmbientSound toggle button (bottom-right corner)
- `z-index: 9999` — CRT scanlines + vignette
- Reduced motion: `prefers-reduced-motion: reduce` kills all layers above z-2 (scanlines, chromatic overlay, particles, orbs, grid) via `display: none`.

## Glitch / Chromatic Effects (smooth, not flicker)
- `chromatic-float` 12s smooth opacity cycle + `chromatic-pan-h` 10s + `chromatic-pan-v` 14s independent translates on the two RGB pseudo-element channels. No abrupt opacity jumps.
- `scanlines-breathe` 10s smooth opacity (0.95↔1) on scanlines. No flicker.

## Ambient Sound
- `src/components/AmbientSound.tsx`: Web Audio API cyberpunk drone pad — 8 detuned oscillators at 27.5Hz, simulated spring reverb, dual LFOs on filter/detune, 0.5Hz heartbeat pulse.
- Requires user gesture (click) to start — browser autoplay policy. Toggle button in bottom-right corner.
- `src/components/DigitalRain.tsx`: Canvas-based katakana/alphanumeric rain columns at 15% opacity, masked fade.

## Accessibility
- SubstancePopup: `role="dialog"`, `aria-modal="true"`, focus trap (Tab cycles, restores on close).
- SearchBar: `role="combobox"`, `role="listbox"`, `role="option"`, `aria-selected`.
- SVGs are decorative (`aria-hidden="true"`) or wrapped in labeled buttons.
- `prefers-reduced-motion: reduce` disables all CSS animations, scanlines, particles, chromatic overlay; reduces cyber-grid opacity. Handled per-element in CSS.

## Environment & Setup
- **Required**: `NEXT_PUBLIC_SANITY_PROJECT_ID` and `NEXT_PUBLIC_SANITY_DATASET` in `.env.local` (Sanity Studio at `/studio` crashes without them).
- **Sentry**: configured in `next.config.mjs` with tunnel route `/monitoring`. Requires `.env.sentry-build-plugin` for source maps in prod builds.
- **Sanity**: Packages exist but unused in src/ — Studio schema at `src/sanity/schemas/` but no data fetching from Sanity occurs. Studio route at `/studio/[[...index]]/page.tsx`. Safe to remove Sanity deps if unwanted.
