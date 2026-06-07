# TripGem

Evidence-based harm reduction database and interaction checker. Browse 540+ substances, check drug combinations, compare profiles, and view dosage guides.

## Features

- **Substance Database** — 540+ entries with harm scores, addiction potential, OD risk, withdrawal severity, and interaction danger ratings
- **Combination Matrix** — Visual grid showing interaction risk between all substance categories (safe → deadly)
- **Interaction Checker** — Select two substances to see specific interaction notes and risk level
- **Compare Tool** — Side-by-side comparison of harm metrics between any two substances
- **Dosage Guides** — Route-specific dosage tables with threshold/light/common/strong/heavy ranges
- **Duration Timeline** — Visual breakdown of onset, peak, offset, and after-effects
- **Radar Charts** — Six-axis visualization of harm, addiction, OD risk, withdrawal, interaction danger, and dependence
- **Chemical Structures** — Auto-fetched from PubChem/NIST CACTUS with SMILES fallback
- **Sanity CMS Integration** — Managed content backend for substance data

## Tech Stack

- **Next.js 16** (App Router, Turbopack)
- **React 19** + TypeScript
- **Tailwind CSS 4** (custom neon/glass theme)
- **Sanity.io** (headless CMS for substance data)
- **Canvas API** (radar charts)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Create `.env.local`:

```
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/                # REST API routes
│   │   ├── substances/     # List + by-slug endpoints
│   │   ├── search/         # Full-text search
│   │   ├── combo-matrix/   # Category interaction rules
│   │   ├── interaction-check/  # Two-substance check
│   │   └── chemical-structure/ # PubChem/CACTUS proxy
│   └── studio/             # Sanity Studio (CMS)
├── components/             # Shared UI components
│   ├── SearchBar.tsx
│   ├── StatsBar.tsx
│   ├── RadarChart.tsx
│   ├── DosageTable.tsx
│   └── DurationTimeline.tsx
├── data/                   # Static datasets
│   ├── substances.ts       # 540+ substance entries
│   ├── comboMatrix.ts      # Category×category rules
│   └── substanceCombos.ts  # Specific substance×substance notes
├── features/               # Feature sections
│   ├── substances/         # Browse + popup detail
│   ├── matrix/             # Combination matrix grid
│   └── tools/              # Interaction checker + compare
├── lib/                    # Shared utilities
│   ├── types.ts            # TypeScript interfaces
│   ├── data.ts             # Data access layer
│   ├── registry.ts         # Category/level config
│   └── api.ts              # Client-side fetch helpers
└── sanity/                 # Sanity config + schemas
    ├── client.ts
    └── schemas/index.ts    # Substance + comboRule schemas
```

## Data Sources

Substance data sourced from PsychonautWiki, TripSit, Erowid, and WHO harm reduction guidelines. Scores are educational estimates, not clinical advice.

## Disclaimer

Educational resource only. Not medical advice. Always consult healthcare professionals.
