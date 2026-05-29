import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { cn } from "@/lib/utils"
import { QueryProvider } from '@/providers/query-provider'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from 'sonner'
import AmbientSound from '@/components/AmbientSound'
import DigitalRain from '@/components/DigitalRain'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#0c0820',
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://tripgem.vercel.app'),
  title: {
    default: 'TripGem — Evidence-Based Harm Reduction Database',
    template: '%s | TripGem Harm Reduction',
  },
  description: 'Comprehensive harm reduction resource with 540+ substances. Check drug interactions, view combination risk matrix, dosage guides, and evidence-based safety information.',
  icons: {
    icon: '/logo.svg',
    shortcut: '/logo.svg',
  },
  keywords: [
    'harm reduction',
    'drug interactions',
    'drug database',
    'substance information',
    'dosage guide',
    'drug combination checker',
    'psychonaut wiki',
    'tripsit',
    'erowid',
    'drug safety',
    'harm reduction database',
    'interaction checker',
  ],
  authors: [{ name: 'TripGem' }],
  creator: 'TripGem',
  publisher: 'TripGem',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://tripgem.vercel.app',
    siteName: 'TripGem',
    title: 'TripGem — Evidence-Based Harm Reduction Database',
    description: '540+ substances with interaction checking, combination risk matrix, and dosage guides.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TripGem — Evidence-Based Harm Reduction Database',
    description: '540+ substances with interaction checking, combination risk matrix, and dosage guides.',
  },
  alternates: {
    canonical: '/',
  },
  category: 'health',
  verification: {
    other: {
      'google-site-verification': '',
    },
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'TripGem',
    description: 'Evidence-based harm reduction database and drug interaction checker',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://tripgem.vercel.app',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://tripgem.vercel.app'}?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
    about: {
      '@type': 'Thing',
      name: 'Harm Reduction',
      description: 'Evidence-based information about substances, drug interactions, and safety guidelines',
    },
    audience: {
      '@type': 'Audience',
      audienceType: 'Healthcare professionals, researchers, and individuals seeking harm reduction information',
    },
  }

  return (
    <html lang="en" className={cn("dark", inter.variable, mono.variable)}>
      <head>
        <Script
          id="json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased">
        <QueryProvider>
          <TooltipProvider>
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
              <div className="orb orb-1" />
              <div className="orb orb-2" />
              <div className="orb orb-3" />
              <div className="orb orb-4" />
            </div>
            <div className="grid-noise" />
            <div className="cyber-grid" aria-hidden="true" />
            <div className="vaporwave-horizon" aria-hidden="true" />
            <DigitalRain />
            <div className="chromatic-overlay" aria-hidden="true" />
            <div className="particles" aria-hidden="true">
              {Array.from({ length: 25 }).map((_, i) => {
                const seed = i * 137.5
                const frac = (s: number) => Math.abs(Math.sin(seed * (s + 1)))
                const isSparkle = i >= 40
                const colors = [
                  'rgba(207, 10, 110, 0.6)',
                  'rgba(255, 0, 170, 0.6)',
                  'rgba(229, 0, 75, 0.6)',
                  'rgba(139, 0, 51, 0.5)',
                  'rgba(168, 85, 247, 0.5)',
                  'rgba(0, 240, 255, 0.4)',
                ]
                if (isSparkle) {
                  return (
                    <div
                      key={i}
                      className="particle-sparkle"
                      style={{
                        '--x': `${5 + frac(1) * 90}%`,
                        '--d': `${14 + frac(2) * 16}s`,
                        '--delay': `${frac(3) * 25}s`,
                        '--s': `${3 + frac(4) * 3}px`,
                        '--drift': `${-80 + frac(5) * 160}px`,
                        '--c': colors[i % 6],
                      } as React.CSSProperties}
                    />
                  )
                }
                return (
                  <div
                    key={i}
                    className="particle"
                    style={{
                      '--x': `${5 + frac(1) * 90}%`,
                      '--d': `${8 + frac(2) * 16}s`,
                      '--delay': `${frac(3) * 22}s`,
                      '--s': `${1.5 + frac(4) * 4}px`,
                      '--drift': `${-70 + frac(5) * 140}px`,
                      '--glow-blur': `${4 + frac(6) * 6}px`,
                      '--c': colors[i % 6],
                    } as React.CSSProperties}
                  />
                )
              })}
            </div>
            <div className="mouse-glow" />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  let mxTick = false
                  document.addEventListener('mousemove', function(e) {
                    if (mxTick) return
                    mxTick = true
                    requestAnimationFrame(function() {
                      document.documentElement.style.setProperty('--mx', e.clientX + 'px')
                      document.documentElement.style.setProperty('--my', e.clientY + 'px')
                      mxTick = false
                    })
                  })
                `,
              }}
            />
            <AmbientSound />
            <div className="relative z-10 min-h-screen flex flex-col">{children}</div>
            <Toaster
              position="bottom-center"
              toastOptions={{
                style: {
                  background: '#18181b',
                  border: '1px solid #27272a',
                  color: '#e4e4e7',
                  fontSize: '13px',
                },
              }}
            />
          </TooltipProvider>
        </QueryProvider>
      </body>
    </html>
  )
}