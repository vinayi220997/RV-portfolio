import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, audit } from '@/lib/auth'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const patchSchema = z.object({
  label: z.string().min(1).max(120).optional(),
  isActive: z.boolean().optional(),
})

interface Params { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const item = await db.adminCode.findUnique({ where: { id } })
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

  const existing = await db.adminCode.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Reserved #admin cannot be disabled or renamed
  if (existing.isReserved) {
    if ('isActive' in parsed.data && parsed.data.isActive === false) {
      return NextResponse.json({ error: 'The reserved #admin code cannot be disabled' }, { status: 400 })
    }
    if ('label' in parsed.data) {
      return NextResponse.json({ error: 'The reserved #admin code cannot be renamed' }, { status: 400 })
    }
  }

  const data: any = { ...parsed.data }
  const item = await db.adminCode.update({ where: { id }, data })
  await audit({ action: 'admin_code_updated', category: 'security', summary: `Updated access code: ${item.code}`, metadata: { id, fields: Object.keys(data) } })
  return NextResponse.json({ item })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const existing = await db.adminCode.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.isReserved) {
    return NextResponse.json({ error: 'The reserved #admin code cannot be deleted' }, { status: 400 })
  }
  await db.adminCode.delete({ where: { id } })
  await audit({ action: 'admin_code_deleted', category: 'security', summary: `Deleted access code: ${existing.code}`, metadata: { id } })
  return NextResponse.json({ ok: true })
}
