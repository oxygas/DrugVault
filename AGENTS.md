# DrugVault — Agent Guide

## Commands
- `npm run dev` — dev server (Next.js 16 Turbopack)
- `npm run build` — full SSG build (571 substance pages)
- `npm run lint` — ESLint on `src/`
- No test suite configured; lint errors in SearchBar.tsx are pre-existing

## Data Layer
- **Static data**: `src/data/all-data.json` uses **compact single-letter keys** (e.g. `n` = name, `c` = category, `hl` = harmLevel). Deserialized via `expandSubstance()` in `src/lib/data.ts:27`. All 540+ substances are read at build time.
- **Lookup maps** (`CATEGORY_COLORS`, `COMBO_LEVEL_COLORS`, etc.) are auto-generated from `src/lib/registry.ts` in `src/lib/types.ts:139-161`. Do NOT hardcode color strings.
- **Search**: bigram-based index in `data.ts:101-130`. Exact match + prefix boosted. No API calls.

## ComboMatrix — 3-file split
- `ComboMatrix.tsx` — thin wrapper, width-based detection (`window.innerWidth < 640`). Renders PC or Phone.
- `ComboMatrixPC.tsx` — `<table>` with sticky `<th>` headers. Avoids CSS Grid sizing bugs from `contain: content`.
- `ComboMatrixPhone.tsx` — search bar + 2-col category grid + expandable interaction cards sorted by risk.
- **Sticky headers**: use `position: sticky; background: var(--bg3)`. **Never** use `.glass` class on sticky elements (its `overflow: hidden` breaks sticky positioning).
- **`.section-card`** has `contain: content` which clips overflow. Matrix section must override with inline `contain: none`.
- Cell sizing: `max(72, min(100, floor((containerW - 12 - 110 - 3*N) / N)))` where N = category count.

## CSS Gotchas
- All `.glass` variants have `overflow: hidden` — incompatible with `position: sticky`.
- `contain: content` on `.section-card` / `.metric-card` clips any overflowing child (including sticky, dropdowns, tooltips).
- Dark theme via CSS custom properties in `globals.css` (`--bg`, `--text`, `--surface`, etc.).
- Mobile @media overrides at bottom of `globals.css:1210+`.

## Architecture
- **Pages**: `/` (server component with HomeClient), `/substances/[slug]` (SSG, 571 paths via `generateStaticParams`), `/combo` (ISR)
- **API routes**: `src/app/api/` — `substances`, `search`, `combo-matrix`, `interaction-check`, `chemical-structure`, `psychonautwiki`, `ip-geolocation`
- **Features**: `src/features/{substances,matrix,tools}/` — each has `components/` + `index.ts`
- **Path alias**: `@/*` → `./src/*`

## Misc
- Sanity CMS for substance data, schemas in `src/sanity/schemas/`
- Sentry via `withSentryConfig` in `next.config.mjs` (`.env.sentry-build-plugin` needed for source maps)
- Vercel deploy: `verify/ai.json` + security headers in `vercel.json`
- `combo.html` and `home.html` in root are test artifacts; `generate_effects.py` is a one-off script
