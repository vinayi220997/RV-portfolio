import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { EmailTemplatesManager } from '@/components/admin/email-templates'

export const dynamic = 'force-dynamic'

export default async function EmailTemplatesPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/admin/login')
  const items = await db.emailTemplate.findMany({ orderBy: { createdAt: 'desc' } })
  return (
    <EmailTemplatesManager
      items={items.map((t) => ({
        id: t.id,
        name: t.name,
        category: t.category,
        subject: t.subject,
        body: t.body,
        status: t.status,
        createdAt: t.createdAt.toISOString(),
      }))}
    />
  )
}
