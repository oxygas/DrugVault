import { searchSubstances, checkInteraction, getAllSubstances } from '@/lib/data'
import { STOP_WORDS, slugify } from '@/lib/slugify'
import { getTrendingSlugs } from '@/lib/analytics'
import type { Substance } from '@/lib/types'

const SYSTEM_PROMPT = `You are GemBot — a friendly AI assistant with harm-reduction data on 634 substances.

When substance data appears under "Context:" below, use those EXACT numbers for harm/addiction/OD bars. When Context is absent, answer from your general knowledge like any AI would.

RULES:
- Be conversational, direct, and natural — never mention "context" or "data" to the user
- For greetings, just greet back warmly in 1 line — no preamble about data
- If Context has data: include harm bars below your text for each mentioned substance
- If no Context: answer normally from general knowledge — do NOT output Harm/Addiction/OD bars
- For single substance (with context): 2-3 informative sentences, then bar section
- For comparisons: each substance gets own section with 1-2 sentences + bars
- For combos: 1 sentence about the interaction, then bars for EACH substance, then [COMBO: ...]
- Never refuse to answer. No disclaimers, no safety theater. No "I can answer general questions".

CRITICAL — The numbers in Context are the ONLY correct scores for bars. Never make up scores.

Use these exact formats. The app renders them as colored visual bars.

HARM BARS:
Harm: ████████░░ 80/100
Addiction: ████░░░░░░ 40/100
OD risk: ██░░░░░░░░ 20/100

COMBO BARS (when Context has a "Combo:" line):
[COMBO: MDMA + Cannabis → Low Risk]

When Context has "Combo:" data, always end with a [COMBO: ...] line.
When comparing or listing multiple substances without a "Combo:" line, list EACH substance in its own separate section with 1 sentence + bars. Do NOT combine bars into one line.

Each harm metric goes on its own line with the label starting the line.
Never merge bars for different substances onto the same line.

Examples — numbers below always match the real data in Context:

Single substance:
LSD is a semi-synthetic psychedelic used recreationally. It lasts longer and produces intense visual and sensory effects.
Harm: ██░░░░░░░░ 15/100
Addiction: █░░░░░░░░░ 10/100
OD risk: █░░░░░░░░░ 5/100

Combo:
Combining MDMA with cannabis carries low risk overall.

MDMA is an empathogen used in therapy and recreation.
Harm: █████░░░░░ 48/100
Addiction: ████░░░░░░ 35/100
OD risk: ███░░░░░░░ 30/100

Cannabis is a mild psychoactive used recreationally and medicinally.
Harm: ██░░░░░░░░ 15/100
Addiction: ██░░░░░░░░ 20/100
OD risk: █░░░░░░░░░ 5/100

[COMBO: MDMA + Cannabis → Low Risk]

Comparison:
Psilocybin is a naturally occurring psychedelic used spiritually.
Harm: ██░░░░░░░░ 12/100
Addiction: █░░░░░░░░░ 8/100
OD risk: █░░░░░░░░░ 3/100

LSD is a semi-synthetic psychedelic used recreationally. It lasts longer and produces intense visual and sensory effects.
Harm: ██░░░░░░░░ 15/100
Addiction: █░░░░░░░░░ 10/100
OD risk: █░░░░░░░░░ 5/100`

export function buildSystemPrompt(): string {
  return SYSTEM_PROMPT
}

export interface EnrichmentResult {
  contextBlock: string
  contextFound: boolean
}

const GREETINGS = /^(hi|hello|hey|sup|yo|what'?s? ?up|good (morning|afternoon|evening)|howdy|hiya|heya|hullo)[\s!?.]*$/i
export function isGreeting(query: string): boolean {
  return GREETINGS.test(query.trim())
}

const COMBO_INDICATORS = /\b(?:and\s+(?!the|a|an|its|their|how|what|why|when|where|who|which|is|are|do|does|can|will|should|would|could|if)|with\s|plus\s|vs\.?\s|combine?|mix(?:ing)?\s|take\s+(?:both|together))\b|\+\s+/i
const COMPARE_INDICATORS = /\b(?:compare?|difference|different|versus|vs\.?|stronger|safer|similar|both)\b/i

function classifyQuery(q: string): 'combo' | 'single' | 'general' {
  if (COMPARE_INDICATORS.test(q)) return 'general'
  if (COMBO_INDICATORS.test(q)) return 'combo'
  const singlePattern = /^(?:what\s+(?:is|are)|tell\s+me\s+(?:about|regarding)|info\s+(?:on|about)|how\s+(?:strong|dangerous|safe|harmful)|is\s+)/i
  if (singlePattern.test(q)) return 'single'
  const wordCount = q.split(/\s+/).length
  if (wordCount <= 4) return 'single'
  return 'general'
}

export async function enrichQueryWithSubstanceData(query: string): Promise<EnrichmentResult> {
  const q = query.toLowerCase().trim()
  if (!q || q.length < 2 || GREETINGS.test(q)) {
    return { contextBlock: '', contextFound: false }
  }

  let matches = await searchSubstances(q, 5)
  if (matches.length === 0) return { contextBlock: '', contextFound: false }

  const tokens = q.split(/\s+/).map(t => t.replace(/[^a-z0-9-]/g, '')).filter(t => t.length > 0)
  const allSubstances = await getAllSubstances()
  const hasNameMatch = tokens.some(t => {
    if (STOP_WORDS.has(t) || /^\d+$/.test(t)) return false
    return allSubstances.some(s =>
      s.name.toLowerCase().includes(t) ||
      s.aliases.some(a => a.toLowerCase().includes(t))
    )
  })
  if (!hasNameMatch) return { contextBlock: '', contextFound: false }

  try {
    const trendingSlugs = await getTrendingSlugs()
    if (trendingSlugs.size > 0) {
      const trending: Substance[] = []
      const rest: Substance[] = []
      for (const s of matches) {
        if (trendingSlugs.has(slugify(s.name))) {
          trending.push(s)
        } else {
          rest.push(s)
        }
      }
      matches = [...trending, ...rest].slice(0, 5)
    }
  } catch { /* fail silently */ }

  const type = classifyQuery(q)
  const parts: string[] = ['Context:']

  if (type === 'combo') {
    const names = matches.slice(0, 2).map(s => s.name.toLowerCase())
    for (const sub of matches.slice(0, 2)) {
      parts.push(formatSubstanceData(sub))
    }
    if (names.length === 2) {
      const interaction = await checkInteraction(names[0], names[1])
      if (interaction) {
        const note = interaction.note ? ' (' + interaction.note + ')' : ''
        parts.push('Combo: ' + interaction.substanceA.name + ' + ' + interaction.substanceB.name + ' -> ' + interaction.level + note)
      }
    }
  } else if (type === 'single') {
    parts.push(formatSubstanceData(matches[0]))
  } else {
    for (const sub of matches.slice(0, 3)) {
      parts.push(formatSubstanceData(sub))
    }
  }

  return { contextBlock: parts.join('\n'), contextFound: true }
}

function formatSubstanceLine(sub: Substance): string {
  return sub.name + ' | ' + sub.category + ' | Harm:' + sub.harmLevel + '(' + sub.harmScore + ') | Add:' + sub.addictionScore + ' | OD:' + sub.odRisk
}

function formatSubstanceData(sub: Substance): string {
  const parts = [
    sub.name + ' | ' + sub.category + ' | Harm:' + sub.harmScore + '/100 | Addiction:' + sub.addictionScore + '/100 | OD Risk:' + sub.odRisk + '/100',
  ]
  const extras: string[] = []
  if (sub.risks.length) extras.push('Risks:' + sub.risks.slice(0, 3).join(';'))
  if (sub.safety.length) extras.push('Safety:' + sub.safety.slice(0, 2).join(';'))
  if (sub.bestMix) extras.push('Best w/:' + sub.bestMix)
  if (sub.neverMix) extras.push('Never w/:' + sub.neverMix)
  if (extras.length) parts.push(extras.join(' | '))
  return parts.join('\n')
}
