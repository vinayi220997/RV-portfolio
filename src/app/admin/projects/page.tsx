import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { ContentListPage } from '@/components/admin/content-list'

export const dynamic = 'force-dynamic'

export default async function ProjectsListPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/admin/login')
  const items = await db.project.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'desc' }] })
  return (
    <ContentListPage
      title="Projects"
      description="Manage your portfolio projects."
      items={items.map((i) => ({ id: i.id, title: i.title, subtitle: i.category || undefined, status: i.status, order: i.order }))}
      newHref="/admin/projects/new"
      editHrefPrefix="/admin/projects"
      apiBase="/api/admin/projects"
    />
  )
}
