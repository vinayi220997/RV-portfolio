import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { ContentEditor } from '@/components/admin/content-editor'

export const dynamic = 'force-dynamic'

export default async function CertNewPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/admin/login')
  return (
    <ContentEditor
      apiBase="/api/admin/certifications"
      backHref="/admin/certifications"
      title="New certification"
      description="Add a certification or workshop."
      fields={[
        { key: 'name', label: 'Name', type: 'text', required: true },
        { key: 'issuer', label: 'Issuer', type: 'text' },
        { key: 'date', label: 'Date', type: 'text', placeholder: '2024' },
        { key: 'credentialUrl', label: 'Credential URL', type: 'text' },
      ]}
    />
  )
}
