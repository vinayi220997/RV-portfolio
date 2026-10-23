import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { ContentEditor } from '@/components/admin/content-editor'

export const dynamic = 'force-dynamic'

export default async function SocialEditPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) redirect('/admin/login')
  const { id } = await params
  const item = await db.socialLink.findUnique({ where: { id } })
  if (!item) redirect('/admin/social')

  return (
    <ContentEditor
      apiBase="/api/admin/social"
      backHref="/admin/social"
      title="Edit social link"
      description={item.platform}
      itemId={item.id}
      fields={[
        { key: 'platform', label: 'Platform', type: 'text', required: true, placeholder: 'LinkedIn, GitHub, Email…' },
        { key: 'url', label: 'URL', type: 'text', required: true, placeholder: 'https://…' },
        { key: 'label', label: 'Display label', type: 'text' },
        { key: 'icon', label: 'Icon key', type: 'text', placeholder: 'linkedin, github, mail…' },
      ]}
      initial={{
        platform: item.platform,
        url: item.url,
        label: item.label || '',
        icon: item.icon || '',
        status: item.status,
      }}
    />
  )
}
