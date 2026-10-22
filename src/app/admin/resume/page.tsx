import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { ResumeManager } from '@/components/admin/resume-manager'

export const dynamic = 'force-dynamic'

export default async function ResumePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/admin/login')
  const items = await db.resumeVersion.findMany({ orderBy: { uploadedAt: 'desc' } })
  return (
    <ResumeManager
      items={items.map((v) => ({
        id: v.id,
        versionLabel: v.versionLabel,
        filename: v.filename,
        mimeType: v.mimeType,
        fileSize: v.fileSize,
        notes: v.notes,
        isPublished: v.isPublished,
        publicUrl: v.publicUrl,
        uploadedAt: v.uploadedAt.toISOString(),
      }))}
    />
  )
}
