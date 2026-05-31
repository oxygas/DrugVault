import { withSentryConfig } from "@sentry/nextjs";
import withBundleAnalyzer from '@next/bundle-analyzer'

import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    remotePatterns: [
      { protocol: 'https', hostname: 'cactus.nci.nih.gov' },
      { protocol: 'https', hostname: 'cdn.sanity.io' },
      { protocol: 'https', hostname: 'pubchem.ncbi.nlm.nih.gov' },
      { protocol: 'https', hostname: 'media4.giphy.com' },
    ],
  },
  turbopack: {
    root: __dirname,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  devIndicators: false,
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: [
      'framer-motion',
      'lucide-react',
      'zod',
    ],
  },
}

const sentryOptions = {
  org: "copecord-a6",
  project: "tripgem",
  silent: !process.env.CI,
  dryRun: !process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  webpack: {
    automaticVercelMonitors: true,
    treeshake: {
      removeDebugLogging: true,
    },
  },
}

export default withSentryConfig(bundleAnalyzer(nextConfig), sentryOptions)
