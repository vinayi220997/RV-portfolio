'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowDown, ArrowUp, Edit, Plus, Search, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export interface ContentItem {
  id: string
  title: string
  subtitle?: string | null
  status: string
  order: number
  [k: string]: unknown
}

export interface Column<T> {
  key: keyof T | 'actions'
  label: string
  className?: string
  render?: (row: T) => React.ReactNode
}

export function ContentListPage<T extends ContentItem>({
  title,
  description,
  items,
  columns = [],
  newHref,
  editHrefPrefix,
  apiBase,
  reorderField = 'order',
}: {
  title: string
  description: string
  items: T[]
  columns?: Column<T>[]
  newHref: string
  editHrefPrefix: string
  apiBase: string
  reorderField?: string
}) {
  const router = useRouter()
  const [query, setQuery] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<string>('all')
  const [busy, setBusy] = React.useState<string | null>(null)

  const filtered = items.filter((i) => {
    if (statusFilter !== 'all' && i.status !== statusFilter) return false
    if (query) {
      const q = query.toLowerCase()
      return i.title.toLowerCase().includes(q) || (i.subtitle?.toLowerCase().includes(q) ?? false)
    }
    return true
  })

  const reorder = async (id: string, dir: 'up' | 'down') => {
    const idx = filtered.findIndex((i) => i.id === id)
    if (idx < 0) return
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= filtered.length) return
    const a = filtered[idx]
    const b = filtered[swapIdx]
    setBusy(a.id)
    try {
      // swap orders
      await Promise.all([
        fetch(`${apiBase}/${a.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [reorderField]: b.order }),
        }),
        fetch(`${apiBase}/${b.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [reorderField]: a.order }),
        }),
      ])
      router.refresh()
      toast.success('Order updated')
    } catch (e) {
      toast.error('Failed to update order')
    } finally {
      setBusy(null)
    }
  }

  const setStatus = async (id: string, status: string) => {
    setBusy(id)
    try {
      const res = await fetch(`${apiBase}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || 'Failed')
      }
      router.refresh()
      toast.success(`Marked as ${status}`)
    } catch (e: any) {
      toast.error(e.message || 'Failed')
    } finally {
      setBusy(null)
    }
  }

  const duplicate = async (id: string) => {
    setBusy(id)
    try {
      const res = await fetch(`${apiBase}/${id}/duplicate`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed')
      toast.success('Duplicated as draft')
      router.refresh()
    } catch (e: any) {
      toast.error(e.message || 'Failed to duplicate')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
        <Button asChild>
          <Link href={newHref}><Plus className="h-4 w-4 mr-1" /> New</Link>
        </Button>
      </header>

      <Card>
        <CardContent className="p-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="hidden">Hidden</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <div className="text-xs text-muted-foreground">{filtered.length} of {items.length}</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            <div className="grid items-center gap-3 px-4 py-2 text-xs uppercase tracking-wider text-muted-foreground bg-secondary/40"
              style={{ gridTemplateColumns: `1fr ${columns.map(() => 'minmax(120px, auto)').join(' ')} 140px` }}
            >
              <div>Title</div>
              {columns.map((c) => <div key={String(c.key)} className={c.className}>{c.label}</div>)}
              <div className="text-right">Actions</div>
            </div>
            {filtered.length === 0 && (
              <div className="px-4 py-12 text-center text-sm text-muted-foreground">No items found.</div>
            )}
            {filtered.map((item, idx) => (
              <div
                key={item.id}
                className={cn('grid items-center gap-3 px-4 py-3 hover:bg-secondary/30 transition')}
                style={{ gridTemplateColumns: `1fr ${columns.map(() => 'minmax(120px, auto)').join(' ')} 140px` }}
              >
                <div className="min-w-0">
                  <div className="font-medium truncate flex items-center gap-2">
                    {item.title}
                    {item.status === 'draft' && <Badge variant="secondary" className="text-[10px]">Draft</Badge>}
                    {item.status === 'hidden' && <Badge variant="outline" className="text-[10px]">Hidden</Badge>}
                    {item.status === 'archived' && <Badge variant="outline" className="text-[10px]">Archived</Badge>}
                  </div>
                  {item.subtitle && <div className="text-xs text-muted-foreground truncate">{item.subtitle}</div>}
                </div>
                {columns.map((c) => (
                  <div key={String(c.key)} className={c.className}>
                    {c.render ? c.render(item) : String(item[c.key as keyof T] ?? '')}
                  </div>
                ))}
                <div className="flex items-center justify-end gap-1">
                  <Button size="icon" variant="ghost" disabled={busy === item.id || idx === 0} onClick={() => reorder(item.id, 'up')} title="Move up">
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" disabled={busy === item.id || idx === filtered.length - 1} onClick={() => reorder(item.id, 'down')} title="Move down">
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" disabled={busy === item.id} onClick={() => duplicate(item.id)} title="Duplicate (creates unpublished copy)">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Select value={item.status} onValueChange={(v) => setStatus(item.id, v)} disabled={busy === item.id}>
                    <SelectTrigger className="h-8 w-[110px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="hidden">Hidden</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button asChild size="icon" variant="ghost">
                    <Link href={`${editHrefPrefix}/${item.id}`} title="Edit"><Edit className="h-4 w-4" /></Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
