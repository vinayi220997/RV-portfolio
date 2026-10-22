import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { ContentEditor } from '@/components/admin/content-editor'

export const dynamic = 'force-dynamic'

export default async function EducationEditPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) redirect('/admin/login')
  const { id } = await params
  const item = await db.education.findUnique({ where: { id } })
  if (!item) redirect('/admin/education')

  return (
    <ContentEditor
      apiBase="/api/admin/education"
      backHref="/admin/education"
      title="Edit education"
      description={item.qualification}
      itemId={item.id}
      fields={[
        { key: 'institution', label: 'Institution', type: 'text', required: true },
        { key: 'qualification', label: 'Qualification', type: 'text', required: true, placeholder: 'BTech, MSc…' },
        { key: 'field', label: 'Field of study', type: 'text' },
        { key: 'startDate', label: 'Start date', type: 'text', required: true, placeholder: '2016' },
        { key: 'endDate', label: 'End date', type: 'text', placeholder: '2021' },
        { key: 'description', label: 'Description', type: 'textarea', rows: 3 },
        { key: 'credentialUrl', label: 'Credential URL', type: 'text' },
      ]}
      initial={{
        institution: item.institution,
        qualification: item.qualification,
        field: item.field || '',
        startDate: item.startDate,
        endDate: item.endDate || '',
        description: item.description || '',
        credentialUrl: item.credentialUrl || '',
        status: item.status,
      }}
    />
  )
}
