import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, audit } from '@/lib/auth'
import { backupDir, safeFileName } from '@/lib/storage'
import { encrypt, sha256 } from '@/lib/crypto'
import { encodeContent } from '@/lib/crypto'
import { promises as fsp } from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

// Create an encrypted backup of all portfolio content (not private files).
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

  const [
    profile, settings, experience, projects, skills, education, certifications,
    socialLinks, messages, codes, templates, resumes, auditLog, publications,
  ] = await Promise.all([
    db.profile.findUnique({ where: { id: 'singleton' } }),
    db.siteSetting.findUnique({ where: { id: 'singleton' } }),
    db.experience.findMany(),
    db.project.findMany(),
    db.skill.findMany(),
    db.education.findMany(),
    db.certification.findMany(),
    db.socialLink.findMany(),
    db.contactMessage.findMany(),
    db.adminCode.findMany(),
    db.emailTemplate.findMany(),
    db.resumeVersion.findMany({ select: { id: true, versionLabel: true, filename: true, mimeType: true, fileSize: true, notes: true, isPublished: true, publicUrl: true, uploadedAt: true } }),
    db.auditLog.findMany(),
    db.publicationEvent.findMany(),
  ])

  const snapshot = {
    version: 1,
    createdAt: new Date().toISOString(),
    createdBy: user.loginId,
    profile,
    settings,
    experience,
    projects,
    skills,
    education,
    certifications,
    socialLinks,
    messages,
    codes,
    templates,
    resumes,
    auditLog,
    publications,
  }

  const encoded = encodeContent(snapshot)
  const buf = Buffer.from(encoded, 'utf8')
  const encrypted = encrypt(buf)
  const checksum = sha256(buf)
  const filename = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.enc`
  const fullPath = path.join(backupDir(), filename)
  await fsp.writeFile(fullPath, encrypted)

  const item = await db.backup.create({
    data: {
      filename,
      fileSize: encrypted.length,
      storagePath: fullPath,
      checksum,
      createdBy: user.loginId,
    },
  })
  await audit({ action: 'backup_created', category: 'backup', summary: `Created encrypted backup: ${filename}`, ipAddress: ip, metadata: { id: item.id, size: encrypted.length, checksum } })
  return NextResponse.json({ item })
}

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const items = await db.backup.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ items })
}
