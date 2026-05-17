import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import Script from 'next/script'
import './globals.css'

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
  themeColor: '#04040c',
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://tripdex.vercel.app'),
  title: {
    default: 'Tripdex — Evidence-Based Harm Reduction Database',
    template: '%s | Tripdex Harm Reduction',
  },
  description: 'Comprehensive harm reduction resource with 540+ substances. Check drug interactions, view combination risk matrix, dosage guides, and evidence-based safety information.',
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
  authors: [{ name: 'Tripdex' }],
  creator: 'Tripdex',
  publisher: 'Tripdex',
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
    url: 'https://tripdex.vercel.app',
    siteName: 'Tripdex',
    title: 'Tripdex — Evidence-Based Harm Reduction Database',
    description: '540+ substances with interaction checking, combination risk matrix, and dosage guides.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Tripdex — Evidence-Based Harm Reduction',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tripdex — Evidence-Based Harm Reduction Database',
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Tripdex',
    description: 'Evidence-based harm reduction database and drug interaction checker',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://tripdex.vercel.app',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://tripdex.vercel.app'}?q={search_term_string}`,
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
    <html lang="en" className={`${inter.variable} ${mono.variable} dark`}>
      <head>
        <Script
          id="json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased">
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
          <div className="orb orb-4" />
        </div>
        <div className="grid-noise" />
        <div className="relative z-10 min-h-screen flex flex-col">{children}</div>
      </body>
    </html>
  )
}
