import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'
import rawData from '@/data/all-data.json'

const PUBCHEM_CID_CACHE = new Map<string, number>()

interface RawSubstance {
  n: string; a: string[]; sm: string
}
interface RawData { s: RawSubstance[] }
const data = rawData as RawData

const ALIAS_MAP = new Map<string, string[]>()
for (const s of data.s) {
  const names: string[] = [s.n, ...(s.a || [])]
  ALIAS_MAP.set(s.n, names)
}

const CID_ALIASES: Record<string, number> = {
  'THCP': 6453074,
  'HHCP': 6453074,
  'HHC': 16050328,
  'Delta-8-THC': 638026,
  'Delta-9-THC': 6694,
}

function isValidSmiles(s: string): boolean {
  if (!s || s.length < 1) return false
  const hasCarbon = /C(?![a-z])/.test(s) || /c/.test(s)
  if (!hasCarbon) return false
  return true
}

async function lookupPubChemCID(name: string): Promise<number | null> {
  if (PUBCHEM_CID_CACHE.has(name)) return PUBCHEM_CID_CACHE.get(name)!

  const lookupNames = ALIAS_MAP.get(name) ?? [name]

  for (const lookupName of lookupNames) {
    try {
      const res = await fetch(
        `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(lookupName)}/cids/JSON`,
        { signal: AbortSignal.timeout(5000) }
      )
      if (res.ok) {
        const data = await res.json()
        const cid = data?.IdentifierList?.CID?.[0]
        if (cid) {
          PUBCHEM_CID_CACHE.set(name, cid)
          return cid
        }
      } else if (res.status === 404) {
        continue
      }
    } catch (e) {
      console.error(`[chemical-structure] PubChem name lookup failed for "${lookupName}":`, e)
    }
  }
  return null
}

async function lookupPubChemCIDBySmiles(smiles: string): Promise<number | null> {
  const cacheKey = `smiles:${smiles}`
  if (PUBCHEM_CID_CACHE.has(cacheKey)) return PUBCHEM_CID_CACHE.get(cacheKey)!

  try {
    const res = await fetch(
      `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${encodeURIComponent(smiles)}/cids/JSON`,
      { signal: AbortSignal.timeout(5000) }
    )
    if (res.ok) {
      const data = await res.json()
      const cid = data?.IdentifierList?.CID?.[0]
      if (cid) {
        PUBCHEM_CID_CACHE.set(cacheKey, cid)
        return cid
      }
    }
  } catch (e) {
    console.error(`[chemical-structure] PubChem SMILES lookup failed:`, e)
  }
  return null
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name')
  const smiles = searchParams.get('smiles')

  if (!name) {
    return NextResponse.json({ error: 'name parameter required' }, { status: 400 })
  }

  try {
    let cid: number | null = null

    if (CID_ALIASES[name]) {
      cid = CID_ALIASES[name]
    } else {
      cid = await lookupPubChemCID(name)
    }

    if (!cid && smiles && isValidSmiles(smiles)) {
      cid = await lookupPubChemCIDBySmiles(smiles)
    }

    if (cid) {
      return NextResponse.json({
        source: 'pubchem',
        imageUrl: `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/PNG?image_size=large`,
        cid,
        name,
      }, {
        headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' },
      })
    }

    if (smiles && isValidSmiles(smiles)) {
      const encodedSmiles = encodeURIComponent(smiles)
      return NextResponse.json({
        source: 'cactus',
        imageUrl: `https://cactus.nci.nih.gov/chemical/structure/${encodedSmiles}/image`,
        cid: null,
        name,
      }, {
        headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' },
      })
    }

    return NextResponse.json({ error: 'No structure found', source: null, imageUrl: null }, { status: 404 })
  } catch (err) {
    Sentry.captureException(err)
    console.error('[chemical-structure] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error', source: null, imageUrl: null }, { status: 500 })
  }
}
