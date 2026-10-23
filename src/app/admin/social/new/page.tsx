import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { ContentEditor } from '@/components/admin/content-editor'

export const dynamic = 'force-dynamic'

export default async function SocialNewPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/admin/login')
  return (
    <ContentEditor
      apiBase="/api/admin/social"
      backHref="/admin/social"
      title="New social link"
      description="Add a professional or social profile link."
      fields={[
        { key: 'platform', label: 'Platform', type: 'text', required: true, placeholder: 'LinkedIn, GitHub, Email…' },
        { key: 'url', label: 'URL', type: 'text', required: true, placeholder: 'https://…' },
        { key: 'label', label: 'Display label', type: 'text' },
        { key: 'icon', label: 'Icon key', type: 'text', placeholder: 'linkedin, github, mail…' },
      ]}
    />
  )
}
