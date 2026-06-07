const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../src/data/all-data.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

function getFactorsForScore(type, score, category, name) {
  const factors = [];
  
  if (type === 'hs') {
    if (score > 70) factors.push({ l: "High Systemic Toxicity", e: `${name} exhibits significant neurotoxic or hepatotoxic mechanisms at high doses.` });
    else if (score > 40) factors.push({ l: "Moderate Toxicity", e: `Prolonged or heavy use of ${name} can lead to adverse physiological effects.` });
    else factors.push({ l: "Low Physical Harm", e: `Generally well tolerated physiologically if used at common dosages.` });
  } else if (type === 'as') {
    if (score > 75) factors.push({ l: "High Dopaminergic Action", e: `Strong reinforcement profile typical of highly addictive substances.` });
    else if (score > 40) factors.push({ l: "Moderate Reinforcement", e: `Can be habit-forming with regular use.` });
    else factors.push({ l: "Low Addiction Potential", e: `Does not typically produce compulsive redosing or cravings.` });
  } else if (type === 'od') {
    if (score > 75) factors.push({ l: "Narrow Therapeutic Index", e: `Active dose is dangerously close to the lethal or toxic dose.` });
    else if (score > 40) factors.push({ l: "Moderate Overdose Risk", e: `Can cause dangerous symptoms if mismeasured or combined.` });
    else factors.push({ l: "High Safety Margin", e: `Extremely difficult to reach physically dangerous levels through typical routes.` });
  } else if (type === 'ws') {
    if (score > 75) factors.push({ l: "Severe Physical Dependence", e: `Abrupt cessation can cause dangerous or unbearable withdrawal symptoms.` });
    else if (score > 40) factors.push({ l: "Moderate Discontinuation Syndrome", e: `May cause discomfort, rebound effects, or mood swings upon cessation.` });
    else factors.push({ l: "Minimal Withdrawal", e: `Cessation generally does not produce severe physical symptoms.` });
  } else if (type === 'id') {
    if (score > 75) factors.push({ l: "Dangerous Synergies", e: `High risk of fatal interactions like serotonin syndrome or respiratory depression.` });
    else if (score > 40) factors.push({ l: "Moderate Interaction Risk", e: `Can unpredictably potentiate other substances or cause adverse effects.` });
    else factors.push({ l: "Relatively Safe Combos", e: `Fewer known dangerous pharmacological interactions.` });
  } else if (type === 'dl') {
    if (score > 75) factors.push({ l: "Strong Psychological Dependence", e: `Users frequently develop strong habits and psychological reliance.` });
    else if (score > 40) factors.push({ l: "Moderate Habituation", e: `Regular use can lead to tolerance and psychological attachment.` });
    else factors.push({ l: "Low Dependence Liability", e: `Rarely produces strong psychological dependence.` });
  }
  
  if (category === 'Psychedelic' && type === 'hs') {
    factors.push({ l: "Psychological Risks", e: `Potential for HPPD, depersonalization, or triggering latent conditions.` });
  } else if (category === 'Opioid' && type === 'od') {
    factors.push({ l: "Respiratory Depression", e: `Primary mechanism of fatal overdose.` });
  } else if (category === 'Stimulant' && type === 'hs') {
    factors.push({ l: "Cardiovascular Strain", e: `Increases heart rate and blood pressure, straining the cardiovascular system.` });
  } else if (category === 'Depressant' && type === 'id') {
    factors.push({ l: "CNS Depressant Synergy", e: `Combining with other depressants exponentially increases risk of respiratory failure.` });
  }

  return factors.slice(0, 2);
}

data.s.forEach(sub => {
  if (!sub.sb) {
    sub.sb = {
      hs: { factors: getFactorsForScore('hs', sub.hs, sub.c, sub.n) },
      as: { factors: getFactorsForScore('as', sub.as, sub.c, sub.n) },
      od: { factors: getFactorsForScore('od', sub.od, sub.c, sub.n) },
      ws: { factors: getFactorsForScore('ws', sub.ws, sub.c, sub.n) },
      id: { factors: getFactorsForScore('id', sub.id, sub.c, sub.n) },
      dl: { factors: getFactorsForScore('dl', sub.dl, sub.c, sub.n) },
    };
  }
});

fs.writeFileSync(dataPath, JSON.stringify(data, null, 0));
console.log('Successfully enriched all-data.json with score breakdowns!');
