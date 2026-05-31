import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { validateToken } from '@/lib/admin-auth'

const BLOCKED_BOTS = [
  'GPTBot', 'CCBot', 'Google-Extended', 'anthropic-ai', 'Claude-Web', 'ClaudeBot',
  'Omgilibot', 'Omgili', 'FacebookBot', 'Bytespider', 'Diffbot', 'PerplexityBot',
  'cohere-ai', 'ImagesiftBot', 'Timpibot', 'VelenPublicWebCrawler', 'DataForSeoBot',
  'petalbot', 'MBCrawler', 'Sogou', 'AhrefsBot', 'SemrushBot', 'MJ12bot', 'DotBot',
  'BLEXIMozilla', 'PetalBot',
]

export async function proxy(request: NextRequest) {
  const ua = request.headers.get('user-agent') || ''

  for (const bot of BLOCKED_BOTS) {
    if (ua.includes(bot)) {
      return new NextResponse(null, { status: 403 })
    }
  }

  const { pathname } = request.nextUrl

  // Admin auth — skip login page and login API
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const token = request.cookies.get('admin_token')?.value
    if (!token || !(await validateToken(token))) {
      const loginUrl = new URL('/admin/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/:path*',
}