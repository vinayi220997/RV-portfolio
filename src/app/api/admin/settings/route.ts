import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, audit } from '@/lib/auth'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const schema = z.object({
  siteTitle: z.string().min(1).max(160).optional(),
  siteDescription: z.string().max(500).optional().or(z.literal('')),
  siteUrl: z.string().max(500).optional().or(z.literal('')),
  faviconUrl: z.string().max(500).optional().or(z.literal('')),
  themeAccent: z.string().max(60).optional().or(z.literal('')),
  themeMode: z.enum(['light', 'dark', 'system']).optional(),
  themeSolidColor: z.string().max(80).optional().or(z.literal('')),
  themeGradient: z.string().max(500).optional().or(z.literal('')),
  footerText: z.string().max(500).optional().or(z.literal('')),
})

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const item = await db.siteSetting.findUnique({ where: { id: 'singleton' } })
  return NextResponse.json({ item })
}

export async function PATCH(req: NextRequest) {
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
  const data: any = { ...parsed.data }
  for (const f of ['siteDescription', 'siteUrl', 'faviconUrl', 'themeAccent', 'themeSolidColor', 'themeGradient', 'footerText']) {
    if (f in data) data[f] = data[f] || null
  }
  const item = await db.siteSetting.upsert({
    where: { id: 'singleton' },
    create: { id: 'singleton', siteTitle: data.siteTitle || 'Portfolio', ...data },
    update: data,
  })
  await audit({ action: 'settings_updated', category: 'content', summary: `Site settings updated by ${user.loginId}`, metadata: { fields: Object.keys(data) } })
  return NextResponse.json({ item })
}
