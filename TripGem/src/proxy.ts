import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { validateToken } from '@/lib/admin-auth'
import { geolocation, ipAddress } from '@vercel/functions'

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

  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const token = request.cookies.get('admin_token')?.value
    if (!token || !(await validateToken(token))) {
      const loginUrl = new URL('/admin/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  const requestHeaders = new Headers(request.headers)

  const geo = geolocation(request)
  if (geo.city) requestHeaders.set('x-vercel-ip-city', geo.city)
  if (geo.country) requestHeaders.set('x-vercel-ip-country', geo.country)
  if (geo.countryRegion) requestHeaders.set('x-vercel-ip-country-region', geo.countryRegion)
  if (geo.latitude) requestHeaders.set('x-vercel-ip-latitude', String(geo.latitude))
  if (geo.longitude) requestHeaders.set('x-vercel-ip-longitude', String(geo.longitude))
  if (geo.postalCode) requestHeaders.set('x-vercel-ip-postal-code', geo.postalCode)

  const ip = ipAddress(request)
  if (ip) requestHeaders.set('x-vercel-ip-address', ip)

  const vercelId = request.headers.get('x-vercel-id')
  if (vercelId) requestHeaders.set('x-vercel-deploy-region', vercelId.split(':')[0] || '')

  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: '/:path*',
}
