import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, audit } from '@/lib/auth'
import { promises as fsp } from 'fs'

export const dynamic = 'force-dynamic'

interface Params { params: Promise<{ id: string }> }

// Download backup file (admin-only, encrypted)
export async function GET(_req: NextRequest, { params }: Params) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const item = await db.backup.findUnique({ where: { id } })
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const buf = await fsp.readFile(item.storagePath)
  await audit({ action: 'backup_downloaded', category: 'backup', summary: `Downloaded backup: ${item.filename}`, metadata: { id } })
  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${item.filename}"`,
    },
  })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const item = await db.backup.findUnique({ where: { id } })
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  try {
    await fsp.unlink(item.storagePath)
  } catch {}
  await db.backup.delete({ where: { id } })
  await audit({ action: 'backup_deleted', category: 'backup', summary: `Deleted backup: ${item.filename}`, metadata: { id } })
  return NextResponse.json({ ok: true })
}
