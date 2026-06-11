import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import Script from 'next/script'
import { Suspense } from 'react'
import { ClientGemBotButton } from '@/components/ClientDynamicComponents'
import './globals.css'
import { cn } from "@/lib/utils"
import { QueryProvider } from '@/providers/query-provider'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from 'sonner'
import VisualEffects from '@/components/VisualEffects'
import { DEFAULT_THEME } from '@/themes/config'
import { Analytics } from "@vercel/analytics/next"
import { AnalyticsTracker } from '@/components/AnalyticsTracker'


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
  metadataBase: new URL('https://tripgem.space'),
  title: {
    default: 'TripGem — Evidence-Based Harm Reduction Database',
    template: '%s | TripGem Harm Reduction',
  },
  description: 'Comprehensive harm reduction resource with 540+ substances. Check drug interactions, view combination risk matrix, dosage guides, and evidence-based safety information.',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
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
    url: 'https://tripgem.space',
    siteName: 'TripGem',
    title: 'TripGem — Evidence-Based Harm Reduction Database',
    description: '540+ substances with interaction checking, combination risk matrix, and dosage guides.',
    images: [
      {
        url: '/og-image.png',
        width: 396,
        height: 372,
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TripGem — Evidence-Based Harm Reduction Database',
    description: '540+ substances with interaction checking, combination risk matrix, and dosage guides.',
    images: ['/og-image.png'],
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
    url: 'https://tripgem.space',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://tripgem.space/?q={search_term_string}',
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
    <html lang="en" className={cn("dark", inter.variable, mono.variable)} data-theme={DEFAULT_THEME} suppressHydrationWarning>
    {/* suppressHydrationWarning on head: the FOUC script reads localStorage which can differ between SSR and client */}
    <head suppressHydrationWarning>
      <link rel="manifest" href="/manifest.json" />
      <link rel="preconnect" href="https://media4.giphy.com" />
      <Script
          id="theme-loader"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('tripgem-theme');if(t)document.documentElement.setAttribute('data-theme',t);var s=localStorage.getItem('tripgem-settings');if(s){var p=JSON.parse(s);if(p&&p.loFiMode)document.documentElement.classList.add('lo-fi-mode')}else if(window.matchMedia&&window.matchMedia('(pointer: coarse)').matches){document.documentElement.classList.add('lo-fi-mode')}}catch(e){}})()`,
          }}
        />
        <Script
          id="json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased">
        <QueryProvider>
          <TooltipProvider>
            <VisualEffects />
            <div className="relative z-10 min-h-[100dvh] flex flex-col">{children}</div>
            <ClientGemBotButton />
            <Analytics />
            <Suspense fallback={null}>
              <AnalyticsTracker />
            </Suspense>
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