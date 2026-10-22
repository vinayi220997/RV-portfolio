import { NextRequest, NextResponse } from 'next/server'
import { changeCredentials, getCurrentUser } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({
  currentPassword: z.string().min(1).max(200),
  newLoginId: z.string().min(3).max(80).optional(),
  newPassword: z.string().min(10).max(200).optional(),
})

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid input' }, { status: 400 })
  }

  const result = await changeCredentials({
    userId: user.id,
    currentPassword: parsed.data.currentPassword,
    newLoginId: parsed.data.newLoginId,
    newPassword: parsed.data.newPassword,
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: 400 })
  }
  return NextResponse.json({ ok: true, message: result.message })
}
