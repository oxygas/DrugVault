import { defineType, defineField, defineArrayMember } from 'sanity'

const substance = defineType({
  name: 'substance',
  title: 'Substance',
  type: 'document',
  groups: [
    {
      name: 'preview',
      title: 'Main Preview',
      default: true,
    },
    {
      name: 'modal',
      title: 'Modal Detail',
    },
    {
      name: 'dosage',
      title: 'Dosage & Duration',
    },
    {
      name: 'editorial',
      title: 'Editorial',
    },
  ],
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
      group: 'preview',
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'name', maxLength: 96 },
      validation: (Rule) => Rule.required(),
      group: 'preview',
    }),
    defineField({
      name: 'aliases',
      title: 'Aliases',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
      group: 'preview',
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Depressants', value: 'Depressants' },
          { title: 'Stimulants', value: 'Stimulants' },
          { title: 'Opioids', value: 'Opioids' },
          { title: 'Psychedelics', value: 'Psychedelics' },
          { title: 'Dissociatives', value: 'Dissociatives' },
          { title: 'Entactogens', value: 'Entactogens' },
          { title: 'Cannabinoids', value: 'Cannabinoids' },
          { title: 'Inhalants', value: 'Inhalants' },
          { title: 'Deliriants', value: 'Deliriants' },
          { title: 'Gabapentionoids', value: 'Gabapentionoids' },
        ],
      },
      validation: (Rule) => Rule.required(),
      group: 'preview',
    }),
    defineField({
      name: 'harmLevel',
      title: 'Harm Level',
      type: 'string',
      options: { list: ['low', 'moderate', 'high', 'extreme'] },
      validation: (Rule) => Rule.required(),
      group: 'preview',
    }),
    defineField({
      name: 'harmScore',
      title: 'Harm Score (0-100)',
      type: 'number',
      validation: (Rule) => Rule.min(0).max(100).required(),
      group: 'preview',
    }),
    defineField({
      name: 'addictionScore',
      title: 'Addiction Score (0-100)',
      type: 'number',
      validation: (Rule) => Rule.min(0).max(100).required(),
      group: 'preview',
    }),
    defineField({
      name: 'onset',
      title: 'Onset',
      type: 'string',
      description: 'e.g. "15-30min"',
      group: 'preview',
    }),
    defineField({
      name: 'duration',
      title: 'Duration',
      type: 'string',
      description: 'e.g. "4-6h"',
      group: 'preview',
    }),
    defineField({
      name: 'smiles',
      title: 'SMILES',
      type: 'string',
      description: 'Chemical structure notation',
      group: 'preview',
    }),

    // --- Modal-only fields ---
    defineField({
      name: 'chemicalStructure',
      title: 'Chemical Structure Image',
      type: 'image',
      description: 'Upload a chemical structure diagram. Displayed only in the detail modal. If empty, the SMILES-generated image is used as fallback.',
      options: { hotspot: false },
      group: 'modal',
    }),
    defineField({
      name: 'odRisk',
      title: 'Overdose Risk (0-100)',
      type: 'number',
      validation: (Rule) => Rule.min(0).max(100),
      group: 'modal',
    }),
    defineField({
      name: 'withdrawalSeverity',
      title: 'Withdrawal Severity (0-100)',
      type: 'number',
      validation: (Rule) => Rule.min(0).max(100),
      group: 'modal',
    }),
    defineField({
      name: 'interactionDanger',
      title: 'Interaction Danger (0-100)',
      type: 'number',
      validation: (Rule) => Rule.min(0).max(100),
      group: 'modal',
    }),
    defineField({
      name: 'dependenceLiability',
      title: 'Dependence Liability (0-100)',
      type: 'number',
      validation: (Rule) => Rule.min(0).max(100),
      group: 'modal',
    }),
    defineField({
      name: 'risks',
      title: 'Risks',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
      group: 'modal',
    }),
    defineField({
      name: 'overdose',
      title: 'Overdose Signs',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
      group: 'modal',
    }),
    defineField({
      name: 'safety',
      title: 'Safety Tips',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
      group: 'modal',
    }),
    defineField({
      name: 'interactions',
      title: 'Interactions',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
      group: 'modal',
    }),
    defineField({
      name: 'withdrawal',
      title: 'Withdrawal Symptoms',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
      group: 'modal',
    }),
    defineField({
      name: 'recovery',
      title: 'Recovery Options',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
      group: 'modal',
    }),
    defineField({
      name: 'bestMix',
      title: 'Best Mix Category',
      type: 'string',
      group: 'modal',
    }),
    defineField({
      name: 'neverMix',
      title: 'Never Mix Category',
      type: 'string',
      group: 'modal',
    }),

    // --- Dosage & Duration group ---
    defineField({
      name: 'durationTotal',
      title: 'Total Duration (min)',
      type: 'number',
      group: 'dosage',
    }),
    defineField({
      name: 'durationOnset',
      title: 'Onset Duration (min)',
      type: 'number',
      group: 'dosage',
    }),
    defineField({
      name: 'durationComeUp',
      title: 'Come Up Duration (min)',
      type: 'number',
      group: 'dosage',
    }),
    defineField({
      name: 'durationPeak',
      title: 'Peak Duration (min)',
      type: 'number',
      group: 'dosage',
    }),
    defineField({
      name: 'durationOffset',
      title: 'Offset Duration (min)',
      type: 'number',
      group: 'dosage',
    }),
    defineField({
      name: 'durationAfterEffects',
      title: 'After Effects Duration (min)',
      type: 'number',
      group: 'dosage',
    }),
    defineField({
      name: 'doseThreshold',
      title: 'Threshold Dose',
      type: 'string',
      description: 'e.g. "5-10mg"',
      group: 'dosage',
    }),
    defineField({
      name: 'doseLight',
      title: 'Light Dose',
      type: 'string',
      group: 'dosage',
    }),
    defineField({
      name: 'doseCommon',
      title: 'Common Dose',
      type: 'string',
      group: 'dosage',
    }),
    defineField({
      name: 'doseStrong',
      title: 'Strong Dose',
      type: 'string',
      group: 'dosage',
    }),
    defineField({
      name: 'doseHeavy',
      title: 'Heavy Dose',
      type: 'string',
      group: 'dosage',
    }),

    // --- Editorial group ---
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
      group: 'editorial',
    }),
    defineField({
      name: 'imageUrl',
      title: 'Image URL (legacy)',
      type: 'string',
      description: 'Legacy override. Prefer chemicalStructure image field above.',
      hidden: true,
      group: 'editorial',
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'category',
      media: 'chemicalStructure',
    },
  },
})

const comboRule = defineType({
  name: 'comboRule',
  title: 'Combination Rule',
  type: 'document',
  fields: [
    defineField({
      name: 'categoryA',
      title: 'Category A',
      type: 'string',
      options: {
        list: ['Depressants', 'Stimulants', 'Opioids', 'Psychedelics', 'Dissociatives', 'Entactogens', 'Cannabinoids', 'Inhalants', 'Deliriants', 'Gabapentionoids'],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'categoryB',
      title: 'Category B',
      type: 'string',
      options: {
        list: ['Depressants', 'Stimulants', 'Opioids', 'Psychedelics', 'Dissociatives', 'Entactogens', 'Cannabinoids', 'Inhalants', 'Deliriants', 'Gabapentionoids'],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'level',
      title: 'Interaction Level',
      type: 'string',
      options: { list: ['safe', 'low_risk', 'caution', 'unsafe', 'dangerous', 'deadly'] },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
    }),
  ],
  preview: {
    select: {
      title: 'level',
      subtitle: 'categoryA',
    },
  },
})

export const schemaTypes = [substance, comboRule]
