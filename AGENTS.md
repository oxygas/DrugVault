# DrugVault — Agent Guide

## Commands
- `npm run dev` — Next.js 16 Turbopack dev server
- `npm run build` — full SSG build (571 substance pages)
- `npm run lint` — ESLint on `src/` (uses `eslint-config-next` with `@next/next/no-img-element` off, `prefer-const` as warn)
- No test suite

## Data Layer
- **`src/data/all-data.json`** uses compact single-letter keys (`n`=name, `c`=category, `hl`=harmLevel). Deserialized via `expandSubstance()` at `src/lib/data.ts:27`.
- 571 substances, all read at build time — no browse API calls.
- **Lookup maps** (`CATEGORY_COLORS`, `COMBO_LEVEL_COLORS`) auto-generated from `registry.ts` in `src/lib/types.ts:139-161`. Never hardcode colors.
- **Subjective effects**: only MDMA has full data (`mdma-effects.json`). ~50 others have `{positives,negatives,why}` from `subjective-effects.json`. Rest have none.
- **Search**: bigram-based index at `data.ts:101-130`. Exact match + prefix boosted. No API calls.
- **Harm score**: 0-100 → 10 LED dots (each = 10 pts). `Math.round(harmScore / 10)` filled.

## CSS Gotchas
- All `.glass` variants have `overflow: hidden` — breaks `position: sticky`. For sticky headers (ComboMatrix): use inline `background: var(--bg3)` with `position: sticky`, never `.glass`.
- `.section-card` has `contain: content` — clips overflow. Matrix must override with inline `contain: none`.
- Tailwind v4 via `@tailwindcss/postcss`, NOT the classic `tailwindcss` package. Import is `@import "tailwindcss"` in `globals.css`.
- Dark theme via CSS custom properties (`--bg`, `--text`, `--surface`).
- Mobile breakpoints at `globals.css:1028+`; iOS zoom prevention on `.search-input` (`font-size: 16px`).
- `.vaporwave-scanlines`: fixed `z-index: 9999` CRT overlay with `mix-blend-mode: overlay`. Killed by `prefers-reduced-motion: reduce`.

## Substance Popup Fixes
- **Mobile sizing**: Use `max-h-[92dvh]` instead of `max-h-[92vh]` (dvh = dynamic viewport height, accounts for mobile browser UI)
- **Content scrolling**: Add `min-h-0` to flex children to prevent overflow in flex containers
- **Neon theme**: Radial gradient backdrop (`rgba(168,85,247,0.08) → rgba(236,72,153,0.04) → rgba(0,0,0,0.65)`), animated glow on popup (`box-shadow: 0 0 0px #fff → 0 0 30px rgba(168,85,247,0.6) → 0 0 0px #fff` via keyframes)
- **Tab buttons**: Gradient text (`bg-clip-text, text-transparent, bg-gradient-to-r from-pink-400 to-purple-500`), enhanced active state glow
- **Header accent**: Animated gradient line (`@keyframes gradientShift { 0% { left: 0; } 100% { left: 100%; } }`)

## Architecture
- **Pages**: `/` (server component → `HomeClient`), `/substances/[slug]` (SSG, 571 paths), `/combo` (ISR 60s revalidate).
- **API routes** under `src/app/api/`: `substances`, `search`, `combo-matrix`, `interaction-check`, `chemical-structure`, `psychonautwiki`, `ip-geolocation`. Each wraps Sentry error capture.
- **Features**: `src/features/{substances,matrix,tools}/` — each has `components/` + feature registry at `src/features/registry.ts`.
- **Entry**: `HomeClient.tsx` manages all sections via dynamic imports (`SubstancePopup`, `SubstancesSection`, `MatrixSection`, `ToolsSection`).
- **Path alias**: `@/*` → `./src/*`.
- **Keyboard shortcuts**: `Alt+1/2/3` sections, `/` or `Ctrl+K` search, `?` help, `Esc` close.

## SearchBar
- `/` key focuses search input (desktop only; shows `[/]` kbd hint when empty; X icon when query present).
- "ALL" pill rendered INSIDE the search input row (`cat-pill-inline`), not in the category pills below.
- Recent searches in `localStorage` key `tripgem_recent_searches` (max 8).

## Security
- **Crawler blocking**: `robots.ts` disallows AI crawlers (GPTBot, CCBot, ClaudeBot, etc.) per-bot + globally blocks `/api/`, `/studio/`, `/monitoring`.
- **`src/proxy.ts`** — Next.js middleware pattern for 403 AI crawler blocking (not wired as active middleware; starting point if middleware is needed).
- **`vercel.json`**: security headers (`X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`). Region `iad1`.

## Next-Gen Lab Preview (`/lab`)
- **Route**: `src/app/lab/page.tsx` + `lab-client.tsx` — 5 tabs: Overview, Combo Checker, Dosage Calculator, Effect Timeline, Trip Journal
- **Safety**: `SafetyOverlay` component with dismissible red alerts per section (default, combos, dosage) at `src/components/safety-overlay.tsx`
- **Zustand stores**: `src/stores/bookmarks.ts` (localStorage persist), `journal.ts` (CRUD + export/import), `ui.ts` (sidebar, dismissed overlays)
- **TanStack Query**: Provider at `src/providers/query-provider.tsx`, wired in root layout
- **shadcn/ui**: Components at `src/components/ui/` — Slider uses `@base-ui/react/slider` (not Radix). TooltipProvider wraps app in layout
- **Sonner**: `Toaster` in root layout for all toast notifications
- **Framer Motion**: Micro-interactions on cards (hover scale, staggered entrance), timeline bars (animated width), modal transitions
- **Mock data**: `src/data/mock-substances.ts` — 15 substances with full schema (effects, interactions, ROA dosages, legal status, citations)
- **Combo Checker** (`src/components/combo-checker.tsx`): 15 substance pairs with 6 risk levels (safe→deadly), safer alternative suggestions
- **Dosage Calculator** (`src/components/dosage-calculator.tsx`): MDMA/LSD/Ketamine, 3 ROAs each, tolerance slider, heavy-dose red flags
- **Effect Timeline** (`src/components/effect-timeline.tsx`): Phase-based intensity bars for MDMA/LSD/Ketamine with onset/duration/after-effects
- **SubstanceCardEnhanced** (`src/components/substance-card-enhanced.tsx`): Animated card with harm bar, category gradient, ROA tags, bookmark button
- **Bookmark Button** (`src/components/bookmark-button.tsx`): Toggle with Framer Motion scale animation, persists to localStorage
- **Trip Journal** (`src/components/trip-journal.tsx`): CRUD entries, mood rating, export/import JSON, all localStorage via Zustand persist

## Environment & Setup
- **Required**: `NEXT_PUBLIC_SANITY_PROJECT_ID` and `NEXT_PUBLIC_SANITY_DATASET` in `.env.local` (Sanity Studio crashes without them).
- **Sentry**: configured via `withSentryConfig` in `next.config.mjs`. Tunnel route `/monitoring`. Requires `.env.sentry-build-plugin` for source maps in production builds.
- **Sanity CMS**: schemas in `src/sanity/schemas/index.ts`; Studio at `/studio` route; config at `sanity.config.ts`.
- **Static output**: `next build` generates fully static pages via `generateStaticParams` in substance pages. Sitemap auto-generated at `src/app/sitemap.ts`.
