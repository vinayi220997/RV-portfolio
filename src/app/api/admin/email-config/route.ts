import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, audit } from '@/lib/auth'
import { getPublicEmailConfig, saveEmailConfig, deleteEmailConfig, testEmailConfig } from '@/lib/email'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const patchSchema = z.object({
  action: z.enum(['save', 'disconnect']),
  emailAddress: z.string().email().optional(),
  appPassword: z.string().min(16).max(64).optional(),
  displayName: z.string().max(120).optional().or(z.literal('')),
})

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const cfg = await getPublicEmailConfig()
  return NextResponse.json({ config: cfg })
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid input' }, { status: 400 })
  }

  if (parsed.data.action === 'disconnect') {
    await deleteEmailConfig()
    await audit({ action: 'email_config_disconnected', category: 'email', summary: 'Gmail App Password config disconnected', metadata: {} })
    return NextResponse.json({ ok: true })
  }

  // save
  if (!parsed.data.emailAddress || !parsed.data.appPassword) {
    return NextResponse.json({ error: 'Email address and App Password are required' }, { status: 400 })
  }
  // Validate App Password format (16 chars, no spaces typical)
  const cleanedPwd = parsed.data.appPassword.replace(/\s/g, '')
  if (cleanedPwd.length !== 16) {
    return NextResponse.json({ error: 'Google App Passwords are 16 characters. Please check your input.' }, { status: 400 })
  }
  // Test before saving
  const test = await testEmailConfig(parsed.data.emailAddress, cleanedPwd)
  if (!test.ok) {
    await audit({
      action: 'email_config_test_failed',
      category: 'email',
      summary: `SMTP test failed for ${parsed.data.emailAddress}: ${test.error}`,
      metadata: { emailAddress: parsed.data.emailAddress },
    })
    return NextResponse.json({ error: `Connection test failed: ${test.error || 'unknown error'}. The App Password may be incorrect, or 2FA may not be enabled on the Google account.` }, { status: 400 })
  }

  await saveEmailConfig({
    emailAddress: parsed.data.emailAddress,
    appPassword: cleanedPwd,
    displayName: parsed.data.displayName || undefined,
  })
  await audit({
    action: 'email_config_saved',
    category: 'email',
    summary: `Gmail App Password config saved for ${parsed.data.emailAddress}`,
    metadata: { emailAddress: parsed.data.emailAddress },
  })
  return NextResponse.json({ ok: true })
}
