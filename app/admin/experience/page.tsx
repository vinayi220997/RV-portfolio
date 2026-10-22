import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { ContentListPage } from '@/components/admin/content-list'

export const dynamic = 'force-dynamic'

export default async function ExperienceListPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/admin/login')
  const items = await db.experience.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'desc' }] })
  return (
    <ContentListPage
      title="Experience"
      description="Manage your work history entries."
      items={items.map((i) => ({ id: i.id, title: i.role, subtitle: `${i.company}${i.startDate ? ` · ${i.startDate}` : ''}`, status: i.status, order: i.order }))}
      newHref="/admin/experience/new"
      editHrefPrefix="/admin/experience"
      apiBase="/api/admin/experience"
    />
  )
}
