import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, audit } from '@/lib/auth'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const patchSchema = z.object({
  platform: z.string().min(1).max(80).optional(),
  url: z.string().min(1).max(500).optional(),
  icon: z.string().max(60).optional().or(z.literal('')),
  label: z.string().max(80).optional().or(z.literal('')),
  order: z.number().int().optional(),
  status: z.enum(['draft', 'published', 'hidden', 'archived']).optional(),
})

interface Params { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const item = await db.socialLink.findUnique({ where: { id } })
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ item })
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid' }, { status: 400 })
  }
  const data: any = { ...parsed.data }
  for (const f of ['icon', 'label']) {
    if (f in data) data[f] = data[f] || null
  }
  const item = await db.socialLink.update({ where: { id }, data })
  await audit({ action: 'social_link_updated', category: 'content', summary: `Updated social link: ${item.platform}`, metadata: { id, fields: Object.keys(data) } })
  return NextResponse.json({ item })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const item = await db.socialLink.delete({ where: { id } })
  await audit({ action: 'social_link_deleted', category: 'content', summary: `Deleted social link: ${item.platform}`, metadata: { id } })
  return NextResponse.json({ ok: true })
}
