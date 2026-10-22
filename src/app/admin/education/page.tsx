import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { ContentListPage } from '@/components/admin/content-list'

export const dynamic = 'force-dynamic'

export default async function EducationListPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/admin/login')
  const items = await db.education.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'desc' }] })
  return (
    <ContentListPage
      title="Education"
      description="Manage education entries."
      items={items.map((i) => ({ id: i.id, title: i.qualification, subtitle: i.institution, status: i.status, order: i.order }))}
      newHref="/admin/education/new"
      editHrefPrefix="/admin/education"
      apiBase="/api/admin/education"
    />
  )
}
