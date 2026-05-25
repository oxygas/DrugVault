'use client'

import { Button } from '@/components/ui/button'
import { Bookmark, BookmarkCheck } from 'lucide-react'
import { useBookmarkStore } from '@/stores/bookmarks'
import { motion } from 'framer-motion'

export function BookmarkButton({ slug, size = 'default' }: { slug: string; size?: 'sm' | 'default' | 'icon' }) {
  const bookmarked = useBookmarkStore((s) => s.isBookmarked(slug))
  const toggle = useBookmarkStore((s) => s.toggle)

  return (
    <motion.div whileTap={{ scale: 0.85 }}>
      <Button
        variant="ghost"
        size={size === 'icon' ? 'icon' : 'sm'}
        onClick={(e) => { e.stopPropagation(); toggle(slug) }}
        className={bookmarked ? 'text-amber-400' : 'text-zinc-500'}
        aria-label={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
      >
        {bookmarked ? <BookmarkCheck className="h-4 w-4 fill-amber-400" /> : <Bookmark className="h-4 w-4" />}
      </Button>
    </motion.div>
  )
}
