import { NextRequest, NextResponse } from 'next/server'
import { createToken, getAdminCreds } from '@/lib/admin-auth'

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()
    const { username: validUser, password: validPass } = getAdminCreds()

    if (username !== validUser || password !== validPass) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const token = await createToken()

    const res = NextResponse.json({ success: true })
    res.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 86400,
    })
    return res
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
}
