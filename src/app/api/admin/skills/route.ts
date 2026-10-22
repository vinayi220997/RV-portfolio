import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, audit } from '@/lib/auth'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const createSchema = z.object({
  name: z.string().min(1).max(120),
  category: z.string().min(1).max(120),
  description: z.string().max(2000).optional().or(z.literal('')),
  proficiency: z.string().max(60).optional().or(z.literal('')),
  order: z.number().int().optional(),
  status: z.enum(['draft', 'published', 'hidden', 'archived']).optional(),
})

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const items = await db.skill.findMany({ orderBy: [{ order: 'asc' }, { name: 'asc' }] })
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
  const maxOrder = await db.skill.aggregate({ _max: { order: true } })
  const item = await db.skill.create({
    data: {
      name: parsed.data.name,
      category: parsed.data.category,
      description: parsed.data.description || null,
      proficiency: parsed.data.proficiency || null,
      order: parsed.data.order ?? (maxOrder._max.order ?? -1) + 1,
      status: parsed.data.status || 'draft',
    },
  })
  await audit({ action: 'skill_created', category: 'content', summary: `Created skill: ${item.name}`, metadata: { id: item.id } })
  return NextResponse.json({ item })
}
