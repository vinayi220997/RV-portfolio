import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, audit } from '@/lib/auth'
import { publicUploadsDir } from '@/lib/storage'
import { promises as fsp } from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

// Unpublish: remove the public copy. The private original stays untouched.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const item = await db.resumeVersion.findUnique({ where: { id } })
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!item.isPublished) return NextResponse.json({ ok: true, message: 'Already unpublished' })

  if (item.publicUrl) {
    try {
      await fsp.unlink(path.join(publicUploadsDir(), path.basename(item.publicUrl)))
    } catch {}
  }
  await db.resumeVersion.update({
    where: { id },
    data: { isPublished: false, publicUrl: null },
  })
  // Clear profile's public resume URL if it pointed to this version
  const profile = await db.profile.findUnique({ where: { id: 'singleton' } })
  if (profile?.resumePublicUrl === item.publicUrl) {
    await db.profile.update({ where: { id: 'singleton' }, data: { resumePublicUrl: null } })
  }

  await audit({ action: 'resume_unpublished', category: 'file', summary: `Unpublished resume version: ${item.versionLabel}`, metadata: { id } })
  return NextResponse.json({ ok: true })
}
