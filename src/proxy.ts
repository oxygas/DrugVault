import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const BLOCKED_BOTS = [
  'GPTBot',
  'CCBot',
  'Google-Extended',
  'anthropic-ai',
  'Claude-Web',
  'ClaudeBot',
  'Omgilibot',
  'Omgili',
  'FacebookBot',
  'Bytespider',
  'Diffbot',
  'PerplexityBot',
  'cohere-ai',
  'ImagesiftBot',
  'Timpibot',
  'VelenPublicWebCrawler',
  'DataForSeoBot',
  'petalbot',
  'MBCrawler',
  'Sogou',
  'AhrefsBot',
  'SemrushBot',
  'MJ12bot',
  'DotBot',
  'BLEXIMozilla',
  'PetalBot',
]

export function proxy(request: NextRequest) {
  const ua = request.headers.get('user-agent') || ''

  // Block AI crawlers
  for (const bot of BLOCKED_BOTS) {
    if (ua.includes(bot)) {
      return new NextResponse(null, { status: 403 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/:path*',
}