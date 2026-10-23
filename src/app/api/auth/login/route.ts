import { NextRequest, NextResponse } from 'next/server'
import { attemptLogin } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({
  loginId: z.string().min(1).max(80),
  password: z.string().min(1).max(200),
})

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Incorrect ID or password' }, { status: 400 })
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const ua = req.headers.get('user-agent') || null

  const result = await attemptLogin(parsed.data.loginId.trim(), parsed.data.password, ip, ua)

  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: 401 })
  }

  return NextResponse.json({
    ok: true,
    message: result.message,
    mustChangePwd: result.mustChangePwd || false,
  })
}
