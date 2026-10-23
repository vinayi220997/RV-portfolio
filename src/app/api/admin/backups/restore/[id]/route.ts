import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, audit } from '@/lib/auth'
import { decrypt, decodeContent } from '@/lib/crypto'
import { promises as fsp } from 'fs'

export const dynamic = 'force-dynamic'

// Restore: decrypt + apply backup to the database.
// Destructive operation — requires explicit user confirmation (already done in UI).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const item = await db.backup.findUnique({ where: { id } })
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

  try {
    const encrypted = await fsp.readFile(item.storagePath)
    const buf = decrypt(encrypted)
    const encoded = buf.toString('utf8')
    const snapshot = decodeContent(encoded) as any

    // Apply snapshot — replace tables
    if (snapshot.profile) {
      await db.profile.upsert({
        where: { id: 'singleton' },
        create: { id: 'singleton', ...snapshot.profile, createdAt: undefined, updatedAt: undefined },
        update: { ...snapshot.profile, createdAt: undefined, updatedAt: undefined },
      })
    }
    if (snapshot.settings) {
      await db.siteSetting.upsert({
        where: { id: 'singleton' },
        create: { id: 'singleton', ...snapshot.settings, createdAt: undefined, updatedAt: undefined },
        update: { ...snapshot.settings, createdAt: undefined, updatedAt: undefined },
      })
    }
    for (const table of ['experience', 'project', 'skill', 'education', 'certification', 'socialLink', 'contactMessage', 'adminCode', 'emailTemplate', 'auditLog', 'publicationEvent'] as const) {
      const data = snapshot[table] || snapshot[capitalize(table)] || []
      if (!Array.isArray(data)) continue
      await (db as any)[table].deleteMany({})
      for (const row of data) {
        try {
          await (db as any)[table].create({ data: { ...row, createdAt: row.createdAt ? new Date(row.createdAt) : undefined, updatedAt: row.updatedAt ? new Date(row.updatedAt) : undefined, uploadedAt: row.uploadedAt ? new Date(row.uploadedAt) : undefined } })
        } catch (e) {
          // skip rows that fail validation
        }
      }
    }

    await audit({ action: 'backup_restored', category: 'backup', summary: `Restored backup: ${item.filename}`, ipAddress: ip, metadata: { id: item.id } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Restore failed' }, { status: 500 })
  }
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
