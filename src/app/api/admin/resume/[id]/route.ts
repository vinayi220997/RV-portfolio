import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, audit } from '@/lib/auth'
import { readPrivateFile, writePublicUpload, safeFileName, publicUploadsDir } from '@/lib/storage'
import { decrypt, encrypt } from '@/lib/crypto'
import { promises as fsp } from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

interface Params { params: Promise<{ id: string }> }

// Download original — admin-only. Returns decrypted file content.
export async function GET(req: NextRequest, { params }: Params) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const item = await db.resumeVersion.findUnique({ where: { id } })
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!item.storagePath) return NextResponse.json({ error: 'Missing file' }, { status: 404 })

  try {
    const encrypted = await fsp.readFile(item.storagePath)
    const buf = decrypt(encrypted)
    await audit({ action: 'resume_downloaded', category: 'file', summary: `Downloaded private resume version: ${item.versionLabel}`, metadata: { id: item.id } })
    return new NextResponse(buf, {
      headers: {
        'Content-Type': item.mimeType,
        'Content-Disposition': `attachment; filename="${item.filename}"`,
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to read file' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const item = await db.resumeVersion.findUnique({ where: { id } })
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // If this was published, remove the public copy
  if (item.isPublished && item.publicUrl) {
    try {
      const publicPath = path.join(publicUploadsDir(), path.basename(item.publicUrl))
      await fsp.unlink(publicPath)
    } catch {}
  }
  // Remove private encrypted file
  try {
    await fsp.unlink(item.storagePath)
  } catch {}

  await db.resumeVersion.delete({ where: { id } })
  await audit({ action: 'resume_deleted', category: 'file', summary: `Deleted resume version: ${item.versionLabel}`, metadata: { id } })
  return NextResponse.json({ ok: true })
}
