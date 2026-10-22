import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { ContentEditor } from '@/components/admin/content-editor'

export const dynamic = 'force-dynamic'

export default async function ProjectNewPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/admin/login')
  return (
    <ContentEditor
      apiBase="/api/admin/projects"
      backHref="/admin/projects"
      title="New project"
      description="Add a new project to your portfolio."
      fields={[
        { key: 'title', label: 'Title', type: 'text', required: true },
        { key: 'slug', label: 'Slug', type: 'text', required: true, placeholder: 'my-project', hint: 'Lowercase, hyphenated. Used as URL identifier.' },
        { key: 'description', label: 'Short description', type: 'textarea', rows: 2, required: true },
        { key: 'longDescription', label: 'Long description', type: 'textarea', rows: 6 },
        { key: 'role', label: 'Your role', type: 'text' },
        { key: 'category', label: 'Category', type: 'text', placeholder: 'Product Design' },
        { key: 'technologies', label: 'Technologies', type: 'tags' },
        { key: 'imageUrl', label: 'Image URL', type: 'text' },
        { key: 'liveUrl', label: 'Live demo URL', type: 'text' },
        { key: 'sourceUrl', label: 'Source code URL', type: 'text' },
        { key: 'isFeatured', label: 'Featured project', type: 'switch' },
        { key: 'startDate', label: 'Start date', type: 'text', placeholder: '2024' },
        { key: 'endDate', label: 'End date', type: 'text', placeholder: '2024' },
      ]}
    />
  )
}
