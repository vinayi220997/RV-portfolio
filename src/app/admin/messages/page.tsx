import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { MessagesInbox } from '@/components/admin/messages-inbox'

export const dynamic = 'force-dynamic'

export default async function MessagesPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/admin/login')
  const items = await db.contactMessage.findMany({ orderBy: { createdAt: 'desc' } })
  return (
    <MessagesInbox
      items={items.map((m) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        subject: m.subject,
        message: m.message,
        ip: m.ip,
        isRead: m.isRead,
        isStarred: m.isStarred,
        isArchived: m.isArchived,
        replyStatus: m.replyStatus,
        createdAt: m.createdAt.toISOString(),
      }))}
    />
  )
}
