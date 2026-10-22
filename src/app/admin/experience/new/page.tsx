import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { ContentEditor } from '@/components/admin/content-editor'

export const dynamic = 'force-dynamic'

export default async function ExperienceNewPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/admin/login')
  return (
    <ContentEditor
      apiBase="/api/admin/experience"
      backHref="/admin/experience"
      title="New experience"
      description="Add a new role to your work history."
      fields={[
        { key: 'role', label: 'Role', type: 'text', required: true, placeholder: 'UI/UX Designer' },
        { key: 'company', label: 'Company', type: 'text', required: true },
        { key: 'location', label: 'Location', type: 'text', placeholder: 'Visakhapatnam, India' },
        { key: 'startDate', label: 'Start date', type: 'text', required: true, placeholder: 'Jan 2025' },
        { key: 'endDate', label: 'End date', type: 'text', placeholder: 'Present' },
        { key: 'description', label: 'Description', type: 'textarea', rows: 4 },
        { key: 'achievements', label: 'Achievements', type: 'tags', placeholder: 'Add achievement…' },
        { key: 'technologies', label: 'Technologies', type: 'tags', placeholder: 'Add technology…' },
      ]}
    />
  )
}
