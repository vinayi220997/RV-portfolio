import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { ContentEditor } from '@/components/admin/content-editor'

export const dynamic = 'force-dynamic'

export default async function EducationNewPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/admin/login')
  return (
    <ContentEditor
      apiBase="/api/admin/education"
      backHref="/admin/education"
      title="New education"
      description="Add an education entry."
      fields={[
        { key: 'institution', label: 'Institution', type: 'text', required: true },
        { key: 'qualification', label: 'Qualification', type: 'text', required: true, placeholder: 'BTech, MSc…' },
        { key: 'field', label: 'Field of study', type: 'text' },
        { key: 'startDate', label: 'Start date', type: 'text', required: true, placeholder: '2016' },
        { key: 'endDate', label: 'End date', type: 'text', placeholder: '2021' },
        { key: 'description', label: 'Description', type: 'textarea', rows: 3 },
        { key: 'credentialUrl', label: 'Credential URL', type: 'text' },
      ]}
    />
  )
}
