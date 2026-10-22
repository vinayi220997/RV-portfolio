import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, audit } from '@/lib/auth'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const patchSchema = z.object({
  name: z.string().min(1).max(160).optional(),
  issuer: z.string().max(160).optional().or(z.literal('')),
  date: z.string().max(40).optional().or(z.literal('')),
  credentialUrl: z.string().max(500).optional().or(z.literal('')),
  order: z.number().int().optional(),
  status: z.enum(['draft', 'published', 'hidden', 'archived']).optional(),
})

interface Params { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const item = await db.certification.findUnique({ where: { id } })
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
  for (const f of ['issuer', 'date', 'credentialUrl']) {
    if (f in data) data[f] = data[f] || null
  }
  const item = await db.certification.update({ where: { id }, data })
  await audit({ action: 'certification_updated', category: 'content', summary: `Updated certification: ${item.name}`, metadata: { id, fields: Object.keys(data) } })
  return NextResponse.json({ item })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const item = await db.certification.delete({ where: { id } })
  await audit({ action: 'certification_deleted', category: 'content', summary: `Deleted certification: ${item.name}`, metadata: { id } })
  return NextResponse.json({ ok: true })
}
