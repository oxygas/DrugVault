export interface HarmReductionInfo {
  description: string
  risks: string[]
  practices: string[]
  avoid: string
}

export const CATEGORY_HARM_REDUCTION: Record<string, HarmReductionInfo> = {
  Stimulants: {
    description: 'Central nervous system stimulants increase heart rate, blood pressure, and dopamine/norepinephrine activity. Risk of cardiovascular strain, hyperthermia, and psychosis at high doses.',
    risks: ['Cardiac stress (arrhythmia, hypertension, stroke)', 'Hyperthermia and dehydration', 'Psychosis from sleep deprivation/overuse', 'Compulsive redosing and addiction', 'Neurotoxicity from oxidative stress'],
    practices: ['Hydrate with electrolytes, not just water', 'Monitor heart rate — rest if >140bpm sustained', "Never redose before the peak has passed (2-3h)", 'Set a dose limit beforehand and stick to it', 'Cool down — fans, cool showers if overheating'],
    avoid: 'NEVER combine with other stimulants, MAOIs (hypertensive crisis), or antidepressants (serotonin syndrome risk). Avoid alcohol — masks intoxication leading to overdose.'
  },

  Depressants: {
    description: 'CNS depressants slow brain activity, reduce anxiety, and sedate. Primary danger is respiratory depression, especially when combined.',
    risks: ['Respiratory depression — slowed/stopped breathing', 'Unconsciousness while vomiting (aspiration)', 'Memory blackouts (especially alcohol)', 'Physical dependence and severe withdrawal', 'Impaired coordination → falls, accidents'],
    practices: ['Never use alone — have someone who can check on you', 'Test potency — start with half a standard dose', 'Avoid redosing — effects last hours, stacking is deadly', 'Sleep on your side to prevent aspiration', 'Have naloxone if using opioids'],
    avoid: 'DEADLY: Combining multiple depressants (alcohol + benzos + opioids). NEVER mix opioids with alcohol or benzos — respiratory arrest.'
  },

  Opioids: {
    description: 'Powerful analgesics that activate mu-opioid receptors. High addiction potential and fatal respiratory depression at overdose.',
    risks: ['Respiratory depression — overdose can be fatal', 'Extremely high dependence liability', 'Severe withdrawal (flu-like, painful, protracted)', 'Fentanyl contamination in street supply', 'Naloxone wears off after 30-90min — overdose can return'],
    practices: ["Always carry naloxone — it's OTC and saves lives", 'Never mix with depressants (alcohol, benzos, GHB)', 'Use fentanyl test strips on any unregulated supply', 'Start with a low test dose (1/4 of expected)', "Don't use alone — use the Never Use Alone hotline (800-484-3731)"],
    avoid: 'DEADLY: Opioids + alcohol/benzos/GHB → respiratory arrest. MAOIs + certain opioids (tramadol, pethidine) → serotonin syndrome.'
  },

  Psychedelics: {
    description: 'Serotonergic (5-HT2A) agonists producing altered perception, cognition, and sense of self. Very low physiological toxicity but significant psychological risks.',
    risks: ['Psychological distress — "bad trip" panic', 'HPPD — persistent visual disturbances', 'Psychosis in predisposed individuals', 'Accidents from impaired perception', "Hazardous behavior without insight"],
    practices: ["Test your substance with reagent kits (Ehrlich, Marquis)", 'Set and setting — comfortable, familiar, sober sitter', "Start low (e.g., 50-75µg LSD, 1-1.5g cubensis)", "Sitter should be sober, experienced, and calm", 'Have benzodiazepines as a "trip killer" for emergencies'],
    avoid: 'Avoid if you have personal/family history of schizophrenia or bipolar. Lithium + psychedelics = seizure risk. SSRIs reduce effects significantly.'
  },

  Dissociatives: {
    description: 'NMDA receptor antagonists producing anesthesia, detachment from body/environment, and out-of-body experiences. Narrow therapeutic window.',
    risks: ['Manic/bizarre behavior under influence', 'Olney\'s lesions (NMDA toxicity) with chronic use', 'Bladder damage with frequent ketamine use', "The \"hole\" — loss of motor control, can't respond to emergencies", 'Cognitive impairment with heavy long-term use'],
    practices: ['Use a scale — volumetric dosing for potent substances', "Avoid mixing with depressants (respiratory depression)", "Don't use in unsafe environments — you may not be mobile", "Keep doses moderate — \"holes\" are intense and disorienting", 'Take frequent breaks to avoid tolerance buildup'],
    avoid: 'Avoid mixing with alcohol or opioids (deep sedation risk). Avoid with stimulants (extreme cardiovascular strain). NOT for public settings.'
  },

  Entactogens: {
    description: 'Phenethylamine derivatives that release serotonin, dopamine, and norepinephrine. Known for emotional empathy, connection, and sensory enhancement.',
    risks: ['Serotonin depletion — crash day(s) after', 'Hyperthermia and hyponatremia (MDMA)', 'Cardiovascular strain at high doses', 'Neurotoxicity from overheating and overuse', 'Serotonin syndrome when combined with antidepressants'],
    practices: ['Hydrate with electrolyte drinks (not just water)', 'Never exceed 120-150mg MDMA; 200mg is danger zone', 'Take 5-HTP + green tea extract for 3-7 days after', 'Wait 3 months between rolls (MDMA)', 'Monitor body temperature — cool down if overheating'],
    avoid: 'DANGEROUS: MDMA + MAOIs or SSRIs = serotonin syndrome (hyperthermia, seizures, death). Avoid with Ritonavir (AIDS med) — fatal interaction.'
  },

  Cannabinoids: {
    description: 'CB1/CB2 receptor agonists derived from cannabis or synthetic alternatives. Wide safety margin but significant psychological risks at high potency.',
    risks: ['Cannabinoid hyperemesis syndrome (chronic use)', 'Psychosis with high-THC or synthetics', "Respiratory issues from smoking (not the THC)", "Dependence and withdrawal (irritability, sleep loss)", "Increased heart rate — risk with heart conditions"],
    practices: ['Use lower THC / higher CBD ratios for safer experience', 'Avoid synthetic cannabinoids (spice/K2) — unpredictable and dangerous', 'Edibles: start low (5-10mg), wait 2h before redosing', 'Use vaporizers instead of smoking to protect lungs', 'CBD oil can counteract THC-induced anxiety'],
    avoid: 'Avoid synthetics entirely. Avoid with lithium, warfarin, or CYP3A4-metabolized drugs. Driving impaired still illegal and dangerous.'
  },

  Inhalants: {
    description: 'Volatile solvents, gases, and nitrites inhaled for brief intoxication. Extremely narrow safety window and high acute toxicity.',
    risks: ['Sudden sniffing death syndrome (cardiac arrest)', 'Brain damage from hypoxia', 'Suffocation from using bags/masks', 'Burns from flammable propellants', 'Liver/kidney/nerve damage with chronic use'],
    practices: ["NEVER use bags, masks, or enclosed spaces", 'Always use in well-ventilated area', 'Never inhale directly from pressurized canisters', 'Sit down to prevent falls if dizzy', 'One hit — wait — never "huff" repeatedly'],
    avoid: 'NEVER use with other depressants. AVOID with heart conditions. NO bags or plastic over head — this kills people.'
  },

  Deliriants: {
    description: 'Anticholinergic substances (diphenhydramine, datura, scopolamine) producing true hallucinations with no insight — the user cannot distinguish reality from hallucination.',
    risks: ['Complete loss of touch with reality — hours of full psychosis', 'Hyperthermia (especially antihistamines)', 'Seizures at high doses', 'Accidental death (walking into traffic, falling from heights)', 'Lasting cognitive impairment from anticholinergic damage'],
    practices: ['Have a SOBER sitter at ALL times — user cannot care for themselves', 'Remove all dangerous objects from the room', "Lock doors/windows — user may wander without knowing", 'Keep doses low — high doses are traumatic and dangerous', "Don't use deliriants recreationally — there is no safe level"],
    avoid: "DO NOT combine with any other substance. Avoid if you have seizures, heart conditions, or Alzheimer's risk (APOE4 carriers)."
  },

  Gabapentionoids: {
    description: 'Gabapentin and pregabalin bind to calcium channels, modulating GABA and glutamate. Used for nerve pain/anxiety but have recreational abuse potential.',
    risks: ['Dizziness, sedation, and fall risk at high doses', 'Respiratory depression when combined with other depressants', 'Dependence and withdrawal (anxiety, insomnia, seizures)', 'Memory impairment with chronic use', 'Withdrawal seizures can be life-threatening'],
    practices: ['Start at lowest effective dose — tolerance builds fast', 'Never combine with opioids, alcohol, or benzodiazepines', 'Taper off slowly — abrupt cessation causes seizures', "Avoid daily use to prevent tolerance and dependence", 'Do not drive or operate machinery until you know effects'],
    avoid: 'DANGEROUS with opioids, alcohol, or benzos (respiratory depression/death). Avoid high doses without a tolerance. Do not cold-turkey quit.'
  },

  Nootropics: {
    description: 'Cognitive enhancers including racetams, choline sources, and adaptogens. Generally safe but research on long-term effects is limited.',
    risks: ['Headaches from choline depletion (racetams)', 'Overstimulation and sleep disruption', "Unknown long-term effects of research chemicals", 'Interactions with prescription medications', 'Quality control issues with unregulated supplements'],
    practices: ['Stack with a choline source (Alpha-GPC, CDP-Choline) if using racetams', 'Cycle on/off to assess effects and prevent tolerance', "Research each compound thoroughly — 'nootropic' doesn't mean safe", 'Buy from reputable vendors with third-party testing', 'Start one at a time to understand effects'],
    avoid: 'Avoid combining multiple stimulant nootropics (caffeine + phenylpiracetam). Some nootropics affect serotonin — caution with SSRIs.'
  },

  Antidepressants: {
    description: 'SSRIs, SNRIs, tricyclics, and MAOIs for depression and anxiety. Require consistent dosing and careful withdrawal management.',
    risks: ['Serotonin syndrome when combined with serotonergic drugs', 'Withdrawal syndrome (discontinuation syndrome)', 'Suicidal ideation in first weeks of treatment', 'Sexual dysfunction (especially SSRIs)', 'MAOI dietary restrictions (tyramine-free diet)'],
    practices: ["Take consistently at the same time each day", 'Never stop abruptly — taper over weeks/months', 'Avoid alcohol, MDMA, and serotonergic substances', 'MAOI users: avoid aged cheese, cured meats, soy products', "Report any unusual mood changes to your doctor immediately"],
    avoid: 'MAOIs + stimulants/MDMA = hypertensive crisis and serotonin syndrome. SSRIs + MDMA = serotonin syndrome risk and blunted effects. St. John\'s Wort + any antidepressant = serotonin syndrome.'
  },

  Antipsychotics: {
    description: 'Dopamine D2 antagonists used for schizophrenia, bipolar, and sometimes anxiety. Can cause severe neurological side effects.',
    risks: ['Tardive dyskinesia (irreversible movement disorder)', 'Neuroleptic malignant syndrome (medical emergency)', 'Metabolic syndrome (weight gain, diabetes, cholesterol)', 'QT prolongation and cardiac effects', 'Extreme sedation and cognitive dulling'],
    practices: ['Monitor metabolic markers regularly (weight, glucose, lipids)', 'Report any involuntary movements immediately', 'Never stop abruptly — risk of rebound psychosis', "Avoid alcohol and CNS depressants", 'Use the minimum effective dose prescribed by your psychiatrist'],
    avoid: 'Avoid alcohol, benzodiazepines (excessive sedation), stimulants (psychosis exacerbation). Caution with QT-prolonging drugs.'
  },

  Dopaminergics: {
    description: 'Substances that primarily modulate dopamine — including L-DOPA, dopamine agonists (pramipexole, ropinirole), and bupropion.',
    risks: ['Impulse control disorders (gambling, hypersexuality, compulsive shopping)', 'Dopamine agonist withdrawal syndrome', 'Psychosis at high doses', 'Nausea and orthostatic hypotension', 'Sleep attacks (sudden onset of sleep)'],
    practices: ['Take with food if nauseated', 'Monitor for impulse control changes — ask family to watch for them', 'Do not drive if experiencing sleep attacks', 'Never adjust dose without medical supervision', 'Report any new compulsive behaviors immediately'],
    avoid: 'Avoid stimulants and MAOIs. Avoid alcohol (may worsen impulse control). DANGEROUS: MAOIs + L-DOPA = hypertensive crisis.'
  },

  Cathinones: {
    description: 'Synthetic cathinones (bath salts) potent SNDRI releasing agents similar to methamphetamine, with serotonergic activity varying by structure. Pyrrolidine derivatives (MDPV, α-PVP) are among the most compulsive and dangerous.',
    risks: ['Severe cardiovascular strain — hypertension, tachycardia, stroke', 'Hyperthermia and rhabdomyolysis', 'Psychosis, paranoia, and violent behavior (especially pyrrolidines)', 'Extreme compulsive redosing — pyrrolidines are highly addictive', 'Serotonin syndrome with serotonergic cathinones (mephedrone, methylone)'],
    practices: ['Never redose — pyrrolidine cathinones trigger compulsive re-dosing loops', 'Hydrate with electrolytes, cool down actively', 'Use benzodiazepines to manage agitation/overstimulation', "Test every batch — purity varies wildly in unregulated supply", 'DANGEROUS: pyrrolidines (α-PVP, MDPV) are orders of magnitude more addictive than mephedrone'],
    avoid: 'NEVER mix with stimulants, MAOIs, or antidepressants (serotonin syndrome). Avoid with MDMA/entactogens (cardiac strain + serotonin overload). Avoid alcohol — masks toxicity. DANGEROUS: combo with other stimulants can cause cardiac arrest.'
  },

  Supplements: {
    description: 'Vitamins, minerals, amino acids, and herbs generally regarded as safe at recommended doses. Quality and purity vary by manufacturer.',
    risks: ['Overdose possible with fat-soluble vitamins (A, D, E, K)', 'Heavy metal contamination in unregulated products', 'Liver toxicity at very high doses (niacin, green tea extract, kava)', 'Drug interactions (St. John\'s Wort, grapefruit extract, vitamin K)', 'Unknown effects of proprietary blends'],
    practices: ['Buy from brands with third-party certification (USP, NSF, ConsumerLab)', 'Research each ingredient — "natural" doesn\'t mean safe', 'Check for drug interactions before taking', 'Follow labeled dosing — more is not better', 'Consult a doctor before starting new supplements'],
    avoid: 'DANGEROUS: St. John\'s Wort + antidepressants/MAOIs = serotonin syndrome. High-dose vitamin B6 can cause nerve damage.'
  },
}
