import { NextRequest, NextResponse } from 'next/server'
import { verifyRecoveryCode, audit } from '@/lib/auth'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const schema = z.object({
  action: z.enum(['verify', 'queue']),
  code: z.string().min(2).max(80),
})

export async function POST(req: NextRequest) {
  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid input' }, { status: 400 })
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const ua = req.headers.get('user-agent') || null

  const result = await verifyRecoveryCode(parsed.data.code, ip)
  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: 400 })
  }

  if (parsed.data.action === 'queue' && result.kind === 'recovery') {
    // Record the queued recovery event in audit log
    await audit({
      action: 'recovery_request_queued',
      category: 'security',
      summary: `Recovery request queued via code: ${parsed.data.code}`,
      ipAddress: ip,
      userAgent: ua,
      metadata: { code: parsed.data.code },
    })
    return NextResponse.json({
      ok: true,
      message: 'Recovery request queued. The operator will be notified.',
    })
  }

  // For 'verify' action (default) — return the result with kind + oneTimeToken
  return NextResponse.json({
    ok: true,
    message: result.message,
    kind: result.kind,
    oneTimeToken: result.oneTimeToken,
  })
}
