import { createClient } from 'next-sanity'

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2025-05-15',
  useCdn: true,
})

export const SANITY_QUERIES = {
  ALL_SUBSTANCES: `*[_type == "substance"] | order(name asc){
    _id, name, slug, aliases, category, harmLevel, harmScore, addictionScore,
    onset, duration, odRisk, withdrawalSeverity, interactionDanger, dependenceLiability,
    risks, overdose, safety, interactions, withdrawal, recovery, smiles,
    chemicalStructure{alt, asset->{url, metadata{dimensions{width, height}}}},
    bestMix, neverMix,
    durationTotal, durationOnset, durationComeUp, durationPeak, durationOffset, durationAfterEffects,
    doseThreshold, doseLight, doseCommon, doseStrong, doseHeavy, description, imageUrl
  }`,
  SUBSTANCE_BY_SLUG: `*[_type == "substance" && slug.current == $slug][0]{
    _id, name, slug, aliases, category, harmLevel, harmScore, addictionScore,
    onset, duration, odRisk, withdrawalSeverity, interactionDanger, dependenceLiability,
    risks, overdose, safety, interactions, withdrawal, recovery, smiles,
    chemicalStructure{alt, asset->{url, metadata{dimensions{width, height}}}},
    bestMix, neverMix,
    durationTotal, durationOnset, durationComeUp, durationPeak, durationOffset, durationAfterEffects,
    doseThreshold, doseLight, doseCommon, doseStrong, doseHeavy, description, imageUrl
  }`,
  SUBSTANCES_BY_CATEGORY: `*[_type == "substance" && category == $category] | order(name asc){
    _id, name, slug, category, harmLevel, harmScore, addictionScore, onset, duration, smiles
  }`,
  COMBO_RULES: `*[_type == "comboRule"]{
    _id, categoryA, categoryB, level, description
  }`,
  SUBSTANCE_COUNT: `count(*[_type == "substance"])`,
  CATEGORIES: `array::unique(*[_type == "substance"].category)`,
}
