import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    // Get client IP address
    const forwardedFor = request.headers.get('x-forwarded-for')
    const ip = forwardedFor?.split(',')[0].trim() || 
               request.headers.get('x-real-ip') || 
               '127.0.0.1'

    // For now, return a default based on common patterns
    // In production, you would call an IP geolocation service
    // For demo purposes, we'll return US (imperial) for most IPs
    // and try to detect if it's likely from a metric country
    
    // Simple heuristic: if IP looks like it might be from Europe/Asia, use metric
    // This is just a placeholder - in reality you'd use a proper geo IP service
    const isLikelyMetric = ip.startsWith('10.') || 
                          ip.startsWith('192.168.') || 
                          ip.startsWith('172.16.') ||
                          ip.startsWith('192.168.') ||
                          // Common private ranges - assume metric for internal IPs
                          false // Default to imperial for safety
    
    // For this implementation, we'll default to imperial (lb) 
    // but allow override via query parameter for testing
    const { searchParams } = new URL(request.url)
    const forceUnit = searchParams.get('unit') as 'lb' | 'kg' | null
    
    const unit = forceUnit || (isLikelyMetric ? 'kg' : 'lb')
    
    return NextResponse.json({
      ip,
      unit, // 'lb' or 'kg'
      system: unit === 'lb' ? 'imperial' : 'metric',
      // Note: In a real implementation, you would use a service like:
      // - ipapi.co
      // - ipinfo.io
      // - maxmind
      // - etc.
    })
  } catch (error) {
    console.error('IP geolocation error:', error)
    // Default to imperial (lb) for safety with dosage calculations
    return NextResponse.json({
      ip: 'unknown',
      unit: 'lb',
      system: 'imperial'
    })
  }
}