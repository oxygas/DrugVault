# DrugVault — Agent Guide

## Commands
- `npm run dev` — dev server (Next.js 16 Turbopack)
- `npm run build` — full SSG build (571 substance pages)
- `npm run lint` — ESLint on `src/`
- No test suite configured

## Data Layer
- **Static data**: `src/data/all-data.json` uses **compact single-letter keys** (`n`=name, `c`=category, `hl`=harmLevel). Deserialized via `expandSubstance()` in `src/lib/data.ts:27`.
- **571 substances**. All read at build time, no API calls for browse.
- **Lookup maps** (`CATEGORY_COLORS`, `COMBO_LEVEL_COLORS`) auto-generated from `registry.ts` in `types.ts:139-161`. Never hardcode colors.
- **Subjective effects**: only MDMA has full SubjectiveEffects data (`mdma-effects.json`). ~50 others have minimal `{positives,negatives,why}` from `subjective-effects.json`. Rest have none — fall back to aliases.
- **Search**: bigram-based index in `data.ts:101-130`. Exact match + prefix boosted. No API calls.
- **Harm score**: 0-100, rendered as 10 LED dots (each = 10 pts). `Math.round(harmScore / 10)` filled.

## ComboMatrix — 3-file split
- `ComboMatrix.tsx` — thin wrapper, width detection (`window.innerWidth < 640`). Renders PC or Phone.
- `ComboMatrixPC.tsx` — `<table>` with sticky `<th>`. Avoid CSS Grid sizing bugs from `contain: content`.
- **Sticky headers**: `position: sticky; background: var(--bg3)`. Never use `.glass` (its `overflow: hidden` breaks sticky).
- **`.section-card`** has `contain: content` — clips overflow. Matrix must override with inline `contain: none`.
- Cell sizing: `max(72, min(100, floor((containerW - 12 - 110 - 3*N) / N)))`.

## CSS Vaporwave System
- **`.vaporwave-card`**: compact card (12/14px padding, `contain-intrinsic-size: 92px`, `content-visibility: auto`). Has `neon-stripe` (4px left glow, `tubePulse` animation), `diagonal-shine` overlay, `cardGlitchIn` clip-path entrance animation.
- **Staggered delays**: `.vaporwave-grid > .vaporwave-card:nth-child(1..12)` — 40ms increments (CSS only, no JS).
- **`.vaporwave-scanlines`**: fixed `z-index: 9999` CRT overlay with `mix-blend-mode: overlay`. Triggers `scanFlicker` animation.
- **`.cat-pill`**: category filter pills with `letter-spacing: 0.12em`, `text-transform: uppercase`, `::before` diagonal shine. Active state has `tubePulse`.
- **`.cat-pill-inline`**: "ALL" pill rendered inside the search bar container. Uses `color-mix(in srgb, ...)` for active background/border.
- **`.section-header`**: box-drawing header `╔══ N substances ══╗`.
- **Chromatic aberration**: `.vaporwave-card:hover .card-name` triggers `chromaticDrift` (red/cyan text-shadow offset).
- **Reduced motion**: `@media (prefers-reduced-motion: reduce)` kills all animations + hides scanlines.
- **Mobile overrides** at globals.css:1021+, iOS zoom prevention on `.search-input` (`font-size: 16px`).

## SearchBar
- `/` key focuses search input (desktop only, shows `[/]` kbd hint when empty).
- "ALL" pill is INSIDE the search input row (`cat-pill-inline`), not in the category pill row below.
- Right side: conditional — X icon when query present, `[/]` kbd hint when empty.
- Category pills rendered below in flex-wrap row.
- Recent searches stored in `localStorage` key `tripdex_recent_searches` (max 8).

## Architecture
- **Pages**: `/` (server → HomeClient), `/substances/[slug]` (SSG, 571 paths), `/combo` (ISR 1m)
- **API routes**: `src/app/api/` — `substances`, `search`, `combo-matrix`, `interaction-check`, `chemical-structure`, `psychonautwiki`, `ip-geolocation`
- **Features**: `src/features/{substances,matrix,tools}/` — each has `components/` + `index.ts`
- **Entry**: `HomeClient.tsx` manages all sections, dynamic import for `SubstancePopup`
- **Path alias**: `@/*` → `./src/*`
- **Keyboard shortcuts**: `Alt+1/2/3` sections, `/` or `Ctrl+K` search, `?` help, `Esc` close

## CSS Gotchas
- All `.glass` variants have `overflow: hidden` — breaks `position: sticky`.
- `contain: content` clips sticky/dropdown/tooltip overflow.
- Dark theme via CSS custom properties (`--bg`, `--text`, `--surface`).
- Mobile media queries at globals.css:1028+.

## Misc
- Sanity CMS (schemas in `src/sanity/schemas/`), deployed via `sanity.config.ts`.
- Sentry via `withSentryConfig` in `next.config.mjs`. Requires `.env.sentry-build-plugin` for source maps.
- Vercel deploy: security headers in `vercel.json`.
- Files under `/home/sigh/` created as root must be `chown sigh:sigh` (AGENTS.md at `/`).
