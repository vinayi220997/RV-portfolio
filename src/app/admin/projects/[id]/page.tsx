import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { ContentEditor } from '@/components/admin/content-editor'

export const dynamic = 'force-dynamic'

export default async function ProjectEditPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) redirect('/admin/login')
  const { id } = await params
  const item = await db.project.findUnique({ where: { id } })
  if (!item) redirect('/admin/projects')

  return (
    <ContentEditor
      apiBase="/api/admin/projects"
      backHref="/admin/projects"
      title="Edit project"
      description={item.title}
      itemId={item.id}
      fields={[
        { key: 'title', label: 'Title', type: 'text', required: true },
        { key: 'slug', label: 'Slug', type: 'text', required: true, placeholder: 'my-project', hint: 'Lowercase, hyphenated. Used as URL identifier.' },
        { key: 'description', label: 'Short description', type: 'textarea', rows: 2, required: true },
        { key: 'longDescription', label: 'Long description', type: 'textarea', rows: 6 },
        { key: 'role', label: 'Your role', type: 'text' },
        { key: 'category', label: 'Category', type: 'text', placeholder: 'Product Design' },
        { key: 'technologies', label: 'Technologies', type: 'tags' },
        { key: 'imageUrl', label: 'Image URL', type: 'text', placeholder: '/path or https://…' },
        { key: 'liveUrl', label: 'Live demo URL', type: 'text' },
        { key: 'sourceUrl', label: 'Source code URL', type: 'text' },
        { key: 'isFeatured', label: 'Featured project', type: 'switch' },
        { key: 'startDate', label: 'Start date', type: 'text', placeholder: '2024' },
        { key: 'endDate', label: 'End date', type: 'text', placeholder: '2024' },
      ]}
      initial={{
        title: item.title,
        slug: item.slug,
        description: item.description,
        longDescription: item.longDescription || '',
        role: item.role || '',
        category: item.category || '',
        technologies: item.technologies || [],
        imageUrl: item.imageUrl || '',
        liveUrl: item.liveUrl || '',
        sourceUrl: item.sourceUrl || '',
        isFeatured: item.isFeatured,
        startDate: item.startDate || '',
        endDate: item.endDate || '',
        status: item.status,
      }}
    />
  )
}
