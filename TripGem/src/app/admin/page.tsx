'use client'

import { useEffect, useState } from 'react'

interface StatEntry { name: string; count: number }

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
    fingerprints: StatEntry[]
    sessions: StatEntry[]
    referrers: StatEntry[]
    utms: StatEntry[]
    connTypes: StatEntry[]
    memories: StatEntry[]
    webvitals: { lcp: StatEntry[]; cls: StatEntry[]; inp: StatEntry[] }
    scrollDepths: StatEntry[]
    timeOnPage: StatEntry[]
    webglVendors: StatEntry[]
    regions: StatEntry[]
    sessionsRecent: any[]
    error?: string
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

function VitalsCard({ title, data, colorMap }: { title: string; data: StatEntry[]; colorMap?: Record<string, string> }) {
  if (!data.length) return null
  const maxCount = data[0]?.count || 1
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
      <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider opacity-70">{title}</h3>
      <div className="space-y-2">
        {data.map((e) => {
          const pct = (e.count / maxCount) * 100
          return (
            <div key={e.name} className="flex items-center gap-2">
              <span className="text-xs w-20 shrink-0">{e.name}</span>
              <div className="flex-1 h-3 bg-white/5 rounded overflow-hidden">
                <div className="h-full rounded" style={{
                  width: `${pct}%`,
                  background: colorMap?.[e.name] || 'var(--accent)',
                }} />
              </div>
              <span className="text-xs tabular-nums w-10 text-right">{e.count}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SessionPanel({ sessions }: { sessions: any[] }) {
  if (!sessions.length) return null
  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold mb-2 uppercase tracking-wider opacity-70">Session Flows</h3>
      <div className="overflow-hidden rounded-lg border border-white/10">
        <div className="max-h-[300px] overflow-y-auto text-xs">
          <table className="w-full">
            <thead className="sticky top-0 bg-[var(--bg-canvas)]">
              <tr className="bg-white/5">
                <th className="text-left px-2 py-1.5 font-medium">Session</th>
                <th className="text-left px-2 py-1.5 font-medium">Flow</th>
                <th className="text-left px-2 py-1.5 font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white/5' : ''}>
                  <td className="px-2 py-1 font-mono max-w-[100px] truncate">{s.sessionId?.slice(0, 8) || '—'}</td>
                  <td className="px-2 py-1 truncate max-w-[300px]" title={s.flow}>{s.flow || '—'}</td>
                  <td className="px-2 py-1">{s.ts ? new Date(s.ts).toLocaleString() : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function SuspiciousPanel({ vpnIps, fingerprints, recent }: { vpnIps: StatEntry[]; fingerprints: StatEntry[]; recent: any[] }) {
  const flagged = recent.filter((v) => v.proxy || v.hosting)
  if (!flagged.length && !vpnIps.length) return null
  return (
    <div className="mb-6 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4">
      <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider text-yellow-400">Suspicious Activity</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <div className="text-xs opacity-60 mb-1">VPN/Proxy IPs ({vpnIps.length})</div>
          <div className="space-y-1 max-h-[200px] overflow-y-auto">
            {vpnIps.slice(0, 10).map((v) => (
              <div key={v.name} className="flex justify-between text-xs">
                <span className="font-mono">{v.name}</span>
                <span className="tabular-nums opacity-70">{v.count}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs opacity-60 mb-1">Recent Flagged ({flagged.length})</div>
          <div className="space-y-1 max-h-[200px] overflow-y-auto">
            {flagged.slice(0, 10).map((v, i) => (
              <div key={i} className="text-xs truncate">
                <span className="font-mono">{v.ip}</span>
                <span className="opacity-50 ml-2">{v.path}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  const [kvHealth, setKvHealth] = useState<{ ok: boolean; error?: string } | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const [{ visitors }, dashRes, health] = await Promise.all([
          fetch('/api/analytics/visitors').then(r => r.json()),
          fetch('/api/analytics/dashboard').then(r => r.json()),
          fetch('/api/admin/kv-health').then(r => r.json()).catch(() => ({ ok: false, error: 'Health check failed' })),
        ])
        if (cancelled) return
        setData({ visitors, analytics: dashRes })
        setKvHealth(health)
        if (visitors.error) setError(visitors.error)
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
      fetch('/api/admin/kv-health').then(r => r.json()).catch(() => ({ ok: false, error: 'Health check failed' })),
    ]).then(([visitors, analytics, health]) => {
      setData({ visitors, analytics })
      setKvHealth(health)
      if (visitors.error) setError(visitors.error)
    }).catch(() => setError('Failed')).finally(() => setLoading(false))
  }

  const v = data?.visitors
  const a = data?.analytics

  const tabs = ['overview', 'vitals', 'traffic', 'fingerprints', 'sessions', 'deploy']

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">TripGem Admin</h1>
          <p className="text-sm opacity-60 mt-1">Advanced user intelligence dashboard</p>
        </div>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${kvHealth?.ok ? 'bg-green-500/20 border border-green-500/30 text-green-400' : 'bg-red-500/20 border border-red-500/30 text-red-400'}`}>
            <span className="w-2 h-2 rounded-full" style={{ background: kvHealth?.ok ? '#22c55e' : '#ef4444' }} />
            KV: {kvHealth?.ok ? 'Connected' : `Disconnected${kvHealth?.error ? ` - ${kvHealth.error}` : ''}`}
          </div>
          <div className="flex gap-2">
          {tabs.map((t) => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === t ? 'bg-white/10 border border-white/20' : 'border border-transparent hover:bg-white/5'
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
          <button onClick={refresh} disabled={loading}
            className="px-4 py-1.5 rounded-lg text-sm font-medium border border-white/10 hover:bg-white/10 transition-colors disabled:opacity-40 ml-2"
          >
            {loading ? '...' : 'Refresh'}
          </button>
        </div>
      </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">{error}</div>
      )}

      {loading && !data && (
        <div className="text-center py-12 opacity-50">Loading dashboard data...</div>
      )}

      {data && v && (
        <>
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
                <StatCard label="Total Visits" value={v.totalVisitors} />
                <StatCard label="VPN/Proxy Hits" value={(v.vpnIps||[]).reduce((a: number, b: any) => a + (b?.count||0), 0)} />
                <StatCard label="Unique Countries" value={v.countries?.length||0} />
                <StatCard label="Unique IPs" value={v.ips?.length||0} />
                <StatCard label="Fingerprints" value={v.fingerprints?.length||0} sub={v.fingerprints?.length ? `${v.fingerprints.length} unique` : ''} />
                <StatCard label="Regions" value={v.regions?.length||0} />
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

              <SuspiciousPanel vpnIps={v.vpnIps} fingerprints={v.fingerprints} recent={v.recent} />
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

          {/* VITALS TAB */}
          {activeTab === 'vitals' && (
            <>
              <h2 className="text-lg font-semibold mb-4">Web Vitals & Behavior</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <VitalsCard title="LCP Distribution" data={v.webvitals.lcp} colorMap={{'≤100ms': '#22c55e', '200ms': '#22c55e', '500ms': '#f59e0b', '1s': '#f59e0b', '2s': '#ef4444', '4s': '#ef4444', '>4s': '#dc2626'}} />
                <VitalsCard title="CLS Distribution" data={v.webvitals.cls} colorMap={{'good': '#22c55e', 'needs-improve': '#f59e0b', 'poor': '#ef4444'}} />
                <VitalsCard title="INP Distribution" data={v.webvitals.inp} colorMap={{'≤100ms': '#22c55e', '200ms': '#22c55e', '500ms': '#f59e0b', '1s': '#ef4444', '2s': '#dc2626'}} />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <VitalsCard title="Scroll Depth" data={v.scrollDepths} />
                <VitalsCard title="Time on Page" data={v.timeOnPage} />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <StatTable title="Connection Types" data={v.connTypes} />
                <StatTable title="Device Memory" data={v.memories} />
              </div>
              <StatTable title="WebGL Vendors" data={v.webglVendors} maxWidth="max-w-[300px]" />
            </>
          )}

          {/* TRAFFIC TAB */}
          {activeTab === 'traffic' && (
            <>
              <h2 className="text-lg font-semibold mb-4">Traffic Sources</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <StatTable title="Referrer Domains" data={v.referrers} />
                <StatTable title="UTM Campaigns" data={v.utms} />
              </div>
              <StatTable title="Edge Regions" data={v.regions} />
            </>
          )}

          {/* FINGERPRINTS TAB */}
          {activeTab === 'fingerprints' && (
            <>
              <h2 className="text-lg font-semibold mb-4">Device Fingerprints</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <StatCard label="Unique Fingerprints" value={v.fingerprints?.length || 0} />
                <StatCard label="Unique Sessions" value={v.sessions?.length || 0} />
                <StatCard label="Fingerprint/IP Ratio" value={v.fingerprints?.length && v.ips?.length ? (v.fingerprints.length / v.ips.length).toFixed(2) : 'N/A'} />
              </div>
              <StatTable title="Fingerprint Hashes" data={v.fingerprints} maxWidth="max-w-[200px]" />
            </>
          )}

          {/* SESSIONS TAB */}
          {activeTab === 'sessions' && (
            <>
              <h2 className="text-lg font-semibold mb-4">Session Analytics</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <StatCard label="Sessions Tracked" value={v.sessions?.length || 0} />
                <StatCard label="Avg Page Depth" value={v.sessions?.length && v.totalVisitors ? Math.round(v.totalVisitors / v.sessions.length) : 'N/A'} sub="visits per session" />
              </div>
              <SessionPanel sessions={v.sessionsRecent} />
            </>
          )}

          {/* DEPLOY TAB */}
          {activeTab === 'deploy' && (
            <>
              <h2 className="text-lg font-semibold mb-4">Deployments</h2>
              <DeployPanel />
            </>
          )}
        </>
      )}
    </div>
  )
}

function DeployPanel() {
  const [deploys, setDeploys] = useState<any[]>([])
  const [states, setStates] = useState<StatEntry[]>([])

  useEffect(() => {
    fetch('/api/webhooks/vercel').then(r => r.json()).then(d => {
      setDeploys(d.recent || [])
      setStates(d.states || [])
    }).catch(() => {})
  }, [])

  if (!deploys.length) return <div className="text-sm opacity-50">No deployment webhooks received yet. Configure a Vercel webhook pointing to /api/webhooks/vercel.</div>

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Deployments" value={states.reduce((a: number, s: StatEntry) => a + s.count, 0)} />
        {states.map((s) => (
          <StatCard key={s.name} label={s.name} value={s.count} />
        ))}
      </div>
      <div className="mb-6">
        <h3 className="text-sm font-semibold mb-2 uppercase tracking-wider opacity-70">Recent Deployments</h3>
        <div className="overflow-hidden rounded-lg border border-white/10">
          <div className="max-h-[400px] overflow-y-auto text-xs">
            <table className="w-full">
              <thead className="sticky top-0 bg-[var(--bg-canvas)]">
                <tr className="bg-white/5">
                  <th className="text-left px-2 py-1.5 font-medium">ID</th>
                  <th className="text-left px-2 py-1.5 font-medium">State</th>
                  <th className="text-left px-2 py-1.5 font-medium">Project</th>
                  <th className="text-left px-2 py-1.5 font-medium">URL</th>
                  <th className="text-left px-2 py-1.5 font-medium">Region</th>
                  <th className="text-left px-2 py-1.5 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {deploys.map((d, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white/5' : ''}>
                    <td className="px-2 py-1 font-mono max-w-[100px] truncate" title={d.id}>{d.id?.slice(0, 12)}</td>
                    <td className="px-2 py-1">{d.state}</td>
                    <td className="px-2 py-1">{d.project || 'tripgem'}</td>
                    <td className="px-2 py-1 truncate max-w-[200px]">{d.url ? <a href={d.url} target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-400">{d.url.replace('https://', '')}</a> : '—'}</td>
                    <td className="px-2 py-1">{d.region || '—'}</td>
                    <td className="px-2 py-1">{d.ts ? new Date(d.ts).toLocaleString() : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
