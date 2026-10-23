'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Eye, EyeOff, Loader2, Save, Key, ShieldAlert, ShieldCheck, Settings as SettingsIcon, Globe, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { ThemeSettings } from '@/components/admin/theme-settings'

interface GmailConfig {
  emailAddress: string | null
  displayName: string | null
  isVerified: boolean
  lastVerifiedAt: string | null
  lastError: string | null
  hasAppPassword: boolean
}

interface SettingsProps {
  initial: {
    siteTitle: string
    siteDescription: string
    siteUrl: string
    faviconUrl: string
    themeAccent: string
    footerText: string
  }
  loginId: string
  mustChangePwd: boolean
  gmailConfig: GmailConfig | null
  themeInitial: {
    themeMode: string | null
    themeAccent: string | null
    themeSolidColor: string | null
    themeGradient: string | null
  }
}

export function SettingsPage({ initial, loginId, mustChangePwd, gmailConfig, themeInitial }: SettingsProps) {
  const router = useRouter()
  const [site, setSite] = React.useState(initial)
  const [savingSite, setSavingSite] = React.useState(false)

  const [cred, setCred] = React.useState({
    currentPassword: '',
    newLoginId: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showPwd, setShowPwd] = React.useState(false)
  const [savingCred, setSavingCred] = React.useState(false)

  const saveSite = async () => {
    setSavingSite(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(site),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed')
      toast.success('Settings saved')
      router.refresh()
    } catch (e: any) {
      toast.error(e.message || 'Failed')
    } finally {
      setSavingSite(false)
    }
  }

  const saveCred = async () => {
    if (cred.newPassword && cred.newPassword !== cred.confirmPassword) {
      toast.error('New password and confirmation do not match')
      return
    }
    if (!cred.newLoginId && !cred.newPassword) {
      toast.error('Enter a new login ID or password to change')
      return
    }
    setSavingCred(true)
    try {
      const res = await fetch('/api/auth/change-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: cred.currentPassword,
          newLoginId: cred.newLoginId || undefined,
          newPassword: cred.newPassword || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed')
      toast.success(json.message || 'Credentials updated')
      setCred({ currentPassword: '', newLoginId: '', newPassword: '', confirmPassword: '' })
      router.push('/admin/login')
      router.refresh()
    } catch (e: any) {
      toast.error(e.message || 'Failed')
    } finally {
      setSavingCred(false)
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-3xl">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Site metadata, footer, and credentials.</p>
      </header>

      {mustChangePwd && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="p-4 flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-700 dark:text-amber-400">
              <div className="font-medium">Default password still in use</div>
              <p className="mt-1 text-amber-700/80 dark:text-amber-400/80">
                For better security, change it below before exposing the admin panel publicly.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Key className="h-4 w-4" /> Change credentials</CardTitle>
          <CardDescription>Reauthentication required. You will be signed out after.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cur">Current password</Label>
              <div className="relative">
                <Input
                  id="cur"
                  type={showPwd ? 'text' : 'password'}
                  value={cred.currentPassword}
                  onChange={(e) => setCred({ ...cred, currentPassword: e.target.value })}
                  placeholder="••••••••"
                  className="pr-10"
                />
                <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1" onClick={() => setShowPwd((v) => !v)}>
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>New login ID <span className="text-muted-foreground text-xs">(leave blank to keep)</span></Label>
              <Input value={cred.newLoginId} onChange={(e) => setCred({ ...cred, newLoginId: e.target.value })} placeholder={loginId} />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="new-pwd">New password <span className="text-muted-foreground text-xs">(min 10 chars)</span></Label>
              <Input id="new-pwd" type={showPwd ? 'text' : 'password'} value={cred.newPassword} onChange={(e) => setCred({ ...cred, newPassword: e.target.value })} placeholder="••••••••" />
            </div>
            <div className="space-y-1.5">
              <Label>Confirm new password</Label>
              <Input type={showPwd ? 'text' : 'password'} value={cred.confirmPassword} onChange={(e) => setCred({ ...cred, confirmPassword: e.target.value })} placeholder="••••••••" />
            </div>
          </div>
          <Button onClick={saveCred} disabled={savingCred || !cred.currentPassword}>
            {savingCred ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Update credentials
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><SettingsIcon className="h-4 w-4" /> Site settings</CardTitle>
          <CardDescription>Used in SEO metadata, footer, and browser tab.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Site title</Label>
              <Input value={site.siteTitle} onChange={(e) => setSite({ ...site, siteTitle: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Theme accent</Label>
              <Input value={site.themeAccent} onChange={(e) => setSite({ ...site, themeAccent: e.target.value })} placeholder="terracotta" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Site description (SEO)</Label>
            <Textarea rows={2} value={site.siteDescription} onChange={(e) => setSite({ ...site, siteDescription: e.target.value })} />
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Site URL</Label>
              <Input value={site.siteUrl} onChange={(e) => setSite({ ...site, siteUrl: e.target.value })} placeholder="https://username.github.io/portfolio" />
            </div>
            <div className="space-y-1.5">
              <Label>Favicon URL</Label>
              <Input value={site.faviconUrl} onChange={(e) => setSite({ ...site, faviconUrl: e.target.value })} placeholder="/avatar.png" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Footer text</Label>
            <Textarea rows={2} value={site.footerText} onChange={(e) => setSite({ ...site, footerText: e.target.value })} />
          </div>
          <Button onClick={saveSite} disabled={savingSite}>
            {savingSite ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save settings
          </Button>
        </CardContent>
      </Card>

      <ThemeSettings
        initial={{
          themeMode: themeInitial.themeMode,
          themeAccent: themeInitial.themeAccent,
          themeSolidColor: themeInitial.themeSolidColor,
          themeGradient: themeInitial.themeGradient,
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Globe className="h-4 w-4" /> Gmail App Password</CardTitle>
          <CardDescription>Configure SMTP via Google App Password. Replies are sent from this account.</CardDescription>
        </CardHeader>
        <CardContent>
          <GmailAppPasswordSection initial={gmailConfig} />
        </CardContent>
      </Card>
    </div>
  )
}

function GmailAppPasswordSection({ initial }: { initial: { emailAddress: string | null; displayName: string | null; isVerified: boolean; lastVerifiedAt: string | null; lastError: string | null; hasAppPassword: boolean } | null }) {
  const router = useRouter()
  const [emailAddress, setEmailAddress] = React.useState(initial?.emailAddress || '')
  const [appPassword, setAppPassword] = React.useState('')
  const [displayName, setDisplayName] = React.useState(initial?.displayName || '')
  const [testing, setTesting] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [disconnecting, setDisconnecting] = React.useState(false)
  const [showPwd, setShowPwd] = React.useState(false)

  const test = async () => {
    if (!emailAddress || !appPassword) {
      toast.error('Email address and App Password are required')
      return
    }
    setTesting(true)
    try {
      const res = await fetch('/api/admin/email-config/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailAddress, appPassword }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Test failed')
      toast.success('SMTP connection verified successfully.')
    } catch (e: any) {
      toast.error(e.message || 'Test failed')
    } finally {
      setTesting(false)
    }
  }

  const save = async () => {
    if (!emailAddress || !appPassword) {
      toast.error('Email address and App Password are required')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/email-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', emailAddress, appPassword, displayName }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Save failed')
      toast.success('Gmail App Password saved. SMTP verified.')
      setAppPassword('')
      router.refresh()
    } catch (e: any) {
      toast.error(e.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const disconnect = async () => {
    setDisconnecting(true)
    try {
      const res = await fetch('/api/admin/email-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect' }),
      })
      if (!res.ok) throw new Error('Failed')
      toast.success('Disconnected')
      router.refresh()
    } catch {
      toast.error('Failed to disconnect')
    } finally {
      setDisconnecting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border/60 bg-secondary/30 p-3 text-sm">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${initial?.hasAppPassword ? 'bg-emerald-500' : 'bg-muted-foreground/40'}`} />
          <span className="font-medium">{initial?.hasAppPassword ? 'Connected' : 'Not configured'}</span>
        </div>
        {initial?.emailAddress && (
          <div className="mt-1 text-xs text-muted-foreground">
            {initial.emailAddress}
            {initial.lastVerifiedAt && <> · Verified {format(new Date(initial.lastVerifiedAt), 'MMM d, yyyy p')}</>}
          </div>
        )}
        {initial?.lastError && (
          <div className="mt-1 text-xs text-destructive">Last error: {initial.lastError}</div>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="gm-email">Gmail address</Label>
        <Input id="gm-email" type="email" value={emailAddress} onChange={(e) => setEmailAddress(e.target.value)} placeholder="you@gmail.com" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="gm-name">Display name <span className="text-xs text-muted-foreground">(optional)</span></Label>
        <Input id="gm-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Ramathota Vinay" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="gm-pwd">App Password <span className="text-xs text-muted-foreground">(16 chars, no spaces)</span></Label>
        <div className="relative">
          <Input
            id="gm-pwd"
            type={showPwd ? 'text' : 'password'}
            value={appPassword}
            onChange={(e) => setAppPassword(e.target.value)}
            placeholder="aaaaaaaaaaaaaaaa"
            className="pr-10 font-mono"
            autoComplete="off"
          />
          <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1" onClick={() => setShowPwd((v) => !v)}>
            {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Generate one at <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">myaccount.google.com/apppasswords</a> (requires 2-Step Verification enabled).
        </p>
      </div>

      <div className="flex flex-wrap gap-2 pt-2">
        <Button variant="outline" onClick={test} disabled={testing || !emailAddress || !appPassword}>
          {testing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
          Test connection
        </Button>
        <Button onClick={save} disabled={saving || !emailAddress || !appPassword}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save &amp; verify
        </Button>
        {initial?.hasAppPassword && (
          <Button variant="outline" onClick={disconnect} disabled={disconnecting}>
            {disconnecting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
            Disconnect
          </Button>
        )}
      </div>

      <div className="rounded-lg border border-border/60 p-3 bg-secondary/30 text-xs text-muted-foreground">
        <div className="font-medium text-foreground mb-1">Security</div>
        <p>
          The App Password is AES-GCM encrypted before being stored in the database. It is decrypted in-memory only when sending an email and is never returned to the browser after saving.
        </p>
      </div>
    </div>
  )
}

function GmailStatus() {
  return (
    <div className="text-sm space-y-2">
      <p className="text-muted-foreground">
        Gmail integration supports two methods, tried in this order:
      </p>
      <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
        <li><strong className="text-foreground">App Password (SMTP)</strong> — configured above. Recommended for self-hosted deployments.</li>
        <li><strong className="text-foreground">OAuth (env vars)</strong> — legacy v1 path. Set <code className="bg-secondary px-1 rounded">GMAIL_CLIENT_ID</code>, <code className="bg-secondary px-1 rounded">GMAIL_CLIENT_SECRET</code>, <code className="bg-secondary px-1 rounded">GMAIL_REFRESH_TOKEN</code>, <code className="bg-secondary px-1 rounded">GMAIL_FROM_ADDRESS</code>.</li>
      </ol>
      <p className="text-xs text-muted-foreground">
        If neither is configured, replies return a 503 with a clear error message.
      </p>
    </div>
  )
}
