'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Star, Archive, Trash2, Mail, MailOpen, Reply, Loader2, Send, ArrowLeft, Download, ChevronDown } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface Message {
  id: string
  name: string
  email: string
  subject: string | null
  message: string
  ip: string | null
  isRead: boolean
  isStarred: boolean
  isArchived: boolean
  replyStatus: string | null
  createdAt: string
}

export function MessagesInbox({ items }: { items: Message[] }) {
  const router = useRouter()
  const search = useSearchParams()
  const focusId = search.get('focus')
  const [selected, setSelected] = React.useState<string | null>(focusId || items[0]?.id || null)
  const [replyOpen, setReplyOpen] = React.useState(false)
  const [replyText, setReplyText] = React.useState('')
  const [sending, setSending] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const [filter, setFilter] = React.useState<'all' | 'unread' | 'starred' | 'archived'>('all')

  const filtered = items.filter((m) => {
    if (filter === 'unread' && m.isRead) return false
    if (filter === 'starred' && !m.isStarred) return false
    if (filter === 'archived' && !m.isArchived) return false
    if (filter === 'all' && m.isArchived) return false
    if (query) {
      const q = query.toLowerCase()
      return m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || (m.subject || '').toLowerCase().includes(q) || m.message.toLowerCase().includes(q)
    }
    return true
  })

  const sel = items.find((m) => m.id === selected) || null

  const patch = async (id: string, data: any, msg?: string) => {
    try {
      const res = await fetch(`/api/admin/messages/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const j = await res.json()
        throw new Error(j.error || 'Failed')
      }
      if (msg) toast.success(msg)
      router.refresh()
    } catch (e: any) {
      toast.error(e.message || 'Failed')
    }
  }

  const del = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/messages/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      toast.success('Deleted')
      setSelected(null)
      router.refresh()
    } catch {
      toast.error('Failed to delete')
    }
  }

  const sendReply = async () => {
    if (!sel) return
    setSending(true)
    try {
      const res = await fetch(`/api/admin/messages/${sel.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: sel.email,
          subject: sel.subject ? `Re: ${sel.subject}` : `Re: Your message`,
          body: replyText,
          replyToMessageId: sel.id,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed')
      toast.success('Reply sent')
      setReplyOpen(false)
      setReplyText('')
      router.refresh()
    } catch (e: any) {
      toast.error(e.message || 'Reply failed')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl">Messages</h1>
          <p className="text-sm text-muted-foreground mt-1">Private inbox of contact form submissions.</p>
        </div>
        <ExportButtons />
      </header>

      <div className="grid lg:grid-cols-[320px_1fr] gap-4">
        <Card className="overflow-hidden">
          <CardContent className="p-3 space-y-2">
            <Input
              placeholder="Search messages…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9"
            />
            <div className="flex flex-wrap gap-1">
              {(['all', 'unread', 'starred', 'archived'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-2.5 h-7 text-xs rounded-full border transition capitalize ${
                    filter === f ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="max-h-[60vh] overflow-y-auto -mx-1">
              {filtered.length === 0 && (
                <div className="px-3 py-12 text-center text-sm text-muted-foreground">No messages.</div>
              )}
              {filtered.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelected(m.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-md transition border-l-2 ${
                    selected === m.id ? 'bg-secondary border-accent' : 'border-transparent hover:bg-secondary/50'
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className={`text-sm truncate ${m.isRead ? 'text-muted-foreground' : 'font-medium'}`}>{m.name}</span>
                    <span className="text-xs text-muted-foreground shrink-0">{format(new Date(m.createdAt), 'MMM d')}</span>
                  </div>
                  {m.subject && <div className="text-xs text-muted-foreground truncate mt-0.5">{m.subject}</div>}
                  <div className="text-xs text-muted-foreground/70 truncate mt-0.5">{m.message}</div>
                  {!m.isRead && <span className="inline-block mt-1 h-1.5 w-1.5 rounded-full bg-accent" />}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {sel ? (
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-serif text-xl break-words">{sel.subject || '(no subject)'}</h2>
                  <div className="mt-1 text-sm">
                    <span className="font-medium">{sel.name}</span>
                    <span className="text-muted-foreground"> &lt;{sel.email}&gt;</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{format(new Date(sel.createdAt), 'PPP p')}</div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="icon" variant="ghost" onClick={() => patch(sel.id, { isStarred: !sel.isStarred }, sel.isStarred ? 'Unstarred' : 'Starred')}>
                    <Star className={`h-4 w-4 ${sel.isStarred ? 'fill-accent text-accent' : ''}`} />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => patch(sel.id, { isArchived: !sel.isArchived }, sel.isArchived ? 'Unarchived' : 'Archived')}>
                    <Archive className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="ghost"><Trash2 className="h-4 w-4" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this message?</AlertDialogTitle>
                        <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => del(sel.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              <div className="rounded-lg bg-secondary/40 p-4 text-sm leading-relaxed whitespace-pre-wrap break-words">
                {sel.message}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline">{sel.isRead ? 'Read' : 'Unread'}</Badge>
                {sel.replyStatus && <Badge variant="secondary">{sel.replyStatus}</Badge>}
                {sel.isStarred && <Badge variant="secondary"><Star className="h-3 w-3 mr-1 fill-accent text-accent" />Starred</Badge>}
                {sel.ip && <span>IP: {sel.ip}</span>}
              </div>

              {replyOpen ? (
                <div className="space-y-3 border-t border-border pt-4">
                  <div className="text-sm font-medium">Reply to {sel.name}</div>
                  <Textarea
                    rows={6}
                    placeholder="Type your reply…"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button onClick={sendReply} disabled={sending || !replyText.trim()}>
                      {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                      Send reply
                    </Button>
                    <Button variant="outline" onClick={() => { setReplyOpen(false); setReplyText('') }}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" onClick={() => setReplyOpen(true)}>
                  <Reply className="h-4 w-4 mr-2" /> Reply via Gmail
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              <Mail className="h-8 w-8 mx-auto mb-3 text-muted-foreground/40" />
              Select a message to view.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function ExportButtons() {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const trigger = (format: 'csv' | 'json', emailsOnly: boolean) => {
    const url = `/api/admin/messages/export?format=${format}${emailsOnly ? '&emailsOnly=true' : ''}`
    window.open(url, '_blank')
    setOpen(false)
    toast.success(`Exported ${emailsOnly ? 'emails' : 'all contacts'} as ${format.toUpperCase()}`)
  }

  return (
    <div className="relative" ref={ref}>
      <Button variant="outline" onClick={() => setOpen((v) => !v)}>
        <Download className="h-4 w-4 mr-2" />
        Export
        <ChevronDown className="h-3 w-3 ml-1" />
      </Button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-lg border border-border bg-card shadow-xl z-10 py-1">
          <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">All contacts</div>
          <button onClick={() => trigger('csv', false)} className="w-full text-left px-3 py-2 text-sm hover:bg-secondary/60 transition">All contacts (CSV)</button>
          <button onClick={() => trigger('json', false)} className="w-full text-left px-3 py-2 text-sm hover:bg-secondary/60 transition">All contacts (JSON)</button>
          <div className="border-t border-border my-1" />
          <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">Emails only</div>
          <button onClick={() => trigger('csv', true)} className="w-full text-left px-3 py-2 text-sm hover:bg-secondary/60 transition">Emails only (CSV)</button>
          <button onClick={() => trigger('json', true)} className="w-full text-left px-3 py-2 text-sm hover:bg-secondary/60 transition">Emails only (JSON)</button>
        </div>
      )}
    </div>
  )
}
