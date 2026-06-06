'use client'

import {
  US, GB, CA, AU, DE, NL, FR, BR, JP, SE,
  PT, NZ, ES, IT, CH, MX, ZA, IE, IN, NO,
} from 'country-flag-icons/react/3x2'

const RENDERERS: Record<string, React.ComponentType<{ title?: string; className?: string }>> = {
  US, GB, CA, AU, DE, NL, FR, BR, JP, SE,
  PT, NZ, ES, IT, CH, MX, ZA, IE, IN, NO,
  UK: GB,
}

export function CountryFlagSvg({ code, className }: { code: string; className?: string }): React.ReactElement {
  const Component = RENDERERS[code.toUpperCase()]
  if (Component) return <Component className={className} />
  return <span className={className}>{code}</span>
}
