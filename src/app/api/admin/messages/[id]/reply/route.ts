import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, audit } from '@/lib/auth'
import { sendEmail } from '@/lib/email'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const schema = z.object({
  to: z.string().email(),
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(20000),
  replyToMessageId: z.string().optional(),
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
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid' }, { status: 400 })
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

  // Look up the original message (if replying) to use its Reply-To
  let replyTo: string | undefined
  if (parsed.data.replyToMessageId) {
    const orig = await db.contactMessage.findUnique({ where: { id: parsed.data.replyToMessageId } })
    if (orig) replyTo = orig.email
  }

  const result = await sendEmail({
    to: parsed.data.to,
    subject: parsed.data.subject,
    body: parsed.data.body,
    replyTo,
  })

  if (!result.ok) {
    await audit({
      action: 'email_send_failed',
      category: 'email',
      summary: `Email to ${parsed.data.to} failed: ${result.error}`,
      ipAddress: ip,
      metadata: { to: parsed.data.to, subject: parsed.data.subject, method: result.method },
    })
    return NextResponse.json({ error: result.error || 'Email send failed' }, { status: result.method === 'none' ? 503 : 500 })
  }

  if (parsed.data.replyToMessageId) {
    await db.contactMessage.update({
      where: { id: parsed.data.replyToMessageId },
      data: { replyStatus: 'replied' },
    })
  }

  await audit({
    action: 'email_sent',
    category: 'email',
    summary: `Sent email to ${parsed.data.to}: "${parsed.data.subject}" via ${result.method}`,
    ipAddress: ip,
    metadata: { to: parsed.data.to, subject: parsed.data.subject, messageId: result.messageId, method: result.method },
  })
  return NextResponse.json({ ok: true, messageId: result.messageId, method: result.method })
}
