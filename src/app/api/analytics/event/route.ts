import { NextRequest } from 'next/server'
import { trackQuery, trackSubstance, trackPage, trackFeedback } from '@/lib/analytics'
import { geoLookup, recordVisitor } from '@/lib/geoip'

const VALID_TYPES = ['query', 'substance', 'page', 'feedback', 'visit'] as const

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, value, positive, screen, timezone, language, platform } = body as {
      type?: string
      value?: string
      positive?: boolean
      screen?: string
      timezone?: string
      language?: string
      platform?: string
    }

    if (!type || !VALID_TYPES.includes(type as typeof VALID_TYPES[number])) {
      return Response.json({ ok: false }, { status: 400 })
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const ua = req.headers.get('user-agent') || ''

    if (type === 'visit') {
      const geo = await geoLookup(ip)
      const info = await recordVisitor(ip, ua, value || '/', geo, { screen, timezone, language, platform })
      return Response.json({ ok: true, visitor: { country: info.country, city: info.city, proxy: info.proxy, os: info.os, browser: info.browser, device: info.device } })
    }

    if (!value || typeof value !== 'string') {
      return Response.json({ ok: false }, { status: 400 })
    }

    switch (type) {
      case 'query':
        await trackQuery(value)
        break
      case 'substance':
        await trackSubstance(value)
        break
      case 'page':
        await trackPage(value)
        break
      case 'feedback':
        await trackFeedback(value, !!positive)
        break
    }

    const referer = req.headers.get('referer') || '/'
    const geo = await geoLookup(ip)
    if (geo || ip !== 'unknown') {
      await recordVisitor(ip, ua, referer, geo, { screen, timezone, language, platform })
    }

    return Response.json({ ok: true })
  } catch {
    return Response.json({ ok: false }, { status: 500 })
  }
}
