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

export async function geoLookup(ip: string): Promise<GeoResult | null> {
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

export async function getVisitorStats() {
  try {
    const [
      topIps, countries, cities, devices, deviceTypes, vpnIps,
      recentStr, paths,
    ] = await Promise.all([
      kv.zrange('tripgem:visitors', 0, 49, { rev: true }).catch(() => []),
      kv.zrange('tripgem:countries', 0, 49, { rev: true }).catch(() => []),
      kv.zrange('tripgem:cities', 0, 49, { rev: true }).catch(() => []),
      kv.zrange('tripgem:devices', 0, 49, { rev: true }).catch(() => []),
      kv.zrange('tripgem:device_types', 0, 49, { rev: true }).catch(() => []),
      kv.zrange('tripgem:vpn_ips', 0, 49, { rev: true }).catch(() => []),
      kv.lrange('tripgem:visits:recent', 0, 99).catch(() => []),
      kv.zrange('tripgem:paths', 0, 49, { rev: true }).catch(() => []),
    ])

    const parseScores = (arr: any[]) => {
      const result: { name: string; count: number }[] = []
      for (let i = 0; i < arr.length; i += 2) {
        result.push({ name: String(arr[i]), count: Number(arr[i + 1]) })
      }
      return result
    }

    const recent = (Array.isArray(recentStr) ? recentStr : [])
      .map((s: string) => {
        try { return JSON.parse(s) } catch { return null }
      })
      .filter(Boolean)
      .slice(0, 50)

    return {
      totalVisitors: countries.length > 0 ? countries.reduce((a: number, _: any, i: number) => a + (i % 2 === 0 ? 0 : Number(countries[i])), 0) : 0,
      ips: parseScores(topIps),
      countries: parseScores(countries),
      cities: parseScores(cities),
      devices: parseScores(devices),
      deviceTypes: parseScores(deviceTypes),
      vpnIps: parseScores(vpnIps),
      paths: parseScores(paths),
      recent,
    }
  } catch {
    return {
      totalVisitors: 0, ips: [], countries: [], cities: [],
      devices: [], deviceTypes: [], vpnIps: [], paths: [], recent: [],
    }
  }
}
