import { NextRequest } from 'next/server'
import { trackQuery, trackSubstance, trackPage, trackFeedback } from '@/lib/analytics'
import { geoLookup, recordExtendedVisitor, vercelGeoLookup } from '@/lib/geoip'
import type { ExtendedVisitorInfo } from '@/lib/geoip'

const VALID_TYPES = ['query', 'substance', 'page', 'feedback', 'visit'] as const

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      type, value, positive,
      screen, timezone, language, platform,
      fingerprint, sessionId, referrer,
      utm_source, utm_medium, utm_campaign,
      connType, connRtt, connDownlink,
      deviceMemory, hardwareConcurrency,
      canvasFingerprint, webglVendor, audioFingerprint,
    } = body as Record<string, string | undefined> & { type?: string; value?: string; positive?: boolean }

    if (!type || !VALID_TYPES.includes(type as typeof VALID_TYPES[number])) {
      return Response.json({ ok: false }, { status: 400 })
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-vercel-ip-address') || 'unknown'
    const ua = req.headers.get('user-agent') || ''

    const vercelGeo = vercelGeoLookup({ headers: req.headers })

    if (type === 'visit') {
      const geo = await geoLookup(ip)
      const info = await recordExtendedVisitor(ip, ua, value || '/', geo || {
        ip,
        country: vercelGeo.country || 'Unknown',
        countryCode: vercelGeo.countryCode,
        region: vercelGeo.region,
        city: vercelGeo.city,
        isp: '',
        org: '',
        as: '',
        proxy: false,
        hosting: false,
        lat: vercelGeo.lat,
        lon: vercelGeo.lon,
        timezone: timezone || '',
        mobile: false,
      }, {
        screen, timezone, language, platform,
        fingerprint, sessionId, referrer,
        utmSource: utm_source,
        utmMedium: utm_medium,
        utmCampaign: utm_campaign,
        connType, connRtt, connDownlink,
        deviceMemory, hardwareConcurrency,
        canvasFingerprint, webglVendor, audioFingerprint,
        vercelRegion: vercelGeo.region,
        vercelDeployId: process.env.VERCEL_DEPLOY_ID || req.headers.get('x-vercel-deploy-region') || '',
      })
      return Response.json({ ok: true, visitor: {
        country: info.country, city: info.city, proxy: info.proxy,
        os: info.os, browser: info.browser, device: info.device,
      }})
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

    const geo = await geoLookup(ip)
    if (geo || ip !== 'unknown') {
      await recordExtendedVisitor(ip, ua, req.headers.get('referer') || '/', geo || null, {
        screen, timezone, language, platform,
        fingerprint, sessionId, referrer,
        utmSource: utm_source,
        utmMedium: utm_medium,
        utmCampaign: utm_campaign,
        connType, connRtt, connDownlink,
        deviceMemory, hardwareConcurrency,
        canvasFingerprint, webglVendor, audioFingerprint,
      })
    }

    return Response.json({ ok: true })
  } catch {
    return Response.json({ ok: false }, { status: 500 })
  }
}
