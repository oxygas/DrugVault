const ADMIN_USER = 'evilempire33'
const ADMIN_PASS = 'Q5UdLS1^xM1^YkkwEYHF1i^iJ4*uMm'
const TOB = 'tripgem_admin'

function getSecret(): string {
  return ADMIN_PASS.padEnd(32, 'x').slice(0, 32)
}

function encBase64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

async function sign(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  return encBase64(sig)
}

export async function createToken(): Promise<string> {
  const payload = { user: ADMIN_USER, exp: Date.now() + 86_400_000, nonce: Math.random().toString(36).slice(2) }
  const enc = btoa(JSON.stringify(payload))
  const sig = await sign(TOB + '.' + enc)
  return TOB + '.' + enc + '.' + sig
}

export function getAdminCreds() {
  return { username: ADMIN_USER, password: ADMIN_PASS }
}

export async function validateToken(token: string): Promise<boolean> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3 || parts[0] !== TOB) return false
    const sig = await sign(TOB + '.' + parts[1])
    if (sig !== parts[2]) return false
    const payload = JSON.parse(atob(parts[1]))
    return payload.exp > Date.now()
  } catch {
    return false
  }
}
