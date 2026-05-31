'use client'

import { useEffect, useState } from 'react'

interface StatEntry {
  name: string
  count: number
}

interface DashboardData {
  visitors: {
    totalVisitors: number
    ips: StatEntry[]
    countries: StatEntry[]
    cities: StatEntry[]
    devices: StatEntry[]
    deviceTypes: StatEntry[]
    vpnIps: StatEntry[]
    paths: StatEntry[]
    recent: any[]
  }
  analytics: {
    queries: StatEntry[]
    substances: StatEntry[]
    pages: StatEntry[]
    feedbackUp: StatEntry[]
    feedbackDown: StatEntry[]
    gaps: StatEntry[]
  } | null
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
      <div className="text-xs uppercase tracking-wider opacity-60 mb-1">{label}</div>
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      {sub && <div className="text-xs opacity-50 mt-1">{sub}</div>}
    </div>
  )
}

function BarRow({ name, count, max, color }: { name: string; count: number; max: number; color?: string }) {
  const pct = max > 0 ? (count / max) * 100 : 0
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="text-sm w-32 shrink-0 truncate">{name}</span>
      <div className="flex-1 h-4 bg-white/5 rounded overflow-hidden">
        <div className="h-full rounded transition-all duration-700" style={{ width: `${pct}%`, background: color || 'var(--accent)' }} />
      </div>
      <span className="text-sm tabular-nums w-12 text-right shrink-0">{count}</span>
    </div>
  )
}

function StatTable({ title, data, maxWidth }: { title: string; data: StatEntry[]; maxWidth?: string }) {
  if (!data.length) return null
  const maxCount = data[0]?.count || 1
  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold mb-2 uppercase tracking-wider opacity-70">{title}</h3>
      <div className="overflow-hidden rounded-lg border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/5">
              <th className="text-left px-3 py-2 font-medium">Name</th>
              <th className="text-right px-3 py-2 font-medium w-24">Count</th>
              <th className="px-3 py-2 w-32"><span className="sr-only">Bar</span></th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => {
              const pct = (row.count / maxCount) * 100
              return (
                <tr key={row.name} className={i % 2 === 0 ? 'bg-white/5' : ''}>
                  <td className={`px-3 py-1.5 truncate ${maxWidth || 'max-w-[300px]'}`}>{row.name}</td>
                  <td className="text-right px-3 py-1.5 tabular-nums">{row.count}</td>
                  <td className="px-3 py-1.5">
                    <div className="h-4 w-full bg-white/5 rounded overflow-hidden">
                      <div className="h-full rounded transition-all duration-500" style={{ width: `${pct}%`, background: 'var(--accent)' }} />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function RecentVisits({ recent }: { recent: any[] }) {
  if (!recent.length) return null
  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold mb-2 uppercase tracking-wider opacity-70">Recent Visits</h3>
      <div className="overflow-hidden rounded-lg border border-white/10">
        <div className="max-h-[400px] overflow-y-auto text-xs">
          <table className="w-full">
            <thead className="sticky top-0 bg-[var(--bg-canvas)]">
              <tr className="bg-white/5">
                <th className="text-left px-2 py-1.5 font-medium">IP</th>
                <th className="text-left px-2 py-1.5 font-medium">Location</th>
                <th className="text-left px-2 py-1.5 font-medium">Device</th>
                <th className="text-left px-2 py-1.5 font-medium">OS/Browser</th>
                <th className="text-left px-2 py-1.5 font-medium">VPN?</th>
                <th className="text-left px-2 py-1.5 font-medium">Path</th>
                <th className="text-left px-2 py-1.5 font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((v, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white/5' : ''}>
                  <td className="px-2 py-1 font-mono">{v.ip}</td>
                  <td className="px-2 py-1">{v.city && v.country !== 'Unknown' ? `${v.city}, ${v.country}` : v.country}</td>
                  <td className="px-2 py-1">{v.device}</td>
                  <td className="px-2 py-1">{v.os}/{v.browser}</td>
                  <td className="px-2 py-1">{v.proxy ? '⚠️ YES' : ''}</td>
                  <td className="px-2 py-1 truncate max-w-[150px]" title={v.path}>{v.path || '/'}</td>
                  <td className="px-2 py-1">{v.timestamp ? new Date(v.timestamp).toLocaleString() : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function CoverageBar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  const color = pct >= 90 ? '#22c55e' : pct >= 70 ? '#f59e0b' : '#ef4444'
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="text-sm w-36 shrink-0 truncate">{label}</span>
      <div className="flex-1 h-3 bg-white/5 rounded overflow-hidden">
        <div className="h-full rounded transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-sm tabular-nums w-16 text-right shrink-0" style={{ color }}>{pct}%</span>
    </div>
  )
}

export default function AdminPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const [{ visitors }, dashRes] = await Promise.all([
          fetch('/api/analytics/visitors').then(r => r.json()),
          fetch('/api/analytics/dashboard').then(r => r.json()),
        ])
        if (cancelled) return
        setData({ visitors, analytics: dashRes })
      } catch {
        if (!cancelled) setError('Failed to load dashboard data')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const refresh = () => {
    setLoading(true)
    setError('')
    Promise.all([
      fetch('/api/analytics/visitors').then(r => r.json()),
      fetch('/api/analytics/dashboard').then(r => r.json()),
    ]).then(([visitors, analytics]) => {
      setData({ visitors, analytics })
    }).catch(() => setError('Failed')).finally(() => setLoading(false))
  }

  const v = data?.visitors
  const a = data?.analytics

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">TripGem Admin</h1>
          <p className="text-sm opacity-60 mt-1">Visitor analytics &amp; substance data</p>
        </div>
        <button onClick={refresh} disabled={loading}
          className="px-4 py-2 rounded-lg text-sm font-medium border border-white/10 hover:bg-white/10 transition-colors disabled:opacity-40"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">{error}</div>
      )}

      {loading && !data && (
        <div className="text-center py-12 opacity-50">Loading dashboard data...</div>
      )}

      {data && v && (
        <>
          <h2 className="text-lg font-semibold mb-4">Visitor Analytics</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            <StatCard label="Total Visits" value={v.totalVisitors} />
            <StatCard label="VPN/Proxy Hits" value={v.vpnIps.reduce((a, b) => a + b.count, 0)} />
            <StatCard label="Unique Countries" value={v.countries.length} />
            <StatCard label="Unique IPs" value={v.ips.length} />
            <StatCard label="Devices" value={v.deviceTypes.reduce((a, b) => a + b.count, 0)} />
            <StatCard label="Pages Tracked" value={v.paths.length} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <StatTable title="Countries" data={v.countries} />
            <StatTable title="Cities" data={v.cities} />
            <StatTable title="Device Types" data={v.deviceTypes} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <StatTable title="OS / Browser" data={v.devices} />
            <StatTable title="VPN / Proxy IPs" data={v.vpnIps} maxWidth="max-w-[200px]" />
          </div>

          <div className="mb-8">
            <StatTable title="Top Pages" data={v.paths} />
          </div>

          <RecentVisits recent={v.recent} />

          {a && (
            <>
              <h2 className="text-lg font-semibold mb-4 mt-10">Analytics</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <StatTable title="Top Queries" data={a.queries} />
                  <StatTable title="Gaps" data={a.gaps} />
                </div>
                <div>
                  <StatTable title="Top Substances" data={a.substances} />
                  <StatTable title="Top Pages" data={a.pages} />
                </div>
                <div className="lg:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <StatTable title="Positive Feedback" data={a.feedbackUp} />
                  <StatTable title="Negative Feedback" data={a.feedbackDown} />
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
