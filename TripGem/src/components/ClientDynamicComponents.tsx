'use client'

import dynamic from 'next/dynamic'

const GemBotButton = dynamic(() => import('@/components/GemBot/GemBotButton').then(m => m.GemBotButton), { ssr: false, loading: () => null })
const LoadingScreen = dynamic(() => import('@/components/LoadingScreen'), { ssr: false, loading: () => null })

export function ClientGemBotButton() {
  return <GemBotButton />
}

export function ClientLoadingScreen() {
  return <LoadingScreen />
}
