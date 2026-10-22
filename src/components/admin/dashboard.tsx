'use client'

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Briefcase, FolderKanban, Sparkles, Mail, ShieldAlert, ScrollText, ArrowUpRight, Star } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface Stats {
  counts: {
    experience: number
    projects: number
    skills: number
    education: number
    certifications: number
    messages: number
    unreadMessages: number
    codes: number
    audit: number
    backups: number
    resumes: number
  }
  publications: {
    publishedProjects: number
    draftProjects: number
    hiddenProjects: number
    publishedExperience: number
  }
  recentMessages: { id: string; name: string; email: string; subject: string | null; isRead: boolean; isStarred: boolean; createdAt: string }[]
  recentAudit: { id: string; action: string; category: string; summary: string; createdAt: string }[]
  mustChangePwd: boolean
}

export function Dashboard({ initial }: { initial: Stats }) {
  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Overview of your portfolio, messages, and security.</p>
        </div>
        <Button asChild>
          <Link href="/" target="_blank">View public site <ArrowUpRight className="ml-1 h-4 w-4" /></Link>
        </Button>
      </header>

      {initial.mustChangePwd && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-medium text-amber-700 dark:text-amber-400">Default password still in use</div>
            <p className="text-sm text-amber-700/80 dark:text-amber-400/80 mt-1">
              You are signed in with the default credentials. For better security, change your password in Settings.
            </p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href="/admin/settings">Change now</Link>
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2"><FolderKanban className="h-3.5 w-3.5" /> Projects</CardDescription>
            <CardTitle className="text-3xl">{initial.counts.projects}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground flex flex-wrap gap-2">
              <span className="text-emerald-600">{initial.publications.publishedProjects} published</span>
              <span>· {initial.publications.draftProjects} draft</span>
              <span>· {initial.publications.hiddenProjects} hidden</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2"><Briefcase className="h-3.5 w-3.5" /> Experience</CardDescription>
            <CardTitle className="text-3xl">{initial.counts.experience}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">{initial.publications.publishedExperience} published</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2"><Sparkles className="h-3.5 w-3.5" /> Skills</CardDescription>
            <CardTitle className="text-3xl">{initial.counts.skills}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">Across multiple categories</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> Messages</CardDescription>
            <CardTitle className="text-3xl">{initial.counts.messages}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs">
              {initial.counts.unreadMessages > 0 ? (
                <Badge variant="destructive">{initial.counts.unreadMessages} unread</Badge>
              ) : (
                <span className="text-muted-foreground">All read</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent messages</CardTitle>
            <CardDescription>Latest contact submissions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {initial.recentMessages.length === 0 ? (
              <p className="text-sm text-muted-foreground">No messages yet.</p>
            ) : (
              initial.recentMessages.map((m) => (
                <Link
                  key={m.id}
                  href={`/admin/messages?focus=${m.id}`}
                  className="block rounded-md border border-border/60 p-3 hover:border-foreground/30 transition"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {!m.isRead && <span className="h-2 w-2 rounded-full bg-accent" />}
                      <span className="text-sm font-medium">{m.name}</span>
                      {m.isStarred && <Star className="h-3 w-3 fill-accent text-accent" />}
                    </div>
                    <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })}</span>
                  </div>
                  {m.subject && <div className="text-xs text-muted-foreground mt-1 truncate">{m.subject}</div>}
                  <div className="text-xs text-muted-foreground/70 truncate">{m.email}</div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent activity</CardTitle>
            <CardDescription>Audit trail</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {initial.recentAudit.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              initial.recentAudit.map((a) => (
                <div key={a.id} className="flex items-start gap-3 text-sm">
                  <ScrollText className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-pretty">{a.summary}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      <Badge variant="outline" className="text-[10px] py-0 mr-1.5">{a.category}</Badge>
                      {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Security & data</CardTitle>
          <CardDescription>Quick links</CardDescription>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
          <Button asChild variant="outline" className="justify-start">
            <Link href="/admin/codes"><ShieldAlert className="h-4 w-4 mr-2" /> {initial.counts.codes} active codes</Link>
          </Button>
          <Button asChild variant="outline" className="justify-start">
            <Link href="/admin/backups"><FolderKanban className="h-4 w-4 mr-2" /> {initial.counts.backups} backups</Link>
          </Button>
          <Button asChild variant="outline" className="justify-start">
            <Link href="/admin/resume"><FolderKanban className="h-4 w-4 mr-2" /> {initial.counts.resumes} resume versions</Link>
          </Button>
          <Button asChild variant="outline" className="justify-start">
            <Link href="/admin/audit"><ScrollText className="h-4 w-4 mr-2" /> {initial.counts.audit} audit events</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
