# Plan: Share Link Display on Drug Pages

**Feature:** Display a shareable URL `https://tripgem.space/drug/SubstanceName` on each substance detail page.

The user wants to add a visible, copyable link display on each drug page that shows the full URL in the format `https://tripgem.space/drug/SubstanceName` (e.g., `https://tripgem.space/drug/Cyclobenzaprine`). This is purely cosmetic/UX — no routing changes, no sitemap changes, no redirects. The actual page routes remain at `/substances/[slug]`. The displayed URL uses `/drug/` prefix with the original substance name (preserving original casing, not the lowercase slug).

## Design Decisions
- **URL format**: `https://tripgem.space/drug/SubstanceName` — uses original `substance.name` (preserving case), `/drug/` prefix for display purposes only
- **Placement**: Header area of SubstanceDetail.tsx (full-page view), near the substance name/category area
- **Interaction**: Click-to-copy the URL to clipboard, with a toast notification confirming "Link copied!"
- **Also add to**: SubstancePopup.tsx for consistency (the popup modal)
- **Icon**: Use a link/share icon (lucide-react `Link` or custom SVG)

## Success Criteria
- [ ] Every substance detail page shows `https://tripgem.space/drug/SubstanceName`
- [ ] Clicking copies to clipboard
- [ ] Toast appears on copy: "Link copied!"
- [ ] Same feature in SubstancePopup.tsx
- [ ] No routing changes — pages still served at `/substances/[slug]`
- [ ] No changes to sitemap, metadata, robots.txt
- [ ] Build passes, lsp_diagnostics clean

## Tasks

### T1: Add ShareLinkButton component
- Create a small reusable `ShareLinkButton` component (or inline in SubstanceDetail)
- Props: `substanceName: string`
- Displays text like `🔗 https://tripgem.space/drug/SubstanceName`
- On click: `navigator.clipboard.writeText(url)` + toast notification
- Styling: subtle pill/badge style fitting the dark vaporwave/glass theme
- File: `src/components/ShareLinkButton.tsx`

### T2: Integrate into SubstanceDetail.tsx
- Import and place in the header area (around line 150, near the category/harm-level badges)
- Should be visible in the overview/header section of the full-page view

### T3: Integrate into SubstancePopup.tsx
- Import and place in the popup header (around line 437, in the button group near the Compare/Favorite/Close buttons)
- Should be visible in the popup modal as well

### T4: Verify
- `npm run build` passes
- `lsp_diagnostics` clean
- Review changed files manually

## Files to Modify
- `src/components/ShareLinkButton.tsx` (NEW)
- `src/components/SubstanceDetail.tsx`
- `src/features/substances/components/SubstancePopup.tsx`

## Files NOT to Modify
- `src/app/layout.tsx` (no metadata changes)
- `src/app/sitemap.ts` (no sitemap changes)
- `src/app/substances/[slug]/page.tsx` (no route changes)
- `src/lib/slugify.ts` (no slug changes)
- `src/lib/types.ts` (no type changes)

## Verification
1. `lsp_diagnostics` on project — zero errors
2. `npm run build` — exit 0
3. Code review: verify displayed URL format, clipboard copy, toast, no routing changes
4. No existing functionality regressed
