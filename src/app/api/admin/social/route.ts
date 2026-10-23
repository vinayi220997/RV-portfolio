import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, audit } from '@/lib/auth'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const createSchema = z.object({
  platform: z.string().min(1).max(80),
  url: z.string().min(1).max(500),
  icon: z.string().max(60).optional().or(z.literal('')),
  label: z.string().max(80).optional().or(z.literal('')),
  order: z.number().int().optional(),
  status: z.enum(['draft', 'published', 'hidden', 'archived']).optional(),
})

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const items = await db.socialLink.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'desc' }] })
  return NextResponse.json({ items })
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid' }, { status: 400 })
  }
  const maxOrder = await db.socialLink.aggregate({ _max: { order: true } })
  const item = await db.socialLink.create({
    data: {
      platform: parsed.data.platform,
      url: parsed.data.url,
      icon: parsed.data.icon || null,
      label: parsed.data.label || null,
      order: parsed.data.order ?? (maxOrder._max.order ?? -1) + 1,
      status: parsed.data.status || 'draft',
    },
  })
  await audit({ action: 'social_link_created', category: 'content', summary: `Created social link: ${item.platform}`, metadata: { id: item.id } })
  return NextResponse.json({ item })
}
