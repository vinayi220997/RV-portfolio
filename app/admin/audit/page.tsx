import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function AuditPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/admin/login')
  const items = await db.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 300 })

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-3xl">Audit log</h1>
        <p className="text-sm text-muted-foreground mt-1">Latest 300 admin actions. Passwords and tokens are never logged.</p>
      </header>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {items.length === 0 && (
              <div className="px-4 py-12 text-center text-sm text-muted-foreground">No audit events.</div>
            )}
            {items.map((a) => (
              <div key={a.id} className="px-4 py-3 flex flex-wrap items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-[10px]">{a.category}</Badge>
                    <span className="text-xs text-muted-foreground font-mono">{a.action}</span>
                  </div>
                  <div className="text-sm mt-0.5 text-pretty">{a.summary}</div>
                  <div className="text-xs text-muted-foreground/70 mt-0.5">
                    {format(a.createdAt, 'MMM d, yyyy p')}
                    {a.ipAddress && <> · IP: {a.ipAddress}</>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
