'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

export function SiteFooter({
  footerText,
  socials,
}: {
  footerText: string | null
  socials: { platform: string; url: string; label: string | null }[]
}) {
  const [code, setCode] = React.useState('')
  const router = useRouter()

  const submitCode = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = code.trim()
    if (!trimmed) return
    if (!trimmed.startsWith('#')) {
      toast.error('Access codes start with #')
      return
    }
    if (trimmed.length < 3) {
      toast.error('Code is too short')
      return
    }
    try {
      const res = await fetch('/api/access-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trimmed }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'Code not existed')
        return
      }
      // Route accepted code to its target
      const target = json.route || '/admin/login'
      router.push(target)
    } catch (e) {
      toast.error('Network error. Please try again.')
    }
  }

  return (
    <footer className="border-t border-border/60 bg-secondary/20">
      <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        <div className="grid gap-10 md:grid-cols-3">
          <div className="md:col-span-2">
            <div className="font-serif text-2xl">Let&apos;s build something thoughtful.</div>
            <p className="mt-2 text-sm text-muted-foreground max-w-md text-pretty">
              {footerText || 'Designed & built with care.'}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {socials.map((s) => (
                <a
                  key={s.url}
                  href={s.url}
                  target={s.url.startsWith('http') ? '_blank' : undefined}
                  rel={s.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="text-sm text-muted-foreground hover:text-foreground transition border-b border-transparent hover:border-foreground/30"
                >
                  {s.label || s.platform}
                </a>
              ))}
            </div>
          </div>

          <form onSubmit={submitCode} className="md:justify-self-end">
            <label htmlFor="code" className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">
              #code <span className="text-muted-foreground/70 normal-case">· #role</span>
            </label>
            <div className="flex">
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="#code"
                className="rounded-r-none border-r-0 max-w-[160px] tabular-nums"
                autoComplete="off"
                spellCheck={false}
              />
              <Button
                type="submit"
                variant="outline"
                className="rounded-l-none border-l-0"
                aria-label="Submit access code"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground/70">
              Authorized access only.
            </p>
          </form>
        </div>

        <div className="mt-10 pt-6 border-t border-border/60 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <div>© {new Date().getFullYear()} Ramathota Vinay. All rights reserved.</div>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-foreground transition">Home</Link>
            <a href="#work" className="hover:text-foreground transition">Work</a>
            <a href="#contact" className="hover:text-foreground transition">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
