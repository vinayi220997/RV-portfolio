'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2, Save } from 'lucide-react'

const schema = z.object({
  name: z.string().min(1, 'Required').max(120),
  title: z.string().min(1, 'Required').max(160),
  titles: z.string().max(500).optional().or(z.literal('')),
  animateTitles: z.boolean().optional(),
  summary: z.string().min(1, 'Required').max(2000),
  bio: z.string().max(5000).optional().or(z.literal('')),
  location: z.string().max(120).optional().or(z.literal('')),
  email: z.string().email().max(120).optional().or(z.literal('')),
  phone: z.string().max(60).optional().or(z.literal('')),
  avatarUrl: z.string().max(500).optional().or(z.literal('')),
  iconLetters: z.string().max(20).optional().or(z.literal('')),
  resumeExternalUrl: z.string().max(500).optional().or(z.literal('')),
  availability: z.string().max(200).optional().or(z.literal('')),
})

type FormValues = z.infer<typeof schema>

export function ProfileEditor({ initial }: { initial: Partial<FormValues> }) {
  const router = useRouter()
  const [saving, setSaving] = React.useState(false)
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initial as FormValues,
  })
  const iconLettersValue = watch('iconLetters') || ''
  const titlesValue = watch('titles') || ''
  const animateTitlesValue = watch('animateTitles') || false

  const onSubmit = async (data: FormValues) => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed')
      toast.success('Profile saved')
      router.refresh()
    } catch (e: any) {
      toast.error(e.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Name</Label>
          <Input {...register('name')} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Title (primary)</Label>
          <Input {...register('title')} />
          {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
        </div>
      </div>

      <Card className="bg-secondary/30">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Multiple titles (typing animation)</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Comma-separated. When animation is on, titles cycle one at a time on the public site.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Animate</span>
              <Switch {...register('animateTitles')} defaultChecked={!!initial.animateTitles} />
            </div>
          </div>
          <Input
            {...register('titles')}
            placeholder="UI/UX Designer, Visual Designer, Product Designer"
          />
          {titlesValue && (
            <div className="text-xs text-muted-foreground">
              Preview: <span className="text-foreground">{titlesValue.split(',').map((t) => t.trim()).filter(Boolean).join(animateTitlesValue ? ' → ' : ' · ')}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-secondary/30">
        <CardContent className="p-4 space-y-3">
          <div>
            <Label className="text-sm font-medium">Website icon letters</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Shown as the logo text in the site header (e.g. &quot;RV&quot;). Falls back to &quot;RV&quot; if empty.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Input
              {...register('iconLetters')}
              placeholder="RV"
              maxLength={20}
              className="font-serif max-w-[200px]"
            />
            <div className="font-serif text-xl">
              {(iconLettersValue.trim()) || 'RV'}<span className="text-accent">.</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-1.5">
        <Label>Summary (hero paragraph)</Label>
        <Textarea rows={4} {...register('summary')} />
        {errors.summary && <p className="text-xs text-destructive">{errors.summary.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Bio (longer about paragraph)</Label>
        <Textarea rows={6} {...register('bio')} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Location</Label>
          <Input {...register('location')} />
        </div>
        <div className="space-y-1.5">
          <Label>Availability</Label>
          <Input placeholder="Open to selected freelance and full-time UI/UX roles." {...register('availability')} />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Public email</Label>
          <Input type="email" {...register('email')} />
        </div>
        <div className="space-y-1.5">
          <Label>Phone</Label>
          <Input {...register('phone')} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Avatar URL</Label>
        <Input {...register('avatarUrl')} placeholder="/avatar.png" />
        <p className="text-xs text-muted-foreground">Path under <code>/public</code> or full URL.</p>
      </div>

      <Card className="bg-secondary/30">
        <CardContent className="p-4 space-y-3">
          <div>
            <Label className="text-sm font-medium">External resume URL (optional)</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              If you host your resume elsewhere (LinkedIn, Google Drive, GitHub), enter the URL here. Used when no uploaded PDF is published.
            </p>
          </div>
          <Input
            {...register('resumeExternalUrl')}
            placeholder="https://drive.google.com/..."
            type="url"
          />
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save profile
        </Button>
      </div>
    </form>
  )
}
