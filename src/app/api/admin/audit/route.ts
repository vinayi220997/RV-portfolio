import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const url = new URL(req.url)
  const limit = Math.min(Number(url.searchParams.get('limit') || '200'), 1000)
  const category = url.searchParams.get('category')
  const items = await db.auditLog.findMany({
    where: category ? { category } : undefined,
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
  return NextResponse.json({ items })
}
