import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getSubstanceBySlug, getAllSubstances, getComboMatrix } from '@/lib/data'
import { slugify } from '@/lib/data'
import SubstanceDetail from '@/components/SubstanceDetail'
import type { ComboLevel } from '@/lib/types'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const substances = getAllSubstances()
  return substances.map(s => ({ slug: slugify(s.name) }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const substance = getSubstanceBySlug(slug)
  if (!substance) return { title: 'Substance Not Found | Tripdex' }

  return {
    title: `${substance.name} — ${substance.category} | Tripdex Harm Reduction`,
    description: `${substance.name} harm profile: ${substance.harmLevel} risk, harm score ${substance.harmScore}/100. ${substance.onset} onset, ${substance.duration} duration. Evidence-based drug information.`,
    keywords: [substance.name, substance.category, 'harm reduction', 'drug interactions', 'dosage guide', ...substance.aliases],
    openGraph: {
      title: `${substance.name} — Tripdex`,
      description: `${substance.category} · ${substance.harmLevel} harm level · Score: ${substance.harmScore}/100`,
      type: 'article',
    },
  }
}

export default async function SubstancePage({ params }: PageProps) {
  const { slug } = await params
  const substance = getSubstanceBySlug(slug)
  if (!substance) notFound()

  const comboMatrix = getComboMatrix()
  const allSubstances = getAllSubstances()
  const relatedSubs = allSubstances
    .filter(s => s.category === substance.category && s.name !== substance.name)
    .slice(0, 6)

  return (
    <SubstanceDetail
      substance={substance}
      comboMatrix={comboMatrix}
      relatedSubstances={relatedSubs}
      allSubstances={allSubstances}
    />
  )
}
