import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, audit } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// Export contact messages as CSV or JSON.
// Query params:
//   format=csv|json  (default: csv)
//   emailsOnly=true  (only email addresses, no message bodies)
export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const format = url.searchParams.get('format') === 'json' ? 'json' : 'csv'
  const emailsOnly = url.searchParams.get('emailsOnly') === 'true'
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

  const items = await db.contactMessage.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      subject: true,
      message: true,
      ip: true,
      isRead: true,
      isStarred: true,
      replyStatus: true,
      createdAt: true,
    },
  })

  await audit({
    action: 'contacts_exported',
    category: 'message',
    summary: `Exported ${items.length} contacts (${format}, ${emailsOnly ? 'emails only' : 'all data'})`,
    ipAddress: ip,
    metadata: { count: items.length, format, emailsOnly },
  })

  if (format === 'json') {
    const data = emailsOnly
      ? items.map((m) => ({ name: m.name, email: m.email }))
      : items.map((m) => ({
          id: m.id,
          name: m.name,
          email: m.email,
          subject: m.subject,
          message: m.message,
          ip: m.ip,
          isRead: m.isRead,
          isStarred: m.isStarred,
          replyStatus: m.replyStatus,
          createdAt: m.createdAt.toISOString(),
        }))
    const filename = emailsOnly ? 'emails.json' : 'contacts.json'
    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  }

  // CSV
  const headers = emailsOnly
    ? ['Name', 'Email']
    : ['ID', 'Name', 'Email', 'Subject', 'Message', 'IP', 'Is Read', 'Is Starred', 'Reply Status', 'Created At']
  const rows = items.map((m) => {
    if (emailsOnly) return [m.name, m.email]
    return [
      m.id,
      m.name,
      m.email,
      m.subject || '',
      (m.message || '').replace(/\r?\n/g, ' '),
      m.ip || '',
      m.isRead ? 'Yes' : 'No',
      m.isStarred ? 'Yes' : 'No',
      m.replyStatus || '',
      m.createdAt.toISOString(),
    ]
  })
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => {
      const s = String(cell)
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`
      }
      return s
    }).join(','))
    .join('\r\n')
  const filename = emailsOnly ? 'emails.csv' : 'contacts.csv'
  return new NextResponse(`\uFEFF${csv}`, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
