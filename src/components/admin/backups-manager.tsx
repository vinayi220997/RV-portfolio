'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DatabaseBackup, Download, Trash2, Loader2, RotateCcw, ShieldCheck } from 'lucide-react'
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

interface Backup {
  id: string
  filename: string
  fileSize: number
  checksum: string
  createdAt: string
  createdBy: string | null
}

export function BackupsManager({ items }: { items: Backup[] }) {
  const router = useRouter()
  const [creating, setCreating] = React.useState(false)
  const [busy, setBusy] = React.useState<string | null>(null)

  const create = async () => {
    setCreating(true)
    try {
      const res = await fetch('/api/admin/backups/create', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed')
      toast.success('Encrypted backup created')
      router.refresh()
    } catch (e: any) {
      toast.error(e.message || 'Failed')
    } finally {
      setCreating(false)
    }
  }

  const download = async (b: Backup) => {
    setBusy(b.id + '-dl')
    try {
      const res = await fetch(`/api/admin/backups/${b.id}`)
      if (!res.ok) throw new Error('Failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = b.filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Downloaded')
    } catch {
      toast.error('Download failed')
    } finally {
      setBusy(null)
    }
  }

  const restore = async (b: Backup) => {
    setBusy(b.id + '-restore')
    try {
      const res = await fetch(`/api/admin/backups/restore/${b.id}`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed')
      toast.success('Restored. Reloading…')
      setTimeout(() => router.refresh(), 1000)
    } catch (e: any) {
      toast.error(e.message || 'Restore failed')
    } finally {
      setBusy(null)
    }
  }

  const remove = async (b: Backup) => {
    setBusy(b.id + '-del')
    try {
      const res = await fetch(`/api/admin/backups/${b.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      toast.success('Deleted')
      router.refresh()
    } catch {
      toast.error('Delete failed')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl">Backups</h1>
          <p className="text-sm text-muted-foreground mt-1">Encrypted snapshots of all portfolio content.</p>
        </div>
        <Button onClick={create} disabled={creating}>
          {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <DatabaseBackup className="h-4 w-4 mr-2" />}
          Create backup
        </Button>
      </header>

      <Card className="border-amber-500/40 bg-amber-500/5">
        <CardContent className="p-4 flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-700 dark:text-amber-400">
            <div className="font-medium">Backups are AES-GCM encrypted at rest</div>
            <p className="mt-1 text-amber-700/80 dark:text-amber-400/80">
              They contain a JSON snapshot of your content (profile, projects, messages, audit log) — <strong>not</strong> your private résumé files. The encryption key lives in <code className="bg-amber-500/15 px-1 rounded">ENCRYPTION_KEY</code> env on the server. If the key is lost, backups cannot be decrypted.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {items.length === 0 && (
              <div className="px-4 py-12 text-center text-sm text-muted-foreground">No backups yet. Create one to get started.</div>
            )}
            {items.map((b) => (
              <div key={b.id} className="px-4 py-4 flex flex-wrap items-start gap-3">
                <div className="h-10 w-10 rounded-md bg-secondary flex items-center justify-center shrink-0">
                  <DatabaseBackup className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium break-all text-sm">{b.filename}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {(b.fileSize / 1024).toFixed(1)} KB · Created {format(new Date(b.createdAt), 'MMM d, yyyy p')} {b.createdBy && `by ${b.createdBy}`}
                  </div>
                  <div className="text-xs text-muted-foreground/60 mt-0.5 font-mono truncate">SHA-256: {b.checksum}</div>
                </div>
                <div className="flex flex-wrap gap-1">
                  <Button size="sm" variant="outline" disabled={busy === b.id + '-dl'} onClick={() => download(b)}>
                    <Download className="h-4 w-4 mr-1" /> Download
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline" disabled={busy === b.id + '-restore'}>
                        <RotateCcw className="h-4 w-4 mr-1" /> Restore
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Restore this backup?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will overwrite your current database content with the snapshot. Recent changes will be lost. Consider creating a backup first.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => restore(b)}>Restore</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="ghost" disabled={busy === b.id + '-del'}><Trash2 className="h-4 w-4" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this backup?</AlertDialogTitle>
                        <AlertDialogDescription>The encrypted file will be permanently removed.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => remove(b)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
