'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  User,
  Briefcase,
  FolderKanban,
  Sparkles,
  GraduationCap,
  Award,
  Link2,
  Mail,
  KeyRound,
  ScrollText,
  DatabaseBackup,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react'

const NAV = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Profile', href: '/admin/profile', icon: User },
  { label: 'Experience', href: '/admin/experience', icon: Briefcase },
  { label: 'Projects', href: '/admin/projects', icon: FolderKanban },
  { label: 'Skills', href: '/admin/skills', icon: Sparkles },
  { label: 'Education', href: '/admin/education', icon: GraduationCap },
  { label: 'Certifications', href: '/admin/certifications', icon: Award },
  { label: 'Social Links', href: '/admin/social', icon: Link2 },
  { label: 'Messages', href: '/admin/messages', icon: Mail },
  { label: 'Admin Codes', href: '/admin/codes', icon: KeyRound },
  { label: 'Email Templates', href: '/admin/email-templates', icon: Mail },
  { label: 'Resume (Private)', href: '/admin/resume', icon: FileText },
  { label: 'Backups', href: '/admin/backups', icon: DatabaseBackup },
  { label: 'Audit Log', href: '/admin/audit', icon: ScrollText },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
]

export function AdminShell({
  children,
  loginId,
  mustChangePwd,
}: {
  children: React.ReactNode
  loginId: string
  mustChangePwd: boolean
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = React.useState(false)

  const onLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            'fixed md:sticky top-0 z-40 h-screen w-64 shrink-0 border-r border-border bg-card transition-transform flex flex-col',
            open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          )}
        >
          {/* Header (fixed at top) */}
          <div className="flex items-center justify-between h-16 px-5 border-b border-border shrink-0">
            <Link href="/admin" className="font-serif text-lg">
              Admin<span className="text-accent">.</span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Notification card + nav (scrollable together) */}
          <div className="flex-1 overflow-y-auto px-3 py-3 min-h-0">
            {mustChangePwd && (
              <div className="mb-3 rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-xs">
                <div className="font-medium text-amber-700 dark:text-amber-400">Action recommended</div>
                <p className="mt-1 text-amber-700/80 dark:text-amber-400/80">
                  The default password is still in use. For better security, change it in Settings.
                </p>
                <Link href="/admin/settings" className="mt-2 inline-block underline">
                  Change password →
                </Link>
              </div>
            )}
            <nav className="space-y-0.5">
              {NAV.map((item) => {
                const Icon = item.icon
                const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition',
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Footer (anchored at bottom, never overlaps nav) */}
          <div className="shrink-0 border-t border-border p-3">
            <div className="px-2 py-2 text-xs text-muted-foreground">
              Signed in as <span className="text-foreground font-medium">{loginId}</span>
            </div>
            <Button variant="ghost" size="sm" className="w-full justify-start" onClick={onLogout}>
              <LogOut className="h-4 w-4 mr-2" /> Sign out
            </Button>
          </div>
        </aside>

        {/* Backdrop */}
        {open && (
          <div
            className="fixed inset-0 z-30 bg-black/40 md:hidden"
            onClick={() => setOpen(false)}
          />
        )}

        {/* Content */}
        <main className="flex-1 min-w-0">
          <div className="md:hidden h-14 border-b border-border bg-card flex items-center px-4 sticky top-0 z-20">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open menu"
              onClick={() => setOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <Link href="/admin" className="ml-2 font-serif">Admin</Link>
          </div>
          <div className="p-6 md:p-10 max-w-6xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
