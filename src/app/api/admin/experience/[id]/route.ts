import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, audit } from '@/lib/auth'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const patchSchema = z.object({
  company: z.string().min(1).max(160).optional(),
  role: z.string().min(1).max(160).optional(),
  location: z.string().max(160).optional().or(z.literal('')),
  startDate: z.string().min(1).max(40).optional(),
  endDate: z.string().max(40).optional().or(z.literal('')),
  description: z.string().max(2000).optional().or(z.literal('')),
  achievements: z.array(z.string()).optional(),
  technologies: z.array(z.string()).optional(),
  order: z.number().int().optional(),
  status: z.enum(['draft', 'published', 'hidden', 'archived']).optional(),
})

interface Params { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const item = await db.experience.findUnique({ where: { id } })
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
  if ('location' in data) data.location = data.location || null
  if ('endDate' in data) data.endDate = data.endDate || null
  if ('description' in data) data.description = data.description || null
  const item = await db.experience.update({ where: { id }, data })
  await audit({ action: 'experience_updated', category: 'content', summary: `Updated experience: ${item.role} at ${item.company}`, metadata: { id: item.id, fields: Object.keys(data) } })
  return NextResponse.json({ item })
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const item = await db.experience.delete({ where: { id } })
  await audit({ action: 'experience_deleted', category: 'content', summary: `Deleted experience: ${item.role} at ${item.company}`, metadata: { id } })
  return NextResponse.json({ ok: true })
}
