import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, audit } from '@/lib/auth'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const schema = z.object({
  name: z.string().min(1).max(120),
  title: z.string().min(1).max(160),
  titles: z.string().max(500).optional().or(z.literal('')),
  animateTitles: z.boolean().optional(),
  summary: z.string().min(1).max(2000),
  bio: z.string().max(5000).optional().or(z.literal('')),
  location: z.string().max(120).optional().or(z.literal('')),
  email: z.string().email().max(120).optional().or(z.literal('')),
  phone: z.string().max(60).optional().or(z.literal('')),
  avatarUrl: z.string().max(500).optional().or(z.literal('')),
  iconLetters: z.string().max(20).optional().or(z.literal('')),
  resumeExternalUrl: z.string().max(500).optional().or(z.literal('')),
  availability: z.string().max(200).optional().or(z.literal('')),
})

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const p = await db.profile.findUnique({ where: { id: 'singleton' } })
  return NextResponse.json({ profile: p })
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid' }, { status: 400 })
  }
  // Validate resumeExternalUrl if provided
  if (parsed.data.resumeExternalUrl && !/^https?:\/\//.test(parsed.data.resumeExternalUrl)) {
    return NextResponse.json({ error: 'External resume URL must start with http:// or https://' }, { status: 400 })
  }
  const data = {
    name: parsed.data.name,
    title: parsed.data.title,
    titles: parsed.data.titles || null,
    animateTitles: parsed.data.animateTitles ?? false,
    summary: parsed.data.summary,
    bio: parsed.data.bio || null,
    location: parsed.data.location || null,
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
    avatarUrl: parsed.data.avatarUrl || null,
    iconLetters: parsed.data.iconLetters || null,
    resumeExternalUrl: parsed.data.resumeExternalUrl || null,
    availability: parsed.data.availability || null,
  }
  await db.profile.upsert({
    where: { id: 'singleton' },
    create: { id: 'singleton', ...data },
    update: data,
  })
  await audit({
    action: 'profile_updated',
    category: 'content',
    summary: `Profile updated by ${user.loginId}`,
    metadata: { fields: Object.keys(data) },
  })
  return NextResponse.json({ ok: true })
}
