'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Loader2, Save, Trash2, Plus, X } from 'lucide-react'
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

interface Field {
  key: string
  label: string
  type: 'text' | 'textarea' | 'number' | 'switch' | 'select' | 'tags'
  placeholder?: string
  hint?: string
  options?: { label: string; value: string }[]
  rows?: number
  required?: boolean
}

export function ContentEditor({
  apiBase,
  backHref,
  title,
  description,
  fields,
  initial,
  itemId,
}: {
  apiBase: string
  backHref: string
  title: string
  description: string
  fields: Field[]
  initial?: Record<string, any>
  itemId?: string
}) {
  const router = useRouter()
  const [saving, setSaving] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)
  const [values, setValues] = React.useState<Record<string, any>>(() => {
    const v: Record<string, any> = {}
    for (const f of fields) {
      if (f.type === 'switch') v[f.key] = initial?.[f.key] ?? false
      else if (f.type === 'tags') v[f.key] = Array.isArray(initial?.[f.key]) ? [...initial[f.key]] : []
      else v[f.key] = initial?.[f.key] ?? ''
    }
    return v
  })
  const [newTag, setNewTag] = React.useState<Record<string, string>>({})

  const setField = (key: string, val: any) => setValues((v) => ({ ...v, [key]: val }))

  const save = async () => {
    // basic validation
    for (const f of fields) {
      if (f.required && (values[f.key] === '' || values[f.key] === null || values[f.key] === undefined)) {
        toast.error(`${f.label} is required`)
        return
      }
    }
    setSaving(true)
    try {
      const method = itemId ? 'PATCH' : 'POST'
      const url = itemId ? `${apiBase}/${itemId}` : apiBase
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Save failed')
      toast.success(itemId ? 'Updated' : 'Created')
      router.push(backHref)
      router.refresh()
    } catch (e: any) {
      toast.error(e.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`${apiBase}/${itemId}`, { method: 'DELETE' })
      if (!res.ok) {
        const j = await res.json()
        throw new Error(j.error || 'Delete failed')
      }
      toast.success('Deleted')
      router.push(backHref)
      router.refresh()
    } catch (e: any) {
      toast.error(e.message || 'Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href={backHref} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition mb-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <h1 className="font-serif text-3xl">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
        <div className="flex gap-2">
          {itemId && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" disabled={deleting}>
                  {deleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this item?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. The item will be permanently removed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={remove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {itemId ? 'Save changes' : 'Create'}
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>{itemId ? 'Edit' : 'New entry'}</CardTitle>
          <CardDescription>Fields marked * are required.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {fields.map((f) => (
            <div key={f.key} className="space-y-1.5">
              <Label htmlFor={f.key}>
                {f.label}
                {f.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              {f.type === 'text' && (
                <Input id={f.key} value={values[f.key] ?? ''} placeholder={f.placeholder} onChange={(e) => setField(f.key, e.target.value)} />
              )}
              {f.type === 'number' && (
                <Input id={f.key} type="number" value={values[f.key] ?? 0} onChange={(e) => setField(f.key, Number(e.target.value))} />
              )}
              {f.type === 'textarea' && (
                <Textarea id={f.key} rows={f.rows || 4} value={values[f.key] ?? ''} placeholder={f.placeholder} onChange={(e) => setField(f.key, e.target.value)} />
              )}
              {f.type === 'switch' && (
                <div className="flex items-center gap-3">
                  <Switch checked={values[f.key] ?? false} onCheckedChange={(v) => setField(f.key, v)} id={f.key} />
                  <Label htmlFor={f.key} className="text-sm text-muted-foreground cursor-pointer">
                    {values[f.key] ? 'Enabled' : 'Disabled'}
                  </Label>
                </div>
              )}
              {f.type === 'select' && (
                <Select value={values[f.key] ?? ''} onValueChange={(v) => setField(f.key, v)}>
                  <SelectTrigger><SelectValue placeholder={f.placeholder} /></SelectTrigger>
                  <SelectContent>
                    {f.options?.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              {f.type === 'tags' && (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {(values[f.key] || []).map((t: string, idx: number) => (
                      <Badge key={idx} variant="secondary" className="gap-1">
                        {t}
                        <button type="button" onClick={() => setField(f.key, values[f.key].filter((_: string, i: number) => i !== idx))}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    <div className="flex gap-1">
                      <Input
                        placeholder={f.placeholder || 'Add…'}
                        value={newTag[f.key] || ''}
                        onChange={(e) => setNewTag((s) => ({ ...s, [f.key]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newTag[f.key]?.trim()) {
                            e.preventDefault()
                            setField(f.key, [...(values[f.key] || []), newTag[f.key].trim()])
                            setNewTag((s) => ({ ...s, [f.key]: '' }))
                          }
                        }}
                        className="h-8 max-w-[160px]"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (newTag[f.key]?.trim()) {
                            setField(f.key, [...(values[f.key] || []), newTag[f.key].trim()])
                            setNewTag((s) => ({ ...s, [f.key]: '' }))
                          }
                        }}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              {f.hint && <p className="text-xs text-muted-foreground">{f.hint}</p>}
            </div>
          ))}

          <div className="space-y-1.5 pt-2">
            <Label>Visibility</Label>
            <Select value={values.status ?? 'draft'} onValueChange={(v) => setField('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="published">Published (visible on public site)</SelectItem>
                <SelectItem value="draft">Draft (hidden, internal)</SelectItem>
                <SelectItem value="hidden">Hidden (excluded from build)</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
