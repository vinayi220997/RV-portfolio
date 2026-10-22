import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, audit } from '@/lib/auth'
import { writePrivateUpload, safeFileName, publicUploadsDir } from '@/lib/storage'
import { sha256, encrypt } from '@/lib/crypto'
import { promises as fsp } from 'fs'
import path from 'path'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const MAX_FILE = 10 * 1024 * 1024 // 10 MB

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const items = await db.resumeVersion.findMany({ orderBy: { uploadedAt: 'desc' } })
  return NextResponse.json({ items })
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const form = await req.formData()
  const file = form.get('file') as File | null
  const label = (form.get('label') as string) || 'New version'
  const notes = (form.get('notes') as string) || ''

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (file.type !== 'application/pdf') return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 })
  if (file.size > MAX_FILE) return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })

  const buf = Buffer.from(await file.arrayBuffer())
  const safe = safeFileName(file.name)
  // Store encrypted at rest in private uploads
  const encrypted = encrypt(buf)
  const stored = await writePrivateUpload(safe + '.enc', encrypted)
  const checksum = sha256(buf)

  const item = await db.resumeVersion.create({
    data: {
      versionLabel: label.trim(),
      filename: file.name,
      mimeType: file.type,
      fileSize: buf.length,
      storagePath: stored,
      notes: notes.trim() || null,
      isPublished: false,
      publicUrl: null,
    },
  })
  await audit({ action: 'resume_uploaded', category: 'file', summary: `Uploaded private resume version: ${label}`, metadata: { id: item.id, filename: item.filename, size: buf.length, checksum } })
  return NextResponse.json({ item })
}
