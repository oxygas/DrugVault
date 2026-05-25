import { ImageResponse } from 'next/og'

export const alt = 'TripGem — Evidence-Based Harm Reduction Database'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #04040c 0%, #0a0a1a 40%, #12122a 100%)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          gap: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <div
            style={{
              width: 64,
              height: 64,
              background: 'linear-gradient(135deg, #a855f7, #ec4899)',
              transform: 'rotate(45deg)',
              borderRadius: 10,
              boxShadow: '0 0 60px rgba(168,85,247,0.5), 0 0 120px rgba(236,72,153,0.2)',
            }}
          />
          <div style={{ display: 'flex', gap: 0, letterSpacing: '-0.02em' }}>
            <span style={{ fontSize: 72, fontWeight: 800, color: '#c084fc' }}>Trip</span>
            <span style={{ fontSize: 72, fontWeight: 800, color: '#ffffff' }}>Gem</span>
          </div>
        </div>
        <div
          style={{
            fontSize: 24,
            color: '#888899',
            fontWeight: 400,
            letterSpacing: '0.02em',
          }}
        >
          Evidence-Based Harm Reduction Database
        </div>
        <div style={{ display: 'flex', gap: 24, marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
            <span style={{ fontSize: 16, color: '#666677' }}>540+ Substances</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#06b6d4' }} />
            <span style={{ fontSize: 16, color: '#666677' }}>Combo Matrix</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f97316' }} />
            <span style={{ fontSize: 16, color: '#666677' }}>Interaction Checker</span>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  )
}
