import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, audit } from '@/lib/auth'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const createSchema = z.object({
  institution: z.string().min(1).max(160),
  qualification: z.string().min(1).max(160),
  field: z.string().max(160).optional().or(z.literal('')),
  startDate: z.string().min(1).max(40),
  endDate: z.string().max(40).optional().or(z.literal('')),
  description: z.string().max(2000).optional().or(z.literal('')),
  credentialUrl: z.string().max(500).optional().or(z.literal('')),
  order: z.number().int().optional(),
  status: z.enum(['draft', 'published', 'hidden', 'archived']).optional(),
})

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const items = await db.education.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'desc' }] })
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
  const maxOrder = await db.education.aggregate({ _max: { order: true } })
  const item = await db.education.create({
    data: {
      institution: parsed.data.institution,
      qualification: parsed.data.qualification,
      field: parsed.data.field || null,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate || null,
      description: parsed.data.description || null,
      credentialUrl: parsed.data.credentialUrl || null,
      order: parsed.data.order ?? (maxOrder._max.order ?? -1) + 1,
      status: parsed.data.status || 'draft',
    },
  })
  await audit({ action: 'education_created', category: 'content', summary: `Created education: ${item.qualification} at ${item.institution}`, metadata: { id: item.id } })
  return NextResponse.json({ item })
}
