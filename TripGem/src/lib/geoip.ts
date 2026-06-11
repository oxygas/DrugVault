import { kv } from '@vercel/kv'

const GEO_CACHE_PREFIX = 'tripgem:geo:'
const GEO_CACHE_TTL = 86400

export interface GeoResult {
  ip: string
  country: string
  countryCode: string
  region: string
  city: string
  isp: string
  org: string
  as: string
  proxy: boolean
  hosting: boolean
  lat: number
  lon: number
  timezone: string
  mobile: boolean
}

export interface VisitorInfo {
  ip: string
  ua: string
  country: string
  countryCode: string
  city: string
  isp: string
  proxy: boolean
  hosting: boolean
  os: string
  browser: string
  device: string
  screen?: string
  timezone?: string
  language?: string
  platform?: string
  timestamp: number
}

export interface ExtendedVisitorInfo extends VisitorInfo {
  fingerprint?: string
  sessionId?: string
  referrer?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  connType?: string
  connRtt?: string
  connDownlink?: string
  deviceMemory?: string
  hardwareConcurrency?: string
  lcp?: string
  cls?: string
  inp?: string
  ttfb?: string
  fcp?: string
  scrollDepth?: string
  timeOnPage?: string
  vercelRegion?: string
  vercelDeployId?: string
  canvasFingerprint?: string
  webglVendor?: string
  audioFingerprint?: string
  pageFlow?: string
}

function parseUA(ua: string) {
  const u = ua.toLowerCase()
  let os = 'Unknown'
  let browser = 'Unknown'
  let device = 'Desktop'

  if (u.includes('windows')) os = 'Windows'
  else if (u.includes('mac os') || u.includes('macintosh')) os = 'macOS'
  else if (u.includes('linux') && !u.includes('android')) os = 'Linux'
  else if (u.includes('android')) os = 'Android'
  else if (u.includes('ios') || u.includes('iphone') || u.includes('ipad')) os = 'iOS'
  else if (u.includes('crkey')) os = 'ChromeOS'

  if (u.includes('firefox') && !u.includes('seamonkey')) browser = 'Firefox'
  else if (u.includes('opr') || u.includes('opera')) browser = 'Opera'
  else if (u.includes('edg')) browser = 'Edge'
  else if (u.includes('chrome') && !u.includes('chromium')) browser = 'Chrome'
  else if (u.includes('safari') && !u.includes('chrome')) browser = 'Safari'
  else if (u.includes('chromium')) browser = 'Chromium'

  if (u.includes('iphone') || u.includes('ipad')) device = 'Mobile'
  else if (u.includes('android') && (u.includes('mobile') || u.includes('phone'))) device = 'Mobile'
  else if (u.includes('tablet') || u.includes('ipad')) device = 'Tablet'

  return { os, browser, device }
}

export function vercelGeoLookup(request: {
  headers: Headers | Record<string, string>
}): { country: string; countryCode: string; city: string; region: string; lat: number; lon: number; postalCode: string } {
  const h = request.headers instanceof Headers ? request.headers : new Headers(request.headers)
  return {
    country: h.get('x-vercel-ip-country') || '',
    countryCode: h.get('x-vercel-ip-country') || '',
    city: h.get('x-vercel-ip-city') || '',
    region: h.get('x-vercel-ip-country-region') || '',
    lat: parseFloat(h.get('x-vercel-ip-latitude') || '0'),
    lon: parseFloat(h.get('x-vercel-ip-longitude') || '0'),
    postalCode: h.get('x-vercel-ip-postal-code') || '',
  }
}

export async function geoLookup(ip: string, headers?: Headers | Record<string, string>): Promise<GeoResult | null> {
  if (headers) {
    const vercelGeo = vercelGeoLookup({ headers })
    if (vercelGeo.countryCode) {
      return {
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
        timezone: '',
        mobile: false,
      }
    }
  }

  if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return null
  }

  try {
    const cached = await kv.get<GeoResult>(`${GEO_CACHE_PREFIX}${ip}`)
    if (cached) return cached
  } catch { /* ignore cache miss */ }

  try {
    const res = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,country,countryCode,region,city,isp,org,as,proxy,hosting,lat,lon,timezone,query,mobile`,
      { signal: AbortSignal.timeout(3000) }
    )
    if (!res.ok) return null
    const data = await res.json()
    if (data.status !== 'success') return null

    const result: GeoResult = {
      ip: data.query,
      country: data.country || 'Unknown',
      countryCode: data.countryCode || '',
      region: data.region || '',
      city: data.city || '',
      isp: data.isp || '',
      org: data.org || '',
      as: data.as || '',
      proxy: !!data.proxy,
      hosting: !!data.hosting,
      lat: data.lat || 0,
      lon: data.lon || 0,
      timezone: data.timezone || '',
      mobile: !!data.mobile,
    }

    try {
      await kv.set(`${GEO_CACHE_PREFIX}${ip}`, result, { ex: GEO_CACHE_TTL })
    } catch { /* ignore */ }

    return result
  } catch {
    return null
  }
}

export async function recordVisitor(
  ip: string,
  ua: string,
  path: string,
  geo: GeoResult | null,
  extra?: { screen?: string; timezone?: string; language?: string; platform?: string }
): Promise<VisitorInfo> {
  const { os, browser, device } = parseUA(ua)

  const info: VisitorInfo = {
    ip,
    ua,
    country: geo?.country || 'Unknown',
    countryCode: geo?.countryCode || '',
    city: geo?.city || '',
    isp: geo?.isp || '',
    proxy: geo?.proxy || false,
    hosting: geo?.hosting || false,
    os,
    browser,
    device,
    screen: extra?.screen,
    timezone: extra?.timezone,
    language: extra?.language,
    platform: extra?.platform,
    timestamp: Date.now(),
  }

  try {
    const pipeline = kv.pipeline()
    pipeline.zincrby('tripgem:visitors', 1, ip)
    pipeline.zincrby('tripgem:countries', 1, geo?.country || 'Unknown')
    if (geo?.city) pipeline.zincrby('tripgem:cities', 1, `${geo.city}, ${geo.country}`)
    pipeline.zincrby('tripgem:devices', 1, `${os}/${browser}`)
    pipeline.zincrby('tripgem:device_types', 1, device)
    if (geo?.proxy || geo?.hosting) pipeline.zincrby('tripgem:vpn_ips', 1, ip)
    pipeline.lpush('tripgem:visits:recent', JSON.stringify({ ...info, path }))
    pipeline.ltrim('tripgem:visits:recent', 0, 999)
    pipeline.zincrby('tripgem:paths', 1, path)
    await pipeline.exec()
  } catch { /* silently fail */ }

  return info
}

export async function recordExtendedVisitor(
  ip: string,
  ua: string,
  path: string,
  geo: GeoResult | null,
  extra: Partial<ExtendedVisitorInfo> = {}
): Promise<ExtendedVisitorInfo> {
  const { os, browser, device } = parseUA(ua)

  const region = extra.vercelRegion || ''

  const info: ExtendedVisitorInfo = {
    ip,
    ua,
    country: geo?.country || extra.country || 'Unknown',
    countryCode: geo?.countryCode || '',
    city: geo?.city || extra.city || '',
    isp: geo?.isp || '',
    proxy: geo?.proxy || false,
    hosting: geo?.hosting || false,
    os,
    browser,
    device,
    screen: extra.screen,
    timezone: extra.timezone,
    language: extra.language,
    platform: extra.platform,
    fingerprint: extra.fingerprint,
    sessionId: extra.sessionId,
    referrer: extra.referrer,
    utmSource: extra.utmSource,
    utmMedium: extra.utmMedium,
    utmCampaign: extra.utmCampaign,
    connType: extra.connType,
    connRtt: extra.connRtt,
    connDownlink: extra.connDownlink,
    deviceMemory: extra.deviceMemory,
    hardwareConcurrency: extra.hardwareConcurrency,
    lcp: extra.lcp,
    cls: extra.cls,
    inp: extra.inp,
    ttfb: extra.ttfb,
    fcp: extra.fcp,
    scrollDepth: extra.scrollDepth,
    timeOnPage: extra.timeOnPage,
    vercelRegion: region,
    vercelDeployId: extra.vercelDeployId,
    canvasFingerprint: extra.canvasFingerprint,
    webglVendor: extra.webglVendor,
    audioFingerprint: extra.audioFingerprint,
    pageFlow: extra.pageFlow,
    timestamp: Date.now(),
  }

  try {
    const pipeline = kv.pipeline()
    pipeline.zincrby('tripgem:visitors', 1, info.fingerprint || ip)
    pipeline.zincrby('tripgem:countries', 1, info.country || 'Unknown')
    if (info.city) pipeline.zincrby('tripgem:cities', 1, `${info.city}, ${info.country}`)
    pipeline.zincrby('tripgem:devices', 1, `${os}/${browser}`)
    pipeline.zincrby('tripgem:device_types', 1, device)
    if (info.proxy || info.hosting) pipeline.zincrby('tripgem:vpn_ips', 1, ip)
    if (info.fingerprint) pipeline.zincrby('tripgem:fingerprints', 1, info.fingerprint)
    if (info.sessionId) pipeline.zincrby('tripgem:sessions', 1, info.sessionId)
    if (info.referrer) {
      const domain = extractDomain(info.referrer)
      if (domain) pipeline.zincrby('tripgem:referrers', 1, domain)
    }
    if (info.utmSource) {
      const utmKey = `${info.utmSource}:${info.utmMedium || 'direct'}`
      pipeline.zincrby('tripgem:utms', 1, utmKey)
    }
    if (info.connType) pipeline.zincrby('tripgem:conn_types', 1, info.connType)
    if (info.deviceMemory) pipeline.zincrby('tripgem:memories', 1, info.deviceMemory)
    if (info.lcp) pipeline.zincrby('tripgem:webvitals:lcp', 1, bucketMs(parseFloat(info.lcp)))
    if (info.cls) pipeline.zincrby('tripgem:webvitals:cls', 1, bucketCls(parseFloat(info.cls)))
    if (info.inp) pipeline.zincrby('tripgem:webvitals:inp', 1, bucketMs(parseFloat(info.inp)))
    if (info.scrollDepth) pipeline.zincrby('tripgem:scroll_depths', 1, bucketDepth(parseFloat(info.scrollDepth)))
    if (info.timeOnPage) pipeline.zincrby('tripgem:time_on_page', 1, bucketSeconds(parseFloat(info.timeOnPage)))
    if (info.webglVendor) pipeline.zincrby('tripgem:webgl_vendors', 1, info.webglVendor)
    if (region) pipeline.zincrby('tripgem:regions', 1, region)
    pipeline.lpush('tripgem:visits:recent', JSON.stringify({ ...info, path }))
    pipeline.ltrim('tripgem:visits:recent', 0, 999)
    pipeline.zincrby('tripgem:paths', 1, path)
    if (info.pageFlow) {
      pipeline.lpush('tripgem:sessions:recent', JSON.stringify({ sessionId: info.sessionId, flow: info.pageFlow, ts: info.timestamp }))
      pipeline.ltrim('tripgem:sessions:recent', 0, 499)
    }
    await pipeline.exec()
  } catch { /* silently fail */ }

  return info
}

function extractDomain(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return '' }
}

function bucketMs(ms: number): string {
  if (ms <= 100) return '≤100ms'
  if (ms <= 200) return '200ms'
  if (ms <= 500) return '500ms'
  if (ms <= 1000) return '1s'
  if (ms <= 2000) return '2s'
  if (ms <= 4000) return '4s'
  return '>4s'
}

function bucketCls(score: number): string {
  if (score <= 0.1) return 'good'
  if (score <= 0.25) return 'needs-improve'
  return 'poor'
}

function bucketDepth(pct: number): string {
  if (pct <= 25) return '0-25%'
  if (pct <= 50) return '25-50%'
  if (pct <= 75) return '50-75%'
  return '75-100%'
}

function bucketSeconds(s: number): string {
  if (s <= 10) return '≤10s'
  if (s <= 30) return '30s'
  if (s <= 60) return '1m'
  if (s <= 180) return '3m'
  if (s <= 600) return '10m'
  return '>10m'
}

export interface VisitorStats {
  totalVisitors: number
  ips: { name: string; count: number }[]
  countries: { name: string; count: number }[]
  cities: { name: string; count: number }[]
  devices: { name: string; count: number }[]
  deviceTypes: { name: string; count: number }[]
  vpnIps: { name: string; count: number }[]
  paths: { name: string; count: number }[]
  recent: any[]
  fingerprints: { name: string; count: number }[]
  sessions: { name: string; count: number }[]
  referrers: { name: string; count: number }[]
  utms: { name: string; count: number }[]
  connTypes: { name: string; count: number }[]
  memories: { name: string; count: number }[]
  webvitals: {
    lcp: { name: string; count: number }[]
    cls: { name: string; count: number }[]
    inp: { name: string; count: number }[]
  }
  scrollDepths: { name: string; count: number }[]
  timeOnPage: { name: string; count: number }[]
  webglVendors: { name: string; count: number }[]
  regions: { name: string; count: number }[]
  sessionsRecent: any[]
  error?: string
}

export async function getVisitorStats(): Promise<VisitorStats> {
  try {
    const [
      topIps, countries, cities, devices, deviceTypes, vpnIps,
      recentStr, paths, fingerprints, sessions, referrers, utms,
      connTypes, memories, lcp, cls, inp, scrollDepths, timeOnPage,
      webglVendors, regions, sessionsRecentStr,
    ] = await Promise.all([
      kv.zrange('tripgem:visitors', 0, 49, { rev: true, withScores: true }),
      kv.zrange('tripgem:countries', 0, 49, { rev: true, withScores: true }),
      kv.zrange('tripgem:cities', 0, 49, { rev: true, withScores: true }),
      kv.zrange('tripgem:devices', 0, 49, { rev: true, withScores: true }),
      kv.zrange('tripgem:device_types', 0, 49, { rev: true, withScores: true }),
      kv.zrange('tripgem:vpn_ips', 0, 49, { rev: true, withScores: true }),
      kv.lrange('tripgem:visits:recent', 0, 99),
      kv.zrange('tripgem:paths', 0, 49, { rev: true, withScores: true }),
      kv.zrange('tripgem:fingerprints', 0, 49, { rev: true, withScores: true }),
      kv.zrange('tripgem:sessions', 0, 49, { rev: true, withScores: true }),
      kv.zrange('tripgem:referrers', 0, 49, { rev: true, withScores: true }),
      kv.zrange('tripgem:utms', 0, 49, { rev: true, withScores: true }),
      kv.zrange('tripgem:conn_types', 0, 49, { rev: true, withScores: true }),
      kv.zrange('tripgem:memories', 0, 49, { rev: true, withScores: true }),
      kv.zrange('tripgem:webvitals:lcp', 0, 49, { rev: true, withScores: true }),
      kv.zrange('tripgem:webvitals:cls', 0, 49, { rev: true, withScores: true }),
      kv.zrange('tripgem:webvitals:inp', 0, 49, { rev: true, withScores: true }),
      kv.zrange('tripgem:scroll_depths', 0, 49, { rev: true, withScores: true }),
      kv.zrange('tripgem:time_on_page', 0, 49, { rev: true, withScores: true }),
      kv.zrange('tripgem:webgl_vendors', 0, 49, { rev: true, withScores: true }),
      kv.zrange('tripgem:regions', 0, 49, { rev: true, withScores: true }),
      kv.lrange('tripgem:sessions:recent', 0, 49),
    ])

    const safe = (arr: any) => Array.isArray(arr) ? arr : []

    const parseScores = (arr: any) => {
      const a = safe(arr)
      const result: { name: string; count: number }[] = []
      for (let i = 0; i < a.length; i += 2) {
        result.push({ name: String(a[i]), count: Number(a[i + 1]) | 0 })
      }
      return result
    }

    const recent = safe(recentStr)
      .map((s: string) => {
        try { return JSON.parse(s) } catch { return null }
      })
      .filter(Boolean)
      .slice(0, 50)

    const sessionsRecent = safe(sessionsRecentStr)
      .map((s: string) => {
        try { return JSON.parse(s) } catch { return null }
      })
      .filter(Boolean)
      .slice(0, 30)

    const parsedCountries = parseScores(countries)
    const totalVisitors = parsedCountries.reduce((a, c) => a + c.count, 0)

    return {
      totalVisitors,
      ips: parseScores(topIps),
      countries: parsedCountries,
      cities: parseScores(cities),
      devices: parseScores(devices),
      deviceTypes: parseScores(deviceTypes),
      vpnIps: parseScores(vpnIps),
      paths: parseScores(paths),
      recent,
      fingerprints: parseScores(fingerprints),
      sessions: parseScores(sessions),
      referrers: parseScores(referrers),
      utms: parseScores(utms),
      connTypes: parseScores(connTypes),
      memories: parseScores(memories),
      webvitals: {
        lcp: parseScores(lcp),
        cls: parseScores(cls),
        inp: parseScores(inp),
      },
      scrollDepths: parseScores(scrollDepths),
      timeOnPage: parseScores(timeOnPage),
      webglVendors: parseScores(webglVendors),
      regions: parseScores(regions),
      sessionsRecent,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[geoip] getVisitorStats failed:', message)
    return {
      totalVisitors: 0, ips: [], countries: [], cities: [],
      devices: [], deviceTypes: [], vpnIps: [], paths: [], recent: [],
      fingerprints: [], sessions: [], referrers: [], utms: [],
      connTypes: [], memories: [],
      webvitals: { lcp: [], cls: [], inp: [] },
      scrollDepths: [], timeOnPage: [], webglVendors: [], regions: [],
      sessionsRecent: [],
      error: `KV connection failed: ${message}. Check KV_REST_API_URL and KV_REST_API_TOKEN env vars.`,
    }
  }
}

export async function checkKvHealth(): Promise<{ ok: boolean; error?: string }> {
  try {
    await kv.ping()
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { ok: false, error: message }
  }
}
