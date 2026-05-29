'use client'

import dynamic from 'next/dynamic'

const StudioApp = dynamic(
  () => import('./StudioApp'),
  { ssr: false }
)

export default function StudioPage() {
  return <StudioApp />
}
