import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { audit } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().max(120),
  subject: z.string().max(120).optional().or(z.literal('')),
  message: z.string().min(10).max(5000),
  consent: z.boolean().optional(),
})

// Simple in-memory rate limit per IP
const RATE: Map<string, { count: number; reset: number }> = new Map()
const RATE_LIMIT = 5
const RATE_WINDOW_MS = 60_000

function checkRate(ip: string): boolean {
  const now = Date.now()
  const entry = RATE.get(ip)
  if (!entry || entry.reset < now) {
    RATE.set(ip, { count: 1, reset: now + RATE_WINDOW_MS })
    return true
  }
  entry.count++
  return entry.count <= RATE_LIMIT
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const ua = req.headers.get('user-agent') || null

  if (!checkRate(ip)) {
    return NextResponse.json({ error: 'Too many submissions. Please wait a minute.' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid input' }, { status: 400 })
  }
  const { name, email, subject, message } = parsed.data

  try {
    const saved = await db.contactMessage.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        subject: subject?.trim() || null,
        message: message.trim(),
        ip,
        userAgent: ua,
      },
    })
    await audit({
      action: 'contact_message_received',
      category: 'message',
      summary: `New message from ${name} <${email}>`,
      ipAddress: ip,
      userAgent: ua,
      metadata: { messageId: saved.id, subject: saved.subject },
    })
    return NextResponse.json({ ok: true, id: saved.id })
  } catch (e) {
    console.error('contact save failed', e)
    return NextResponse.json({ error: 'Could not store your message. Please try again later.' }, { status: 500 })
  }
}
