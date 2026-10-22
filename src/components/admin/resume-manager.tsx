'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Upload, Download, Trash2, Globe, GlobeLock, Loader2, FileText, AlertTriangle } from 'lucide-react'
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

interface Version {
  id: string
  versionLabel: string
  filename: string
  mimeType: string
  fileSize: number
  notes: string | null
  isPublished: boolean
  publicUrl: string | null
  uploadedAt: string
}

export function ResumeManager({ items }: { items: Version[] }) {
  const router = useRouter()
  const [file, setFile] = React.useState<File | null>(null)
  const [label, setLabel] = React.useState('')
  const [notes, setNotes] = React.useState('')
  const [uploading, setUploading] = React.useState(false)
  const [busy, setBusy] = React.useState<string | null>(null)

  const upload = async () => {
    if (!file) {
      toast.error('Choose a PDF file')
      return
    }
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF is supported')
      return
    }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('label', label || `Upload ${format(new Date(), 'MMM d, yyyy')}`)
      fd.append('notes', notes)
      const res = await fetch('/api/admin/resume', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed')
      toast.success('Uploaded')
      setFile(null)
      setLabel('')
      setNotes('')
      router.refresh()
    } catch (e: any) {
      toast.error(e.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const download = async (id: string) => {
    setBusy(id + '-dl')
    try {
      const res = await fetch(`/api/admin/resume/${id}`)
      if (!res.ok) throw new Error('Failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = items.find((i) => i.id === id)?.filename || 'resume.pdf'
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

  const publish = async (id: string) => {
    setBusy(id + '-pub')
    try {
      const res = await fetch(`/api/admin/resume/${id}/publish`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed')
      toast.success('Published — public copy created')
      router.refresh()
    } catch (e: any) {
      toast.error(e.message || 'Publish failed')
    } finally {
      setBusy(null)
    }
  }

  const unpublish = async (id: string) => {
    setBusy(id + '-unpub')
    try {
      const res = await fetch(`/api/admin/resume/${id}/unpublish`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed')
      toast.success('Unpublished — public copy removed')
      router.refresh()
    } catch {
      toast.error('Unpublish failed')
    } finally {
      setBusy(null)
    }
  }

  const remove = async (id: string) => {
    setBusy(id + '-del')
    try {
      const res = await fetch(`/api/admin/resume/${id}`, { method: 'DELETE' })
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
      <header>
        <h1 className="font-serif text-3xl">Resume management</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload private résumé versions. Publish a separate public copy on demand.
        </p>
      </header>

      <Card className="border-amber-500/40 bg-amber-500/5">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-700 dark:text-amber-400">
            <div className="font-medium">Private by default</div>
            <p className="mt-1 text-amber-700/80 dark:text-amber-400/80">
              Originals are stored encrypted and never exposed publicly. Publishing creates a separate copy in <code className="bg-amber-500/15 px-1 rounded">/uploads/public/</code>. The original remains private even after publishing.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upload new version</CardTitle>
          <CardDescription>PDF, max 10 MB. Stored encrypted at rest.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="r-file">PDF file</Label>
              <Input
                id="r-file"
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="r-label">Version label</Label>
              <Input id="r-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="October 2026 — final" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="r-notes">Notes (private)</Label>
            <Textarea id="r-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Internal notes about this version…" />
          </div>
          <Button onClick={upload} disabled={uploading || !file}>
            {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            Upload
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Versions</CardTitle>
          <CardDescription>{items.length} total · originals never published automatically.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {items.length === 0 && (
              <div className="px-4 py-12 text-center text-sm text-muted-foreground">No resume versions yet.</div>
            )}
            {items.map((v) => (
              <div key={v.id} className="px-4 py-4 flex flex-wrap items-start gap-3">
                <div className="h-10 w-10 rounded-md bg-secondary flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{v.versionLabel}</span>
                    {v.isPublished ? (
                      <Badge className="text-[10px]"><Globe className="h-3 w-3 mr-1" /> Published</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]"><GlobeLock className="h-3 w-3 mr-1" /> Private</Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground mt-0.5">{v.filename} · {(v.fileSize / 1024).toFixed(1)} KB</div>
                  <div className="text-xs text-muted-foreground/70 mt-0.5">
                    Uploaded {format(new Date(v.uploadedAt), 'MMM d, yyyy p')}
                  </div>
                  {v.notes && <div className="text-xs text-muted-foreground mt-1 italic">{v.notes}</div>}
                  {v.publicUrl && (
                    <a href={v.publicUrl} target="_blank" className="text-xs text-accent hover:underline mt-1 inline-block">
                      Public URL: {v.publicUrl}
                    </a>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  <Button size="sm" variant="outline" disabled={busy === v.id + '-dl'} onClick={() => download(v.id)}>
                    <Download className="h-4 w-4 mr-1" /> Download
                  </Button>
                  {v.isPublished ? (
                    <Button size="sm" variant="outline" disabled={busy === v.id + '-unpub'} onClick={() => unpublish(v.id)}>
                      <GlobeLock className="h-4 w-4 mr-1" /> Unpublish
                    </Button>
                  ) : (
                    <Button size="sm" disabled={busy === v.id + '-pub'} onClick={() => publish(v.id)}>
                      <Globe className="h-4 w-4 mr-1" /> Publish
                    </Button>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="ghost" disabled={busy === v.id + '-del'}><Trash2 className="h-4 w-4" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this version?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Removes both the private original and any public copy. Cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => remove(v.id)}>Delete</AlertDialogAction>
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
