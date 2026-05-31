import { searchSubstances, checkInteraction, getSubstanceByName } from '@/lib/data'
import type { Substance } from '@/lib/types'

const SYSTEM_PROMPT = `You are GemBot — a harm reduction data guide with data on 634 substances.

You are given data in each user message under "Context:". USE that data to write your answer.

RULES for answers:
- Lead with what the substance is
- Look at the Context data and include the harm profile bars below your text
- 2-3 sentences, then bar section
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

Examples:

MDMA is an empathogen used in therapy and recreation.
Harm: ██████░░░░ 63/100
Addiction: ██░░░░░░░░ 12/100
OD risk: ██████░░░░ 56/100

Caffeine is a stimulant for alertness. Low harm profile.
Harm: █░░░░░░░░░ 10/100
Addiction: ██░░░░░░░░ 25/100

Combining MDMA with cannabis carries low risk overall.
Harm: ██████░░░░ 63/100
Addiction: ██░░░░░░░░ 12/100
[COMBO: MDMA + Cannabis → Low Risk]`

export function buildSystemPrompt(): string {
  return SYSTEM_PROMPT
}

export interface EnrichmentResult {
  contextBlock: string
  contextFound: boolean
}

const GREETINGS = /^(hi|hello|hey|sup|yo|what'?s? ?up|good (morning|afternoon|evening)|howdy|hiya|heya|hullo)[\s!?.]*$/i

const COMBO_INDICATORS = /\b(?:and\s|\+\s?|with\s|vs\.?\s|combine?|mix(?:ing)?\s|take\s+(?:both|together))\b/i

function classifyQuery(q: string): 'combo' | 'single' | 'general' {
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
  const parts: string[] = ['Context']

  if (type === 'combo') {
    const names = matches.slice(0, 2).map(s => s.name.toLowerCase())
    for (const sub of matches.slice(0, 2)) {
      parts.push(formatSubstanceLine(sub))
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
      parts.push(formatSubstanceLine(sub))
    }
  }

  return { contextBlock: parts.join('\n'), contextFound: true }
}

function formatSubstanceLine(sub: Substance): string {
  return sub.name + ' | ' + sub.category + ' | Harm:' + sub.harmLevel + '(' + sub.harmScore + ') | Add:' + sub.addictionScore + ' | OD:' + sub.odRisk
}

function formatSubstanceData(sub: Substance): string {
  const parts = [
    sub.name + ' | Cat:' + sub.category + ' | Harm:' + sub.harmLevel + '(' + sub.harmScore + ') | Addict:' + sub.addictionScore + ' | OD:' + sub.odRisk + ' | WD:' + sub.withdrawalSeverity + ' | Interact:' + sub.interactionDanger + ' | Dep:' + sub.dependenceLiability,
  ]
  const extras: string[] = []
  if (sub.risks.length) extras.push('Risks:' + sub.risks.slice(0, 3).join(';'))
  if (sub.safety.length) extras.push('Safety:' + sub.safety.slice(0, 2).join(';'))
  if (sub.bestMix) extras.push('Best w/:' + sub.bestMix)
  if (sub.neverMix) extras.push('Never w/:' + sub.neverMix)
  if (extras.length) parts.push(extras.join(' | '))
  return parts.join('\n')
}
