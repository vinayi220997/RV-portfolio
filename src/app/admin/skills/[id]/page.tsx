import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { ContentEditor } from '@/components/admin/content-editor'

export const dynamic = 'force-dynamic'

export default async function SkillEditPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) redirect('/admin/login')
  const { id } = await params
  const item = await db.skill.findUnique({ where: { id } })
  if (!item) redirect('/admin/skills')

  return (
    <ContentEditor
      apiBase="/api/admin/skills"
      backHref="/admin/skills"
      title="Edit skill"
      description={item.name}
      itemId={item.id}
      fields={[
        { key: 'name', label: 'Skill name', type: 'text', required: true },
        { key: 'category', label: 'Category', type: 'text', required: true, placeholder: 'UX, Design Craft, Systems…' },
        { key: 'proficiency', label: 'Proficiency', type: 'select', options: [
          { label: '— None —', value: '' },
          { label: 'Beginner', value: 'Beginner' },
          { label: 'Intermediate', value: 'Intermediate' },
          { label: 'Advanced', value: 'Advanced' },
          { label: 'Expert', value: 'Expert' },
        ] },
        { key: 'description', label: 'Description', type: 'textarea', rows: 3 },
      ]}
      initial={{
        name: item.name,
        category: item.category,
        proficiency: item.proficiency || '',
        description: item.description || '',
        status: item.status,
      }}
    />
  )
}
