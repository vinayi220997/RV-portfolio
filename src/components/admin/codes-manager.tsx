'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Plus, Trash2, Loader2, ShieldCheck, Lock, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
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

interface Code {
  id: string
  code: string
  label: string
  isActive: boolean
  isReserved: boolean
  createdAt: string
  lastUsedAt: string | null
}

export function CodesManager({ items }: { items: Code[] }) {
  const router = useRouter()
  const [code, setCode] = React.useState('')
  const [label, setLabel] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [deleting, setDeleting] = React.useState<string | null>(null)

  const create = async () => {
    if (!code.startsWith('#')) {
      toast.error('Code must start with #')
      return
    }
    if (code.length < 3) {
      toast.error('Code is too short')
      return
    }
    if (!label.trim()) {
      toast.error('Label is required')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim(), label: label.trim() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed')
      toast.success(`Created code: ${code.trim()}`)
      setCode('')
      setLabel('')
      router.refresh()
    } catch (e: any) {
      toast.error(e.message || 'Failed')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (item: Code) => {
    if (item.isReserved) {
      toast.error('#admin cannot be disabled')
      return
    }
    try {
      const res = await fetch(`/api/admin/codes/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !item.isActive }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed')
      toast.success(item.isActive ? 'Disabled' : 'Enabled')
      router.refresh()
    } catch (e: any) {
      toast.error(e.message || 'Failed')
    }
  }

  const remove = async (item: Code) => {
    setDeleting(item.id)
    try {
      const res = await fetch(`/api/admin/codes/${item.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed')
      toast.success('Deleted')
      router.refresh()
    } catch (e: any) {
      toast.error(e.message || 'Failed')
    } finally {
      setDeleting(null)
    }
  }

  const generateRandom = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let s = '#'
    for (let i = 0; i < 16; i++) s += chars[Math.floor(Math.random() * chars.length)]
    setCode(s)
    toast.info('Generated strong random code')
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-3xl">Admin access codes</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Codes route users to the admin login. Real authentication happens server-side — no code grants access on its own.
        </p>
      </header>

      <Card className="border-amber-500/40 bg-amber-500/5">
        <CardContent className="p-4 flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-700 dark:text-amber-400">
            <div className="font-medium">Security note</div>
            <p className="mt-1 text-amber-700/80 dark:text-amber-400/80 leading-relaxed">
              Codes are public route selectors. Anyone can attempt to submit any code in the footer. The reserved <code className="bg-amber-500/15 px-1 rounded">#admin</code> always routes to the login screen but never authenticates on its own. Use strong random codes (e.g. <code className="bg-amber-500/15 px-1 rounded">#X7kB…</code>) for custom ones, never predictable words.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Create new code</CardTitle>
          <CardDescription>Assign a descriptive label and a strong code value.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="code">Code value</Label>
              <div className="flex gap-2">
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="#your-code-here"
                  className="font-mono"
                />
                <Button variant="outline" onClick={generateRandom} type="button" title="Generate strong random code">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="label">Label / role</Label>
              <Input
                id="label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Editor, Reviewer, Contractor…"
              />
            </div>
          </div>
          <Button onClick={create} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
            Add code
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing codes</CardTitle>
          <CardDescription>{items.length} total · reserved #admin is protected.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {items.map((item) => (
              <div key={item.id} className="px-4 py-3 flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="font-mono text-sm bg-secondary px-2 py-0.5 rounded">{item.code}</code>
                    {item.isReserved && (
                      <Badge variant="default" className="text-[10px]">
                        <Lock className="h-3 w-3 mr-1" /> Reserved
                      </Badge>
                    )}
                    {!item.isActive && <Badge variant="outline" className="text-[10px]">Disabled</Badge>}
                  </div>
                  <div className="text-sm text-muted-foreground mt-0.5">{item.label}</div>
                  <div className="text-xs text-muted-foreground/70 mt-0.5">
                    Created {format(new Date(item.createdAt), 'MMM d, yyyy')}
                    {item.lastUsedAt && <> · Last used {format(new Date(item.lastUsedAt), 'MMM d, yyyy p')}</>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={item.isActive} onCheckedChange={() => toggleActive(item)} disabled={item.isReserved} />
                  {!item.isReserved && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="ghost" disabled={deleting === item.id}>
                          {deleting === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this code?</AlertDialogTitle>
                          <AlertDialogDescription>
                            The code <code className="font-mono bg-secondary px-1 rounded">{item.code}</code> will no longer route to the admin login.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => remove(item)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
