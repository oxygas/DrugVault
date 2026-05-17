import { NextResponse } from 'next/server'

const PUBCHEM_CID_CACHE = new Map<string, number>()

async function lookupPubChemCID(name: string): Promise<number | null> {
  if (PUBCHEM_CID_CACHE.has(name)) return PUBCHEM_CID_CACHE.get(name)!

  try {
    const res = await fetch(
      `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(name)}/cids/JSON`,
      { signal: AbortSignal.timeout(8000) }
    )
    if (!res.ok) return null
    const data = await res.json()
    const cid = data?.IdentifierList?.CID?.[0]
    if (cid) {
      PUBCHEM_CID_CACHE.set(name, cid)
      return cid
    }
  } catch (e) {
    console.error(`[chemical-structure] PubChem lookup failed for ${name}:`, e)
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
    const cid = await lookupPubChemCID(name)

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
      return NextResponse.json({
        source: 'cactus',
        imageUrl: `https://cactus.nci.nih.gov/chemical/structure/${encodeURIComponent(smiles)}/image`,
        cid: null,
        name,
      }, {
        headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' },
      })
    }

    return NextResponse.json({ error: 'No structure found', source: null, imageUrl: null }, { status: 404 })
  } catch (err) {
    console.error('[chemical-structure] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error', source: null, imageUrl: null }, { status: 500 })
  }
}
