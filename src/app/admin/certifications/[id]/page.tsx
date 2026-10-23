import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { ContentEditor } from '@/components/admin/content-editor'

export const dynamic = 'force-dynamic'

export default async function CertEditPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) redirect('/admin/login')
  const { id } = await params
  const item = await db.certification.findUnique({ where: { id } })
  if (!item) redirect('/admin/certifications')

  return (
    <ContentEditor
      apiBase="/api/admin/certifications"
      backHref="/admin/certifications"
      title="Edit certification"
      description={item.name}
      itemId={item.id}
      fields={[
        { key: 'name', label: 'Name', type: 'text', required: true },
        { key: 'issuer', label: 'Issuer', type: 'text' },
        { key: 'date', label: 'Date', type: 'text', placeholder: '2024' },
        { key: 'credentialUrl', label: 'Credential URL', type: 'text' },
      ]}
      initial={{
        name: item.name,
        issuer: item.issuer || '',
        date: item.date || '',
        credentialUrl: item.credentialUrl || '',
        status: item.status,
      }}
    />
  )
}
