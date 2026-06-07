# Score Breakdown System Implementation Plan

Created: 2026-05-29
Status: APPROVED
Approved: Yes
Iterations: 0
Worktree: No
Type: Feature

## Summary

**Goal:** Make scores clickable throughout the app, revealing per-substance factor breakdowns with source citations explaining why each score is what it is.

**Architecture:** Extend `all-data.json` compact format with a new `sb` (scoreBreakdowns) key storing per-score factor explanations + source URLs. Build `ScoreBreakdownPopup` component triggered by clicking score badges in SubstanceDetail and SubstancePopup. Add enrichment script to pre-populate factors from existing `risks`, `safety`, `od2`, `w`, `i` arrays. Improve RadarChart with color-coded severity axes.

**Tech Stack:** Next.js 16, TypeScript, Zustand (for popup state), Canvas API (RadarChart), Python (enrichment script), Zod (validation)

## Scope

### In Scope
- New `scoreBreakdowns` data structure in all-data.json compact format
- Updated Substance type, Zod schema, expandSubstance() mapping
- Per-score citation/source URL storage
- ScoreBreakdownPopup component
- Clickable score badges in SubstanceDetail and SubstancePopup
- Improved RadarChart (per-axis severity colors, zone shading)
- Python enrichment script to auto-populate factors from existing data
- Fix interactionDanger max > 100 data issue
- Stats: aggregate score stats for all 6 scores

### Out of Scope
- Community voting / user-contributed scores
- Real-time scoring formula changes
- Substance comparison tool (separate feature)
- Ranking pages by score category
- Sanity CMS schema changes (data is in all-data.json, Sanity is unused)

## Approach

**Chosen:** Annotated Scores with factor breakdowns
**Why:** Keep existing scores as-is (proven data) and layer explanations on top. Avoids recalculating 618 substances while delivering the core ask: "click to see why it was scored that way." The enrichment script gives us initial coverage from existing data.
**Alternatives considered:**
- **Derived scores from factors:** Too complex, would change existing values, requires defining formal formulas per category
- **Manual authoring only:** Impractical for 618 substances with no editorial team
- **No structured data, just pw text:** Too vague — user wants to see specific factors per score

## Context for Implementer

### Key Files
- `src/data/all-data.json` — source truth, compact format
- `src/lib/data.ts` — `expandSubstance()` maps compact keys to full Substance
- `src/lib/types.ts` — Substance interface
- `src/lib/schemas.ts` — Zod validation schemas
- `src/components/RadarChart.tsx` — 6-axis canvas chart
- `src/components/SubstanceDetail.tsx` — detail page with score display
- `src/features/substances/components/SubstancePopup.tsx` — popup with score display
- `src/stores/ui.ts` — Zustand store for popup state
- `scripts/enrich-score-breakdowns.py` — enrichment script (create)

### Data Format
all-data.json uses single-letter compact keys. The new `sb` key structure:
```
sb: {
  hs: { factors: [{ l: "label", e: "explanation", su: "sourceUrl?" }] },
  as: { factors: [...], su: "sourceUrl?" },
  od: { factors: [...] },
  ws: { factors: [...] },
  id: { factors: [...] },
  dl: { factors: [...] }
}
```

### Patterns to follow
- `src/lib/data.ts:27` — expandSubstance pattern for mapping compact keys
- `src/features/substances/components/SubstancePopup.tsx` — popup pattern (dialog with focus trap)
- `src/stores/ui.ts` — zustand store pattern for popup state

### Gotchas
- interactionDanger max is 104 > 100 — must clamp in expandSubstance
- scores that are 0 still need plausible factors — handle gracefully in enrichment
- pw text exists for most substances but varies in length — enrichment script should handle short texts gracefully
- Compact format uses single-letter keys (n, hs, as, od, ws, id, dl, r, s, od2, w, i, pw)

## Assumptions
- All 618 substances need basic factor coverage — enrichment script generates from existing data
- pw text + risks/safety/od2/w/i arrays contain enough signal to generate meaningful factors
- Score values themselves are correct (no recalculation needed beyond clamping)

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Script-generated factors are too generic | Medium | Medium | Script uses template per risk-item with score-contextual language; manually refine high-profile substances |
| Factor data bloat all-data.json | Low | Low | Compact keys keep overhead small (~200 bytes/substance) |
| Score popup performance issues | Low | Low | Pre-load breakdown data in Substance; no extra API calls |

## Goal Verification

### Truths
1. Clicking any score badge in SubstanceDetail opens breakdown showing factors + sources
2. All 618 substances have at least auto-generated factor data
3. RadarChart shows per-axis severity color coding
4. interactionDanger values are clamped to 0-100
5. StatsBar shows aggregate stats for all 6 scores
6. Enrichment script runs successfully, generating `sb` data for all substances

### Artifacts
- `src/lib/types.ts` — new ScoreBreakdowns, ScoreFactor types
- `src/lib/data.ts` — expandSubstance maps `sb` key, clamps scores
- `src/components/ScoreBreakdownPopup.tsx` — popup component
- `src/components/SubstanceDetail.tsx` — clickable score badges
- `src/components/RadarChart.tsx` — per-axis colors
- `scripts/enrich-score-breakdowns.py` — enrichment script

## Progress Tracking

- [ ] Task 1: Data model — extend types, schemas, expandSubstance, clamp scores
- [ ] Task 2: Fix interactionDanger > 100 + verify all score ranges
- [ ] Task 3: Build ScoreBreakdownPopup component
- [ ] Task 4: Make score badges clickable in SubstanceDetail + SubstancePopup
- [ ] Task 5: Improve RadarChart with per-axis severity coloring
- [ ] Task 6: Update StatsBar to show all 6 score aggregates
- [ ] Task 7: Build enrichment script to auto-generate factor data
- [ ] Task 8: Run enrichment, validate output, verify build
      **Total Tasks:** 8 | **Completed:** 0 | **Remaining:** 8

## Implementation Tasks

### Task 1: Data model

**Objective:** Add ScoreBreakdown types, Zod schemas, compact key mapping in expandSubstance, and clamp interactionDanger to 0-100.
**Dependencies:** None

**Files:**
- Modify: `src/lib/types.ts` — add ScoreBreakdown, ScoreFactor, ScoreBreakdowns interfaces
- Modify: `src/lib/schemas.ts` — add Zod schemas for new types
- Modify: `src/lib/data.ts` — map `sb` compact key in expandSubstance, add fallback to empty structure, clamp interactionDanger

**Key Decisions:**
- Type definition:
  ```typescript
  interface ScoreFactor {
    label: string
    explanation: string
    sourceUrl?: string
  }
  interface ScoreBreakdown {
    factors: ScoreFactor[]
    sourceUrl?: string
  }
  interface ScoreBreakdowns {
    harmScore: ScoreBreakdown
    addictionScore: ScoreBreakdown
    odRisk: ScoreBreakdown
    withdrawalSeverity: ScoreBreakdown
    interactionDanger: ScoreBreakdown
    dependenceLiability: ScoreBreakdown
  }
  ```
- `sb` compact keys: `l`=label, `e`=explanation, `su`=sourceUrl
- If `sb` absent: provide empty ScoreBreakdowns (no crash, empty factors)
- Clamp: `r.id = Math.min(r.id, 100)` in expandSubstance

**Definition of Done:**
- [ ] ScoreBreakdowns type added to types.ts
- [ ] Zod schemas updated in schemas.ts
- [ ] expandSubstance maps `sb` key and provides default
- [ ] interactionDanger clamped to max 100
- [ ] `npm run build` passes

---

### Task 2: Fix data issues

**Objective:** Fix any score values outside 0-100 range and verify data consistency.
**Dependencies:** None

**Files:**
- Modify: `src/data/all-data.json` — fix out-of-range scores directly in source

**Key Decisions:**
- Fix at source for cleanliness; clamping in expandSubstance is safety net
- Run validation after fix

**Definition of Done:**
- [ ] No score exceeds 0-100 range in all-data.json
- [ ] Validation script confirms all substances clean

---

### Task 3: Build ScoreBreakdownPopup

**Objective:** Create a popup that displays score breakdown when clicking a score badge. Shows factors, explanations, and source links.
**Dependencies:** Task 1

**Files:**
- Create: `src/components/ScoreBreakdownPopup.tsx`
- Modify: `src/stores/ui.ts` — add scoreBreakdown state (which score, which substance)

**Key Decisions:**
- Zustand store manages popup state: `{ isOpen, substanceName, scoreKey: 'harmScore' | ... }`
- Follow SubstancePopup pattern: `role="dialog"`, `aria-modal="true"`, focus trap, Escape to close
- Reuse existing popup overlay styles
- Layout: Header (score name + value, severity color) → Factors list (label, explanation, source link) → Close button
- Source URLs open in new tab with `rel="noopener noreferrer"`

**Definition of Done:**
- [ ] Popup renders with correct score data for any score/substance
- [ ] Factors display with labels and explanations
- [ ] Source URLs open in new tabs properly
- [ ] Keyboard: Escape closes, Tab traps focus
- [ ] Style matches dark vaporwave theme

---

### Task 4: Make score badges clickable

**Objective:** Wire score badge clicks in SubstanceDetail and SubstancePopup to open ScoreBreakdownPopup.
**Dependencies:** Task 3

**Files:**
- Modify: `src/components/SubstanceDetail.tsx` — clickable score badges for all 6 scores
- Modify: `src/features/substances/components/SubstancePopup.tsx` — clickable score badges for all 6 scores

**Key Decisions:**
- Currently SubstanceDetail shows only harmScore and addictionScore as text. Add badges for odRisk, withdrawalSeverity, interactionDanger, dependenceLiability too.
- Add `cursor: pointer` + hover effect on clickable badges
- SubstancePopup currently shows only harmLevel badge — add score badges in overview tab

**Definition of Done:**
- [ ] All 6 scores displayed as clickable badges in SubstanceDetail
- [ ] All 6 scores displayed as clickable badges in SubstancePopup overview
- [ ] Clicking any badge opens ScoreBreakdownPopup with correct data
- [ ] Cursor + hover states indicate clickability

---

### Task 5: Improve RadarChart

**Objective:** Color-code radar chart axes by severity and add severity zone shading.
**Dependencies:** None

**Files:**
- Modify: `src/components/RadarChart.tsx`

**Key Decisions:**
- Per-axis coloring based on score severity: green (0-30), amber (31-60), red (61-100)
- Keep fill/stroke as category color (substance identity)
- Add background zone shading matching severity bands
- Preserve `[needsRedraw]` dep array pattern
- No performance regression — still uses RAF coalescing

**Definition of Done:**
- [ ] Axis labels color-coded by severity
- [ ] Severity zone shading visible on background grid
- [ ] Canvas rendering smooth, no perf regression

---

### Task 6: Update StatsBar

**Objective:** Show aggregate averages for all 6 scores in the StatsBar.
**Dependencies:** None

**Files:**
- Modify: `src/lib/data.ts` — `getSubstanceStats()` to return all 6 averages
- Follow caller chain to update UI display

**Key Decisions:**
- Add odRisk, withdrawalSeverity, interactionDanger, dependenceLiability averages
- Keep UI compact — expandable or tooltip if needed

**Definition of Done:**
- [ ] getSubstanceStats returns all 6 averages
- [ ] All 6 displayed in UI
- [ ] No layout breakage on narrow viewports

---

### Task 7: Build enrichment script

**Objective:** Python script generating `sb` (scoreBreakdowns) for all 618 substances from existing data.
**Dependencies:** Task 1 (data format defined)

**Files:**
- Create: `scripts/enrich-score-breakdowns.py`

**Key Decisions:**
- Input: `src/data/all-data.json`, Output: enriched `all-data.json` with `sb` keys
- Per-score factor generation:
  - **harmScore (hs):** Map from `risks` array — each risk is a factor. Add high odRisk/as scores as contributors.
  - **addictionScore (as):** Map from `w` (withdrawal) and `rc` (recovery) arrays.
  - **odRisk (od):** Map from `od2` (overdose signs) and overdose-related risks.
  - **withdrawalSeverity (ws):** Map from `w` array entries.
  - **interactionDanger (id):** Map from `i` (interactions) and `bm`/`nm` (best/never mix).
  - **dependenceLiability (dl):** Map from `rc` (recovery) and `w` entries.
- Fallback: 1-2 generic factors from `pw` text summary
- Source URL: `https://psychonautwiki.org/wiki/{name_slug}`

**Definition of Done:**
- [ ] Script runs without errors
- [ ] Every substance gets `sb` data with at least 1 factor per score
- [ ] all-data.json output is valid JSON

---

### Task 8: Run enrichment, validate, verify build

**Objective:** Execute the enrichment script, validate output, verify full build.
**Dependencies:** Task 7

**Files:**
- Modify: `src/data/all-data.json` — enriched with `sb` keys

**Key Decisions:**
- Run `python3 scripts/enrich-score-breakdowns.py`
- Validate all 618 substances have `sb` key with all 6 sub-keys
- Spot-check 10 substances across categories for factor quality
- Run `npm run build` and `npm run lint`

**Definition of Done:**
- [ ] Enrichment script produces valid all-data.json
- [ ] All 618 substances have scoreBreakdowns data
- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] Spot-check confirms factors are meaningful
