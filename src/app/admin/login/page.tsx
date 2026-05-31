'use client'

import { useState } from 'react'

export default function AdminLoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      if (!res.ok) {
        const msg = await res.json().catch(() => ({}))
        setError((msg as any).error || 'Login failed')
        return
      }
      window.location.href = '/admin'
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-canvas)' }}>
      <div className="glass" style={{ padding: '2.5rem', borderRadius: '1rem', width: '100%', maxWidth: '360px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>TripGem Admin</h1>
        <p style={{ fontSize: '0.85rem', opacity: 0.6, marginBottom: '1.5rem' }}>Sign in to access the dashboard</p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.35rem', opacity: 0.7 }}>Username</label>
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="search-input"
              style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--bg2)', color: 'var(--text)', outline: 'none' }}
              autoFocus
              required
            />
          </div>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.35rem', opacity: 0.7 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="search-input"
              style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--bg2)', color: 'var(--text)', outline: 'none' }}
              required
            />
          </div>

          {error && (
            <div style={{ padding: '0.5rem 0.75rem', borderRadius: '0.5rem', background: 'rgba(220,38,38,0.15)', color: '#fca5a5', fontSize: '0.85rem', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: 'none',
              background: 'var(--accent)', color: '#fff', fontWeight: 600, cursor: 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
