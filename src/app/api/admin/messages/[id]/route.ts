import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, audit } from '@/lib/auth'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const patchSchema = z.object({
  isRead: z.boolean().optional(),
  isStarred: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  replyStatus: z.string().max(60).optional().or(z.literal('')),
})

interface Params { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const item = await db.contactMessage.findUnique({ where: { id } })
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!item.isRead) {
    await db.contactMessage.update({ where: { id }, data: { isRead: true } })
  }
  return NextResponse.json({ item: { ...item, isRead: true } })
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
  if ('replyStatus' in data) data.replyStatus = data.replyStatus || null
  const item = await db.contactMessage.update({ where: { id }, data })
  await audit({ action: 'message_updated', category: 'message', summary: `Message from ${item.name} updated`, metadata: { id, fields: Object.keys(data) } })
  return NextResponse.json({ item })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const item = await db.contactMessage.delete({ where: { id } })
  await audit({ action: 'message_deleted', category: 'message', summary: `Deleted message from ${item.name}`, metadata: { id } })
  return NextResponse.json({ ok: true })
}
