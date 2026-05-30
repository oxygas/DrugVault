import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const DATA_PATH = resolve(__dirname, '../src/data/all-data.json')
const OUT_PATH = resolve(__dirname, '../src/data/harm-reduction-scores.json')
const API = 'https://integrate.api.nvidia.com/v1/chat/completions'

const BATCH = parseInt(process.argv.find(a => a.startsWith('--batch='))?.split('=')[1] || '8')
const DELAY = parseInt(process.argv.find(a => a.startsWith('--delay='))?.split('=')[1] || '400')
const DRY_RUN = process.argv.includes('--dry-run')
const RESUME = process.argv.includes('--resume')
const MODEL = process.argv.find(a => a.startsWith('--model='))?.split('=')[1] || 'meta/llama-3.3-70b-instruct'

const API_KEY = process.env.NVIDIA_API_KEY
if (!API_KEY) {
  console.error('NVIDIA_API_KEY env var required')
  process.exit(1)
}

const raw = JSON.parse(readFileSync(DATA_PATH, 'utf-8'))
const substances = raw.s

function trunc(str, max) {
  if (!str) return ''
  return str.length > max ? str.slice(0, max) + '...' : str
}

function formatSubstance(s) {
  const lines = [
    `Name: ${s.n}`,
    `Category: ${s.c} | Harm Level: ${s.hl} | Harm Score: ${s.hs}/100`,
    `Scores — Addict:${s.as} OD:${s.od} Withdr:${s.ws} InteractDng:${s.id} Depend:${s.dl}`,
  ]
  if (s.r?.length) lines.push(`Risks: ${trunc(s.r.slice(0, 4).join(' | '), 350)}`)
  if (s.s?.length) lines.push(`Safety: ${trunc(s.s.slice(0, 3).join(' | '), 300)}`)
  if (s.i?.length) lines.push(`Interactions: ${trunc(s.i.slice(0, 3).join(' | '), 350)}`)
  if (s.od2?.length) lines.push(`Overdose: ${trunc(s.od2.slice(0, 2).join(' | '), 200)}`)
  if (s.w?.length) lines.push(`Withdrawal: ${trunc(s.w.slice(0, 2).join(' | '), 200)}`)
  if (s.rc?.length) lines.push(`Recovery: ${trunc(s.rc.slice(0, 2).join(' | '), 200)}`)
  if (s.st?.length) lines.push(`Street: ${s.st.slice(0, 8).join(', ')}`)
  lines.push(`Has: ROAs=${s.pr?'Y':'N'} bestMix=${s.bm||'_'} neverMix=${s.nm||'_'} | Counts: risks=${s.r?.length||0} safety=${s.s?.length||0} interact=${s.i?.length||0} wd=${s.w?.length||0} rc=${s.rc?.length||0} alias=${s.a?.length||0} street=${s.st?.length||0} brand=${s.bn?.length||0}`)
  return lines.join('\n')
}

const FEW_SHOT_USER = `--- SUBSTANCE 1 ---
Name: Cocaine
Category: Stimulants | Harm Level: high | Harm Score: 68/100
Scores — Addict:72 OD:45 Withdr:55 InteractDng:40 Depend:65
Risks: Cardiotoxicity | Myocardial ischemia | Stroke risk | Seizure threshold lowered
Safety: Test a small amount first | Avoid daily use to prevent tolerance | Stay hydrated | Avoid mixing with other stimulants
Interactions: DANGEROUS: MAOIs — hypertensive crisis | DANGEROUS: Alcohol — cocaethylene formation, cardiotoxic | Caution: SSRI/SNRI — increased serotonin syndrome risk | Caution: Cannabis — increased heart rate, anxiety
Overdose: Chest pain | Difficulty breathing | Seizures | Hyperthermia
Withdrawal: Depression | Fatigue | Increased appetite | Vivid nightmares
Recovery: Medical detox | Therapy/CBT | Support groups
Street: coke, blow, snow, crack, booger, yayo, white, flake
Has: ROAs=Y bestMix=Cannabinoids neverMix=MAOIs | Counts: risks=4 safety=5 interact=4 wd=4 rc=3 alias=4 street=8 brand=1`

const FEW_SHOT_ASSISTANT = `{
  "Cocaine": {
    "overall": 5,
    "safety": "✗",
    "accuracy": "✓",
    "tone": "✓",
    "practicalValue": "✓",
    "resources": "✓",
    "assessment": "Comprehensive entry with extensive risk documentation, detailed interaction warnings (MAOI hypertensive crisis, alcohol cocaethylene), and full withdrawal/recovery protocols. All critical harm reduction fields present.",
    "recommendations": ["Include LD50 data point", "Add brand name 'crack' distinction for freebase form"],
    "skullLabel": "Gold-standard data"
  }
}`

const SYSTEM_PROMPT = `You are a clinical harm reduction data reviewer. Rate each substance's DATA QUALITY — how complete, specific, and actionable the information is for someone seeking harm reduction guidance.

Return ONLY valid JSON. STRICTLY NO markdown, NO backticks, NO trailing text, NO preamble. Start directly with { and end with }. Not a single character outside the JSON object.

Schema:
{
  "[Name]": {
    "overall": <1-5>,
    "safety": "<✓|△|✗>",
    "accuracy": "<✓|△|✗>",
    "tone": "<✓|△|✗>",
    "practicalValue": "<✓|△|✗>",
    "resources": "<✓|△|✗>",
    "assessment": "<1-2 sentences about DATA QUALITY — mention what's good or missing>",
    "recommendations": ["<2-3 specific suggestions to improve this entry>"],
    "skullLabel": "<1-5 word label for DATA QUALITY (not substance danger)>"
  }
}

Scoring rules:
- overall: 5=all fields filled with specific actionable info. 4=good but minor gaps. 3=decent but several missing fields. 2=sparse. 1=critically incomplete
- safety: ✓ if harmScore<30. △ if 30-60. ✗ if >60
- accuracy: always ✓ (data is factual)
- tone: always ✓ (neutral clinical)
- practicalValue: ✓ if >=3 safety tips AND >=3 interactions AND has bestMix+neverMix. △ if missing one. ✗ if missing multiple
- resources: ✓ if has ROAs AND withdrawal AND recovery. △ if 2/3. ✗ if <=1

CRITICAL: Make assessment and recommendations SPECIFIC to each substance. Mention actual fields present, actual missing data, actual risks or interactions. Vary your output between substances.`

function buildUserPrompt(batch) {
  return batch.map((s, i) => `--- SUBSTANCE ${i + 1} ---\n${formatSubstance(s)}`).join('\n\n')
}

function parseResponse(text, batch) {
  const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
  const braceStart = cleaned.indexOf('{')
  const lastBrace = cleaned.lastIndexOf('}')
  if (braceStart === -1 || lastBrace === -1) throw new Error('No JSON object found')
  const jsonStr = cleaned.slice(braceStart, lastBrace + 1)
  const parsed = JSON.parse(jsonStr)
  const result = {}
  for (const key of Object.keys(parsed)) {
    const match = batch.find(s => s.n === key)
    if (match) {
      result[match.n] = parsed[key]
    }
  }
  return result
}

async function callAPI(batch) {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: FEW_SHOT_USER },
    { role: 'assistant', content: FEW_SHOT_ASSISTANT },
    { role: 'user', content: buildUserPrompt(batch) }
  ]

  if (DRY_RUN) {
    console.log(`\n=== BATCH (${batch.length}) ===`)
    console.log('SYSTEM:', SYSTEM_PROMPT.slice(0, 500) + '...')
    console.log('USER:', buildUserPrompt(batch).slice(0, 1000) + '...')
    return {}
  }

  const res = await fetch(API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({ model: MODEL, messages, temperature: 0.1, max_tokens: 4096 })
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`API ${res.status}: ${errText.slice(0, 300)}`)
  }

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('Empty response')

  return parseResponse(content, batch)
}

async function main() {
  let existing = {}
  if (RESUME && existsSync(OUT_PATH)) {
    existing = JSON.parse(readFileSync(OUT_PATH, 'utf-8'))
    console.log(`Resuming: ${Object.keys(existing).length} already scored`)
  }

  const toScore = substances.filter(s => !existing[s.n])
  console.log(`Total: ${substances.length}, Done: ${substances.length - toScore.length}, Remaining: ${toScore.length}`)
  console.log(`Model: ${MODEL}, Batch: ${BATCH}, Calls: ~${Math.ceil(toScore.length / BATCH)}`)

  for (let i = 0; i < toScore.length; i += BATCH) {
    const batch = toScore.slice(i, i + BATCH)
    const batchNum = Math.floor(i / BATCH) + 1
    const totalBatches = Math.ceil(toScore.length / BATCH)

    const names = batch.map(s => s.n).join(', ')
    process.stdout.write(`[${batchNum}/${totalBatches}] ${names}... `)

    try {
      const result = await callAPI(batch)
      Object.assign(existing, result)
      writeFileSync(OUT_PATH, JSON.stringify(existing, null, 2))
      const parsed = Object.keys(result).length
      console.log(parsed === batch.length ? `✓` : `⚠ ${parsed}/${batch.length}`)
    } catch (err) {
      console.error(`✗ ${err.message}`)
      writeFileSync(OUT_PATH, JSON.stringify(existing, null, 2))
      console.log('  Saved. Resume with --resume')
      break
    }

    if (i + BATCH < toScore.length) {
      await new Promise(r => setTimeout(r, DELAY))
    }
  }

  const scored = Object.keys(existing).length
  console.log(`\nDone: ${scored}/${substances.length} → ${OUT_PATH}`)
}

if (DRY_RUN) {
  console.log('=== DRY RUN ===')
  console.log(`Model: ${MODEL}, Batch: ${BATCH}, Substances: ${substances.length}, Calls: ~${Math.ceil(substances.length / BATCH)}`)
  const sample = substances.slice(0, 2)
  await callAPI(sample)
} else {
  main().catch(err => { console.error(err); process.exit(1) })
}
