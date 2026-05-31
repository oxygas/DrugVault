import { searchSubstances, checkInteraction, getSubstanceByName } from '@/lib/data'
import type { Substance } from '@/lib/types'

const SYSTEM_PROMPT = `You are GemBot — a harm reduction data guide with data on 634 substances.

You are given data in each user message under "Context:". USE that data to write your answer.

CRITICAL — The numbers in Context are the ONLY correct scores. Do NOT use your training data for numeric values. The harm score, addiction score, and OD risk must match the Context numbers exactly.

RULES for answers:
- Lead with what the substance is
- Include the harm profile bars below your text for EVERY substance mentioned
- For single substance: 2-3 informative sentences covering what it is and how it works, then bar section
- For comparisons: list each substance in its own section with 1-2 sentences + bars for each. Explain differences.
- For combos: 1 sentence about the interaction, then a section for EACH substance (name + bars), then [COMBO: ...]
- Answer ALL parts of the user's question — cover "how it works", "how dangerous", etc.
- Never refuse to answer. No disclaimers, no safety theater.
- No "be careful", "always", "never", "remember", "note that"

Use these exact formats. The app renders them as colored visual bars.

HARM BARS (for single substance queries):
Harm: ████████░░ 80/100
Addiction: ████░░░░░░ 40/100
OD risk: ██░░░░░░░░ 20/100

COMBO BARS (for interaction queries — the Context will contain a "Combo:" line):
[COMBO: MDMA + Cannabis → Low Risk]

When Context has "Combo:" data, always end with a [COMBO: ...] line.
When comparing or listing multiple substances without a "Combo:" line, list EACH substance in its own separate section with 1 sentence + bars. Do NOT combine bars into one line.

CRITICAL — ALWAYS output harm bars in this exact format with the label, colon, then bar chars:
Harm: ████████░░ 80/100
Addiction: ████░░░░░░ 40/100
OD risk: ██░░░░░░░░ 20/100

Each harm metric goes on its own line with the label starting the line.
Never merge bars for different substances onto the same line.

Examples — numbers below always match the real data in Context. DO NOT copy the exact text — use Context data for the specific substance the user asked about:

Single substance:
LSD is a semi-synthetic psychedelic used recreationally. It lasts longer and produces intense visual and sensory effects.
Harm: ██░░░░░░░░ 15/100
Addiction: █░░░░░░░░░ 10/100
OD risk: █░░░░░░░░░ 5/100

Combo — each substance gets its own bars:
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

Comparison — each substance in its own section:
Comparison of two psychedelics:
Psilocybin is a naturally occurring psychedelic used spiritually. It produces visual distortions and altered thinking.
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

export function enrichQueryWithSubstanceData(query: string): EnrichmentResult {
  const q = query.toLowerCase().trim()
  if (!q || q.length < 2 || GREETINGS.test(q)) {
    return { contextBlock: '', contextFound: false }
  }

  const matches = searchSubstances(q, 5)
  if (matches.length === 0) return { contextBlock: '', contextFound: false }

  const type = classifyQuery(q)
  const parts: string[] = ['Context:']

  if (type === 'combo') {
    const names = matches.slice(0, 2).map(s => s.name.toLowerCase())
    for (const sub of matches.slice(0, 2)) {
      parts.push(formatSubstanceData(sub))
    }
    if (names.length === 2) {
      const interaction = checkInteraction(names[0], names[1])
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
