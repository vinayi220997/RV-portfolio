import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { ContentEditor } from '@/components/admin/content-editor'

export const dynamic = 'force-dynamic'

export default async function SkillNewPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/admin/login')
  return (
    <ContentEditor
      apiBase="/api/admin/skills"
      backHref="/admin/skills"
      title="New skill"
      description="Add a skill to your portfolio."
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
    />
  )
}
