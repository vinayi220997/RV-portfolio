import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { BackupsManager } from '@/components/admin/backups-manager'

export const dynamic = 'force-dynamic'

export default async function BackupsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/admin/login')
  const items = await db.backup.findMany({ orderBy: { createdAt: 'desc' } })
  return (
    <BackupsManager
      items={items.map((b) => ({
        id: b.id,
        filename: b.filename,
        fileSize: b.fileSize,
        checksum: b.checksum,
        createdAt: b.createdAt.toISOString(),
        createdBy: b.createdBy,
      }))}
    />
  )
}
