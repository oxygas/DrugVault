# TripGem — Agent Guide

A Next.js 16 App Router SSG site: 540+ substances, 573 static pages, combo matrix, interaction checker. Dark vaporwave theme, Tailwind v4.

## Commands
- `npm run dev` — Next.js 16 Turbopack dev server
- `npm run build` — full SSG build (573 pages)
- `npm run lint` — ESLint on `src/` (5 pre-existing errors in SearchBar.tsx + SubstanceDetail.tsx; `@next/next/no-img-element` off, `prefer-const` warn)
- No test suite

## Data Layer
- **`src/data/all-data.json`** (51K lines, 571 substances) uses compact single-letter keys: `n`=name, `c`=category, `hl`=harmLevel, `sm`=SMILES, `r`=risks, `s`=safety, etc. Deserialized via `expandSubstance()` in `src/lib/data.ts:27`. Must cast via `as RawData` — Zod schemas exist but data bypasses them.
- **Subjective effects**: MDMA has full data from `mdma-effects.json`; ~50 others have `{positives,negatives,why}` from `subjective-effects.json`. Rest have none.
- **Search**: bigram-based index built at import time. Exact match + prefix boosted. No API calls. Min 2 chars.
- **Harm score**: 0-100 scaled to 10 LED dots (`Math.round(harmScore / 10)`).

## Architecture
- **3 routes**: `/` (server → `HomeClient`), `/substances/[slug]` (SSG, 571 paths), `/combo` → `redirect('/')` (no longer a real page). `/lab` is a preview route with mock data.
- **Feature registry**: `src/features/registry.ts` is the source of truth for category config. `src/lib/types.ts` derives `CATEGORY_COLORS`, `COMBO_LEVEL_COLORS` etc. from it. Never hardcode colors.
- **Entry**: `HomeClient.tsx` (~358 lines) orchestrates dynamic imports of `SubstancesSection`, `MatrixSection`, `ToolsSection`. Manages all keyboard shortcuts.
- **Path alias**: `@/*` → `./src/*`.
- **Keyboard shortcuts**: `Alt+1/2/3` sections, `/` or `Ctrl+K` search, `?` help, `Esc` close popup.

## CSS Gotchas
- `.glass` variants have `overflow: hidden` — breaks `position: sticky`. For sticky headers (ComboMatrix): inline `background: var(--bg3)` with `position: sticky`, never `.glass`.
- `.section-card` has `contain: content` — Matrix must override with inline `contain: none`.
- Tailwind v4 via `@tailwindcss/postcss` (import `@import "tailwindcss"` in globals.css, NOT classic `tailwindcss`).
- iOS zoom prevention: `.search-input` must have `font-size: 16px`.
- `.vaporwave-scanlines`: fixed `z-index: 9999` CRT overlay — killed by `prefers-reduced-motion: reduce`.
- `content-visibility: auto` on `.vaporwave-card` for offscreen rendering perf.
- Mobile popup: use `dvh` not `vh`, add `min-h-0` to flex children to prevent overflow.

## Accessibility
- SubstancePopup uses `role="dialog"`, `aria-modal="true"`, and a focus trap (Tab cycles focusable elements, restores previous focus on close).
- SearchBar uses `role="combobox"`, `role="listbox"`, `role="option"` pattern. Options have `aria-selected`.
- SVGs are decorative (`aria-hidden="true"`) or wrapped in labeled buttons.
- `prefers-reduced-motion: reduce` disables all card animations and scanline overlay.

## Known Pre-existing Lint Errors
- `SearchBar.tsx:48-53`: `useEffect` calls `setRecentSearches` and mutates ref synchronously — React 19 strict mode flags these.
- `SubstanceDetail.tsx:211`: unescaped `&quot;` characters in JSX.
- `ComboMatrixPhone.tsx:67`: missing `selectedCat` dependency in `useMemo`.

## Environment & Setup
- **Required**: `NEXT_PUBLIC_SANITY_PROJECT_ID` and `NEXT_PUBLIC_SANITY_DATASET` in `.env.local` (Sanity Studio at `/studio` crashes without them).
- **Sentry**: configured in `next.config.mjs` with tunnel route `/monitoring`. Requires `.env.sentry-build-plugin` for source maps in prod builds.
- **Sanity packages are unused** in src/ — Studio schema exists at `src/sanity/schemas/` but no data fetching from Sanity occurs. Safe to remove if unwanted.
- `@sanity` packages, `next-sanity` — unused deps. Can prune but keep if Studio is expected.
