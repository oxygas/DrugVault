import { NextRequest, NextResponse } from 'next/server'

const PW_GRAPHQL = 'https://api.psychonautwiki.org/'

const SUBSTANCE_QUERY = `
  query GetSubstance($name: String!) {
    substances(name: $name) {
      name
      summary
      properties {
        ROAS {
          routeOfAdministration
          dose {
            threshold { value unit }
            light { value unit }
            common { value unit }
            strong { value unit }
            heavy { value unit }
          }
          duration {
            onset { value unit }
            peak { value unit }
            offset { value unit }
            afterEffects { value unit }
            total { value unit }
          }
        }
        classifications {
          psychoactiveClass
          chemicalClass
        }
      }
      subjectiveEffects {
        total {
          name
          effectDimensions {
            name
            url
          }
        }
      }
    }
  }
`

const EFFECTS_QUERY = `
  query GetSubstanceEffects($name: String!) {
    substances(name: $name) {
      subjectiveEffects {
        total {
          name
          effectDimensions {
            name
            url
            summary
            valence
          }
        }
      }
    }
  }
`

async function queryPW(query: string, variables: Record<string, string>) {
  const res = await fetch(PW_GRAPHQL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'DrugVault/1.0 (harm reduction tool)',
    },
    body: JSON.stringify({ query, variables }),
  })
  if (!res.ok) throw new Error(`PW API error: ${res.status}`)
  return res.json()
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const name = searchParams.get('name')
  const type = searchParams.get('type') || 'substance'

  if (!name) {
    return NextResponse.json({ error: 'name parameter required' }, { status: 400 })
  }

  const cacheKey = `pw-${name.toLowerCase().replace(/\s+/g, '-')}-${type}`
  const cacheDuration = 24 * 60 * 60 * 1000

  if (cacheKey && typeof globalThis !== 'undefined') {
    const cached = (globalThis as Record<string, unknown>)[cacheKey] as { data: unknown; timestamp: number } | undefined
    if (cached && Date.now() - cached.timestamp < cacheDuration) {
      return NextResponse.json(cached.data)
    }
  }

  try {
    let data: unknown

    if (type === 'effects') {
      const result = await queryPW(EFFECTS_QUERY, { name })
      data = result.data?.substances?.[0]?.subjectiveEffects ?? null
    } else {
      const result = await queryPW(SUBSTANCE_QUERY, { name })
      data = result.data?.substances?.[0] ?? null
    }

    if (typeof globalThis !== 'undefined') {
      (globalThis as Record<string, unknown>)[cacheKey] = { data, timestamp: Date.now() }
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('PsychonautWiki API error:', err)
    return NextResponse.json({ error: 'Failed to fetch from PsychonautWiki' }, { status: 502 })
  }
}