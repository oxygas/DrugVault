# TripGem — Agent Guide

Next.js 16 App Router SSG site: 634 substances, 877 combos, dark vaporwave/cyberpunk theme, Tailwind v4.

## Commands
- `npm run dev` — Turbopack dev server
- `npm run build` — SSG build (~30-60s)
- `npm run lint` — ESLint on `src/`; `@next/next/no-img-element` off, `prefer-const` warn
- `npm run generate-scores` — regenerates `harm-reduction-scores.json`
- No test suite; no typecheck script

## Data Layer
- **`src/data/all-data.json`** — compact single-letter keys (`n`=name, `c`=category, `hl`=harmLevel, `sm`=SMILES). Deserialized via `expandSubstance()` in `src/lib/data.ts:31`.
- **Search** in `src/lib/data.ts:200`: weighted token matching — name match +150, alias +100, prefix +75/+50, category +30, bigram +1. `STOP_WORDS` exported (line 186).
- **Harm score** → 10 LED dots: `Math.round(harmScore / 10)`. Displayed in HarmBar components.
- **Subjective effects**: MDMA has full data from `mdma-effects.json`; ~556 others have `{positives,negatives,why}` from `subjective-effects.json`.
- `scripts/enrich-from-pw.py` for PsychonautWiki enrichment.
  - **Safety**: `names_match()` validates PW result matches our substance before merging dose/ROA/summary. Prevents cross-contamination (e.g. Opium ← 1,4-Butanediol).
  - **`PW_NAME_VARIANTS`**: explicit name mappings for substances known by different names in PW (e.g. psilocybin → psilocybin mushrooms).
  - **Erowid**: PW lacks dose data for ~79 substances (RChems, dopaminergics, inhalants). Manual Erowid data added for Salvia, Opium, Khat, Nitrous Oxide, Poppers, Ayahuasca, PST.
  - **`DosageTable.tsx`**: `hasMeaningfulDose()` filters routes with null/empty dose. Shows fallback message when no meaningful dose exists.

## GemBot Chat
- **Backend**: `/api/gembot` (POST) proxies to NVIDIA NIM (`meta/llama-3.3-70b-instruct`, overridable via `NVIDIA_MODEL` env var). Requires `NVIDIA_API_KEY` in `.env.local`. Additional routes: `/api/gembot/trending` (GET), `/api/gembot/learn` (POST).
- **Streaming**: SSE stream parsed from NVIDIA's format, re-emitted as `data: {"content":"chunk"}`.
- **Rate limit**: 15 req/min per IP, in-memory cache (resets on cold start).
- **Context enrichment**: `enrichQueryWithSubstanceData()` in `src/lib/gembot-prompt.ts:98` — classifies query (combo/single/general), builds context block from local data. **Relevance gate**: skips context when no token matches a real substance name/alias (line 108-115).
- **Greeting shortcut**: `isGreeting()` returns SSE response directly, no AI call (route.ts:96).
- **Trending boost**: search results reordered by KV trending slugs (gembot-prompt.ts:117-131).
- **System prompt**: relaxed to allow general-knowledge answers when context absent. Strict about using context numbers for harm bars.
- **Max tokens**: 1000 for comparison queries, 600 otherwise. Temperature: 0.7.
- **UI**: `src/components/GemBot/` — 4 components (Button, Overlay, Input, Message). Feedback thumbs baked into `GemBotMessage.tsx`.

## Analytics & Admin
- **KV storage**: `@vercel/kv` in `src/lib/analytics.ts` — ZSET-based counters for queries, substances, pages, feedback, gaps. Analytics API: `/api/analytics/event` (POST), `/api/analytics/dashboard` (GET), `/api/analytics/visitors` (GET).
- **Visitor tracking**: `src/lib/geoip.ts` — ip-api.com (free, 45 req/min, 24h KV cache), KV pipeline writes 8 ZSETs + recent list. `src/lib/use-analytics.ts` client hook sends `keepalive` fetch on every page load.
- **Admin credentials** hardcoded in `src/lib/admin-auth.ts`: HMAC-SHA256 cookie token (24h expiry). Proxy redirects `/admin*` → `/admin/login` when unauthed.
- **Admin dashboard**: `/admin/page.tsx` — visitor stats + substance data + KV analytics tables.

## Architecture
- **`src/proxy.ts`** (NOT `middleware.ts` — Next.js 16 can't have both). Blocks AI crawler UAs, validates admin cookie.
- **Routes**: `/` (server → `HomeClient`), `/substances/[slug]` (SSG, 634 paths), `/combo` → `redirect('/')`. `/lab` = mock data. `/studio` = Sanity CMS (crashes without `.env.local`). Other API routes: `/api/chemical-structure`, `/api/search`, `/api/tts`, `/api/interaction-check`, `/api/combo-matrix`, `/api/substances`, `/api/admin/login`.
- **Config registries**: `src/lib/registry.ts` source of truth for categories (16), combo levels (6), harm levels (4). `src/lib/types.ts` derives colors/labels. Never hardcode colors.
- **Path alias**: `@/*` → `./src/*`.

## State Management
- **6 zustand stores**: `bookmarks.ts`, `journal.ts`, `settings.ts`, `theme.ts`, `ui.ts`, `gembot.ts`. All persist to localStorage via `persist` middleware except `ui.ts`. **GemBot store's `partialize` returns `{}`** — messages are in-memory only, lost on refresh.

## Performance (do not regress)
- **DigitalRain.tsx**: RAF loop MUST pause on `document.hidden`, resume on `visibilitychange`.
- **layout.tsx**: Mousemove handler MUST be RAF-coalesced.
- **RadarChart.tsx**: `useEffect` MUST have `[needsRedraw]` dep.

## CSS Gotchas
- `.glass` variants have `overflow: hidden` — breaks `position: sticky`. For sticky: inline `background: var(--bg3)`.
- Tailwind v4 via `@tailwindcss/postcss` — import `@import "tailwindcss"` in globals.css, NOT classic `tailwindcss`.
- **No `xs` breakpoint** — Tailwind v4 only has `sm` (640px) as the smallest. `hidden xs:*` classes are dead code.
- iOS zoom prevention: `.search-input` must have `font-size: 16px`.
- `content-visibility: auto` on `.vaporwave-card`.
- Mobile popup: use `dvh` not `vh`, `min-h-0` on flex children.
- `contain: content` on `.section-card`, `.metric-card`, `.info-card` — needs inline override when `position: sticky`.

## Effects Layer (z-index bottom→top)
-2: body gradient | 0: orbs, grid-noise, perspective grid | 1: particles, DigitalRain | 2: mouse-glow | 99: chromatic aberration | 9999: CRT scanlines+vignette. Reduced motion kills layers above z-2.

## Accessibility
- SubstancePopup: `role="dialog"`, `aria-modal`, focus trap.
- SearchBar: `role="combobox"`/`listbox`/`option`, `aria-selected`.
- SVGs: `aria-hidden="true"` or wrapped in labeled buttons.

## Environment & Setup
- **Required for dev**: `NVIDIA_API_KEY` in `.env.local` for GemBot. `NVIDIA_MODEL` optional (default `meta/llama-3.3-70b-instruct`, local override uses `meta/llama-3.1-8b-instruct`).
- **KV required for analytics**: `KV_URL` and `KV_TOKEN` in `.env.local`.
- **Sentry**: configured with tunnel `/monitoring`. DSN in `sentry.*.config.ts`. Requires `SENTRY_AUTH_TOKEN` for source maps.
- **Sanity Studio**: crashes without `NEXT_PUBLIC_SANITY_PROJECT_ID` and `NEXT_PUBLIC_SANITY_DATASET`.
- **Vercel deploy**: `vercel.json` sets `iad1` region, security headers.
