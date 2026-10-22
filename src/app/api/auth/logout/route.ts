import { NextResponse } from 'next/server'
import { destroySession, getCurrentUser, audit } from '@/lib/auth'

export async function POST() {
  const user = await getCurrentUser()
  if (user) {
    await audit({
      action: 'sign_out',
      category: 'auth',
      summary: `Signed out: ${user.loginId}`,
    })
  }
  await destroySession()
  return NextResponse.json({ ok: true })
}
