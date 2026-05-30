'use client'

export function StateFlagSvg({ code }: { code: string }) {
  const src = `https://flags.telco.dev/us/${code.toLowerCase()}/${code.toLowerCase()}.svg`
  return (
    <img
      src={src}
      alt={`${code} flag`}
      width="100%"
      height="100%"
      style={{ objectFit: 'cover' }}
      loading="lazy"
    />
  )
}
