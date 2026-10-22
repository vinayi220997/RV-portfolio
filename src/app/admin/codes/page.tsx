import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { CodesManager } from '@/components/admin/codes-manager'

export const dynamic = 'force-dynamic'

export default async function CodesPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/admin/login')
  const items = await db.adminCode.findMany({ orderBy: { createdAt: 'desc' } })
  return (
    <CodesManager
      items={items.map((c) => ({
        id: c.id,
        code: c.code,
        label: c.label,
        isActive: c.isActive,
        isReserved: c.isReserved,
        createdAt: c.createdAt.toISOString(),
        lastUsedAt: c.lastUsedAt?.toISOString() || null,
      }))}
    />
  )
}
