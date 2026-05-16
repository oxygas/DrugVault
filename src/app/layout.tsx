import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
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

export const metadata: Metadata = {
  title: 'Tripdex — Evidence-Based Harm Reduction',
  description: 'Comprehensive harm reduction resource with 150+ substances, drug combination matrix, interaction checker, and dosage guides.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable} dark`}>
    <body className="antialiased">
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
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