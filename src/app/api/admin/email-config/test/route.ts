import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, audit } from '@/lib/auth'
import { testEmailConfig } from '@/lib/email'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const schema = z.object({
  emailAddress: z.string().email(),
  appPassword: z.string().min(16).max(64),
})

// Test SMTP connection before saving. Does NOT persist anything.
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
  const cleanedPwd = parsed.data.appPassword.replace(/\s/g, '')
  if (cleanedPwd.length !== 16) {
    return NextResponse.json({ error: 'Google App Passwords are 16 characters. Please check your input.' }, { status: 400 })
  }
  const result = await testEmailConfig(parsed.data.emailAddress, cleanedPwd)
  if (!result.ok) {
    await audit({
      action: 'email_config_test_failed',
      category: 'email',
      summary: `SMTP test failed for ${parsed.data.emailAddress}: ${result.error}`,
      metadata: { emailAddress: parsed.data.emailAddress },
    })
    return NextResponse.json({ error: result.error || 'Connection test failed. Verify the App Password and that 2FA is enabled on your Google account.' }, { status: 400 })
  }
  return NextResponse.json({ ok: true, message: 'SMTP connection verified successfully.' })
}
