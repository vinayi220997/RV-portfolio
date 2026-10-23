import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, audit } from '@/lib/auth'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const patchSchema = z.object({
  title: z.string().min(1).max(160).optional(),
  slug: z.string().min(1).max(160).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().min(1).max(500).optional(),
  longDescription: z.string().max(5000).optional().or(z.literal('')),
  role: z.string().max(160).optional().or(z.literal('')),
  technologies: z.array(z.string()).optional(),
  imageUrl: z.string().max(500).optional().or(z.literal('')),
  liveUrl: z.string().max(500).optional().or(z.literal('')),
  sourceUrl: z.string().max(500).optional().or(z.literal('')),
  category: z.string().max(120).optional().or(z.literal('')),
  isFeatured: z.boolean().optional(),
  startDate: z.string().max(20).optional().or(z.literal('')),
  endDate: z.string().max(20).optional().or(z.literal('')),
  order: z.number().int().optional(),
  status: z.enum(['draft', 'published', 'hidden', 'archived']).optional(),
})

interface Params { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const item = await db.project.findUnique({ where: { id } })
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
  for (const f of ['longDescription', 'role', 'imageUrl', 'liveUrl', 'sourceUrl', 'category', 'startDate', 'endDate']) {
    if (f in data) data[f] = data[f] || null
  }
  if (parsed.data.slug) {
    const existing = await db.project.findFirst({ where: { slug: parsed.data.slug, NOT: { id } } })
    if (existing) return NextResponse.json({ error: 'Slug already in use' }, { status: 400 })
  }
  const item = await db.project.update({ where: { id }, data })
  await audit({ action: 'project_updated', category: 'content', summary: `Updated project: ${item.title}`, metadata: { id: item.id, fields: Object.keys(data) } })
  return NextResponse.json({ item })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const item = await db.project.delete({ where: { id } })
  await audit({ action: 'project_deleted', category: 'content', summary: `Deleted project: ${item.title}`, metadata: { id } })
  return NextResponse.json({ ok: true })
}
