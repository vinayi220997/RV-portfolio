import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { ContentListPage } from '@/components/admin/content-list'

export const dynamic = 'force-dynamic'

export default async function SkillsListPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/admin/login')
  const items = await db.skill.findMany({ orderBy: [{ order: 'asc' }, { name: 'asc' }] })
  return (
    <ContentListPage
      title="Skills"
      description="Manage skills grouped by category."
      items={items.map((i) => ({ id: i.id, title: i.name, subtitle: i.category, status: i.status, order: i.order }))}
      newHref="/admin/skills/new"
      editHrefPrefix="/admin/skills"
      apiBase="/api/admin/skills"
    />
  )
}
