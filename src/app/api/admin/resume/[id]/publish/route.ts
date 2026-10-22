import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, audit } from '@/lib/auth'
import { readPrivateFile, writePublicUpload, safeFileName, publicUploadsDir } from '@/lib/storage'
import { decrypt, encrypt } from '@/lib/crypto'
import { promises as fsp } from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

// Publish a private resume version → creates a separate public copy in public/uploads.
// The original remains private; only the public copy is exposed at the public URL.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const item = await db.resumeVersion.findUnique({ where: { id } })
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Decrypt private file
  const encrypted = await fsp.readFile(item.storagePath)
  const buf = decrypt(encrypted)

  // Write to public uploads (inside /public so it's servable)
  const publicName = safeFileName(item.filename).replace(/\.pdf$/, '') + '-' + Date.now() + '.pdf'
  const publicPath = path.join(publicUploadsDir(), publicName)
  await fsp.writeFile(publicPath, buf)

  // If a previous public copy exists, remove it
  if (item.publicUrl) {
    try {
      const prev = path.join(publicUploadsDir(), path.basename(item.publicUrl))
      await fsp.unlink(prev)
    } catch {}
  }

  const publicUrl = `/uploads/public/${publicName}`
  await db.resumeVersion.update({
    where: { id },
    data: { isPublished: true, publicUrl },
  })
  // Update profile's resumePublicUrl to point to the latest published version
  await db.profile.update({
    where: { id: 'singleton' },
    data: { resumePublicUrl: publicUrl },
  })

  await audit({ action: 'resume_published', category: 'file', summary: `Published resume version: ${item.versionLabel} → ${publicUrl}`, metadata: { id, publicUrl } })
  return NextResponse.json({ ok: true, publicUrl })
}
