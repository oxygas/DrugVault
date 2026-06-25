import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getSubstanceBySlug, getAllSubstances, getComboMatrix } from '@/lib/data'
import { slugify } from '@/lib/slugify'
import SubstanceDetail from '@/components/SubstanceDetail'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const substances = await getAllSubstances()
  return substances.map(s => ({ slug: slugify(s.name) }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const substance = await getSubstanceBySlug(slug)
  if (!substance) return { title: 'Substance Not Found' }

  return {
    title: `${substance.name} — ${substance.category}`,
    description: `${substance.name} harm profile: ${substance.harmLevel} risk, harm score ${substance.harmScore}/100. ${substance.onset} onset, ${substance.duration} duration. Evidence-based drug information.`,
    keywords: [substance.name, substance.category, 'harm reduction', 'drug interactions', 'dosage guide', ...substance.aliases],
    alternates: {
      canonical: `/substances/${slug}`,
    },
    openGraph: {
      title: `${substance.name} — ${substance.category} — TripGem`,
      description: `${substance.category} · ${substance.harmLevel} harm level · Score: ${substance.harmScore}/100`,
      type: 'article',
    },
  }
}

export default async function SubstancePage({ params }: PageProps) {
  const { slug } = await params
  const substance = await getSubstanceBySlug(slug)
  if (!substance) notFound()

  const comboMatrix = await getComboMatrix()
  const allSubstances = await getAllSubstances()
  const relatedSubs = allSubstances
    .filter(s => s.category === substance.category && s.name !== substance.name)
    .slice(0, 6)

  // Dynamic Schema.org Drug structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Drug',
    name: substance.name,
    alternateName: [
      ...(substance.aliases || []),
      ...(substance.brandNames || []),
      ...(substance.streetNames || [])
    ],
    description: substance.pwSummary || `${substance.name} harm reduction safety profile, harm score ${substance.harmScore}/100, addiction score ${substance.addictionScore}/100, classification: ${substance.category}.`,
    category: substance.category,
    nonProprietaryName: substance.name,
    overdosage: substance.overdose && substance.overdose.length > 0 ? substance.overdose.join('. ') : undefined,
    safetyConsideration: [
      ...(substance.safety || []),
      ...(substance.risks || [])
    ].slice(0, 8).join('. ') || undefined,
    dosageForm: substance.pwRoas && substance.pwRoas.length > 0
      ? substance.pwRoas.filter(Boolean).map(r => `${r.n} (${r.d?.t || 'unknown'} dose)`).join(', ')
      : undefined,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SubstanceDetail
        substance={substance}
        comboMatrix={comboMatrix}
        relatedSubstances={relatedSubs}
        allSubstances={allSubstances}
      />
    </>
  )
}
