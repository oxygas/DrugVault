import { withSentryConfig } from "@sentry/nextjs";

import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cactus.nci.nih.gov' },
      { protocol: 'https', hostname: 'cdn.sanity.io' },
      { protocol: 'https', hostname: 'pubchem.ncbi.nlm.nih.gov' },
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

export default withSentryConfig(nextConfig, sentryOptions)
