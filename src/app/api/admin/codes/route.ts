import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, audit, generateToken } from '@/lib/auth'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const createSchema = z.object({
  code: z.string().min(2).max(80).regex(/^#[a-zA-Z0-9_-]+$/, 'Code must start with # and contain only letters, numbers, hyphens, or underscores'),
  label: z.string().min(1).max(120),
})

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const items = await db.adminCode.findMany({ orderBy: { createdAt: 'desc' } })
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

  // Reserved #admin cannot be re-created
  if (parsed.data.code === '#admin') {
    return NextResponse.json({ error: '#admin is permanently reserved and cannot be created as a custom code' }, { status: 400 })
  }

  const exists = await db.adminCode.findUnique({ where: { code: parsed.data.code } })
  if (exists) {
    return NextResponse.json({ error: 'A code with this value already exists' }, { status: 400 })
  }

  const item = await db.adminCode.create({
    data: {
      code: parsed.data.code,
      label: parsed.data.label,
      isActive: true,
      isReserved: false,
    },
  })
  await audit({ action: 'admin_code_created', category: 'security', summary: `Created access code: ${item.code} (${item.label})`, metadata: { id: item.id } })
  return NextResponse.json({ item })
}

// Helper for generating a strong random code (used by UI button)
export async function generateStrongCode(): Promise<string> {
  return '#' + generateToken(8)
}
