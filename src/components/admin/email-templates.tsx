'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Edit, Trash2, Copy, Loader2, ArrowLeft } from 'lucide-react'
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

interface Template {
  id: string
  name: string
  category: string | null
  subject: string
  body: string
  status: string
  createdAt: string
}

export function EmailTemplatesManager({ items }: { items: Template[] }) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Template | null>(null)
  const [form, setForm] = React.useState({ name: '', category: '', subject: '', body: '', status: 'draft' })
  const [saving, setSaving] = React.useState(false)

  const openNew = () => {
    setEditing(null)
    setForm({ name: '', category: '', subject: '', body: '', status: 'draft' })
    setOpen(true)
  }

  const openEdit = (t: Template) => {
    setEditing(t)
    setForm({ name: t.name, category: t.category || '', subject: t.subject, body: t.body, status: t.status })
    setOpen(true)
  }

  const save = async () => {
    if (!form.name || !form.subject || !form.body) {
      toast.error('Name, subject, and body are required')
      return
    }
    setSaving(true)
    try {
      const url = editing ? `/api/admin/email-templates/${editing.id}` : '/api/admin/email-templates'
      const res = await fetch(url, {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed')
      toast.success(editing ? 'Saved' : 'Created')
      setOpen(false)
      router.refresh()
    } catch (e: any) {
      toast.error(e.message || 'Failed')
    } finally {
      setSaving(false)
    }
  }

  const duplicate = async (t: Template) => {
    try {
      const res = await fetch('/api/admin/email-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${t.name} (copy)`,
          category: t.category || '',
          subject: t.subject,
          body: t.body,
          status: 'draft',
        }),
      })
      if (!res.ok) throw new Error('Failed')
      toast.success('Duplicated')
      router.refresh()
    } catch {
      toast.error('Failed to duplicate')
    }
  }

  const remove = async (t: Template) => {
    try {
      const res = await fetch(`/api/admin/email-templates/${t.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      toast.success('Deleted')
      router.refresh()
    } catch {
      toast.error('Failed to delete')
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl">Email templates</h1>
          <p className="text-sm text-muted-foreground mt-1">Reusable email content with placeholders.</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" /> New template</Button>
      </header>

      <Card>
        <CardContent className="p-4 text-sm text-muted-foreground">
          <div className="font-medium text-foreground mb-2">Supported placeholders</div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="font-mono">{`{{name}}`}</Badge>
            <Badge variant="secondary" className="font-mono">{`{{email}}`}</Badge>
            <Badge variant="secondary" className="font-mono">{`{{project}}`}</Badge>
            <Badge variant="secondary" className="font-mono">{`{{subject}}`}</Badge>
          </div>
          <p className="mt-2 text-xs">Placeholders are resolved at send time when used in a reply. Unknown placeholders are left empty.</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {items.length === 0 && (
              <div className="px-4 py-12 text-center text-sm text-muted-foreground">No templates yet. Create one to get started.</div>
            )}
            {items.map((t) => (
              <div key={t.id} className="px-4 py-4 flex flex-wrap items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{t.name}</span>
                    {t.category && <Badge variant="outline" className="text-[10px]">{t.category}</Badge>}
                    {t.status === 'draft' && <Badge variant="secondary" className="text-[10px]">Draft</Badge>}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">{t.subject}</div>
                  <div className="text-xs text-muted-foreground/70 mt-1 line-clamp-2 whitespace-pre-wrap">{t.body}</div>
                  <div className="text-xs text-muted-foreground/60 mt-1">Created {format(new Date(t.createdAt), 'MMM d, yyyy')}</div>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(t)} title="Edit"><Edit className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => duplicate(t)} title="Duplicate"><Copy className="h-4 w-4" /></Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="ghost" title="Delete"><Trash2 className="h-4 w-4" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this template?</AlertDialogTitle>
                        <AlertDialogDescription>“{t.name}” will be permanently removed.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => remove(t)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {open && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6" onClick={() => setOpen(false)}>
          <div className="bg-card border border-border rounded-t-2xl md:rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 md:p-8 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-xl">{editing ? 'Edit template' : 'New template'}</h2>
                <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Close</Button>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="t-name">Name</Label>
                <Input id="t-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Welcome reply" />
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="t-cat">Category</Label>
                  <Input id="t-cat" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="General, Hiring…" />
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="t-subject">Subject</Label>
                <Input id="t-subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Re: {{subject}}" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="t-body">Body</Label>
                <Textarea id="t-body" rows={10} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder={`Hi {{name}},\n\nThanks for reaching out about {{project}}…`} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={save} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  {editing ? 'Save' : 'Create'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
