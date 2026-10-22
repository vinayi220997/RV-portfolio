import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { audit } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({
  code: z.string().min(2).max(80),
})

// Public endpoint. Validates that the access code exists and is active.
// CRITICAL: this is a route selector only. It never authenticates the user.
// Real authentication happens server-side at /api/auth/login.
export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Code not existed' }, { status: 400 })
  }

  const code = parsed.data.code.trim()
  if (!code.startsWith('#')) {
    return NextResponse.json({ error: 'Code not existed' }, { status: 400 })
  }

  const record = await db.adminCode.findUnique({ where: { code } })

  if (!record || !record.isActive) {
    await audit({
      action: 'access_code_rejected',
      category: 'security',
      summary: `Unknown or inactive access code attempted: ${code}`,
    })
    return NextResponse.json({ error: 'Code not existed' }, { status: 404 })
  }

  // Update last used timestamp
  await db.adminCode.update({
    where: { id: record.id },
    data: { lastUsedAt: new Date() },
  })

  await audit({
    action: 'access_code_accepted',
    category: 'security',
    summary: `Access code accepted: ${code} (${record.label})`,
    metadata: { codeId: record.id, label: record.label },
  })

  // Route to login — never auto-bypass authentication
  return NextResponse.json({
    ok: true,
    route: '/admin/login',
    label: record.label,
  })
}
