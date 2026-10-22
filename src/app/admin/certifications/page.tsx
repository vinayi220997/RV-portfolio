import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { ContentListPage } from '@/components/admin/content-list'

export const dynamic = 'force-dynamic'

export default async function CertificationsListPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/admin/login')
  const items = await db.certification.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'desc' }] })
  return (
    <ContentListPage
      title="Certifications"
      description="Manage certifications and workshops."
      items={items.map((i) => ({ id: i.id, title: i.name, subtitle: i.issuer || undefined, status: i.status, order: i.order }))}
      newHref="/admin/certifications/new"
      editHrefPrefix="/admin/certifications"
      apiBase="/api/admin/certifications"
    />
  )
}
