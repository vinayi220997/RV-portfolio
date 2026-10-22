import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, audit } from '@/lib/auth'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const createSchema = z.object({
  company: z.string().min(1).max(160),
  role: z.string().min(1).max(160),
  location: z.string().max(160).optional().or(z.literal('')),
  startDate: z.string().min(1).max(40),
  endDate: z.string().max(40).optional().or(z.literal('')),
  description: z.string().max(2000).optional().or(z.literal('')),
  achievements: z.array(z.string()).optional(),
  technologies: z.array(z.string()).optional(),
  order: z.number().int().optional(),
  status: z.enum(['draft', 'published', 'hidden', 'archived']).optional(),
})

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const items = await db.experience.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'desc' }] })
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
  const maxOrder = await db.experience.aggregate({ _max: { order: true } })
  const item = await db.experience.create({
    data: {
      company: parsed.data.company,
      role: parsed.data.role,
      location: parsed.data.location || null,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate || null,
      description: parsed.data.description || null,
      achievements: parsed.data.achievements || [],
      technologies: parsed.data.technologies || [],
      order: parsed.data.order ?? (maxOrder._max.order ?? -1) + 1,
      status: parsed.data.status || 'draft',
    },
  })
  await audit({ action: 'experience_created', category: 'content', summary: `Created experience: ${item.role} at ${item.company}`, metadata: { id: item.id } })
  return NextResponse.json({ item })
}
