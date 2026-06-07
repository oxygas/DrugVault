/**
 * Device detection utilities
 * Works both server-side (headers) and client-side (userAgent/window)
 */

export interface DeviceInfo {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isTouch: boolean
}

// Mobile user-agent patterns
const MOBILE_UA_PATTERNS = [
  /Android.*Mobile/i,
  /iPhone/i,
  /iPod/i,
  /BlackBerry/i,
  /Windows Phone/i,
  /webOS/i,
  /Opera Mini/i,
  /Opera Mobi/i,
  /Mobile.*Safari/i,
  /Mobile/i,
]

// Tablet patterns (iPad on desktop Safari doesn't say Mobile)
const TABLET_UA_PATTERNS = [
  /iPad/i,
  /Android(?!.*Mobile)/i,
  /Tablet/i,
  /PlayBook/i,
  /Silk/i,
]

// Desktop patterns
const DESKTOP_UA_PATTERNS = [
  /Windows NT/i,
  /Macintosh/i,
  /X11/i,
  /Linux.*x86_64/i,
  /Linux.*x86-64/i,
]

/**
 * Detect device from user-agent string (server-side or client-side)
 */
export function detectDevice(userAgent: string): DeviceInfo {
  const isMobile = MOBILE_UA_PATTERNS.some((p) => p.test(userAgent))
  const isTablet = TABLET_UA_PATTERNS.some((p) => p.test(userAgent))
  const isDesktop = DESKTOP_UA_PATTERNS.some((p) => p.test(userAgent)) && !isMobile && !isTablet
  const isTouch = typeof window !== 'undefined' && 'ontouchstart' in window

  return {
    isMobile,
    isTablet,
    isDesktop: !isMobile && !isTablet,
    isTouch,
  }
}

/**
 * Check if request is from mobile subdomain
 */
export function isMobileSubdomain(hostname: string): boolean {
  return hostname.startsWith('m.')
}

/**
 * Get device info from NextRequest (server component / middleware)
 */
export function getDeviceFromRequest(request: { headers: Headers; nextUrl: { hostname: string } }): DeviceInfo & { isMobileSubdomain: boolean } {
  const ua = request.headers.get('user-agent') || ''
  const device = detectDevice(ua)
  return {
    ...device,
    isMobileSubdomain: isMobileSubdomain(request.nextUrl.hostname),
  }
}

/**
 * Client-side device detection hook
 * Returns device info with SSR-safe defaults
 */
export function useDevice(): DeviceInfo {
  if (typeof window === 'undefined') {
    return { isMobile: false, isTablet: false, isDesktop: true, isTouch: false }
  }

  const ua = navigator.userAgent
  return detectDevice(ua)
}

/**
 * Simple touch device check for mobile optimizations
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}
