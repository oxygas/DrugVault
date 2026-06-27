'use client'

import { useCallback, useState } from 'react'
import { Link } from 'lucide-react'
import { toast } from 'sonner'

interface ShareLinkButtonProps {
  substanceName: string
}

const SITE_URL = 'https://tripgem.space'

export default function ShareLinkButton({ substanceName }: ShareLinkButtonProps) {
  const [copied, setCopied] = useState(false)
  const url = `${SITE_URL}/drug/${substanceName}`

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success('Link copied!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy link')
    }
  }, [url])

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-display font-semibold transition-all hover:bg-[rgba(255,255,255,0.06)]"
      style={{
        background: 'rgba(255,255,255,0.03)',
        color: copied ? 'var(--green, #22c55e)' : 'var(--text3)',
        border: '1px solid var(--border)',
      }}
      title={url}
      aria-label={`Copy link: ${url}`}
    >
      <Link className="w-4 h-4" />
      <span className="hidden sm:inline truncate max-w-[240px]">{url}</span>
      <span className="sm:hidden text-[10px]">Copy link</span>
    </button>
  )
}
