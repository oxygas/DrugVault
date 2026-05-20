import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'

const PUBCHEM_CID_CACHE = new Map<string, number>()

const NAME_ALTERNATIVES: Record<string, string[]> = {
  'THCP': ['Tetrahydrocannabiphorol', '3-Heptyl-delta-1-tetrahydrocannabinol'],
  'HHCP': ['Hexahydrocannabiphorol'],
  'HHC': ['Hexahydrocannabinol'],
  'THCP-O': ['THCP acetate'],
  'THC-A': ['THC-A', 'Tetrahydrocannabinolic acid'],
  'THC-B': ['THC-B'],
  'THC-V': ['THCV', 'Tetrahydrocannabivarin'],
  'Delta-10-THC': ['delta-10-tetrahydrocannabinol'],
  'Delta-8-THC': ['delta-8-tetrahydrocannabinol'],
  'Delta-9-THC': ['delta-9-tetrahydrocannabinol'],
  '1B-LSD': ['1B-LSD'],
  '1cP-AL-LAD': ['1cP-AL-LAD'],
  '1cP-LSD': ['1cP-LSD'],
  '1P-ETH-LAD': ['1P-ETH-LAD'],
  '1P-LSD': ['1P-LSD'],
  '1V-LSD': ['1V-LSD'],
  '25T-2-NBOMe': ['25T2NBOMe'],
  '25T-4-NBOMe': ['25T4NBOMe'],
}

const CID_ALIASES: Record<string, number> = {
  'THCP': 6453074,
  'HHCP': 6453074,
  'HHC': 16050328,
  'Delta-8-THC': 638026,
  'Delta-9-THC': 6694,
}

async function lookupPubChemCID(name: string): Promise<number | null> {
  if (PUBCHEM_CID_CACHE.has(name)) return PUBCHEM_CID_CACHE.get(name)!

  const lookupNames = [name, ...(NAME_ALTERNATIVES[name] || [])]

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
      }
    } catch (e) {
      console.error(`[chemical-structure] PubChem lookup failed for "${lookupName}":`, e)
    }
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

    if (smiles) {
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
