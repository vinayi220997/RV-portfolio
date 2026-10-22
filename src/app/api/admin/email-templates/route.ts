import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, audit } from '@/lib/auth'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const createSchema = z.object({
  name: z.string().min(1).max(120),
  category: z.string().max(80).optional().or(z.literal('')),
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(20000),
  status: z.enum(['draft', 'published']).optional(),
})

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const items = await db.emailTemplate.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ items })
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid' }, { status: 400 })
  }
  const item = await db.emailTemplate.create({
    data: {
      name: parsed.data.name,
      category: parsed.data.category || null,
      subject: parsed.data.subject,
      body: parsed.data.body,
      placeholders: ['{{name}}', '{{email}}', '{{project}}'],
      status: parsed.data.status || 'draft',
    },
  })
  await audit({ action: 'email_template_created', category: 'email', summary: `Created template: ${item.name}`, metadata: { id: item.id } })
  return NextResponse.json({ item })
}
