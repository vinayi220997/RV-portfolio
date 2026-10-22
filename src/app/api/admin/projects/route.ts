import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, audit } from '@/lib/auth'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const createSchema = z.object({
  title: z.string().min(1).max(160),
  slug: z.string().min(1).max(160).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens'),
  description: z.string().min(1).max(500),
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

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const items = await db.project.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'desc' }] })
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
  const exists = await db.project.findUnique({ where: { slug: parsed.data.slug } })
  if (exists) return NextResponse.json({ error: 'Slug already in use' }, { status: 400 })
  const maxOrder = await db.project.aggregate({ _max: { order: true } })
  const item = await db.project.create({
    data: {
      title: parsed.data.title,
      slug: parsed.data.slug,
      description: parsed.data.description,
      longDescription: parsed.data.longDescription || null,
      role: parsed.data.role || null,
      technologies: parsed.data.technologies || [],
      imageUrl: parsed.data.imageUrl || null,
      liveUrl: parsed.data.liveUrl || null,
      sourceUrl: parsed.data.sourceUrl || null,
      category: parsed.data.category || null,
      isFeatured: parsed.data.isFeatured ?? false,
      startDate: parsed.data.startDate || null,
      endDate: parsed.data.endDate || null,
      order: parsed.data.order ?? (maxOrder._max.order ?? -1) + 1,
      status: parsed.data.status || 'draft',
    },
  })
  await audit({ action: 'project_created', category: 'content', summary: `Created project: ${item.title}`, metadata: { id: item.id, slug: item.slug } })
  return NextResponse.json({ item })
}
