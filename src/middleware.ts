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

// Mobile user-agent patterns for detection
const MOBILE_UA_PATTERNS = [
  /Android.*Mobile/i,
  /iPhone/i,
  /iPad/i,
  /iPod/i,
  /BlackBerry/i,
  /Windows Phone/i,
  /webOS/i,
  /Opera Mini/i,
  /Opera Mobi/i,
  /Mobile.*Safari/i,
  /Mobile/i,
]

// Desktop user-agent patterns (to redirect back from m. subdomain)
const DESKTOP_UA_PATTERNS = [
  /Windows NT/i,
  /Macintosh/i,
  /X11/i,
  /Linux.*x86_64/i,
  /Linux.*x86-64/i,
]

function isMobileDevice(userAgent: string): boolean {
  return MOBILE_UA_PATTERNS.some(pattern => pattern.test(userAgent))
}

function isDesktopDevice(userAgent: string): boolean {
  return DESKTOP_UA_PATTERNS.some(pattern => pattern.test(userAgent))
}

export function middleware(request: NextRequest) {
  const ua = request.headers.get('user-agent') || ''
  const url = request.nextUrl
  const hostname = url.hostname

  // Block AI crawlers
  for (const bot of BLOCKED_BOTS) {
    if (ua.includes(bot)) {
      return new NextResponse(null, { status: 403 })
    }
  }

  // Skip redirect for API routes, static files, and Sanity Studio
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/_next/') ||
    url.pathname.startsWith('/studio') ||
    url.pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Check if already on mobile subdomain
  const isMobileSubdomain = hostname.startsWith('m.')

  // Mobile device detected and not on m. subdomain -> redirect to m.
  if (isMobileDevice(ua) && !isMobileSubdomain) {
    const mobileUrl = new URL(url.toString())
    mobileUrl.hostname = `m.${hostname}`
    return NextResponse.redirect(mobileUrl, 302)
  }

  // Desktop device detected and on m. subdomain -> redirect back to main
  if (isDesktopDevice(ua) && isMobileSubdomain) {
    const desktopUrl = new URL(url.toString())
    desktopUrl.hostname = hostname.replace(/^m\./, '')
    return NextResponse.redirect(desktopUrl, 302)
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/:path*',
}