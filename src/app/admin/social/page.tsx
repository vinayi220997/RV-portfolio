import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { ContentListPage } from '@/components/admin/content-list'

export const dynamic = 'force-dynamic'

export default async function SocialListPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/admin/login')
  const items = await db.socialLink.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'desc' }] })
  return (
    <ContentListPage
      title="Social Links"
      description="Manage professional social and contact links."
      items={items.map((i) => ({ id: i.id, title: i.platform, subtitle: i.url, status: i.status, order: i.order }))}
      newHref="/admin/social/new"
      editHrefPrefix="/admin/social"
      apiBase="/api/admin/social"
    />
  )
}
