import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_PATH = path.resolve(__dirname, '../src/data/all-data.json')
const EFFECTS_PATH = path.resolve(__dirname, '../src/data/subjective-effects.json')

const anomalies = [
  'Cariprazine', 'Brexpiprazole', 'Iloperidone', 'Lumateperone', 'Molindone',
  'Thiothixene', 'Flupentixol', 'Zuclopenthixol', 'Levomepromazine', 'Prochlorperazine',
  'Sertindole', 'Pimavanserin', 'Chlorprothixene', 'Amoxapine', 'Clotiapine',
  'Perazine', 'Fluspirilene', 'Penfluridol', 'Mesoridazine'
]

const doses = {
  'Olanzapine': { threshold: 2.5, light: '2.5-5', common: '5-10', strong: '10-20', heavy: 20, u: 'mg', n: 'oral' },
  'Quetiapine': { threshold: 12.5, light: '25-50', common: '50-150', strong: '150-300', heavy: 800, u: 'mg', n: 'oral' },
  'Aripiprazole': { threshold: 2, light: '2-5', common: '5-15', strong: '15-30', heavy: 30, u: 'mg', n: 'oral' },
  'Haloperidol': { threshold: 0.5, light: '0.5-2', common: '2-5', strong: '5-10', heavy: 20, u: 'mg', n: 'oral' },
  'Clozapine': { threshold: 12.5, light: '12.5-50', common: '50-300', strong: '300-600', heavy: 900, u: 'mg', n: 'oral' },
  'Risperidone': { threshold: 0.25, light: '0.5-1', common: '1-4', strong: '4-6', heavy: 16, u: 'mg', n: 'oral' },
  'Paliperidone': { threshold: 1.5, light: '3', common: '3-9', strong: '9-12', heavy: 12, u: 'mg', n: 'oral' },
  'Ziprasidone': { threshold: 20, light: '20-40', common: '40-80', strong: '80-160', heavy: 160, u: 'mg', n: 'oral' },
  'Lurasidone': { threshold: 20, light: '20-40', common: '40-80', strong: '80-120', heavy: 160, u: 'mg', n: 'oral' },
  'Chlorpromazine': { threshold: 10, light: '10-25', common: '25-100', strong: '100-400', heavy: 1000, u: 'mg', n: 'oral' },
  'Fluphenazine': { threshold: 0.5, light: '0.5-1', common: '1-5', strong: '5-10', heavy: 20, u: 'mg', n: 'oral' },
  'Perphenazine': { threshold: 2, light: '2-4', common: '4-16', strong: '16-32', heavy: 64, u: 'mg', n: 'oral' },
  'Thioridazine': { threshold: 10, light: '10-25', common: '25-100', strong: '100-300', heavy: 800, u: 'mg', n: 'oral' },
  'Trifluoperazine': { threshold: 1, light: '1-2', common: '2-10', strong: '10-20', heavy: 40, u: 'mg', n: 'oral' },
  'Amisulpride': { threshold: 25, light: '50-100', common: '100-400', strong: '400-800', heavy: 1200, u: 'mg', n: 'oral' },
  'Asenapine': { threshold: 1, light: '2.5', common: '2.5-5', strong: '5-10', heavy: 20, u: 'mg', n: 'sublingual' },
  'Loxapine': { threshold: 5, light: '5-10', common: '10-50', strong: '50-100', heavy: 250, u: 'mg', n: 'oral' },
  'Sulpiride': { threshold: 25, light: '50-100', common: '100-400', strong: '400-800', heavy: 1600, u: 'mg', n: 'oral' },
  'Droperidol': { threshold: 0.5, light: '0.625-1.25', common: '1.25-2.5', strong: '2.5-5', heavy: 10, u: 'mg', n: 'intramuscular' },
  'Pimozide': { threshold: 0.5, light: '1-2', common: '2-6', strong: '6-10', heavy: 20, u: 'mg', n: 'oral' },
  'Cariprazine': { threshold: 0.5, light: '1.5', common: '1.5-3', strong: '3-6', heavy: 6, u: 'mg', n: 'oral' },
  'Brexpiprazole': { threshold: 0.25, light: '0.5-1', common: '1-2', strong: '2-4', heavy: 4, u: 'mg', n: 'oral' },
  'Iloperidone': { threshold: 1, light: '1-2', common: '2-8', strong: '8-12', heavy: 24, u: 'mg', n: 'oral' },
  'Lumateperone': { threshold: 10, light: '21', common: '42', strong: '42', heavy: 42, u: 'mg', n: 'oral' },
  'Molindone': { threshold: 5, light: '5-15', common: '15-50', strong: '50-100', heavy: 225, u: 'mg', n: 'oral' },
  'Thiothixene': { threshold: 1, light: '2-5', common: '5-15', strong: '15-30', heavy: 60, u: 'mg', n: 'oral' },
  'Flupentixol': { threshold: 0.5, light: '0.5-1.5', common: '1.5-6', strong: '6-12', heavy: 18, u: 'mg', n: 'oral' },
  'Zuclopenthixol': { threshold: 2, light: '2-10', common: '10-30', strong: '30-50', heavy: 75, u: 'mg', n: 'oral' },
  'Levomepromazine': { threshold: 2.5, light: '5-12.5', common: '12.5-50', strong: '50-100', heavy: 300, u: 'mg', n: 'oral' },
  'Prochlorperazine': { threshold: 2.5, light: '5', common: '5-10', strong: '10-25', heavy: 40, u: 'mg', n: 'oral' },
  'Sertindole': { threshold: 4, light: '4-12', common: '12-20', strong: '20-24', heavy: 24, u: 'mg', n: 'oral' },
  'Pimavanserin': { threshold: 10, light: '17', common: '34', strong: '34', heavy: 34, u: 'mg', n: 'oral' },
  'Chlorprothixene': { threshold: 5, light: '15-30', common: '30-100', strong: '100-200', heavy: 400, u: 'mg', n: 'oral' },
  'Amoxapine': { threshold: 25, light: '25-50', common: '50-150', strong: '150-300', heavy: 600, u: 'mg', n: 'oral' },
  'Clotiapine': { threshold: 5, light: '10-20', common: '20-80', strong: '80-160', heavy: 360, u: 'mg', n: 'oral' },
  'Perazine': { threshold: 10, light: '25-50', common: '50-150', strong: '150-300', heavy: 600, u: 'mg', n: 'oral' },
  'Fluspirilene': { threshold: 0.5, light: '1-2', common: '2-8', strong: '8-12', heavy: 20, u: 'mg', n: 'intramuscular' },
  'Penfluridol': { threshold: 10, light: '20', common: '20-60', strong: '60-120', heavy: 160, u: 'mg', n: 'oral' },
  'Mesoridazine': { threshold: 10, light: '10-25', common: '25-100', strong: '100-200', heavy: 400, u: 'mg', n: 'oral' }
}

const typicalAntipsychotics = [
  'Haloperidol', 'Chlorpromazine', 'Fluphenazine', 'Perphenazine', 'Thioridazine',
  'Trifluoperazine', 'Loxapine', 'Droperidol', 'Pimozide', 'Molindone',
  'Thiothixene', 'Flupentixol', 'Zuclopenthixol', 'Levomepromazine', 'Prochlorperazine',
  'Chlorprothixene', 'Clotiapine', 'Perazine', 'Fluspirilene', 'Penfluridol', 'Mesoridazine'
]

async function getSmilesFromPubChem(name) {
  try {
    const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(name)}/property/CanonicalSMILES,IsomericSMILES/JSON`
    const res = await fetch(url)
    if (!res.ok) {
      console.log(`  PubChem HTTP error for ${name}: ${res.status}`)
      return null
    }
    const data = await res.json()
    const prop = data?.PropertyTable?.Properties?.[0]
    return prop?.SMILES || prop?.ConnectivitySMILES || null
  } catch (e) {
    console.log(`  PubChem query failed for ${name}: ${e.message}`)
    return null
  }
}

async function main() {
  console.log('Loading all-data.json...')
  const raw = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'))
  const substances = raw.s

  const antipsychotics = substances.filter(s => s.c === 'Antipsychotics')
  console.log(`Found ${antipsychotics.length} antipsychotics in DB.`)

  for (const sub of antipsychotics) {
    const isAnomalous = anomalies.includes(sub.n)

    console.log(`Processing: ${sub.n}...`)

    // 1. Rename keys if anomalous
    if (isAnomalous) {
      if ('on' in sub) {
        sub.o = sub.on
        delete sub.on
      }
      if ('dr' in sub) {
        sub.d = sub.dr
        delete sub.dr
      }
      // Clean up extra keys
      if ('wd' in sub) {
        sub.ws = sub.wd
        delete sub.wd
      }
    }

    // Ensure o and d are defined
    if (!sub.o) sub.o = '1-2 hours'
    if (!sub.d) sub.d = '12-24 hours'

    // 2. Populate aliases from brand names
    if (!sub.a || sub.a.length === 0) {
      sub.a = [...(sub.bn || [])]
    }

    // 3. Fetch SMILES if missing
    if (!sub.sm) {
      console.log(`  Fetching SMILES for ${sub.n} from PubChem...`)
      const smiles = await getSmilesFromPubChem(sub.n)
      if (smiles) {
        sub.sm = smiles
        console.log(`  SMILES found: ${smiles}`)
      } else {
        console.log(`  SMILES NOT found. Using placeholder.`)
        sub.sm = ''
      }
      // Wait to respect API rate limits
      await new Promise(r => setTimeout(r, 200))
    }

    // 4. Populate standard interactions if missing/empty
    if (!sub.i || sub.i.length === 0) {
      const isTypical = typicalAntipsychotics.includes(sub.n)
      if (isTypical) {
        sub.i = [
          'Risky: Alcohol — enhanced sedation and motor impairment',
          'Risky: Other CNS depressants — enhanced sedation and respiratory depression',
          'Risky: QT-prolonging agents — increased risk of arrhythmias',
          'Caution: Anticholinergics — increased risk of anticholinergic toxicity'
        ]
      } else {
        sub.i = [
          'Risky: Alcohol — enhanced sedation and cognitive impairment',
          'Risky: Other CNS depressants — enhanced sedation and respiratory depression',
          'Caution: CYP3A4/2D6 inhibitors/inducers — altered antipsychotic levels',
          'Risky: QT-prolonging agents — increased risk of arrhythmias'
        ]
      }
    }

    // 5. Populate pr (ROAs doses) if missing/empty
    if (!sub.pr || sub.pr.length === 0) {
      const doseInfo = doses[sub.n]
      if (doseInfo) {
        sub.pr = [
          {
            n: doseInfo.n,
            d: {
              t: doseInfo.threshold.toString(),
              l: doseInfo.light.toString(),
              c: doseInfo.common.toString(),
              s: doseInfo.strong.toString(),
              h: doseInfo.heavy.toString(),
              u: doseInfo.u
            },
            dur: {
              o: sub.o,
              p: '2-4 hours',
              t: sub.d
            }
          }
        ]
      }
    }
  }

  console.log('Writing back to all-data.json...')
  fs.writeFileSync(DATA_PATH, JSON.stringify(raw, null, 0))
  console.log('all-data.json saved successfully.')

  // Update subjective-effects.json
  console.log('Loading subjective-effects.json...')
  const effects = JSON.parse(fs.readFileSync(EFFECTS_PATH, 'utf-8'))

  for (const sub of antipsychotics) {
    const key = sub.n.toLowerCase()
    const isTypical = typicalAntipsychotics.includes(sub.n)

    const why = isTypical
      ? 'First-generation (typical) antipsychotics are dopamine receptor antagonists primarily used to treat acute psychosis, schizophrenia, and severe agitation. In harm reduction contexts, they are occasionally used to abort intense psychedelic trips (known as trip killers), though they carry a significant risk of extrapyramidal motor symptoms.'
      : 'Second-generation (atypical) antipsychotics modulate both dopamine and serotonin receptors. They are clinically used for schizophrenia, bipolar mania, and treatment-resistant depression. Because of their powerful tranquilizing properties, they are frequently referenced in drug communities as effective tools to mitigate or completely abort difficult psychedelic experiences (trip killers).'

    // Check if entry doesn't exist or is empty
    if (!effects[key] || !effects[key].positives || effects[key].positives.length === 0) {
      effects[key] = {
        positives: [
          'Anxiety suppression',
          'Sedation',
          'Nausea suppression'
        ],
        negatives: [
          'Dizziness',
          'Dry mouth',
          'Akathisia',
          'Cognitive fatigue',
          'Weight gain',
          'Perception of bodily heaviness'
        ],
        why: why
      }
      console.log(`Updated subjective effects for: ${sub.n}`)
    }
  }

  console.log('Saving subjective-effects.json...')
  fs.writeFileSync(EFFECTS_PATH, JSON.stringify(effects, null, 2))
  console.log('subjective-effects.json saved successfully.')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
