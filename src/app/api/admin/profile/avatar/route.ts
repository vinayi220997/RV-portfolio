import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, audit } from '@/lib/auth'
import { writePublicUpload, safeFileName } from '@/lib/storage'
import { promises as fsp } from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

const MAX_FILE = 5 * 1024 * 1024 // 5 MB

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const form = await req.formData()
  const file = form.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    return NextResponse.json({ error: 'Only JPG, PNG, and WebP images are supported' }, { status: 400 })
  }
  if (file.size > MAX_FILE) {
    return NextResponse.json({ error: 'Image must be under 5 MB' }, { status: 400 })
  }

  const buf = Buffer.from(await file.arrayBuffer())
  const ext = file.type === 'image/jpeg' ? '.jpg' : file.type === 'image/png' ? '.png' : '.webp'
  const safe = safeFileName('avatar' + ext)
  const fullPath = await writePublicUpload(safe, buf)

  // The public URL is /uploads/public/<filename>
  const publicUrl = `/uploads/public/${safe}`
  // Update the profile's avatarUrl
  await db.profile.update({
    where: { id: 'singleton' },
    data: { avatarUrl: publicUrl },
  })

  await audit({
    action: 'profile_image_uploaded',
    category: 'file',
    summary: `Profile image uploaded: ${safe}`,
    metadata: { url: publicUrl, size: buf.length },
  })
  return NextResponse.json({ ok: true, url: publicUrl })
}
