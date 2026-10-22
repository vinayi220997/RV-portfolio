'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Eye, EyeOff, Loader2, Lock, ArrowLeft, KeyRound, ShieldCheck, Send } from 'lucide-react'

interface Props {
  showBootstrap: boolean
}

export function AdminLoginClient({ showBootstrap }: Props) {
  const router = useRouter()
  const search = useSearchParams()
  const recoveryToken = search.get('recovery_token')
  const [showPwd, setShowPwd] = React.useState(false)
  const [loginId, setLoginId] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [forgotOpen, setForgotOpen] = React.useState(false)

  const onSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (recoveryToken) {
      if (!recoveryToken) {
        toast.error('Recovery token is missing')
        return
      }
    } else {
      if (!loginId || !password) {
        toast.error('Login ID and password are required')
        return
      }
    }
    setBusy(true)
    try {
      // If a recovery token is present, use the recovery-default endpoint instead
      const endpoint = recoveryToken ? '/api/auth/recover/default-login' : '/api/auth/login'
      const body = recoveryToken
        ? { token: recoveryToken }
        : { loginId, password }
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'Incorrect ID or password')
        return
      }
      toast.success(json.message || 'Login successful')
      const next = search.get('next') || '/admin'
      router.push(next)
      router.refresh()
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition mb-8">
          <ArrowLeft className="h-4 w-4" /> Back to site
        </Link>

        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-accent/15 flex items-center justify-center">
                <Lock className="h-5 w-5 text-accent" />
              </div>
              <div>
                <CardTitle className="text-2xl">{recoveryToken ? 'Recovery login' : 'Admin sign in'}</CardTitle>
                <CardDescription className="text-xs">{recoveryToken ? 'Default password · verified' : 'Authorized access only'}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {recoveryToken ? (
              <div className="space-y-4">
                <div className="rounded-lg bg-accent/10 border border-accent/30 p-3 text-sm">
                  <div className="font-medium text-accent">Default-password login</div>
                  <p className="mt-1 text-muted-foreground leading-relaxed">
                    Your verification code was accepted. Click the button below to sign in using the default password. Please change your password in Settings after signing in.
                  </p>
                </div>
                <Button
                  className="w-full"
                  onClick={() => onSubmit()}
                  disabled={busy}
                >
                  {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Lock className="h-4 w-4 mr-2" />}
                  Sign in with default password
                </Button>
                <p className="text-[11px] text-muted-foreground text-center">
                  You will be signed in and asked to set a new password.
                </p>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="loginId">Login ID <span className="text-xs text-muted-foreground">(role_context)</span></Label>
                  <Input
                    id="loginId"
                    autoComplete="username"
                    placeholder="role_context"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password <span className="text-xs text-muted-foreground">(role_context@length)</span></Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPwd ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="role_context@length"
                      className="pr-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                      onClick={() => setShowPwd((v) => !v)}
                      aria-label={showPwd ? 'Hide password' : 'Show password'}
                    >
                      {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in…
                    </>
                  ) : (
                    'Sign in'
                  )}
                </Button>
              </form>
            )}

            <div className="mt-5 text-center">
              <button
                type="button"
                onClick={() => setForgotOpen(true)}
                className="text-xs text-muted-foreground hover:text-foreground transition"
              >
                Forgot password?
              </button>
            </div>

            {showBootstrap && !recoveryToken && (
              <div className="mt-5 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 text-xs">
                <div className="flex items-center gap-2 font-medium text-amber-700 dark:text-amber-400">
                  <ShieldCheck className="h-3.5 w-3.5" /> Default credentials
                </div>
                <p className="mt-1 text-amber-700/80 dark:text-amber-400/80 leading-relaxed">
                  The default admin credentials are:
                </p>
                <div className="mt-2 font-mono text-[11px] text-amber-700 dark:text-amber-400">
                  <div>Login ID: <code className="bg-amber-500/15 px-1 rounded">admin_user</code></div>
                  <div>Password: <code className="bg-amber-500/15 px-1 rounded">admin_password@58</code></div>
                </div>
                <p className="mt-2 text-[11px] text-amber-700/70 dark:text-amber-400/70">
                  These credentials are shown only on this first visit. The default password remains usable for sign-in until you change it in <strong>Settings</strong>. Please change it as soon as possible.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          The bootstrap credentials hint {showBootstrap ? 'is currently visible' : 'has been hidden'} — it only appears before the first successful sign-in.
        </p>
      </div>

      {forgotOpen && (
        <ForgotPasswordDialog onClose={() => setForgotOpen(false)} />
      )}
    </main>
  )
}

function ForgotPasswordDialog({ onClose }: { onClose: () => void }) {
  const [step, setStep] = React.useState<'verify' | 'default' | 'queue_form' | 'queued'>('verify')
  const [code, setCode] = React.useState('')
  const [oneTimeToken, setOneTimeToken] = React.useState('')
  const [verifying, setVerifying] = React.useState(false)
  const [queuing, setQueuing] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const verify = async () => {
    if (!code.trim().startsWith('#')) {
      setError('Code must start with #')
      return
    }
    setVerifying(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', code: code.trim() }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'Code not existed')
        return
      }
      if (json.kind === 'default') {
        setOneTimeToken(json.oneTimeToken)
        setStep('default')
      } else if (json.kind === 'recovery') {
        setStep('queue_form')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setVerifying(false)
    }
  }

  const queueRecovery = async () => {
    setQueuing(true)
    try {
      const res = await fetch('/api/auth/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'queue', code: code.trim() }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'Failed to queue recovery request')
        return
      }
      setStep('queued')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setQueuing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6" onClick={onClose}>
      <div className="bg-card border border-border rounded-t-2xl md:rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 md:p-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-accent" />
              <h2 className="font-serif text-xl">Forgot password</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
          </div>

          {step === 'verify' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Enter your verification code below to proceed. If the code is valid, you will be allowed to continue with the appropriate recovery flow.
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="rec-code">Verification code</Label>
                <Input
                  id="rec-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter your #code"
                  className="font-mono"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
                <Button onClick={verify} disabled={verifying || !code.trim()} className="flex-1">
                  {verifying ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                  Verify code
                </Button>
              </div>
            </div>
          )}

          {step === 'default' && (
            <div className="space-y-4">
              <div className="rounded-lg bg-accent/10 border border-accent/30 p-3">
                <div className="text-sm font-medium text-accent">Verified</div>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  Your verification code is valid. You may now sign in using the default password. After signing in, please change your password in <strong>Settings</strong>.
                </p>
              </div>
              <Button
                className="w-full"
                onClick={() => {
                  if (oneTimeToken) {
                    window.location.href = `/admin/login?recovery_token=${encodeURIComponent(oneTimeToken)}`
                  }
                }}
              >
                <Lock className="h-4 w-4 mr-2" /> Sign in with default password
              </Button>
              <p className="text-[11px] text-muted-foreground text-center">
                You will be redirected to the login form to complete sign-in.
              </p>
            </div>
          )}

          {step === 'queue_form' && (
            <div className="space-y-4">
              <div className="rounded-lg bg-accent/10 border border-accent/30 p-3">
                <div className="text-sm font-medium text-accent">Recovery code verified</div>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  Your recovery code is valid. Queue a recovery request below — the operator will be notified and will complete the recovery process for you.
                </p>
              </div>
              <Button className="w-full" onClick={queueRecovery} disabled={queuing}>
                {queuing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                Queue recovery request
              </Button>
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
          )}

          {step === 'queued' && (
            <div className="space-y-4 text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-accent/15 flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-accent" />
              </div>
              <h3 className="font-serif text-lg">Recovery request queued</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The operator has been notified. They will complete the recovery process and contact you. This event has been recorded in the audit log.
              </p>
              <Button variant="outline" onClick={onClose} className="w-full">Close</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
