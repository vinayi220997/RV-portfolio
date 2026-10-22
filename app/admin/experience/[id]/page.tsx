import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { ContentEditor } from '@/components/admin/content-editor'

export const dynamic = 'force-dynamic'

export default async function ExperienceEditPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) redirect('/admin/login')
  const { id } = await params
  const item = await db.experience.findUnique({ where: { id } })
  if (!item) redirect('/admin/experience')

  return (
    <ContentEditor
      apiBase="/api/admin/experience"
      backHref="/admin/experience"
      title="Edit experience"
      description={item.role}
      itemId={item.id}
      fields={[
        { key: 'role', label: 'Role', type: 'text', required: true, initial: item.role },
        { key: 'company', label: 'Company', type: 'text', required: true },
        { key: 'location', label: 'Location', type: 'text' },
        { key: 'startDate', label: 'Start date', type: 'text', required: true, placeholder: 'Jan 2025' },
        { key: 'endDate', label: 'End date', type: 'text', placeholder: 'Present' },
        { key: 'description', label: 'Description', type: 'textarea', rows: 4 },
        { key: 'achievements', label: 'Achievements', type: 'tags', placeholder: 'Add achievement…' },
        { key: 'technologies', label: 'Technologies', type: 'tags', placeholder: 'Add technology…' },
      ]}
      initial={{
        role: item.role,
        company: item.company,
        location: item.location || '',
        startDate: item.startDate,
        endDate: item.endDate || '',
        description: item.description || '',
        achievements: item.achievements || [],
        technologies: item.technologies || [],
        status: item.status,
      }}
    />
  )
}
